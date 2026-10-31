import { getPlace } from './places.js';
import {
  getThing, drawThing, drawThingFront, BITES, freshState,
} from '../art/things.js';
import { drawPerson, PERSON_BOX, personBounds } from '../art/person.js';
import { drawBackdrop } from '../art/scenes.js';
import { svg } from '../art/kit.js';
import {
  WORLD_H, landingY, ceilingY, clampX,
} from './physics.js';

/**
 * The stage: one place at a time, drawn as a dollhouse you play with by hand.
 *
 *   drag anything      — people, furniture, food, animals. Let go and it
 *                        drops onto the floor or table below.
 *   drop on a seat     — people sit on chairs and sofas, and lie down in beds
 *   drop on a person   — small things go into their hand
 *   tap                — lamps and TVs switch, food gets eaten, animals talk,
 *                        people say hello
 *   drag the background — slides the view along when the place is wider
 *                        than the screen
 *
 * Several fingers at once all work: every pointer has its own drag.
 *
 * The stage changes `world` in place and calls `onChange` so it gets saved.
 * World units: every place is 800 tall; it's scaled to fit the screen height.
 */

const TAP_SLOP = 8;          // pixels a finger can wander and still be a tap
const SEAT_REACH = 80;       // how close to a seat counts as "on it"
const EDGE = 64;             // drag this close to the screen edge to slide the view

let uidCounter = 0;
export function newUid() {
  uidCounter += 1;
  return `t${Date.now().toString(36)}${uidCounter.toString(36)}`;
}

export class Stage {
  /**
   * @param {HTMLElement} viewport  element the stage fills
   * @param {object} world          { things: {placeId: []}, people: {key: {}} }
   * @param {object} hooks          personConfig, onChange, onTapPerson, onTravel,
   *                                isOverDrawer, onDragState, sfx, ensurePlace
   */
  constructor(viewport, world, hooks) {
    this.viewport = viewport;
    this.world = world;
    this.hooks = hooks;
    this.place = null;
    this.cams = {};
    this.camX = 0;
    this.scale = 1;
    this.drags = new Map();
    this.thingEls = new Map();
    this.frontEls = new Map();
    this.personEls = new Map();
    this.enabled = true;

    this.stage = document.createElement('div');
    this.stage.id = 'stage';
    this.backdrop = document.createElement('div');
    this.backdrop.className = 'backdrop';
    this.stage.append(this.backdrop);
    this.layers = {};
    for (const name of ['wall', 'rug', 'furniture', 'people', 'item', 'front', 'fx']) {
      const layer = document.createElement('div');
      layer.className = `layer layer-${name}`;
      this.layers[name] = layer;
      this.stage.append(layer);
    }
    this.viewport.append(this.stage);

    this._bindPointers();
    window.addEventListener('resize', () => this.layout());
    window.addEventListener('orientationchange', () => setTimeout(() => this.layout(), 150));
  }

  // -------------------------------------------------------------------------
  // Showing a place
  // -------------------------------------------------------------------------

  get things() {
    return this.world.things[this.place.id];
  }

  show(placeId) {
    if (this.place) this.cams[this.place.id] = this.camX;
    this.cancelDrags();
    this.place = getPlace(placeId);
    this.hooks.ensurePlace?.(placeId);
    this.camX = this.cams[placeId] ?? 0;
    this.backdrop.innerHTML = drawBackdrop(this.place);
    this.stage.style.width = `${this.place.w}px`;
    this.stage.style.height = `${WORLD_H}px`;
    for (const layer of Object.values(this.layers)) layer.replaceChildren();
    this.thingEls.clear();
    this.frontEls.clear();
    this.personEls.clear();
    for (const t of this.things) if (!t.heldBy) this._renderThing(t);
    for (const key of this.peopleHere()) this._renderPerson(key);
    this.layout();
  }

  /** Keys of everyone currently in this place. */
  peopleHere() {
    return Object.keys(this.world.people).filter((k) => this.world.people[k].place === this.place.id);
  }

