import { paletteBlocks, getBlockRender } from '../world/blocks.js';
import {
  SKIN_TONES, HAIR_COLORS, CLOTH_COLORS, HAIR_STYLES, ACCESSORIES, BODY_TYPES,
  DEFAULT_CHARACTER, randomCharacter,
} from '../player/avatar.js';
import { CharacterPreview } from './preview.js';
import { IS_TOUCH } from '../core/input.js';

/** Small helper — build an element from a tag, props and children. */
function el(tag, props = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (key === 'class') node.className = value;
    else if (key === 'html') node.innerHTML = value;
    else if (key.startsWith('on') && typeof value === 'function') {
      node.addEventListener(key.slice(2).toLowerCase(), value);
    } else if (value !== null && value !== undefined && value !== false) {
      node.setAttribute(key, value === true ? '' : value);
    }
  }
  for (const child of children.flat()) {
    if (child == null) continue;
    node.append(typeof child === 'string' ? document.createTextNode(child) : child);
  }
  return node;
}

/** Turn a block's procedural texture into an <img>-able data URL for the hotbar. */
const iconCache = new Map();
function blockIcon(id) {
  if (iconCache.has(id)) return iconCache.get(id);
  const render = getBlockRender(id);
  let url = '';
  try {
    url = render.material.map.image.toDataURL();
  } catch {
    url = '';
  }
  iconCache.set(id, url);
  return url;
}

export class UI {
  constructor(root) {
    this.root = root;
    this.callbacks = {};
    this.paletteGroups = paletteBlocks();
    this.activeGroup = this.paletteGroups[0]?.key || 'build';
    this.selectedBlockId = this.paletteGroups[0]?.blocks[0]?.id ?? null;
    this.creatorState = null;
    this.preview = null;
    this._build();
  }

  on(name, fn) {
    this.callbacks[name] = fn;
    return this;
  }

  emit(name, ...args) {
    this.callbacks[name]?.(...args);
  }

  _build() {
    // --- canvas + HUD ---
    this.canvas = el('canvas', { id: 'scene' });

    this.crosshair = el('div', { id: 'crosshair' });
    this.placeLabel = el('div', { id: 'place-label' });
    this.hint = el('div', { id: 'hint' });
    this.toasts = el('div', { id: 'toasts' });
    this.zoneName = el('div', { id: 'zone-name' }, 'The Village');

    this.menuBtn = el('button', {
      class: 'icon-btn', title: 'Menu', 'aria-label': 'Menu',
      onclick: () => this.emit('pause'),
    }, '☰');
    this.cameraBtn = el('button', {
      class: 'icon-btn', title: 'Change view', 'aria-label': 'Change view',
      onclick: () => this.emit('toggleCamera'),
    }, '👁');

    this.topLeft = el('div', { id: 'top-left' }, this.menuBtn, this.cameraBtn, this.zoneName);

    // --- hotbar ---
    this.tabsEl = el('div', { id: 'palette-tabs' });
    this.hotbarEl = el('div', { id: 'hotbar' });
    this.selectedName = el('div', { id: 'selected-name' });
    this.hotbarWrap = el('div', { id: 'hotbar-wrap' },
      this.tabsEl, this.selectedName, this.hotbarEl);

    this.hud = el('div', { id: 'hud' },
      this.crosshair, this.placeLabel, this.hint, this.toasts,
      this.topLeft, this.hotbarWrap);

    // --- touch controls ---
    this.joystick = el('div', { id: 'joystick' }, el('div', { class: 'nub' }));
    this.jumpBtn = el('button', { class: 'round-btn', 'aria-label': 'Jump' }, '⤒');
    this.placeBtn = el('button', { class: 'round-btn', 'aria-label': 'Place block' }, '▣');
    this.breakBtn = el('button', { class: 'round-btn', 'aria-label': 'Remove block' }, '⛏');
    this.talkBtn = el('button', { class: 'round-btn wide', hidden: true, 'aria-label': 'Talk' }, '💬 Talk');
    this.touchButtons = el('div', { id: 'touch-buttons' },
      this.breakBtn, this.placeBtn, this.jumpBtn, this.talkBtn);
    this.touch = el('div', { id: 'touch', hidden: !IS_TOUCH },
      this.joystick, this.touchButtons);

    // --- dialogue ---
    this.dialogueWho = el('div', { class: 'who' });
    this.dialogueText = el('div', { class: 'text' });
    this.dialogueMore = el('div', { class: 'more' });
    this.dialogue = el('div', {
      id: 'dialogue', class: 'panel',
      onclick: () => this.emit('talk'),
    }, this.dialogueWho, this.dialogueText, this.dialogueMore);

    // --- overlays ---
    this.titleScreen = this._buildTitle();
    this.pauseMenu = this._buildPause();
    this.helpMenu = this._buildHelp();
    this.creator = this._buildCreator();
    this.loading = el('div', { id: 'loading' },
      el('span', { class: 'moon' }, '🌙'),
      el('div', {}, 'Building the village…'));

    this.root.append(
      this.canvas, this.hud, this.touch, this.dialogue,
      this.titleScreen, this.pauseMenu, this.helpMenu, this.creator, this.loading,
    );

    this.renderPalette();
  }

