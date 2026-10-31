import {
  SKIN_TONES, HAIR_COLORS, CLOTH_COLORS, HAIR_STYLES, OUTFITS, ACCESSORIES, BODY_TYPES,
  DEFAULT_CHARACTER, randomCharacter, unlockedOptions, drawPerson,
} from '../art/person.js';
import { THINGS } from '../art/things.js';
import { isUnlocked, getPack } from '../shop/packs.js';
import { ShopPanel } from './shop.js';
import { el, thingThumb, personThumb } from './dom.js';

/**
 * Everything that isn't the dollhouse itself: the buttons along the top, the
 * toy box drawer, the title screen, menus, the character creator and the
 * shop. It talks to main.js only through `emit`.
 */

const TOUCH = typeof window !== 'undefined'
  && (window.matchMedia?.('(pointer: coarse)').matches || 'ontouchstart' in window);

export class UI {
  constructor(root) {
    this.root = root;
    this.callbacks = {};
    this.owned = new Set();
    this.people = [];
    this.drawerTab = 'stuff';
    this.creatorState = null;
    this._build();
  }

  on(name, fn) {
    this.callbacks[name] = fn;
    return this;
  }

  emit(name, ...args) {
    return this.callbacks[name]?.(...args);
  }

  _build() {
    this.viewport = el('div', { id: 'stage-viewport' });

    // --- top bar ---
    this.menuBtn = el('button', {
      class: 'icon-btn', title: 'Menu', 'aria-label': 'Menu', onclick: () => this.emit('pause'),
    }, '☰');
    this.townBtn = el('button', {
      id: 'town-btn', class: 'icon-btn', title: 'Back to the street', 'aria-label': 'Back to the street',
      onclick: () => this.emit('go', 'town'),
    }, '🏘');
    this.shopBtn = el('button', {
      id: 'shop-btn', class: 'icon-btn', title: 'Shop', 'aria-label': 'Shop', onclick: () => this.emit('openShop'),
    }, '🛍');
    this.placeName = el('div', { id: 'place-name' }, '');
    this.topBar = el('div', { id: 'top-bar' }, this.menuBtn, this.townBtn, this.shopBtn, this.placeName);
    this.toasts = el('div', { id: 'toasts' });

    // --- the toy box ---
    this.drawerBtn = el('button', {
      id: 'drawer-btn', 'aria-label': 'Toy box', title: 'Toy box', onclick: () => this.toggleDrawer(),
    }, el('span', { class: 'emoji' }, '🧸'), el('span', { class: 'put-away' }, 'Put away'));
    this.drawerTabs = el('div', { class: 'drawer-tabs' });
    this.drawerList = el('div', { class: 'drawer-list' });
    this.drawer = el('div', { id: 'drawer', hidden: true },
      el('div', { class: 'drawer-head' }, this.drawerTabs,
        el('div', { class: 'drawer-hint' }, 'Drag up to bring out · drag back here to put away'),
        el('button', { class: 'icon-btn small', 'aria-label': 'Close', onclick: () => this.toggleDrawer(false) }, '✕')),
      this.drawerList);

    this.hud = el('div', { id: 'hud' }, this.topBar, this.toasts, this.drawerBtn, this.drawer);

    // --- overlays ---
    this.titleScreen = this._buildTitle();
    this.pauseMenu = this._buildPause();
    this.helpMenu = this._buildHelp();
    this.creator = this._buildCreator();
    this.shop = new ShopPanel({
      onBuy: (id) => this.emit('buyPack', id),
      onClose: () => this.emit('closeShop'),
    });
    this.loading = el('div', { id: 'loading' },
      el('span', { class: 'moon' }, '🏡'), el('div', {}, 'Opening the dollhouse…'));

    this.root.append(this.viewport, this.hud, this.titleScreen, this.pauseMenu, this.helpMenu,
      this.creator, this.shop.root, this.loading);
  }

  // ------------------------------------------------------------------
  // Title, pause, help
  // ------------------------------------------------------------------

