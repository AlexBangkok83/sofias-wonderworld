/**
 * One input state for keyboard + mouse + touch.
 *
 * Touch is not an afterthought here: Sofia plays on a phone as often as a
 * laptop, so the joystick and the on-screen buttons feed exactly the same
 * state the keyboard does.
 */

export const IS_TOUCH =
  typeof window !== 'undefined' &&
  (window.matchMedia?.('(pointer: coarse)').matches || 'ontouchstart' in window);

const KEY_MAP = {
  KeyW: 'forward', ArrowUp: 'forward',
  KeyS: 'back', ArrowDown: 'back',
  KeyA: 'left', ArrowLeft: 'left',
  KeyD: 'right', ArrowRight: 'right',
  Space: 'jump',
  ShiftLeft: 'sprint', ShiftRight: 'sprint',
};

export class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.keys = new Set();
    this.buttons = new Set();          // held virtual buttons (touch)
    this.pressed = new Set();          // edge-triggered this frame
    this.lookDX = 0;
    this.lookDY = 0;
    this.joystick = { active: false, x: 0, y: 0, id: null, ox: 0, oy: 0 };
    this.lookTouchId = null;
    this.pointerLocked = false;
    this.mouseDown = new Set();
    this.wheel = 0;
    this.enabled = true;
    this.sensitivity = 0.0026;
    this.touchSensitivity = 0.0055;
    this._listeners = [];

    this._bindKeyboard();
    this._bindMouse();
    this._bindTouch();
  }

  _on(target, type, handler, options) {
    target.addEventListener(type, handler, options);
    this._listeners.push([target, type, handler, options]);
  }

  _bindKeyboard() {
    this._on(window, 'keydown', (e) => {
      if (!this.enabled) return;
      if (e.repeat) return;
      const action = KEY_MAP[e.code];
      if (action) {
        this.keys.add(action);
        this.pressed.add(action);
        if (e.code === 'Space') e.preventDefault();
      }
      this.pressed.add(e.code);
    });
    this._on(window, 'keyup', (e) => {
      const action = KEY_MAP[e.code];
      if (action) this.keys.delete(action);
    });
    this._on(window, 'blur', () => {
      this.keys.clear();
      this.buttons.clear();
      this.mouseDown.clear();
    });
  }

  _bindMouse() {
    this._on(this.canvas, 'contextmenu', (e) => e.preventDefault());

    this._on(this.canvas, 'mousedown', (e) => {
      if (!this.enabled) return;
      this.mouseDown.add(e.button);
      if (e.button === 0) this.pressed.add('break');
      if (e.button === 2) this.pressed.add('place');
    });
    this._on(window, 'mouseup', (e) => this.mouseDown.delete(e.button));

    this._on(window, 'mousemove', (e) => {
      if (!this.enabled) return;
      if (this.pointerLocked) {
        this.lookDX += e.movementX * this.sensitivity;
        this.lookDY += e.movementY * this.sensitivity;
      } else if (this.mouseDown.size > 0) {
        // Drag-to-look for anyone who doesn't want pointer lock.
        this.lookDX += e.movementX * this.sensitivity;
        this.lookDY += e.movementY * this.sensitivity;
      }
    });

    this._on(document, 'pointerlockchange', () => {
      this.pointerLocked = document.pointerLockElement === this.canvas;
      if (!this.pointerLocked) this.onPointerUnlock?.();
    });

    this._on(this.canvas, 'wheel', (e) => {
      if (!this.enabled) return;
      this.wheel += Math.sign(e.deltaY);
      e.preventDefault();
    }, { passive: false });
  }

  _bindTouch() {
    const half = () => window.innerWidth * 0.45;

    this._on(this.canvas, 'touchstart', (e) => {
      if (!this.enabled) return;
      for (const touch of e.changedTouches) {
        if (touch.clientX < half() && !this.joystick.active) {
          this.joystick.active = true;
          this.joystick.id = touch.identifier;
          this.joystick.ox = touch.clientX;
          this.joystick.oy = touch.clientY;
          this.joystick.x = 0;
          this.joystick.y = 0;
          this.onJoystickStart?.(touch.clientX, touch.clientY);
        } else if (this.lookTouchId === null) {
          this.lookTouchId = touch.identifier;
          this._lookLast = { x: touch.clientX, y: touch.clientY };
          this._lookMoved = 0;
        }
      }
      e.preventDefault();
    }, { passive: false });

    this._on(this.canvas, 'touchmove', (e) => {
      if (!this.enabled) return;
      for (const touch of e.changedTouches) {
        if (touch.identifier === this.joystick.id) {
          const dx = touch.clientX - this.joystick.ox;
          const dy = touch.clientY - this.joystick.oy;
          const radius = 56;
          const dist = Math.hypot(dx, dy);
          const clamp = dist > radius ? radius / dist : 1;
          this.joystick.x = (dx * clamp) / radius;
          this.joystick.y = (dy * clamp) / radius;
          this.onJoystickMove?.(this.joystick.x, this.joystick.y);
        } else if (touch.identifier === this.lookTouchId) {
          const dx = touch.clientX - this._lookLast.x;
          const dy = touch.clientY - this._lookLast.y;
          this.lookDX += dx * this.touchSensitivity;
          this.lookDY += dy * this.touchSensitivity;
          this._lookMoved += Math.abs(dx) + Math.abs(dy);
          this._lookLast = { x: touch.clientX, y: touch.clientY };
        }
      }
      e.preventDefault();
    }, { passive: false });

    const endTouch = (e) => {
      for (const touch of e.changedTouches) {
        if (touch.identifier === this.joystick.id) {
          this.joystick.active = false;
          this.joystick.id = null;
          this.joystick.x = 0;
          this.joystick.y = 0;
          this.onJoystickEnd?.();
        } else if (touch.identifier === this.lookTouchId) {
          // A tap that barely moved is a "use this block" tap.
          if (this._lookMoved < 12) this.pressed.add('tap');
          this.lookTouchId = null;
        }
      }
    };
    this._on(this.canvas, 'touchend', endTouch);
    this._on(this.canvas, 'touchcancel', endTouch);
  }

  /** Wire an on-screen button element to a virtual button name. */
  bindButton(element, name, { repeat = false } = {}) {
    const down = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!this.enabled) return;
      this.buttons.add(name);
      this.pressed.add(name);
      element.classList.add('is-down');
      if (repeat) {
        clearInterval(element._repeatTimer);
        element._repeatTimer = setInterval(() => {
          if (this.buttons.has(name)) this.pressed.add(name);
        }, 220);
      }
    };
    const up = (e) => {
      e?.preventDefault();
      this.buttons.delete(name);
      element.classList.remove('is-down');
      clearInterval(element._repeatTimer);
    };
    element.addEventListener('touchstart', down, { passive: false });
    element.addEventListener('touchend', up);
    element.addEventListener('touchcancel', up);
    element.addEventListener('mousedown', down);
    element.addEventListener('mouseup', up);
    element.addEventListener('mouseleave', up);
  }

  requestPointerLock() {
    if (IS_TOUCH) return;
    this.canvas.requestPointerLock?.();
  }

  exitPointerLock() {
    if (document.pointerLockElement === this.canvas) document.exitPointerLock?.();
  }

  /** -1..1 strafe, -1..1 forward (positive = forward). */
  get move() {
    let x = 0;
    let z = 0;
    if (this.keys.has('left')) x -= 1;
    if (this.keys.has('right')) x += 1;
    if (this.keys.has('forward')) z += 1;
    if (this.keys.has('back')) z -= 1;
    if (this.joystick.active) {
      x += this.joystick.x;
      z -= this.joystick.y;
    }
    const len = Math.hypot(x, z);
    if (len > 1) { x /= len; z /= len; }
    return { x, z };
  }

  get sprinting() {
    return this.keys.has('sprint') || this.buttons.has('sprint');
  }

  get jumping() {
    return this.keys.has('jump') || this.buttons.has('jump');
  }

  isDown(name) {
    return this.keys.has(name) || this.buttons.has(name);
  }

  /** True once per press. */
  wasPressed(name) {
    return this.pressed.has(name);
  }

  consumeLook() {
    const dx = this.lookDX;
    const dy = this.lookDY;
    this.lookDX = 0;
    this.lookDY = 0;
    return { dx, dy };
  }

  consumeWheel() {
    const w = this.wheel;
    this.wheel = 0;
    return w;
  }

  /** Call at the end of every frame. */
  endFrame() {
    this.pressed.clear();
  }

  setEnabled(enabled) {
    this.enabled = enabled;
    if (!enabled) {
      this.keys.clear();
      this.buttons.clear();
      this.pressed.clear();
      this.mouseDown.clear();
      this.joystick.active = false;
      this.joystick.x = 0;
      this.joystick.y = 0;
      this.lookDX = 0;
      this.lookDY = 0;
      this.onJoystickEnd?.();
    }
  }

  dispose() {
    for (const [target, type, handler, options] of this._listeners) {
      target.removeEventListener(type, handler, options);
    }
    this._listeners.length = 0;
  }
}
