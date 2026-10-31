import './styles.css';

import { UI } from './ui/ui.js';
import { sfx, setSoundsEnabled } from './ui/sfx.js';
import { SaveStore } from './core/save.js';
import { Stage } from './world/stage.js';
import {
  PLACES, START_PLACE, getPlace, arrivalX, townSpotFor,
} from './world/places.js';
import { seedThings, seedPerson } from './world/seed.js';
import { landingY } from './world/physics.js';
import { getThing, packThings } from './art/things.js';
import { DEFAULT_CHARACTER } from './art/person.js';
import { VILLAGERS, getVillager } from './npc/dialogue.js';
import { Voice } from './npc/voice.js';
import {
  emptyBank, payAllowance, buyPack, shopView, dayKey,
} from './shop/piggybank.js';

const root = document.getElementById('app');
const ui = new UI(root);
const store = new SaveStore();
const voice = new Voice();

const state = {
  save: null,
  stage: null,
  talkIndex: {},
};

// ---------------------------------------------------------------------------
// Saving
// ---------------------------------------------------------------------------

function snapshot() {
  return {
    ...state.save,
    place: state.stage?.place?.id ?? state.save.place,
    playedBefore: true,
  };
}

function autosave() {
  if (!state.save) return;
  store.schedule(snapshot);
}

async function saveNow() {
  if (!state.save) return;
  state.save = snapshot();
  await store.flush(() => state.save);
}

// ---------------------------------------------------------------------------
// The world: where everything and everyone is
// ---------------------------------------------------------------------------

function newCharacterId() {
  return `c${Date.now().toString(36)}${Math.floor(Math.random() * 1e4).toString(36)}`;
}

/** Fill in anything missing: places never seeded, villagers, new characters. */
function completeWorld() {
  if (!state.save.world) state.save.world = { things: {}, people: {} };
  const world = state.save.world;
  for (const place of Object.values(PLACES)) {
    if (!Array.isArray(world.things[place.id])) world.things[place.id] = seedThings(place);
  }
  for (const place of Object.values(PLACES)) {
    for (const [key, spec] of Object.entries(place.people)) {
      if (!world.people[key]) world.people[key] = seedPerson(place, world.things[place.id], spec);
    }
  }
  const start = getPlace(START_PLACE);
  state.save.characters.forEach((c, i) => {
    if (!world.people[c.id]) {
      world.people[c.id] = seedPerson(start, world.things[start.id], 1200 - i * 70);
    }
  });
  // Forget anyone who no longer exists (a deleted character).
  for (const key of Object.keys(world.people)) {
    if (!VILLAGERS[key] && !state.save.characters.some((c) => c.id === key)) delete world.people[key];
  }
}

function personConfig(key) {
  const villager = getVillager(key);
  if (villager) return { ...villager.character, name: villager.name };
  return state.save.characters.find((c) => c.id === key) || null;
}

function peopleList() {
  const here = state.stage?.place?.id;
  const keys = [...state.save.characters.map((c) => c.id), ...Object.keys(VILLAGERS)];
  return keys.map((key) => ({
    key,
    name: personConfig(key)?.name || 'Someone',
    cfg: personConfig(key),
    here: state.save.world.people[key]?.place === here,
  }));
}

// ---------------------------------------------------------------------------
// Going places
// ---------------------------------------------------------------------------

function go(placeId, { focusX = null } = {}) {
  const place = getPlace(placeId);
  if (!place) return;
  voice.stop();
  state.stage.show(placeId);
  if (focusX !== null) state.stage.centerOn(focusX);
  ui.setPlace(place);
  ui.setPeople(peopleList());
  if (placeId === 'moon' && !state.save.discovered.moon) {
    state.save.discovered.moon = true;
    ui.toast('🌙 You found the Moon House!', 4200);
    sfx('tada');
  }
  autosave();
}