  _buildTitle() {
    this.titlePlayBtn = el('button', { class: 'btn', onclick: () => this.emit('play') }, 'Play');
    return el('div', { id: 'title', class: 'overlay' },
      el('div', { class: 'panel card' },
        el('div', { class: 'title-art', html: drawPerson(DEFAULT_CHARACTER, { mood: 'happy' }) }),
        el('h1', {}, "Sofia's Village"),
        el('p', {}, 'Pick up anyone and anything. Tap things to see what they do. '
          + 'Make your own people, and visit every house.'),
        el('div', { class: 'row' }, this.titlePlayBtn,
          el('button', { class: 'btn lilac', onclick: () => this.emit('openCharacters') }, 'Characters'),
          el('button', { class: 'btn secondary', onclick: () => this.emit('openShop') }, '🛍 Shop'))));
  }

  showTitle(hasSave) {
    this.titlePlayBtn.textContent = hasSave ? 'Carry on' : 'Play';
    this.titleScreen.hidden = false;
  }

  hideTitle() {
    this.titleScreen.hidden = true;
  }

  _buildPause() {
    const toggle = (label, key) => {
      const btn = el('button', {
        class: 'btn small',
        onclick: () => {
          const next = btn.dataset.on !== 'true';
          this.setSettingValue(key, next);
          this.emit('setting', key, next);
        },
      }, 'On');
      btn.dataset.on = 'true';
      this[`${key}Toggle`] = btn;
      return el('div', { class: 'setting' }, el('span', {}, label), btn);
    };
    return el('div', { id: 'pause', class: 'overlay', hidden: true },
      el('div', { class: 'panel menu-card' },
        el('h2', {}, 'Paused'),
        el('p', { class: 'sub' }, 'Everything saves by itself.'),
        el('div', { class: 'menu-rows' },
          el('button', { class: 'btn', onclick: () => this.emit('resume') }, 'Back to playing'),
          el('button', { class: 'btn lilac', onclick: () => this.emit('openCharacters') }, 'Characters'),
          el('button', { class: 'btn', onclick: () => this.emit('openShop') }, '🛍 Shop'),
          el('button', {
            class: 'btn secondary',
            onclick: () => { this.pauseMenu.hidden = true; this.helpMenu.hidden = false; },
          }, 'How to play'),
          toggle('Villager voices', 'voice'),
          toggle('Sounds', 'sounds'),
          el('button', { class: 'btn secondary', onclick: () => this.emit('save') }, 'Save now'),
          this._startOverButton())));
  }

  /**
   * Starting over asks twice, inside the page: the first tap says what will
   * happen, the second does it. (Browser confirm() pop-ups don't show
   * everywhere this runs — on claude.ai they're silently refused.)
   */
  _startOverButton() {
    let timer = null;
    const btn = el('button', {
      id: 'start-over', class: 'btn danger small',
      onclick: () => {
        if (btn.dataset.armed === 'true') {
          clearTimeout(timer);
          this.emit('reset');
          return;
        }
        btn.dataset.armed = 'true';
        btn.textContent = 'Tap again to put everything back to how it was';
        timer = setTimeout(() => {
          btn.dataset.armed = 'false';
          btn.textContent = 'Start over';
        }, 4000);
      },
    }, 'Start over');
    return btn;
  }

  _buildHelp() {
    const finger = TOUCH ? 'finger' : 'mouse';
    const rows = [
      ['Move things', `Press on anyone or anything and drag it with your ${finger}. Let go and it drops.`],
      ['Sit down', 'Drop someone on a chair or a sofa. Drop them on a bed and they go to sleep.'],
      ['Hold things', 'Drop something small onto a person and they hold it.'],
      ['Eat', 'Tap food to take a bite.'],
      ['Tap things', 'Lamps, the TV, the oven, the fridge, the piano, the animals — try everything.'],
      ['Go places', 'Tap a house on the street to go in. Drag someone onto a door to take them with you.'],
      ['The toy box', '🧸 has everyone and everything. Drag them out, or drag them back in to put them away.'],
      ['The shop', '🛍 has new things. Come back every day.'],
    ];
    return el('div', { id: 'help', class: 'overlay', hidden: true },
      el('div', { class: 'panel menu-card help' },
        el('h2', {}, 'How to play'),
        el('p', { class: 'sub' }, 'There is no way to lose. Nothing here can go wrong.'),
        el('dl', {}, rows.flatMap(([term, def]) => [el('dt', {}, term), el('dd', {}, def)])),
        el('div', { class: 'menu-rows', style: 'margin-top:18px' },
          el('button', {
            class: 'btn', onclick: () => { this.helpMenu.hidden = true; this.pauseMenu.hidden = false; },
          }, 'Back'))));
  }

