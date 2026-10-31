import * as THREE from 'three';
import './styles.css';

import { UI } from './ui/ui.js';
import { Input, IS_TOUCH } from './core/input.js';
import { SaveStore, emptySave } from './core/save.js';
import { Lighting } from './core/lighting.js';
import { World, validateWorld } from './world/world.js';
import { AIR, getBlock } from './world/blocks.js';
import { Player } from './player/player.js';
import { DEFAULT_CHARACTER } from './player/avatar.js';
import { NpcManager } from './npc/npc.js';
import { Voice } from './npc/voice.js';
import { getVillager } from './npc/dialogue.js';
import {
  emptyBank, payAllowance, buyPack, shopView, dayKey,
} from './shop/piggybank.js';

const root = document.getElementById('app');
const ui = new UI(root);
const store = new SaveStore();
const voice = new Voice();

// ---------------------------------------------------------------------------
// Renderer
// ---------------------------------------------------------------------------

const renderer = new THREE.WebGLRenderer({
  canvas: ui.canvas,
  antialias: !IS_TOUCH,
  powerPreference: 'high-performance',
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, IS_TOUCH ? 1.75 : 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(72, 1, 0.08, 420);
const lighting = new Lighting(scene);

// Wireframe box drawn around whatever block is under the crosshair.
const highlight = new THREE.LineSegments(
  new THREE.EdgesGeometry(new THREE.BoxGeometry(1.005, 1.005, 1.005)),
  new THREE.LineBasicMaterial({ color: 0xfff3d0, transparent: true, opacity: 0.9, depthTest: true }),
);
highlight.visible = false;
scene.add(highlight);

// Ghost of the block about to be placed.
const ghost = new THREE.Mesh(
  new THREE.BoxGeometry(1.001, 1.001, 1.001),
  new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.28, depthWrite: false }),
);
ghost.visible = false;
scene.add(ghost);

function resize() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
window.addEventListener('orientationchange', () => setTimeout(resize, 120));
resize();

// ---------------------------------------------------------------------------
// Game state
// ---------------------------------------------------------------------------

const state = {
  save: emptySave(),
  world: null,
  zone: null,
  player: null,
  npcs: null,
  playing: false,
  doorCooldown: 0,
  elapsed: 0,
};

const input = new Input(ui.canvas);

function newCharacterId() {
  return `c${Date.now().toString(36)}${Math.floor(Math.random() * 1e4).toString(36)}`;
}

function activeCharacter() {
  const { characters, activeCharacterId } = state.save;
  return characters.find((c) => c.id === activeCharacterId)
    || characters[0]
    || { ...DEFAULT_CHARACTER, id: 'default' };
}

function snapshot() {
  const player = state.player;
  return {
    ...state.save,
    edits: state.world.collectEdits(),
    location: player && state.zone
      ? {
        zone: state.zone.id,
        pos: [player.position.x, player.position.y, player.position.z],
        yaw: player.yaw,
      }
      : state.save.location,
    playedBefore: true,
  };
}

function autosave() {
  if (!state.world) return;
  store.schedule(snapshot);
}

async function saveNow() {
  if (!state.world) return;
  state.save = snapshot();
  await store.flush(() => state.save);
}

// ---------------------------------------------------------------------------
// Zone handling
// ---------------------------------------------------------------------------

function enterZone(zoneId, spawnKey = null, { keepPosition = null } = {}) {
  const previous = state.zone;
  if (previous) scene.remove(previous.group);

  const zone = state.world.get(zoneId);
  state.zone = zone;
  scene.add(zone.group);

  lighting.applyZone(zone);
  state.npcs.setZone(zone);

  const spawn = keepPosition
    ? { pos: keepPosition.pos, yaw: keepPosition.yaw, pitch: 0 }
    : state.world.spawnFor(zoneId, spawnKey);
  state.player.teleport(spawn.pos, spawn.yaw, spawn.pitch || 0);

  // Frame the camera straight away so the world behind the title screen and
  // the pause menu is the place you're actually standing.
  state.player.update(0, input, zone);
  state.player.updateCamera(camera, zone);
  lighting.update(zone, state.player.position);

  ui.setZoneName(zone.label);
  ui.setBuildingAllowed(zone.editable);
  ui.hideDialogue();
  voice.stop();
  state.doorCooldown = 0.55;

  if (zoneId === 'moon_house' && !state.save.discovered.moon) {
    state.save.discovered.moon = true;
    ui.toast('🌙 You found the Moon House!', 4200);
  } else if (zone.editable) {
    ui.toast(`${zone.label} — you can build in here`, 2600);
  }
  autosave();
}