  // ------------------------------------------------------------------
  // Title
  // ------------------------------------------------------------------
  _buildTitle() {
    this.titlePlayBtn = el('button', {
      class: 'btn', onclick: () => this.emit('play'),
    }, 'Play');
    this.titleContinueBtn = el('button', {
      class: 'btn secondary', hidden: true, onclick: () => this.emit('play'),
    }, 'Carry on');
    this.titleCharBtn = el('button', {
      class: 'btn lilac', onclick: () => this.emit('openCharacters'),
    }, 'Characters');

    return el('div', { id: 'title', class: 'overlay' },
      el('div', { class: 'panel card' },
        el('div', { class: 'moon' }, '🌙'),
        el('h1', {}, "Sofia's Village"),
        el('p', {}, 'Wander around, go inside the houses, make characters, '
          + 'and build whatever you like out of blocks.'),
        el('div', { class: 'row' }, this.titlePlayBtn, this.titleCharBtn)));
  }

  showTitle(hasSave) {
    this.titlePlayBtn.textContent = hasSave ? 'Carry on' : 'Play';
    this.titleScreen.hidden = false;
  }

  hideTitle() {
    this.titleScreen.hidden = true;
  }

  // ------------------------------------------------------------------
  // Pause menu
  // ------------------------------------------------------------------
  _buildPause() {
    const toggle = (label, key, initial) => {
      const btn = el('button', {
        class: 'btn small', onclick: () => {
          const next = btn.dataset.on !== 'true';
          btn.dataset.on = String(next);
          btn.textContent = next ? 'On' : 'Off';
          this.emit('setting', key, next);
        },
      }, initial ? 'On' : 'Off');
      btn.dataset.on = String(initial);
      this[`${key}Toggle`] = btn;
      return el('div', { class: 'setting' }, el('span', {}, label), btn);
    };

    this.pauseRows = el('div', { class: 'menu-rows' },
      el('button', { class: 'btn', onclick: () => this.emit('resume') }, 'Back to playing'),
      el('button', { class: 'btn lilac', onclick: () => this.emit('openCharacters') }, 'Characters'),
      el('button', {
        class: 'btn secondary',
        onclick: () => { this.pauseMenu.hidden = true; this.helpMenu.hidden = false; },
      }, 'How to play'),
      toggle('Villager voices', 'voice', true),
      toggle('Shadows', 'shadows', true),
      el('button', {
        class: 'btn secondary', onclick: () => this.emit('save'),
      }, 'Save now'),
      el('button', {
        class: 'btn danger small',
        onclick: () => {
          if (window.confirm('Start the whole village again? Everything you built will go.')) {
            this.emit('reset');
          }
        },
      }, 'Start over'));

    return el('div', { id: 'pause', class: 'overlay', hidden: true },
      el('div', { class: 'panel menu-card' },
        el('h2', {}, 'Paused'),
        el('p', { class: 'sub' }, 'Everything saves by itself.'),
        this.pauseRows));
  }