/** Someone was dropped on a door: they go through it, and so do we. */
function travel(key, to) {
  const world = state.save.world;
  const person = world.people[key];
  const from = person.place;
  const target = getPlace(to);
  const x = to === 'town' ? townSpotFor(from) : arrivalX(target);
  const fromList = world.things[from] || [];
  const held = fromList.find((t) => t.heldBy === key);
  if (held) {
    fromList.splice(fromList.indexOf(held), 1);
    world.things[to].push(held);
  }
  person.place = to;
  person.seat = null;
  person.x = x;
  person.y = landingY(target, world.things[to], { x, y: target.ground - 100 });
  sfx('whoosh');
  go(to, { focusX: x });
}

// ---------------------------------------------------------------------------
// Talking
// ---------------------------------------------------------------------------

const CHATTER = ['Hi!', 'Hee hee!', 'La la la!', 'I like it here.', 'Wheee!', 'Hello there!', 'Hmm hmm hmm.'];

function tapPerson(key) {
  const villager = getVillager(key);
  if (villager) {
    const index = (state.talkIndex[key] ?? -1) + 1;
    state.talkIndex[key] = index % villager.lines.length;
    const line = villager.lines[state.talkIndex[key]];
    state.stage.bubble(key, line);
    voice.speak(key, state.talkIndex[key], line, villager);
    return;
  }
  const cfg = personConfig(key);
  const line = Math.random() < 0.3 ? `I'm ${cfg?.name || 'me'}!` : CHATTER[Math.floor(Math.random() * CHATTER.length)];
  state.stage.bubble(key, line);
  voice.speak(`me-${key}`, 0, line, { voice: { pitch: 1.3, rate: 1 } });
}

// ---------------------------------------------------------------------------
// Shop and piggy bank
//
// Money arrives once a day and is never shown (src/shop/piggybank.js). It's
// collected whenever it could have become a new day: on boot, when the app
// comes back to the front, and when the shop opens.
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

let boughtSinceOpen = null;

function openShop() {
  closeEverything();
  collectAllowance();
  boughtSinceOpen = null;
  ui.openShop(currentShopView());
}

function closeShop() {
  ui.closeShop();
  ui.hideTitle();
  // Straight to the new things: the toy box, or Characters for a pack of looks.
  if (!boughtSinceOpen) return;
  if (packThings(boughtSinceOpen).length) ui.showDrawerTab('stuff', boughtSinceOpen);
  else ui.openCreator(state.save.characters, state.save.characters[0]?.id);
}

function buy(packId) {
  collectAllowance();
  const owned = ownedPacks();
  const result = buyPack(state.save.piggyBank, owned, packId);
  if (result.ok) {
    state.save.packs = [...owned];
    ui.setOwnedPacks(owned);
    boughtSinceOpen = packId;
  }
  ui.shop.refresh(currentShopView());
  if (result.ok) {
    ui.shop.reveal(packId);
    saveNow();
  }
  return result.ok;
}

// ---------------------------------------------------------------------------
// Menus
// ---------------------------------------------------------------------------

function closeEverything() {
  state.stage?.cancelDrags();
  voice.stop();
  ui.closePause();
  ui.closeCreator();
  ui.hideTitle();
  ui.toggleDrawer(false);
}

function pause() {
  closeEverything();
  ui.openPause();
  saveNow();
}

function resume() {
  closeEverything();
}