function checkDoors(dt) {
  if (state.doorCooldown > 0) {
    state.doorCooldown -= dt;
    return;
  }
  const p = state.player.position;
  const x = Math.floor(p.x);
  const y = Math.floor(p.y);
  const z = Math.floor(p.z);
  for (const door of state.zone.doors) {
    if (x < door.x0 || x > door.x1 || z < door.z0 || z > door.z1) continue;
    if (door.y0 !== undefined && (y < door.y0 || y > door.y1)) continue;
    enterZone(door.target, door.spawnKey || null);
    return;
  }
}

// ---------------------------------------------------------------------------
// Building
// ---------------------------------------------------------------------------

function blockedByCreature(x, y, z) {
  if (state.player.intersectsCell(x, y, z)) return true;
  for (const npc of state.npcs.npcs) {
    const np = npc.group.position;
    if (
      np.x + 0.35 > x && np.x - 0.35 < x + 1
      && np.y + 2 > y && np.y < y + 1
      && np.z + 0.35 > z && np.z - 0.35 < z + 1
    ) return true;
  }
  return false;
}

function placeBlock() {
  const zone = state.zone;
  if (!zone.editable) {
    ui.flashLabel('Building happens inside the houses');
    return;
  }
  const hit = state.player.targetBlock(zone);
  if (!hit) return;
  const { x, y, z } = hit.place;
  if (!zone.inBounds(x, y, z)) return;
  if (zone.get(x, y, z) !== AIR) return;
  if (blockedByCreature(x, y, z)) {
    ui.flashLabel('Something is in the way');
    return;
  }
  const id = ui.selectedBlockId;
  if (id == null) return;
  zone.set(x, y, z, id);
  ui.flashLabel(getBlock(id)?.label || 'Placed');
  autosave();
}

function removeBlock() {
  const zone = state.zone;
  if (!zone.editable) {
    ui.flashLabel('Building happens inside the houses');
    return;
  }
  const hit = state.player.targetBlock(zone);
  if (!hit) return;
  const { x, y, z } = hit.block;
  if (y === 0) {
    // Keep the floor. Without it she'd end up standing in a hole looking at
    // nothing, and there's no way to tell that's what happened.
    ui.flashLabel('The floor stays put');
    return;
  }
  zone.set(x, y, z, AIR);
  autosave();
}

// ---------------------------------------------------------------------------
// Shop and piggy bank
//
// Money arrives once a day and is never shown (src/shop/piggybank.js). It's
// collected here whenever it could have become a new day: on boot, when the
// tab or app comes back to the front, and when the shop opens.
// ---------------------------------------------------------------------------

// Only ever changed by the test hook below, to step into tomorrow.
let dayOffset = 0;
const today = () => dayKey(new Date(Date.now() + dayOffset * 24 * 60 * 60 * 1000));

function ownedPacks() {
  return new Set(state.save.packs);
}

function collectAllowance() {
  if (!state.save.piggyBank) state.save.piggyBank = emptyBank();
  const days = payAllowance(state.save.piggyBank, today());
  // No toast and no sound: she's not meant to see the money arrive.
  if (days) autosave();
  return days;
}

function currentShopView() {
  return shopView(state.save.piggyBank, ownedPacks());
}

function openShop() {
  if (state.playing) {
    state.playing = false;
    input.setEnabled(false);
    input.exitPointerLock();
  }
  voice.stop();
  ui.hideDialogue();
  ui.closePause();
  ui.closeCreator();
  ui.hideTitle();
  collectAllowance();
  ui.openShop(currentShopView());
}

function buy(packId) {
  collectAllowance();
  const owned = ownedPacks();
  const result = buyPack(state.save.piggyBank, owned, packId);
  if (result.ok) {
    state.save.packs = [...owned];
    ui.setOwnedPacks(owned);
    // So the hotbar is already on the new tab next time she's indoors.
    ui.showPaletteGroup(packId);
  }
  ui.shop.refresh(currentShopView());
  if (result.ok) {
    ui.shop.reveal(packId);
    saveNow();
  }
  return result.ok;
}

// ---------------------------------------------------------------------------
// Talking
// ---------------------------------------------------------------------------

function talk() {
  const result = state.npcs.talk();
  if (!result) return;
  const villager = getVillager(result.npc.id);
  const more = result.npc.lines.length > 1
    ? (IS_TOUCH ? 'tap for more' : 'press E for more')
    : '';
  ui.showDialogue(result.npc.name, villager?.role || '', result.text, more);
}

