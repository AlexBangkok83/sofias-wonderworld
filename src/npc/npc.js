import * as THREE from 'three';
import { buildAvatar, animateAvatar, lookAt, characterHeight } from '../player/avatar.js';
import { getVillager } from './dialogue.js';

const TALK_RANGE = 3.6;

function nameplate(text) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const font = '600 40px system-ui, -apple-system, "Segoe UI", sans-serif';
  ctx.font = font;
  const width = Math.ceil(ctx.measureText(text).width) + 40;
  canvas.width = width;
  canvas.height = 64;
  ctx.font = font;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(38, 30, 44, 0.72)';
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(0, 8, width, 48, 24);
    ctx.fill();
  } else {
    // Older Safari has no roundRect, and a thrown error here would take out
    // every villager in the zone.
    ctx.fillRect(0, 8, width, 48);
  }
  ctx.fillStyle = '#fbf3e6';
  ctx.fillText(text, width / 2, 33);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: texture, transparent: true, depthTest: false, depthWrite: false,
  }));
  sprite.scale.set((width / 64) * 0.4, 0.4, 1);
  sprite.renderOrder = 10;
  return sprite;
}

/** One villager in the world. */
class Npc {
  constructor(spec) {
    const villager = getVillager(spec.id);
    this.id = spec.id;
    this.villager = villager;
    this.name = villager?.name || spec.id;
    this.lines = villager?.lines || ['...'];
    this.lineIndex = 0;
    this.homeYaw = spec.yaw || 0;

    this.group = new THREE.Group();
    this.group.position.set(spec.x, spec.y ?? 0, spec.z);
    this.group.rotation.y = this.homeYaw;

    this.avatar = buildAvatar(villager?.character || {});
    this.group.add(this.avatar);

    this.plate = nameplate(this.name);
    this.plate.position.y = characterHeight(villager?.character || {}) + 0.35;
    this.group.add(this.plate);

    this.bobPhase = Math.random() * Math.PI * 2;
  }

  /** Snap the villager down onto whatever floor is under them. */
  settle(zone) {
    let y = Math.floor(this.group.position.y);
    const x = Math.floor(this.group.position.x);
    const z = Math.floor(this.group.position.z);
    // Search upward for the first open cell with solid ground beneath it.
    for (let probe = 0; probe < zone.sizeY; probe++) {
      const solidBelow = zone.isSolidAt(x, probe - 1, z);
      const clear = !zone.isSolidAt(x, probe, z) && !zone.isSolidAt(x, probe + 1, z);
      if (solidBelow && clear) {
        y = probe;
        break;
      }
    }
    this.group.position.y = y;
  }

  update(dt, playerPos, isTarget) {
    this.bobPhase += dt;
    animateAvatar(this.avatar, dt, 0, { grounded: true });
    if (isTarget) {
      lookAt(this.avatar, playerPos);
    } else {
      const data = this.avatar.userData;
      data.head.rotation.y += (0 - data.head.rotation.y) * 0.08;
    }
    this.plate.material.opacity = isTarget ? 1 : 0.55;
  }

  nextLine() {
    const index = this.lineIndex;
    const text = this.lines[index];
    this.lineIndex = (this.lineIndex + 1) % this.lines.length;
    return { index, text };
  }
}

/** Spawns and updates the villagers for whichever zone you're standing in. */
export class NpcManager {
  constructor(scene, voice) {
    this.scene = scene;
    this.voice = voice;
    this.npcs = [];
    this.group = new THREE.Group();
    this.group.name = 'npcs';
    scene.add(this.group);
    this.nearest = null;
    this.talking = null;
  }

  setZone(zone) {
    this.group.clear();
    this.npcs = (zone.npcs || []).map((spec) => {
      const npc = new Npc(spec);
      npc.settle(zone);
      this.group.add(npc.group);
      return npc;
    });
    this.nearest = null;
    this.talking = null;
  }

  update(dt, player) {
    const p = player.position;
    let best = null;
    let bestDist = TALK_RANGE;
    for (const npc of this.npcs) {
      const dist = Math.hypot(
        npc.group.position.x - p.x,
        npc.group.position.y - p.y,
        npc.group.position.z - p.z,
      );
      if (dist < bestDist) {
        best = npc;
        bestDist = dist;
      }
    }
    if (best !== this.nearest) {
      this.nearest = best;
      if (best) this.voice.preload(best.id, best.lines.length);
    }
    for (const npc of this.npcs) npc.update(dt, p, npc === this.nearest);

    // Walking away ends the conversation.
    if (this.talking && this.talking !== this.nearest) {
      this.talking = null;
      this.voice.stop();
      this.onDialogueEnd?.();
    }
  }

  /** Say the next line from whoever is closest. Returns what was said. */
  talk() {
    const npc = this.nearest;
    if (!npc) return null;
    this.talking = npc;
    const { index, text } = npc.nextLine();
    this.voice.speak(npc.id, index, text, npc.villager || {});
    return { npc, index, text };
  }
}