  openPause() {
    this.pauseMenu.hidden = false;
    this.helpMenu.hidden = true;
  }

  closePause() {
    this.pauseMenu.hidden = true;
    this.helpMenu.hidden = true;
  }

  get anyMenuOpen() {
    return !this.pauseMenu.hidden || !this.helpMenu.hidden || !this.creator.hidden
      || !this.titleScreen.hidden || this.shop.isOpen;
  }

  setSettingValue(key, value) {
    const btn = this[`${key}Toggle`];
    if (!btn) return;
    btn.dataset.on = String(value);
    btn.textContent = value ? 'On' : 'Off';
  }

  // ------------------------------------------------------------------
  // Top bar, toasts
  // ------------------------------------------------------------------

  setPlace(place) {
    this.placeName.textContent = place.label;
    this.townBtn.hidden = place.id === 'town';
  }

  toast(text, duration = 3200) {
    const node = el('div', { class: 'toast' }, text);
    this.toasts.append(node);
    setTimeout(() => {
      node.classList.add('leaving');
      setTimeout(() => node.remove(), 420);
    }, duration);
  }

  // ------------------------------------------------------------------
  // The toy box
  // ------------------------------------------------------------------

  toggleDrawer(open = this.drawer.hidden) {
    this.drawer.hidden = !open;
    this.drawerBtn.classList.toggle('open', open);
    if (open) this.renderDrawer();
  }

  showDrawerTab(tab, scrollToPack = null) {
    this.drawerTab = tab;
    this.toggleDrawer(true);
    if (scrollToPack) {
      const first = this.drawerList.querySelector(`[data-pack="${scrollToPack}"]`);
      if (first) this.drawerList.scrollLeft = first.offsetLeft - 12;
    }
  }

  /** Everyone, for the People tab: [{ key, name, cfg, here }]. */
  setPeople(people) {
    this.people = people;
    if (!this.drawer.hidden && this.drawerTab === 'people') this.renderDrawer();
  }

  renderDrawer() {
    const tab = (key, label) => el('button', {
      class: `tab${this.drawerTab === key ? ' active' : ''}`,
      onclick: () => { this.drawerTab = key; this.renderDrawer(); },
    }, label);
    this.drawerTabs.replaceChildren(tab('stuff', '🧸 Stuff'), tab('people', '👫 People'));

    let tiles;
    if (this.drawerTab === 'people') {
      tiles = this.people.map((p) => this._tile(
        personThumb(p.cfg), p.name, { person: p.key }, p.here ? 'here' : '',
      ));
    } else {
      const free = THINGS.filter((t) => !t.pack);
      const bought = THINGS.filter((t) => t.pack && isUnlocked(t, this.owned));
      tiles = [...bought.reverse(), ...free].map((def) => this._tile(
        thingThumb(def), def.label, { thing: def.id }, def.pack ? 'new' : '', def.pack,
      ));
    }
    this.drawerList.replaceChildren(...tiles);
    this.drawerList.scrollLeft = 0;
  }