ui.on('play', () => resume())
  .on('pause', () => pause())
  .on('resume', () => resume())
  .on('go', (placeId) => go(placeId))
  .on('save', async () => {
    await saveNow();
    ui.toast('Saved ✓', 1600);
  })
  .on('setting', (key, value) => {
    state.save.settings[key] = value;
    if (key === 'voice') voice.setEnabled(value);
    if (key === 'sounds') setSoundsEnabled(value);
    autosave();
  })
  .on('reset', async () => {
    await store.clear();
    window.location.reload();
  })
  .on('openShop', () => openShop())
  .on('closeShop', () => closeShop())
  .on('buyPack', (id) => buy(id))
  .on('spawn', (spec, e) => {
    if (spec.thing) state.stage.spawnThing(spec.thing, e);
    else state.stage.spawnPerson(spec.person, e);
    ui.setPeople(peopleList());
  })
  .on('place', (spec) => {
    if (spec.thing) state.stage.placeThing(spec.thing);
    else state.stage.placePerson(spec.person);
    sfx('pop');
    ui.setPeople(peopleList());
  })
  .on('openCharacters', () => {
    closeEverything();
    ui.openCreator(state.save.characters, state.save.characters[0]?.id);
  })
  .on('closeCharacters', () => {
    ui.closeCreator();
  })
  .on('saveCharacter', (draft) => {
    const name = (draft.name || '').trim() || 'Someone';
    const editingId = ui.editingCharacterId;
    if (editingId) {
      const index = state.save.characters.findIndex((c) => c.id === editingId);
      if (index >= 0) state.save.characters[index] = { ...draft, name, id: editingId };
      state.stage.refreshPerson(editingId);
    } else {
      const id = newCharacterId();
      state.save.characters.push({ ...draft, name, id });
      state.save.world.people[id] = { place: null, x: 0, y: 0 };
      ui.setEditingCharacter(id);
      // New people pop up wherever she is.
      state.stage.placePerson(id);
    }
    ui.refreshCharacterList(state.save.characters);
    ui.setPeople(peopleList());
    ui.toast(`${name} saved ✓`, 1800);
    autosave();
  })
  .on('deleteCharacter', (id) => {
    if (state.save.characters.length <= 1) return;
    const person = state.save.world.people[id];
    if (person?.place === state.stage.place.id) state.stage.putAwayPerson(id);
    else if (person?.place) {
      const list = state.save.world.things[person.place] || [];
      for (const t of list) if (t.heldBy === id) t.heldBy = null;
    }
    state.save.characters = state.save.characters.filter((c) => c.id !== id);
    delete state.save.world.people[id];
    if (ui.editingCharacterId === id) ui.setEditingCharacter(state.save.characters[0].id);
    ui.refreshCharacterList(state.save.characters);
    ui.setPeople(peopleList());
    autosave();
  });

window.addEventListener('keydown', (e) => {
  if (e.code !== 'Escape') return;
  if (ui.shopOpen) {
    if (!ui.shop.back()) closeShop();
  } else if (!ui.creator.hidden) {
    ui.closeCreator();
  } else if (!ui.helpMenu.hidden) {
    ui.helpMenu.hidden = true;
    ui.openPause();
  } else if (!ui.pauseMenu.hidden) {
    resume();
  } else if (!ui.drawer.hidden) {
    ui.toggleDrawer(false);
  } else if (ui.titleScreen.hidden) {
    pause();
  }
});

document.addEventListener('visibilitychange', () => {
  if (!state.save) return;
  if (document.hidden) {
    voice.stop();
    state.stage?.cancelDrags();
    saveNow();
  } else {
    // A phone left on the game overnight comes back to a new day.
    collectAllowance();
    if (ui.shopOpen) ui.shop.refresh(currentShopView());
  }
});
window.addEventListener('pagehide', () => { if (state.save) saveNow(); });

// ---------------------------------------------------------------------------
// Test hooks
//
// A small handle on the running game so the smoke test can drive it the way
// a player would and check what actually happened. Also handy from the
// browser console.
// ---------------------------------------------------------------------------