  /** Re-draw a person, e.g. after their clothes changed in the creator. */
  refreshPerson(key) {
    if (this.world.people[key]?.place === this.place?.id) this._renderPerson(key);
    else this._removePersonEl(key);
  }

  layout() {
    if (!this.place) return;
    const vw = this.viewport.clientWidth || window.innerWidth;
    const vh = this.viewport.clientHeight || window.innerHeight;
    this.scale = Math.max(0.3, Math.min(1.3, vh / WORLD_H));
    this.vw = vw;
    this.vh = vh;
    this._applyCamera();
  }

  _applyCamera() {
    const s = this.scale;
    const span = this.place.w * s;
    let tx;
    if (span <= this.vw) {
      tx = (this.vw - span) / 2;
      this.camX = 0;
    } else {
      const maxCam = this.place.w - this.vw / s;
      this.camX = Math.max(0, Math.min(maxCam, this.camX));
      tx = -this.camX * s;
    }
    const ty = Math.max(0, (this.vh - WORLD_H * s) / 2);
    this.tx = tx;
    this.ty = ty;
    this.stage.style.transform = `translate(${tx}px, ${ty}px) scale(${s})`;
  }

  /** Slide the view so world x is in the middle of the screen. */
  centerOn(x) {
    this.camX = x - this.vw / this.scale / 2;
    this._applyCamera();
  }

  toWorld(clientX, clientY) {
    const rect = this.viewport.getBoundingClientRect();
    return {
      x: (clientX - rect.left - this.tx) / this.scale,
      y: (clientY - rect.top - this.ty) / this.scale,
    };
  }

  /** The middle of what's on screen, in world units. */
  viewCenter() {
    const rect = this.viewport.getBoundingClientRect();
    return this.toWorld(rect.left + rect.width / 2, rect.top + rect.height * 0.4);
  }

  // -------------------------------------------------------------------------
  // Drawing things and people
  // -------------------------------------------------------------------------

  _renderThing(t) {
    const def = getThing(t.kind);
    let el = this.thingEls.get(t.uid);
    if (!el) {
      el = document.createElement('div');
      el.className = `thing kind-${t.kind}`;
      el.dataset.uid = t.uid;
      this.layers[def.layer].append(el);
      this.thingEls.set(t.uid, el);
    }
    el.style.width = `${def.w}px`;
    el.style.height = `${def.h}px`;
    // An invisible box over the whole thing, so a table can be picked up by
    // the gap under its top and a chair by the hole in its back.
    el.innerHTML = svg(def.w, def.h, `<rect class="hit" width="${def.w}" height="${def.h}" fill="transparent"/>`
      + drawThing(def, t.st, t.uid));
    if (def.front) {
      let front = this.frontEls.get(t.uid);
      if (!front) {
        front = document.createElement('div');
        front.className = 'thing-front';
        front.dataset.uid = t.uid;
        this.layers.front.append(front);
        this.frontEls.set(t.uid, front);
      }
      front.style.width = `${def.w}px`;
      front.style.height = `${def.h}px`;
      front.innerHTML = svg(def.w, def.h, drawThingFront(def, t.st));
    }
    this._placeThingEl(t);
  }

  _placeThingEl(t) {
    const def = getThing(t.kind);
    const left = `${t.x - def.w / 2}px`;
    const top = `${t.y - def.h}px`;
    for (const el of [this.thingEls.get(t.uid), this.frontEls.get(t.uid)]) {
      if (!el) continue;
      el.style.left = left;
      el.style.top = top;
    }
  }

  _removeThingEl(uid) {
    this.thingEls.get(uid)?.remove();
    this.frontEls.get(uid)?.remove();
    this.thingEls.delete(uid);
    this.frontEls.delete(uid);
  }

  /** Where a person is drawn, and in what pose. */
  personSpot(key) {
    const p = this.world.people[key];
    const drag = [...this.drags.values()].find((d) => d.kind === 'person' && d.id === key && d.started);
    if (drag) return { x: p.x, y: p.y, pose: 'held' };
    if (p.seat) {
      const seat = this.seatPoint(p.seat);
      if (seat) return seat;
    }
    return { x: p.x, y: p.y, pose: 'stand' };
  }