  /**
   * One tile. Tap it to drop the thing (or person) into the middle of the
   * view; drag it upwards to carry it out to exactly where you want it.
   */
  _tile(thumb, label, spec, badge = '', pack = null) {
    const tile = el('button', {
      class: `tile${badge ? ` ${badge}` : ''}`,
      'data-thing': spec.thing || null,
      'data-person': spec.person || null,
      'data-pack': pack,
      title: label,
    }, thumb, el('span', { class: 'label' }, label),
    badge === 'new' && pack ? el('span', { class: 'badge' }, getPack(pack)?.emoji || '★') : null);

    let start = null;
    tile.addEventListener('pointerdown', (e) => {
      start = { x: e.clientX, y: e.clientY, id: e.pointerId };
    });
    tile.addEventListener('pointermove', (e) => {
      if (!start || e.pointerId !== start.id) return;
      const dx = e.clientX - start.x;
      const dy = e.clientY - start.y;
      if (dy < -12 && Math.abs(dy) > Math.abs(dx)) {
        start = null;
        this.emit('spawn', spec, e);
      }
    });
    tile.addEventListener('pointerup', (e) => {
      if (!start || e.pointerId !== start.id) return;
      const moved = Math.hypot(e.clientX - start.x, e.clientY - start.y);
      start = null;
      if (moved < 10) this.emit('place', spec);
    });
    tile.addEventListener('pointercancel', () => { start = null; });
    return tile;
  }

  /** Is a point over the toy box (the open drawer, or the 🧸 button)? */
  isOverDrawer(x, y) {
    const inside = (r, pad = 0) => x >= r.left - pad && x <= r.right + pad && y >= r.top - pad && y <= r.bottom + pad;
    if (!this.drawer.hidden && inside(this.drawer.getBoundingClientRect())) return true;
    return inside(this.drawerBtn.getBoundingClientRect(), 14);
  }

  /** While something is being carried, the toy box becomes a place to drop it. */
  setDragging(on) {
    this.root.classList.toggle('carrying', on);
    if (!on) this.drawerBtn.classList.remove('hot');
  }

  highlightDrop(x, y) {
    this.drawerBtn.classList.toggle('hot', this.isOverDrawer(x, y));
  }

  // ------------------------------------------------------------------
  // Shop
  // ------------------------------------------------------------------

  openShop(view) {
    this.shop.open(view);
  }

  closeShop() {
    this.shop.close();
  }

  get shopOpen() {
    return this.shop.isOpen;
  }

  setOwnedPacks(owned) {
    this.owned = new Set(owned);
    if (!this.drawer.hidden) this.renderDrawer();
    if (this.creatorState) this._renderCreatorOptions();
  }

  // ------------------------------------------------------------------
  // Character creator
  // ------------------------------------------------------------------

  _buildCreator() {
    this.previewEl = el('div', { id: 'preview-box' });
    this.charListEl = el('div', { id: 'character-list' });
    this.optionsEl = el('div', { class: 'options' });
    this.nameInput = el('input', {
      type: 'text', maxlength: '16', placeholder: 'Name',
      oninput: () => {
        if (this.creatorState) this.creatorState.draft.name = this.nameInput.value;
      },
    });
    this.creatorTitle = el('h2', {}, 'Characters');
    return el('div', { id: 'creator', class: 'overlay', hidden: true },
      el('div', { class: 'panel menu-card' },
        this.creatorTitle,
        el('p', { class: 'sub' }, 'Make as many people as you like. New people pop up wherever you are.'),
        this.charListEl,
        el('div', { class: 'layout' }, this.previewEl, this.optionsEl),
        el('div', { class: 'row-split', style: 'margin-top:16px' },
          el('button', {
            class: 'btn secondary',
            onclick: () => {
              this.creatorState.draft = randomCharacter(this.creatorState.draft.name || 'Friend', this.owned);
              this.nameInput.value = this.creatorState.draft.name;
              this._renderCreatorOptions();
            },
          }, '🎲 Surprise me'),
          el('button', {
            class: 'btn', onclick: () => this.emit('saveCharacter', { ...this.creatorState.draft }),
          }, 'Save'),
          el('button', { class: 'btn secondary', onclick: () => this.emit('closeCharacters') }, 'Done'))));
  }