state.npcs = new NpcManager(scene, voice);
state.npcs.onDialogueEnd = () => ui.hideDialogue();

// ---------------------------------------------------------------------------
// Pausing
// ---------------------------------------------------------------------------

function pause() {
  if (!state.playing) return;
  state.playing = false;
  input.setEnabled(false);
  input.exitPointerLock();
  ui.openPause();
  voice.stop();
  saveNow();
}

function resume() {
  ui.closePause();
  ui.closeCreator();
  ui.hideTitle();
  state.playing = true;
  input.setEnabled(true);
  if (!IS_TOUCH) input.requestPointerLock();
}

input.onPointerUnlock = () => {
  if (state.playing && !ui.anyMenuOpen) pause();
};

// ---------------------------------------------------------------------------
// Touch control wiring
// ---------------------------------------------------------------------------

if (IS_TOUCH) {
  input.bindButton(ui.jumpBtn, 'jump');
  input.bindButton(ui.placeBtn, 'place', { repeat: true });
  input.bindButton(ui.breakBtn, 'break', { repeat: true });
  input.bindButton(ui.talkBtn, 'interact');

  input.onJoystickStart = (x, y) => {
    ui.joystick.style.left = `${x}px`;
    ui.joystick.style.top = `${y}px`;
    ui.joystick.classList.add('active');
  };
  input.onJoystickMove = (x, y) => {
    const nub = ui.joystick.firstElementChild;
    nub.style.transform = `translate(${x * 30}px, ${y * 30}px)`;
  };
  input.onJoystickEnd = () => {
    ui.joystick.classList.remove('active');
    const nub = ui.joystick.firstElementChild;
    if (nub) nub.style.transform = '';
  };
}

ui.canvas.addEventListener('mousedown', () => {
  if (state.playing && !IS_TOUCH && !input.pointerLocked && !ui.anyMenuOpen) {
    input.requestPointerLock();
  }
});

// ---------------------------------------------------------------------------
// UI callbacks
// ---------------------------------------------------------------------------

ui.on('play', () => resume())
  .on('pause', () => pause())
  .on('resume', () => resume())
  .on('save', async () => {
    await saveNow();
    ui.toast('Saved ✓', 1600);
  })
  .on('toggleCamera', () => {
    state.player.firstPerson = !state.player.firstPerson;
    state.save.settings.firstPerson = state.player.firstPerson;
    ui.flashLabel(state.player.firstPerson ? 'Looking through your eyes' : 'Watching yourself');
    autosave();
  })
  .on('talk', () => talk())
  .on('setting', (key, value) => {
    state.save.settings[key] = value;
    if (key === 'voice') voice.setEnabled(value);
    if (key === 'shadows') {
      renderer.shadowMap.enabled = value;
      lighting.setShadowsEnabled(value);
      state.world.castShadows = value;
      for (const zone of state.world.zones.values()) {
        for (const [id, mesh] of zone.meshes) {
          // Crossed-plane plants never cast; their shadows are just noise.
          mesh.castShadow = value && getBlock(id)?.geometry === 'box';
          mesh.receiveShadow = value;
        }
      }
    }
    autosave();
  })
  .on('reset', async () => {
    await store.clear();
    window.location.reload();
  })
  .on('openCharacters', () => {
    if (state.playing) {
      state.playing = false;
      input.setEnabled(false);
      input.exitPointerLock();
    }
    ui.closePause();
    ui.hideTitle();
    ui.openCreator(state.save.characters, state.save.activeCharacterId);
  })
  .on('closeCharacters', () => {
    ui.closeCreator();
    resume();
  })
  .on('openShop', () => openShop())
  .on('closeShop', () => {
    ui.closeShop();
    resume();
  })
  .on('buyPack', (id) => buy(id))
  .on('saveCharacter', (draft) => {
    const name = (draft.name || '').trim() || 'Someone';
    const editingId = ui.editingCharacterId;
    if (editingId) {
      const index = state.save.characters.findIndex((c) => c.id === editingId);
      if (index >= 0) state.save.characters[index] = { ...draft, name, id: editingId };
      if (editingId === state.save.activeCharacterId) state.player.setCharacter({ ...draft, name });
    } else {
      const id = newCharacterId();
      state.save.characters.push({ ...draft, name, id });
      ui.setEditingCharacter(id);
      if (!state.save.activeCharacterId) {
        state.save.activeCharacterId = id;
        state.player.setCharacter({ ...draft, name });
      }
    }
    ui.refreshCharacterList(state.save.characters, state.save.activeCharacterId);
    ui.toast(`${name} saved ✓`, 1800);
    autosave();
  })
  .on('playAs', (id) => {
    const character = state.save.characters.find((c) => c.id === id);
    if (!character) return;
    state.save.activeCharacterId = id;
    state.player.setCharacter(character);
    ui.refreshCharacterList(state.save.characters, id);
    ui.toast(`You are ${character.name} now`, 2200);
    autosave();
  })
  .on('deleteCharacter', (id) => {
    if (state.save.characters.length <= 1) return;
    state.save.characters = state.save.characters.filter((c) => c.id !== id);
    if (state.save.activeCharacterId === id) {
      state.save.activeCharacterId = state.save.characters[0].id;
      state.player.setCharacter(state.save.characters[0]);
    }
    if (ui.editingCharacterId === id) ui.setEditingCharacter(state.save.activeCharacterId);
    ui.refreshCharacterList(state.save.characters, state.save.activeCharacterId);
    autosave();
  });