  seatPoint({ uid, i }) {
    const t = this.things.find((x) => x.uid === uid);
    if (!t) return null;
    const def = getThing(t.kind);
    const seat = def.seats?.[i];
    if (!seat) return null;
    return { x: t.x - def.w / 2 + seat.x, y: t.y - def.h + seat.y, pose: seat.pose };
  }

  heldBy(key) {
    return this.things.find((t) => t.heldBy === key) || null;
  }

  _renderPerson(key) {
    const cfg = this.hooks.personConfig(key);
    if (!cfg) return;
    let el = this.personEls.get(key);
    if (!el) {
      el = document.createElement('div');
      el.className = 'person';
      el.dataset.person = key;
      this.layers.people.append(el);
      this.personEls.set(key, el);
    }
    const spot = this.personSpot(key);
    const held = this.heldBy(key);
    let heldSvg = '';
    if (held) {
      const def = getThing(held.kind);
      heldSvg = `<g data-held="${held.uid}" transform="scale(0.85) translate(${-def.w / 2} ${-def.h / 2})">`
        + `${drawThing(def, held.st, held.uid)}</g>`;
    }
    el.innerHTML = drawPerson(cfg, { pose: spot.pose, held: heldSvg });
    el.classList.toggle('lying', spot.pose === 'lie');
    this._placePersonEl(key, spot);
  }

  _placePersonEl(key, spot = this.personSpot(key)) {
    const el = this.personEls.get(key);
    if (!el) return;
    el.style.left = `${spot.x - PERSON_BOX.ax}px`;
    el.style.top = `${spot.y - PERSON_BOX.ay}px`;
  }

  _removePersonEl(key) {
    this.personEls.get(key)?.remove();
    this.personEls.delete(key);
  }

  // -------------------------------------------------------------------------
  // Pointer handling
  // -------------------------------------------------------------------------