  openCreator(characters, editingId = characters[0]?.id ?? null) {
    const editing = characters.find((c) => c.id === editingId);
    this.creatorState = {
      characters,
      editingId: editing ? editingId : null,
      draft: { ...(editing || DEFAULT_CHARACTER) },
    };
    delete this.creatorState.draft.id;
    this.creator.hidden = false;
    this.nameInput.value = this.creatorState.draft.name || '';
    this._renderCharacterList();
    this._renderCreatorOptions();
  }

  closeCreator() {
    this.creator.hidden = true;
  }

  _renderCharacterList() {
    const state = this.creatorState;
    const rows = state.characters.map((char) => el('div', {
      class: `char-row${char.id === state.editingId ? ' active' : ''}`,
    },
    personThumb(char),
    el('span', { class: 'name' }, char.name || 'Someone'),
    el('button', {
      class: 'btn small secondary',
      onclick: () => {
        state.editingId = char.id;
        state.draft = { ...char };
        delete state.draft.id;
        this.nameInput.value = state.draft.name || '';
        this._renderCharacterList();
        this._renderCreatorOptions();
      },
    }, 'Edit'),
    state.characters.length > 1 ? el('button', {
      class: 'btn small danger', 'aria-label': `Delete ${char.name}`,
      onclick: () => this.emit('deleteCharacter', char.id),
    }, '✕') : null));

    rows.push(el('button', {
      class: 'btn small',
      onclick: () => {
        state.editingId = null;
        state.draft = { ...DEFAULT_CHARACTER, name: '' };
        this.nameInput.value = '';
        this._renderCharacterList();
        this._renderCreatorOptions();
      },
    }, '+ New character'));
    this.charListEl.replaceChildren(...rows);
    this.creatorTitle.textContent = state.editingId ? 'Change this character' : 'Make a character';
  }

  _renderCreatorOptions() {
    const draft = this.creatorState.draft;
    this.previewEl.innerHTML = drawPerson(draft, { mood: 'happy' });
    const owned = this.owned;

    const chips = (label, all, key) => el('div', { class: 'opt-group' },
      el('div', { class: 'opt-label' }, label),
      el('div', { class: 'chips' }, unlockedOptions(all, owned).map((entry) => el('button', {
        class: `chip${draft[key] === entry.id ? ' active' : ''}`,
        onclick: () => { draft[key] = entry.id; this._renderCreatorOptions(); },
      }, entry.label))));

    const swatches = (label, all, key) => el('div', { class: 'opt-group' },
      el('div', { class: 'opt-label' }, label),
      el('div', { class: 'chips' }, unlockedOptions(all, owned).map((entry) => el('button', {
        class: `swatch${draft[key] === entry.id ? ' active' : ''}`,
        'aria-label': entry.id,
        title: entry.id,
        style: `background:${entry.color}`,
        onclick: () => { draft[key] = entry.id; this._renderCreatorOptions(); },
      }))));

    this.optionsEl.replaceChildren(
      el('div', { class: 'name-row' }, this.nameInput),
      chips('Size', BODY_TYPES, 'body'),
      swatches('Skin', SKIN_TONES, 'skin'),
      chips('Hair', HAIR_STYLES, 'hair'),
      swatches('Hair colour', HAIR_COLORS, 'hairColor'),
      chips('Clothes', OUTFITS, 'outfit'),
      swatches('Top', CLOTH_COLORS, 'shirt'),
      swatches('Trousers', CLOTH_COLORS, 'pants'),
      swatches('Shoes', CLOTH_COLORS, 'shoes'),
      chips('Extra', ACCESSORIES, 'accessory'),
      swatches('Extra colour', CLOTH_COLORS, 'accessoryColor'),
    );
  }

  get editingCharacterId() {
    return this.creatorState?.editingId ?? null;
  }

  refreshCharacterList(characters) {
    if (!this.creatorState) return;
    this.creatorState.characters = characters;
    this._renderCharacterList();
  }

  setEditingCharacter(id) {
    if (this.creatorState) this.creatorState.editingId = id;
  }

  hideLoading() {
    this.loading.hidden = true;
  }
}
