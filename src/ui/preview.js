import * as THREE from 'three';
import { buildAvatar, characterHeight } from '../player/avatar.js';

/**
 * The little turntable in the character creator. Its own tiny renderer, torn
 * down when the creator closes so a phone isn't holding two GL contexts open
 * while she's playing.
 */
export class CharacterPreview {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = null;
    this.scene = null;
    this.camera = null;
    this.avatar = null;
    this.running = false;
    this.spin = 0;
    this.dragging = false;
    this._bindDrag();
  }

  _bindDrag() {
    let lastX = 0;
    const start = (x) => { this.dragging = true; lastX = x; };
    const move = (x) => {
      if (!this.dragging) return;
      this.spin += (x - lastX) * 0.012;
      lastX = x;
    };
    const end = () => { this.dragging = false; };

    this.canvas.addEventListener('mousedown', (e) => start(e.clientX));
    window.addEventListener('mousemove', (e) => move(e.clientX));
    window.addEventListener('mouseup', end);
    this.canvas.addEventListener('touchstart', (e) => {
      start(e.touches[0].clientX);
      e.preventDefault();
    }, { passive: false });
    this.canvas.addEventListener('touchmove', (e) => {
      move(e.touches[0].clientX);
      e.preventDefault();
    }, { passive: false });
    this.canvas.addEventListener('touchend', end);
  }

  _ensure() {
    if (this.renderer) return;
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas, antialias: true, alpha: true,
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(32, 1, 0.1, 40);

    this.scene.add(new THREE.HemisphereLight(0xf3e6d0, 0x453a52, 2.1));
    const key = new THREE.DirectionalLight(0xfff0d6, 2.0);
    key.position.set(2.5, 4, 3.5);
    this.scene.add(key);
    const rim = new THREE.DirectionalLight(0xb79ce0, 1.1);
    rim.position.set(-3, 2, -2.5);
    this.scene.add(rim);

    // A little plinth so the character isn't floating in the void.
    const plinth = new THREE.Mesh(
      new THREE.CylinderGeometry(0.62, 0.7, 0.12, 20),
      new THREE.MeshLambertMaterial({ color: 0x6b5480 }),
    );
    plinth.position.y = -0.06;
    this.scene.add(plinth);

    this.pivot = new THREE.Group();
    this.scene.add(this.pivot);
  }

  setCharacter(config) {
    this._ensure();
    if (this.avatar) this.pivot.remove(this.avatar);
    this.avatar = buildAvatar(config);
    this.pivot.add(this.avatar);
    const height = characterHeight(config);
    this.camera.position.set(0, height * 0.6, height * 2.35);
    this.camera.lookAt(0, height * 0.5, 0);
  }

  resize() {
    if (!this.renderer) return;
    const rect = this.canvas.getBoundingClientRect();
    const width = Math.max(1, Math.round(rect.width));
    const height = Math.max(1, Math.round(rect.height));
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  start() {
    this._ensure();
    if (this.running) return;
    this.running = true;
    let last = performance.now();
    const tick = (now) => {
      if (!this.running) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!this.dragging) this.spin += dt * 0.5;
      this.pivot.rotation.y = this.spin;
      this.resize();
      this.renderer.render(this.scene, this.camera);
      this._raf = requestAnimationFrame(tick);
    };
    this._raf = requestAnimationFrame(tick);
  }

  stop() {
    this.running = false;
    if (this._raf) cancelAnimationFrame(this._raf);
  }

  dispose() {
    this.stop();
    if (this.renderer) {
      this.renderer.dispose();
      this.renderer.forceContextLoss?.();
      this.renderer = null;
    }
    this.avatar = null;
  }
}
