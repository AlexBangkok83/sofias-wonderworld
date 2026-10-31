/**
 * Persistence. IndexedDB when it's available, localStorage when it isn't.
 *
 * No accounts, no server, no database — there's no multiplayer and nothing to
 * sync, so all of that would buy nothing. Everything lives on the device.
 * Syncing across her phone and laptop would be a separate conversation.
 */

import { cleanBank } from '../shop/piggybank.js';

const DB_NAME = 'sofias-village';
const DB_VERSION = 1;
const STORE = 'state';
const KEY = 'save';
const LS_KEY = 'sofias-village-save';

// Version 1 was the blocky 3D village. Version 2 is the dollhouse: the block
// edits and the 3D position are dropped, everything else carries over.
export const SAVE_VERSION = 2;

export function emptySave() {
  return {
    version: SAVE_VERSION,
    characters: [],
    // Where everything and everyone is: { things: {placeId: [...]}, people: {key: {...}} }.
    // Built from the authored places on first boot (src/world/seed.js).
    world: null,
    place: null,
    discovered: {},
    settings: { voice: true, sounds: true },
    playedBefore: false,
    // Hidden money (src/shop/piggybank.js). Never shown on screen. Filled in
    // on boot, which is also when the day's money arrives.
    piggyBank: null,
    // Ids of the shop packs she's bought.
    packs: [],
  };
}

function openDb() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('no indexedDB'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export class SaveStore {
  constructor() {
    this.db = null;
    this.usingFallback = false;
    this._timer = null;
    this._pending = null;
  }

  async _getDb() {
    if (this.db) return this.db;
    if (this.usingFallback) return null;
    try {
      this.db = await openDb();
      return this.db;
    } catch {
      this.usingFallback = true;
      return null;
    }
  }

  async load() {
    const db = await this._getDb();
    if (db) {
      try {
        const data = await new Promise((resolve, reject) => {
          const tx = db.transaction(STORE, 'readonly');
          const req = tx.objectStore(STORE).get(KEY);
          req.onsuccess = () => resolve(req.result);
          req.onerror = () => reject(req.error);
        });
        if (data) return this._migrate(data);
      } catch {
        this.usingFallback = true;
      }
    }
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) return this._migrate(JSON.parse(raw));
    } catch {
      // Storage blocked entirely (private mode on some browsers). Play on;
      // the game still works, it just won't remember anything.
    }
    return emptySave();
  }

  _migrate(data) {
    const base = emptySave();
    const merged = { ...base, ...data, settings: { ...base.settings, ...(data.settings || {}) } };
    if (!(data.version >= 2)) {
      // From the 3D village: keep her characters, the piggy bank and her packs.
      delete merged.edits;
      delete merged.location;
      delete merged.activeCharacterId;
      delete merged.settings.firstPerson;
      delete merged.settings.shadows;
      delete merged.settings.music;
      merged.world = null;
      merged.place = null;
    }
    merged.version = SAVE_VERSION;
    if (!Array.isArray(merged.characters)) merged.characters = [];
    merged.characters = merged.characters.filter((c) => c && typeof c.id === 'string');
    if (!merged.world || typeof merged.world !== 'object'
      || typeof merged.world.things !== 'object' || typeof merged.world.people !== 'object') {
      merged.world = null;
    }
    if (!merged.discovered || typeof merged.discovered !== 'object') merged.discovered = {};
    // Saves from before the shop existed have neither of these.
    merged.piggyBank = merged.piggyBank ? cleanBank(merged.piggyBank) : null;
    merged.packs = Array.isArray(merged.packs)
      ? [...new Set(merged.packs.filter((id) => typeof id === 'string'))]
      : [];
    return merged;
  }

  async write(data) {
    const payload = { ...data, version: SAVE_VERSION, savedAt: Date.now() };
    const db = await this._getDb();
    if (db) {
      try {
        await new Promise((resolve, reject) => {
          const tx = db.transaction(STORE, 'readwrite');
          tx.objectStore(STORE).put(payload, KEY);
          tx.oncomplete = resolve;
          tx.onerror = () => reject(tx.error);
        });
        return true;
      } catch {
        this.usingFallback = true;
      }
    }
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(payload));
      return true;
    } catch {
      return false;
    }
  }

  /** Coalesce rapid changes — she can place a lot of blocks in two seconds. */
  schedule(getData, delay = 1200) {
    this._pending = getData;
    if (this._timer) return;
    this._timer = setTimeout(() => {
      this._timer = null;
      const fn = this._pending;
      this._pending = null;
      if (fn) this.write(fn());
    }, delay);
  }

  /** Write immediately — on pause, on leaving a room, on tab hide. */
  async flush(getData) {
    if (this._timer) {
      clearTimeout(this._timer);
      this._timer = null;
    }
    const fn = getData || this._pending;
    this._pending = null;
    if (fn) return this.write(fn());
    return false;
  }

  async clear() {
    const db = await this._getDb();
    if (db) {
      try {
        await new Promise((resolve, reject) => {
          const tx = db.transaction(STORE, 'readwrite');
          tx.objectStore(STORE).delete(KEY);
          tx.oncomplete = resolve;
          tx.onerror = () => reject(tx.error);
        });
      } catch {
        // fall through to clearing localStorage too
      }
    }
    try {
      localStorage.removeItem(LS_KEY);
    } catch {
      // nothing to do
    }
  }
}