  _buildHelp() {
    const rows = IS_TOUCH
      ? [
        ['Walk', 'Slide your left thumb anywhere on the left side of the screen.'],
        ['Look', 'Drag on the right side of the screen.'],
        ['Jump', 'The ⤒ button.'],
        ['Build', '▣ puts a block down. ⛏ takes one away. Tap the screen to place too.'],
        ['Pick a block', 'Tap one in the bar at the bottom.'],
        ['Talk', 'Walk up to a villager and press 💬 Talk.'],
        ['Go inside', 'Just walk into a door.'],
      ]
      : [
        ['Walk', 'W A S D, or the arrow keys. Hold Shift to run.'],
        ['Look', 'Move the mouse. Click the game first to grab the mouse; Esc lets it go.'],
        ['Jump', 'Space.'],
        ['Build', 'Right-click places a block. Left-click removes one.'],
        ['Pick a block', 'Number keys 1–9, the mouse wheel, or click the bar at the bottom.'],
        ['Talk', 'Walk up to a villager and press E.'],
        ['Change view', 'C swaps between watching yourself and looking through your own eyes.'],
        ['Go inside', 'Just walk into a door.'],
      ];

    return el('div', { id: 'help', class: 'overlay', hidden: true },
      el('div', { class: 'panel menu-card help' },
        el('h2', {}, 'How to play'),
        el('p', { class: 'sub' }, 'There is no way to lose. Nothing here can go wrong.'),
        el('dl', {}, rows.flatMap(([term, def]) => [
          el('dt', {}, term), el('dd', {}, def),
        ])),
        el('div', { class: 'menu-rows', style: 'margin-top:18px' },
          el('button', {
            class: 'btn',
            onclick: () => { this.helpMenu.hidden = true; this.pauseMenu.hidden = false; },
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
    return !this.pauseMenu.hidden || !this.helpMenu.hidden
      || !this.creator.hidden || !this.titleScreen.hidden;
  }

  setSettingValue(key, value) {
    const btn = this[`${key}Toggle`];
    if (!btn) return;
    btn.dataset.on = String(value);
    btn.textContent = value ? 'On' : 'Off';
  }

  // ------------------------------------------------------------------
  // Hotbar
  // ------------------------------------------------------------------
  renderPalette() {
    this.tabsEl.replaceChildren(...this.paletteGroups.map((group) => el('button', {
      class: `tab${group.key === this.activeGroup ? ' active' : ''}`,
      onclick: () => {
        this.activeGroup = group.key;
        const first = group.blocks[0];
        if (first) this.selectBlock(first.id);
        this.renderPalette();
      },
    }, group.label)));

    const group = this.paletteGroups.find((g) => g.key === this.activeGroup);
    const blocks = group ? group.blocks : [];
    this.currentSlots = blocks;
    this.hotbarEl.replaceChildren(...blocks.map((block, i) => {
      const icon = blockIcon(block.id);
      const slot = el('div', {
        class: `slot${block.id === this.selectedBlockId ? ' active' : ''}`,
        title: block.label,
        onclick: () => this.selectBlock(block.id),
      }, i < 9 ? el('span', { class: 'num' }, String(i + 1)) : null);
      if (icon) slot.style.backgroundImage = `url(${icon})`;
      else slot.style.background = block.icon;
      return slot;
    }));
    this._updateSelectedName();
  }

  _updateSelectedName() {
    const block = (this.currentSlots || []).find((b) => b.id === this.selectedBlockId);
    this.selectedName.textContent = block ? block.label : '';
  }

  selectBlock(id) {
    this.selectedBlockId = id;
    for (const [i, block] of (this.currentSlots || []).entries()) {
      this.hotbarEl.children[i]?.classList.toggle('active', block.id === id);
    }
    this._updateSelectedName();
    this.emit('selectBlock', id);
  }

  /** Number-key / wheel selection within the visible group. */
  selectSlot(index) {
    const block = (this.currentSlots || [])[index];
    if (block) this.selectBlock(block.id);
  }

  cycleSlot(direction) {
    const slots = this.currentSlots || [];
    if (!slots.length) return;
    const current = slots.findIndex((b) => b.id === this.selectedBlockId);
    const next = (current + direction + slots.length) % slots.length;
    this.selectBlock(slots[next].id);
  }

  setBuildingAllowed(allowed) {
    this.hotbarWrap.hidden = !allowed;
    this.placeBtn.hidden = !allowed;
    this.breakBtn.hidden = !allowed;
    this.crosshair.classList.toggle('hidden', !allowed);
  }

  // ------------------------------------------------------------------
  // HUD bits
  // ------------------------------------------------------------------
  setZoneName(name) {
    this.zoneName.textContent = name;
  }

  showHint(text, key) {
    this.hint.replaceChildren(
      ...(key ? [el('span', { class: 'key' }, key)] : []),
      document.createTextNode(text),
    );
    this.hint.classList.add('show');
  }

  hideHint() {
    this.hint.classList.remove('show');
  }

  flashLabel(text) {
    this.placeLabel.textContent = text;
    this.placeLabel.classList.add('show');
    clearTimeout(this._labelTimer);
    this._labelTimer = setTimeout(() => this.placeLabel.classList.remove('show'), 900);
  }

  toast(text, duration = 3200) {
    const node = el('div', { class: 'toast' }, text);
    this.toasts.append(node);
    setTimeout(() => {
      node.style.transition = 'opacity 0.4s ease';
      node.style.opacity = '0';
      setTimeout(() => node.remove(), 420);
    }, duration);
  }

  showDialogue(name, role, text, more) {
    this.dialogueWho.replaceChildren(
      el('span', {}, name),
      role ? el('span', { class: 'role' }, role) : null,
    );
    this.dialogueText.textContent = text;
    this.dialogueMore.textContent = more;
    this.dialogue.classList.add('show');
  }

  hideDialogue() {
    this.dialogue.classList.remove('show');
  }

  get dialogueOpen() {
    return this.dialogue.classList.contains('show');
  }

  setTalkAvailable(available) {
    this.talkBtn.hidden = !available;
  }

  // ------------------------------------------------------------------
  // Character creator
  // ------------------------------------------------------------------
  _buildCreator() {
    this.previewCanvas = el('canvas', { id: 'preview-canvas' });
    this.charListEl = el('div', { id: 'character-list' });
    this.optionsEl = el('div', { class: 'options' });
    this.nameInput = el('input', {
      type: 'text', maxlength: '16', placeholder: 'Name',
      oninput: () => {
        if (!this.creatorState) return;
        this.creatorState.draft.name = this.nameInput.value;
      },
    });

    const layout = el('div', { class: 'layout' },
      el('div', { id: 'preview-box' },
        this.previewCanvas,
        el('div', { class: 'spin' }, 'drag to spin')),
      this.optionsEl);

    this.creatorTitle = el('h2', {}, 'Characters');

    return el('div', { id: 'creator', class: 'overlay', hidden: true },
      el('div', { class: 'panel menu-card' },
        this.creatorTitle,
        el('p', { class: 'sub' }, 'Make as many as you like, then pick who to be.'),
        this.charListEl,
        layout,
        el('div', { class: 'row-split', style: 'margin-top:16px' },
          el('button', {
            class: 'btn secondary',
            onclick: () => {
              this.creatorState.draft = randomCharacter(this.creatorState.draft.name || 'Friend');
              this.nameInput.value = this.creatorState.draft.name;
              this._renderCreatorOptions();
            },
          }, '🎲 Surprise me'),
          el('button', {
            class: 'btn',
            onclick: () => this.emit('saveCharacter', { ...this.creatorState.draft }),
          }, 'Save'),
          el('button', {
            class: 'btn secondary',
            onclick: () => this.emit('closeCharacters'),
          }, 'Done'))));
  }

  openCreator(characters, activeId) {
    this.creatorState = {
      characters,
      activeId,
      editingId: activeId,
      draft: { ...(characters.find((c) => c.id === activeId) || DEFAULT_CHARACTER) },
    };
    delete this.creatorState.draft.id;
    this.creator.hidden = false;
    this.nameInput.value = this.creatorState.draft.name || '';
    if (!this.preview) this.preview = new CharacterPreview(this.previewCanvas);
    this.preview.start();
    this._renderCharacterList();
    this._renderCreatorOptions();
  }

  closeCreator() {
    this.creator.hidden = true;
    this.preview?.stop();
  }

  _renderCharacterList() {
    const state = this.creatorState;
    const rows = state.characters.map((char) => el('div', {
      class: `char-row${char.id === state.editingId ? ' active' : ''}`,
    },
    el('span', { class: 'name' }, char.name || 'Someone'),
    char.id === state.activeId ? el('span', { class: 'tag' }, 'playing') : null,
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
    char.id === state.activeId ? null : el('button', {
      class: 'btn small lilac',
      onclick: () => this.emit('playAs', char.id),
    }, 'Play as'),
    state.characters.length > 1 ? el('button', {
      class: 'btn small danger',
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
    this.preview?.setCharacter(draft);

    const chips = (label, list, key) => el('div', { class: 'opt-group' },
      el('div', { class: 'opt-label' }, label),
      el('div', { class: 'chips' }, list.map((entry) => el('button', {
        class: `chip${draft[key] === entry.id ? ' active' : ''}`,
        onclick: () => {
          draft[key] = entry.id;
          this._renderCreatorOptions();
        },
      }, entry.label))));

    const swatches = (label, list, key) => el('div', { class: 'opt-group' },
      el('div', { class: 'opt-label' }, label),
      el('div', { class: 'chips' }, list.map((entry) => {
        const btn = el('button', {
          class: `swatch${draft[key] === entry.id ? ' active' : ''}`,
          'aria-label': entry.id,
          title: entry.id,
          onclick: () => {
            draft[key] = entry.id;
            this._renderCreatorOptions();
          },
        });
        btn.style.background = `#${entry.color.toString(16).padStart(6, '0')}`;
        return btn;
      })));

    this.optionsEl.replaceChildren(
      el('div', { class: 'name-row' }, this.nameInput),
      chips('Size', BODY_TYPES, 'body'),
      swatches('Skin', SKIN_TONES, 'skin'),
      chips('Hair', HAIR_STYLES, 'hair'),
      swatches('Hair colour', HAIR_COLORS, 'hairColor'),
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

  refreshCharacterList(characters, activeId) {
    if (!this.creatorState) return;
    this.creatorState.characters = characters;
    this.creatorState.activeId = activeId;
    this._renderCharacterList();
  }

  setEditingCharacter(id) {
    if (this.creatorState) this.creatorState.editingId = id;
  }

  hideLoading() {
    this.loading.hidden = true;
  }
}

export { el };