// ---------------------------------------------------------------------------
// Keyboard shortcuts that aren't movement
// ---------------------------------------------------------------------------

window.addEventListener('keydown', (e) => {
  if (e.code === 'Escape') {
    if (ui.shopOpen) {
      if (ui.shop.revealOpen) {
        ui.shop.closeReveal();
      } else {
        ui.closeShop();
        resume();
      }
    } else if (!ui.creator.hidden) {
      ui.closeCreator();
      resume();
    } else if (!ui.helpMenu.hidden) {
      ui.helpMenu.hidden = true;
      ui.openPause();
    } else if (state.playing) {
      pause();
    } else if (!ui.pauseMenu.hidden) {
      resume();
    }
    return;
  }
  if (!state.playing) return;
  if (e.code === 'KeyC') ui.emit('toggleCamera');
  if (e.code === 'KeyE') talk();
  if (/^Digit[1-9]$/.test(e.code)) ui.selectSlot(Number(e.code.slice(5)) - 1);
});

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    voice.stop();
    if (state.world) saveNow();
  } else if (state.world) {
    // A phone left on the game overnight comes back to a new day.
    collectAllowance();
    if (ui.shopOpen) ui.shop.refresh(currentShopView());
  }
});
window.addEventListener('pagehide', () => { if (state.world) saveNow(); });

// ---------------------------------------------------------------------------
// Frame loop
// ---------------------------------------------------------------------------

let last = performance.now();

function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (!state.world || !state.zone) return;
  state.elapsed += dt;

  if (state.playing) {
    const zone = state.zone;
    const player = state.player;

    player.update(dt, input, zone);
    state.npcs.update(dt, player);
    checkDoors(dt);

    // Blocks
    if (zone.editable) {
      if (input.wasPressed('place') || input.wasPressed('tap')) placeBlock();
      if (input.wasPressed('break')) removeBlock();
      const wheel = input.consumeWheel();
      if (wheel) ui.cycleSlot(wheel > 0 ? 1 : -1);
    } else {
      input.consumeWheel();
    }

    // Talking
    if (input.wasPressed('interact')) talk();
    const nearby = state.npcs.nearest;
    ui.setTalkAvailable(!!nearby);
    if (nearby && !ui.dialogueOpen) {
      ui.showHint(`Talk to ${nearby.name}`, IS_TOUCH ? null : 'E');
    } else {
      ui.hideHint();
    }

    // Target highlight
    if (zone.editable) {
      const hit = player.targetBlock(zone);
      if (hit) {
        highlight.visible = true;
        highlight.position.set(hit.block.x + 0.5, hit.block.y + 0.5, hit.block.z + 0.5);
        const p = hit.place;
        const canPlace = zone.inBounds(p.x, p.y, p.z) && zone.get(p.x, p.y, p.z) === AIR
          && !blockedByCreature(p.x, p.y, p.z);
        ghost.visible = canPlace;
        if (canPlace) {
          ghost.position.set(p.x + 0.5, p.y + 0.5, p.z + 0.5);
          const def = getBlock(ui.selectedBlockId);
          if (def) ghost.material.color.set(def.icon);
        }
      } else {
        highlight.visible = false;
        ghost.visible = false;
      }
    } else {
      highlight.visible = false;
      ghost.visible = false;
    }

    if (zone.dirty) zone.rebuild(renderer.shadowMap.enabled);

    player.updateCamera(camera, zone);
    lighting.update(zone, player.position);
  }

  // Outside the playing branch: otherwise a key pressed as a menu opens stays
  // "just pressed" and fires the moment play resumes.
  input.endFrame();
  renderer.render(scene, camera);
}