  _bindPointers() {
    this.viewport.addEventListener('pointerdown', (e) => this._down(e));
    window.addEventListener('pointermove', (e) => this._move(e));
    window.addEventListener('pointerup', (e) => this._up(e, false));
    window.addEventListener('pointercancel', (e) => this._up(e, true));
    this.viewport.addEventListener('wheel', (e) => {
      if (!this.place) return;
      e.preventDefault();
      this.camX += (Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY) / this.scale;
      this._applyCamera();
    }, { passive: false });
    this.viewport.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  /** What's under a pointer: a held thing, a thing, a person, or nothing. */
  _hit(target) {
    const held = target.closest?.('[data-held]');
    if (held) return { kind: 'thing', id: held.dataset.held, held: true };
    const thing = target.closest?.('[data-uid]');
    if (thing) return { kind: 'thing', id: thing.dataset.uid };
    const person = target.closest?.('[data-person]');
    if (person) return { kind: 'person', id: person.dataset.person };
    return null;
  }

  _down(e) {
    if (!this.enabled || !this.place) return;
    if (e.button !== undefined && e.button > 0) return;
    e.preventDefault();
    const hit = this._hit(e.target);
    const w = this.toWorld(e.clientX, e.clientY);
    const drag = {
      pointerId: e.pointerId,
      startClientX: e.clientX,
      startClientY: e.clientY,
      lastClientX: e.clientX,
      lastClientY: e.clientY,
      started: false,
      kind: hit ? hit.kind : 'pan',
      id: hit?.id,
      held: !!hit?.held,
      startCam: this.camX,
      startWorld: w,
    };
    this.drags.set(e.pointerId, drag);
  }

  _move(e) {
    const drag = this.drags.get(e.pointerId);
    if (!drag) return;
    drag.lastClientX = e.clientX;
    drag.lastClientY = e.clientY;
    if (!drag.started) {
      const dist = Math.hypot(e.clientX - drag.startClientX, e.clientY - drag.startClientY);
      if (dist < TAP_SLOP) return;
      this._startDrag(drag);
    }
    if (drag.kind === 'pan') {
      this.camX = drag.startCam - (e.clientX - drag.startClientX) / this.scale;
      this._applyCamera();
      return;
    }
    this._follow(drag);
    this._edgeScroll();
  }

  _up(e, cancelled) {
    const drag = this.drags.get(e.pointerId);
    if (!drag) return;
    this.drags.delete(e.pointerId);
    if (!drag.started) {
      if (!cancelled) this._tap(drag);
      return;
    }
    if (drag.kind === 'pan') return;
    this._drop(drag, e.clientX, e.clientY, cancelled);
    if (![...this.drags.values()].some((d) => d.started && d.kind !== 'pan')) this.hooks.onDragState?.(false);
  }

  /** Let go of everything, e.g. when a menu opens mid-drag. */
  cancelDrags() {
    for (const drag of [...this.drags.values()]) {
      this.drags.delete(drag.pointerId);
      if (drag.started && drag.kind !== 'pan') this._drop(drag, drag.lastClientX, drag.lastClientY, true);
    }
    this.hooks.onDragState?.(false);
  }

  _startDrag(drag) {
    drag.started = true;
    if (drag.kind === 'pan') return;
    const w = this.toWorld(drag.startClientX, drag.startClientY);
    if (drag.kind === 'thing') {
      const t = this.things.find((x) => x.uid === drag.id);
      if (!t) { drag.kind = 'pan'; return; }
      if (t.heldBy) {
        // Pulled out of someone's hand: it becomes its own thing again,
        // centred under the finger.
        const holder = t.heldBy;
        t.heldBy = null;
        const def = getThing(t.kind);
        t.x = w.x;
        t.y = w.y + def.h / 2;
        this._renderPerson(holder);
        this._renderThing(t);
      }
      drag.offsetX = w.x - t.x;
      drag.offsetY = w.y - t.y;
      this._lift(this.thingEls.get(t.uid), this.frontEls.get(t.uid));
      this.hooks.sfx?.('pop');
      // Whatever was sitting on it now has nothing under it.
      if (getThing(t.kind).surface) this.settle(t.uid);
    } else {
      const p = this.world.people[drag.id];
      const spot = this.personSpot(drag.id);
      p.x = spot.x;
      p.y = spot.pose === 'sit' ? spot.y + 40 : spot.pose === 'lie' ? spot.y + 20 : spot.y;
      p.seat = null;
      drag.offsetX = w.x - p.x;
      drag.offsetY = w.y - p.y;
      this._renderPerson(drag.id);
      this._lift(this.personEls.get(drag.id));
      this.hooks.sfx?.('pop');
    }
    this.hooks.onDragState?.(true);
  }

  _lift(...els) {
    for (const el of els) {
      if (!el) continue;
      el.style.transition = '';
      el.classList.add('dragging');
    }
  }

  _follow(drag) {
    const w = this.toWorld(drag.lastClientX, drag.lastClientY);
    if (drag.kind === 'thing') {
      const t = this.things.find((x) => x.uid === drag.id);
      if (!t) return;
      t.x = w.x - drag.offsetX;
      t.y = w.y - drag.offsetY;
      this._placeThingEl(t);
    } else {
      const p = this.world.people[drag.id];
      p.x = w.x - drag.offsetX;
      p.y = w.y - drag.offsetY;
      this._placePersonEl(drag.id);
    }
    this.hooks.onDragMove?.(drag.lastClientX, drag.lastClientY);
  }

  /** Slide the view while something is held near the edge of the screen. */
  _edgeScroll() {
    if (this._edgeTimer) return;
    const step = () => {
      this._edgeTimer = null;
      const active = [...this.drags.values()].filter((d) => d.started && d.kind !== 'pan');
      if (!active.length) return;
      const rect = this.viewport.getBoundingClientRect();
      let dir = 0;
      for (const d of active) {
        if (d.lastClientX < rect.left + EDGE) dir = -1;
        if (d.lastClientX > rect.right - EDGE) dir = 1;
      }
      if (!dir) return;
      const before = this.camX;
      this.camX += (dir * 9) / this.scale;
      this._applyCamera();
      if (this.camX === before) return;
      for (const d of active) this._follow(d);
      this._edgeTimer = requestAnimationFrame(step);
    };
    this._edgeTimer = requestAnimationFrame(step);
  }

  // -------------------------------------------------------------------------
  // Letting go
  // -------------------------------------------------------------------------

  _drop(drag, clientX, clientY, cancelled) {
    const w = this.toWorld(clientX, clientY);
    const overDrawer = !cancelled && this.hooks.isOverDrawer?.(clientX, clientY);
    if (drag.kind === 'thing') this._dropThing(drag.id, w, overDrawer);
    else this._dropPerson(drag.id, w, overDrawer);
    this.hooks.onChange?.();
  }

  _dropThing(uid, w, overDrawer) {
    const t = this.things.find((x) => x.uid === uid);
    if (!t) return;
    const def = getThing(t.kind);
    for (const el of [this.thingEls.get(uid), this.frontEls.get(uid)]) el?.classList.remove('dragging');

    if (overDrawer) {
      this.removeThing(uid);
      this.hooks.sfx?.('whoosh');
      return;
    }

    // Into someone's hand?
    if (def.holdable) {
      const key = this.personAt(w.x, w.y);
      if (key && !this.heldBy(key)) {
        t.heldBy = key;
        this._removeThingEl(uid);
        this._renderPerson(key);
        this.hooks.sfx?.('drop');
        return;
      }
    }

    t.x = clampX(this.place, t.x, def.w);
    if (def.layer === 'wall') {
      t.y = Math.max(def.h, Math.min(this.place.ground, t.y));
      this._placeThingEl(t);
      this.hooks.sfx?.('drop');
      return;
    }
    if (def.floats) {
      const target = ceilingY(this.place, t.x, t.y - def.h) + def.h + 4;
      this._fallTo(t, target, { up: true });
      return;
    }
    const target = landingY(this.place, this.things, {
      x: t.x, y: t.y, onFloorsOnly: def.layer !== 'item', skipUid: uid,
    });
    this._fallTo(t, target, { bouncy: def.bouncy });
    if (def.surface) this.settle();
  }

  _dropPerson(key, w, overDrawer) {
    const p = this.world.people[key];
    this.personEls.get(key)?.classList.remove('dragging');

    if (overDrawer) {
      this.putAwayPerson(key);
      this.hooks.sfx?.('whoosh');
      return;
    }

    // Onto a door: off they go, and the view goes with them.
    const link = this.linkAt(w.x, w.y);
    if (link && this.hooks.onTravel) {
      p.seat = null;
      this.hooks.onTravel(key, link.to);
      return;
    }

    // Onto a free seat or bed?
    const seat = this.freeSeatNear(w.x, w.y, key);
    if (seat) {
      p.seat = seat;
      this._renderPerson(key);
      this.hooks.sfx?.('drop');
      return;
    }

    p.x = clampX(this.place, p.x, 60);
    const target = landingY(this.place, this.things, { x: p.x, y: p.y });
    this._renderPerson(key);
    this._fallPerson(key, target);
  }

  /** Animate a thing dropping to `target`, with a little squash when it lands. */
  _fallTo(t, target, { up = false, bouncy = false } = {}) {
    const def = getThing(t.kind);
    const distance = Math.abs(target - t.y);
    t.y = target;
    const els = [this.thingEls.get(t.uid), this.frontEls.get(t.uid)].filter(Boolean);
    const duration = Math.min(0.7, 0.12 + Math.sqrt(distance / WORLD_H) * 0.5);
    for (const el of els) {
      el.style.transition = distance > 2
        ? `top ${duration}s ${up ? 'cubic-bezier(.2,.7,.4,1)' : 'cubic-bezier(.55,0,1,.45)'}` : '';
    }
    this._placeThingEl(t);
    const land = () => {
      for (const el of els) {
        el.style.transition = '';
        el.classList.remove('land', 'bounce');
        void el.offsetWidth;
        el.classList.add(bouncy ? 'bounce' : 'land');
      }
      if (distance > 20 && !up) this.hooks.sfx?.(bouncy ? 'boing' : 'drop');
    };
    if (distance > 2) setTimeout(land, duration * 1000);
    else land();
    if (def.layer === 'item' && !up) this._raise(t.uid);
  }

  _fallPerson(key, target) {
    const p = this.world.people[key];
    const distance = Math.abs(target - p.y);
    p.y = target;
    const el = this.personEls.get(key);
    const duration = Math.min(0.7, 0.12 + Math.sqrt(distance / WORLD_H) * 0.5);
    if (el) el.style.transition = distance > 2 ? `top ${duration}s cubic-bezier(.55,0,1,.45)` : '';
    this._placePersonEl(key);
    setTimeout(() => {
      if (!el) return;
      el.style.transition = '';
      el.classList.remove('land');
      void el.offsetWidth;
      el.classList.add('land');
      if (distance > 20) this.hooks.sfx?.('drop');
    }, distance > 2 ? duration * 1000 : 0);
  }

  /** Keep the thing you just touched on top of its neighbours. */
  _raise(uid) {
    const el = this.thingEls.get(uid);
    if (el?.parentNode) el.parentNode.append(el);
    const i = this.things.findIndex((t) => t.uid === uid);
    if (i >= 0) this.things.push(...this.things.splice(i, 1));
  }

  /**
   * Let anything whose support has gone fall. Run after a table moves:
   * whatever was on it drops to whatever is underneath now.
   */
  settle(skipUid = null) {
    const things = this.things;
    const dragging = new Set([...this.drags.values()].filter((d) => d.started).map((d) => d.id));
    for (const t of things) {
      if (t.heldBy || t.uid === skipUid || dragging.has(t.uid)) continue;
      const def = getThing(t.kind);
      if (def.layer !== 'item' || def.floats) continue;
      const others = skipUid ? things.filter((x) => x.uid !== skipUid) : things;
      const target = landingY(this.place, others, { x: t.x, y: t.y, skipUid: t.uid });
      if (target > t.y + 1) this._fallTo(t, target, { bouncy: def.bouncy });
    }
    for (const key of this.peopleHere()) {
      const p = this.world.people[key];
      if (p.seat || dragging.has(key)) continue;
      const others = skipUid ? things.filter((x) => x.uid !== skipUid) : things;
      const target = landingY(this.place, others, { x: p.x, y: p.y });
      if (target > p.y + 1) this._fallPerson(key, target);
    }
  }

  // -------------------------------------------------------------------------
  // Tapping
  // -------------------------------------------------------------------------

  _tap(drag) {
    const w = drag.startWorld;
    if (drag.kind === 'person') {
      this._wiggle(this.personEls.get(drag.id));
      this.hooks.onTapPerson?.(drag.id);
      return;
    }
    if (drag.kind === 'thing') {
      this.tapThing(drag.id);
      return;
    }
    const link = this.linkAt(w.x, w.y);
    if (link) this.hooks.onLinkTap?.(link.to);
  }

  tapThing(uid) {
    const t = this.things.find((x) => x.uid === uid);
    if (!t) return;
    const def = getThing(t.kind);
    const el = t.heldBy ? this.personEls.get(t.heldBy) : this.thingEls.get(uid);
    const top = this._topOf(t);

    if (def.food) {
      t.st.bites = (t.st.bites || 0) + 1;
      this.hooks.sfx?.('chomp');
      const eater = t.heldBy;
      if (t.st.bites >= BITES) {
        this.removeThing(uid);
        if (eater) this.bubble(eater, 'Yum! All gone!');
        else this.pop(top.x, top.y, 'Yum!');
      } else {
        if (eater) {
          this._renderPerson(eater);
          this.bubble(eater, 'Nom nom!');
        } else {
          this._renderThing(t);
          this.pop(top.x, top.y, 'Nom!');
        }
      }
      this.hooks.onChange?.();
      return;
    }
    if (def.toggle) {
      t.st.on = !t.st.on;
      if (t.heldBy) this._renderPerson(t.heldBy);
      else this._renderThing(t);
      this.hooks.sfx?.(t.kind === 'rocket' && t.st.on ? 'whoosh' : 'click');
      if (t.kind === 'rocket' && t.st.on) this._wiggle(el, 'rumble');
      this.hooks.onChange?.();
      return;
    }
    if (def.says) {
      this.pop(top.x, top.y - 10, def.says, 'speech');
      this._wiggle(el, 'hop');
      this.hooks.sfx?.('animal');
      return;
    }
    if (def.sound === 'piano') {
      this.hooks.sfx?.('note');
      this.pop(top.x + (Math.random() * 120 - 60), top.y, Math.random() < 0.5 ? '♪' : '♫', 'note');
      return;
    }
    if (def.sound === 'squeak') {
      this.hooks.sfx?.('squeak');
      this._wiggle(el, 'squash');
      return;
    }
    if (def.sound === 'sparkle') {
      this.hooks.sfx?.('sparkle');
      for (let i = 0; i < 5; i++) {
        this.pop(top.x + (Math.random() * 90 - 45), top.y + (Math.random() * 40 - 20), '✦', 'sparkle');
      }
      return;
    }
    this._wiggle(el);
    this.hooks.sfx?.('tick');
  }

  _topOf(t) {
    const def = getThing(t.kind);
    if (t.heldBy) {
      const spot = this.personSpot(t.heldBy);
      return { x: spot.x + 40, y: spot.y - 180 };
    }
    return { x: t.x, y: t.y - def.h };
  }

  _wiggle(el, kind = 'wiggle') {
    if (!el) return;
    el.classList.remove('wiggle', 'hop', 'squash', 'rumble');
    void el.offsetWidth;
    el.classList.add(kind);
  }

  /** A speech bubble over someone's head. */
  bubble(key, text) {
    const spot = this.personSpot(key);
    const cfg = this.hooks.personConfig(key);
    const b = personBounds(cfg, spot.pose);
    this.pop(spot.x, spot.y + b.y0 - 14, text, 'speech');
  }

  /** Something floating up out of the scene: a word, a note, a sparkle. */
  pop(x, y, text, kind = 'word') {
    const el = document.createElement('div');
    el.className = `pop pop-${kind}`;
    el.textContent = text;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    this.layers.fx.append(el);
    setTimeout(() => el.remove(), kind === 'speech' ? 3200 : 1300);
    return el;
  }

  // -------------------------------------------------------------------------
  // Hit tests
  // -------------------------------------------------------------------------

  /** Whoever is at a world point (excluding anyone being dragged). */
  personAt(x, y) {
    const dragging = new Set([...this.drags.values()].filter((d) => d.started).map((d) => d.id));
    let best = null;
    for (const key of this.peopleHere()) {
      if (dragging.has(key)) continue;
      const spot = this.personSpot(key);
      const b = personBounds(this.hooks.personConfig(key), spot.pose);
      if (x >= spot.x + b.x0 - 10 && x <= spot.x + b.x1 + 10 && y >= spot.y + b.y0 && y <= spot.y + b.y1 + 10) {
        best = key;
      }
    }
    return best;
  }

  linkAt(x, y) {
    return this.place.links.find((l) => x >= l.x && x <= l.x + l.w && y >= l.y && y <= l.y + l.h) || null;
  }

  freeSeatNear(x, y, key) {
    const taken = new Set(Object.entries(this.world.people)
      .filter(([k, p]) => k !== key && p.place === this.place.id && p.seat)
      .map(([, p]) => `${p.seat.uid}:${p.seat.i}`));
    let best = null;
    let bestDist = SEAT_REACH;
    for (const t of this.things) {
      if (t.heldBy) continue;
      const def = getThing(t.kind);
      (def.seats || []).forEach((seat, i) => {
        if (taken.has(`${t.uid}:${i}`)) return;
        const sx = t.x - def.w / 2 + seat.x;
        const sy = t.y - def.h + seat.y;
        // The finger is usually on the body, a little above where they'd sit.
        const d = Math.hypot(x - sx, (y - sy) * 0.6);
        if (d < bestDist) {
          bestDist = d;
          best = { uid: t.uid, i };
        }
      });
    }
    return best;
  }

  // -------------------------------------------------------------------------
  // Adding and removing
  // -------------------------------------------------------------------------

  /** Put a new thing in this place under a pointer, already being dragged. */
  spawnThing(kind, e) {
    const def = getThing(kind);
    const w = this.toWorld(e.clientX, e.clientY);
    const t = { uid: newUid(), kind, x: w.x, y: w.y + def.h / 2, st: freshState(def) };
    this.things.push(t);
    this._renderThing(t);
    this._grab(e, 'thing', t.uid, w);
    return t.uid;
  }

  /** Put a new thing in the middle of the view and let it drop. */
  placeThing(kind) {
    const def = getThing(kind);
    const c = this.viewCenter();
    const t = { uid: newUid(), kind, x: clampX(this.place, c.x, def.w), y: c.y, st: freshState(def) };
    this.things.push(t);
    this._renderThing(t);
    this._dropThing(t.uid, { x: -1, y: -1 }, false);
    this.hooks.onChange?.();
    return t.uid;
  }

  /** Bring someone here (from wherever they were) under a pointer, being dragged. */
  spawnPerson(key, e) {
    const w = this.toWorld(e.clientX, e.clientY);
    this.bringPerson(key, w.x, w.y + 80);
    this._grab(e, 'person', key, w);
  }

  /** Bring someone here and let them drop in the middle of the view. */
  placePerson(key) {
    const c = this.viewCenter();
    this.bringPerson(key, clampX(this.place, c.x, 60), c.y);
    const p = this.world.people[key];
    p.y = landingY(this.place, this.things, { x: p.x, y: p.y });
    this._renderPerson(key);
    this.hooks.onChange?.();
  }

  bringPerson(key, x, y) {
    const p = this.world.people[key];
    const from = p.place;
    if (from && from !== this.place.id) {
      // Whatever they're holding comes along.
      const list = this.world.things[from] || [];
      const held = list.find((t) => t.heldBy === key);
      if (held) {
        list.splice(list.indexOf(held), 1);
        this.things.push(held);
      }
    }
    p.place = this.place.id;
    p.seat = null;
    p.x = x;
    p.y = y;
    this._renderPerson(key);
  }

  _grab(e, kind, id, w) {
    const drag = {
      pointerId: e.pointerId,
      startClientX: e.clientX,
      startClientY: e.clientY,
      lastClientX: e.clientX,
      lastClientY: e.clientY,
      started: false,
      kind,
      id,
      startCam: this.camX,
      startWorld: w,
    };
    this.drags.set(e.pointerId, drag);
    this._startDrag(drag);
  }

  removeThing(uid) {
    const i = this.things.findIndex((t) => t.uid === uid);
    if (i < 0) return;
    const [t] = this.things.splice(i, 1);
    this._removeThingEl(uid);
    // Anyone sitting on it stands up.
    for (const key of this.peopleHere()) {
      const p = this.world.people[key];
      if (p.seat?.uid === uid) {
        const spot = this.seatPoint(p.seat) || { x: t.x, y: t.y };
        p.seat = null;
        p.x = spot.x;
        p.y = landingY(this.place, this.things, { x: p.x, y: spot.y });
        this._renderPerson(key);
      }
    }
    if (t.heldBy) this._renderPerson(t.heldBy);
    if (getThing(t.kind).surface) this.settle();
  }

  putAwayPerson(key) {
    const p = this.world.people[key];
    const held = this.heldBy(key);
    if (held) {
      // They let go of whatever they were holding; it drops here.
      held.heldBy = null;
      const spot = this.personSpot(key);
      held.x = spot.x;
      held.y = spot.y - 60;
      this._renderThing(held);
      this._dropThing(held.uid, { x: -1, y: -1 }, false);
    }
    p.place = null;
    p.seat = null;
    this._removePersonEl(key);
  }
}