function installTestHooks() {
  const stage = state.stage;
  window.__game = {
    state,
    ui,
    stage,
    placeId: () => stage.place?.id ?? null,
    go: (id) => go(id),
    things: () => stage.things.map((t) => ({ ...t, st: { ...t.st } })),
    thing: (uid) => {
      const t = stage.things.find((x) => x.uid === uid);
      return t ? { ...t, st: { ...t.st } } : null;
    },
    findThing: (kind) => stage.things.find((t) => t.kind === kind && !t.heldBy)?.uid ?? null,
    person: (key) => ({ ...state.save.world.people[key], spot: stage.personSpot(key) }),
    peopleHere: () => stage.peopleHere(),
    /** Screen position of a world point, for real mouse and touch drags. */
    toScreen: (x, y) => {
      const rect = stage.viewport.getBoundingClientRect();
      return { x: rect.left + stage.tx + x * stage.scale, y: rect.top + stage.ty + y * stage.scale };
    },
    /** Slide the view so world x is in the middle. */
    look: (x) => stage.centerOn(x),
    /** Screen position of the middle of a thing (doesn't move the view). */
    thingOnScreen: (uid) => {
      const t = stage.things.find((x) => x.uid === uid);
      if (!t) return null;
      const def = getThing(t.kind);
      return window.__game.toScreen(t.x, t.y - def.h / 2);
    },
    personOnScreen: (key) => {
      const spot = stage.personSpot(key);
      const lift = spot.pose === 'stand' ? 90 : spot.pose === 'sit' ? 70 : 25;
      return window.__game.toScreen(spot.x, spot.y - lift);
    },
    seatOnScreen: (uid, i = 0) => {
      const seat = stage.seatPoint({ uid, i });
      return seat ? window.__game.toScreen(seat.x, seat.y - 30) : null;
    },
    characterCount: () => state.save.characters.length,
    ownedPacks: () => [...state.save.packs],
    // The shop. Deliberately no way to read the balance here either — tests
    // check what she'd see (Buy / Not yet / Yours), not the number behind it.
    packStatus: (id) => currentShopView().find((v) => v.pack.id === id)?.status ?? null,
    /** Pretend `days` more days have gone by, then collect what's owed. */
    skipDays: (days = 1) => {
      dayOffset += days;
      collectAllowance();
      if (ui.shopOpen) ui.shop.refresh(currentShopView());
    },
    saveNow,
  };
}

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------

async function boot() {
  state.save = await store.load();
  await voice.init();
  voice.setEnabled(state.save.settings.voice !== false);
  setSoundsEnabled(state.save.settings.sounds !== false);
  ui.setSettingValue('voice', state.save.settings.voice !== false);
  ui.setSettingValue('sounds', state.save.settings.sounds !== false);

  if (!state.save.characters.length) {
    state.save.characters = [{ ...DEFAULT_CHARACTER, id: newCharacterId() }];
  }
  for (const c of state.save.characters) if (!c.outfit) c.outfit = 'tee';
  completeWorld();

  // Today's money, if it hasn't arrived yet, and whatever she's bought before.
  collectAllowance();
  ui.setOwnedPacks(ownedPacks());

  state.stage = new Stage(ui.viewport, state.save.world, {
    personConfig,
    ensurePlace: () => completeWorld(),
    onChange: () => {
      autosave();
      ui.setPeople(peopleList());
    },
    onTapPerson: (key) => tapPerson(key),
    onTravel: (key, to) => travel(key, to),
    onLinkTap: (to) => {
      sfx('whoosh');
      const from = state.stage.place.id;
      go(to, { focusX: to === 'town' ? townSpotFor(from) : null });
    },
    isOverDrawer: (x, y) => ui.isOverDrawer(x, y),
    onDragState: (on) => ui.setDragging(on),
    onDragMove: (x, y) => ui.highlightDrop(x, y),
    sfx,
  });

  go(getPlace(state.save.place) ? state.save.place : START_PLACE);

  ui.hideLoading();
  ui.showTitle(!!state.save.playedBefore);
  installTestHooks();

  if (!state.save.playedBefore) {
    ui.toast('Drag anyone and anything! Tap things to see what they do.', 6000);
  }
}

requestAnimationFrame(() => {
  requestAnimationFrame(() => {
    boot().catch((error) => {
      console.error(error);
      ui.loading.hidden = false;
      ui.loading.textContent = 'Something went wrong opening the dollhouse. Try refreshing.';
    });
  });
});