// ---------------------------------------------------------------------------
// Test hooks
//
// A small handle on the running game so scripts/smoke-test.mjs can drive it
// the way a player would and check what actually happened. Also handy for
// poking at the world from the browser console.
// ---------------------------------------------------------------------------

function installTestHooks() {
  window.__game = {
    state,
    input,
    ui,
    zoneId: () => state.zone?.id ?? null,
    enterZone: (id, spawnKey = null) => enterZone(id, spawnKey),
    characterCount: () => state.save.characters.length,
    activeCharacterName: () => activeCharacter().name,
    blockCount: () => {
      const { data } = state.zone;
      let count = 0;
      for (let i = 0; i < data.length; i++) if (data[i] !== AIR) count += 1;
      return count;
    },
    editCount: () => Object.values(state.world.collectEdits())
      .reduce((total, edits) => total + Object.keys(edits).length, 0),
    setLook: (yaw, pitch) => {
      state.player.yaw = yaw;
      state.player.pitch = pitch;
    },
    placeAt: (pos, yaw = 0, pitch = 0) => {
      state.player.teleport(pos, yaw);
      state.player.pitch = pitch;
      state.doorCooldown = 3;
    },
    /** Stand right in front of the closest villager in this zone. */
    goToNearestNpc: () => {
      const npc = state.npcs.npcs[0];
      if (!npc) return false;
      const p = npc.group.position;
      state.player.teleport([p.x, p.y + 0.1, p.z + 1.4], Math.PI);
      return true;
    },
    saveNow,
    validateWorld,
    place: () => placeBlock(),
    remove: () => removeBlock(),
    // The shop. Deliberately no way to read the balance here either — tests
    // check what she'd see (Buy / Not yet / Yours), not the number behind it.
    ownedPacks: () => [...state.save.packs],
    packStatus: (id) => currentShopView().find((v) => v.pack.id === id)?.status ?? null,
    /** Pretend `days` more days have gone by, then collect what's owed. */
    skipDays: (days = 1) => {
      dayOffset += days;
      collectAllowance();
      if (ui.shopOpen) ui.shop.refresh(currentShopView());
    },
  };
}

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------

async function boot() {
  state.save = await store.load();
  await voice.init();
  voice.setEnabled(state.save.settings.voice !== false);

  if (state.save.settings.shadows === null || state.save.settings.shadows === undefined) {
    // Phones get shadows off by default; it's the single biggest cost here.
    state.save.settings.shadows = !IS_TOUCH;
  }
  renderer.shadowMap.enabled = state.save.settings.shadows;
  lighting.setShadowsEnabled(state.save.settings.shadows);
  ui.setSettingValue('shadows', state.save.settings.shadows);
  ui.setSettingValue('voice', state.save.settings.voice !== false);

  if (!state.save.characters.length) {
    state.save.characters = [{ ...DEFAULT_CHARACTER, id: newCharacterId() }];
    state.save.activeCharacterId = state.save.characters[0].id;
  }

  // Today's money, if it hasn't arrived yet, and whatever she's bought before.
  collectAllowance();
  ui.setOwnedPacks(ownedPacks());

  state.world = new World({
    edits: state.save.edits,
    castShadows: state.save.settings.shadows,
  });
  state.player = new Player(activeCharacter());
  state.player.firstPerson = !!state.save.settings.firstPerson;
  scene.add(state.player.group);

  // Come back to wherever she left off.
  const location = state.save.location;
  if (location && location.zone) {
    try {
      enterZone(location.zone, null, {
        keepPosition: { pos: location.pos, yaw: location.yaw },
      });
    } catch {
      enterZone('village', 'start');
    }
  } else {
    enterZone('village', 'start');
  }

  ui.hideLoading();
  ui.showTitle(!!state.save.playedBefore);
  installTestHooks();
  requestAnimationFrame(frame);

  if (!state.save.playedBefore) {
    ui.toast('Walk into a door to go inside a house 🚪', 5200);
  }
}

// Let the loading screen actually paint before the world build blocks the
// main thread — otherwise she stares at a white page.
requestAnimationFrame(() => {
  requestAnimationFrame(() => {
    boot().catch((error) => {
      console.error(error);
      ui.loading.hidden = false;
      ui.loading.textContent = 'Something went wrong loading the village. Try refreshing.';
    });
  });
});
