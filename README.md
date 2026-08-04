# Sofia's Village

A cozy 3D roleplay sandbox. Blocky Minecraft-style visuals, Toca Boca-style
freeform play. No goals, no scores, no losing.

**Designer:** Sofia (7) · **Supervisor:** Alex

---

## Running it

```bash
npm install
npm run dev        # then open the printed URL
```

`npm run dev` binds to your network, so the address it prints also works on
Sofia's phone as long as it's on the same wifi.

```bash
npm run build      # production build into dist/
npm run preview    # serve the production build locally
```

**Deploying:** point Vercel at this repo. `vercel.json` is already set up
(`vite` preset, `npm run build`, `dist/`). It's a fully static site — nothing
runs on a server, so there's nothing to configure and no bill beyond hosting.

---

## What's in it

All five phases from the spec are built.

| Phase | What it is | Where the code lives |
|---|---|---|
| 1 | A room you can build in, saved between visits | `src/world/zone.js`, `src/core/save.js` |
| 2 | The village: five buildings, doors you walk through | `src/world/village.js`, `src/world/buildings.js` |
| 3 | Character creator, multiple saved characters | `src/player/avatar.js`, `src/ui/ui.js` |
| 4 | Eight villagers with proximity dialogue and voices | `src/npc/`, `scripts/generate-voices.mjs` |
| 5 | The secret moon house | `src/world/moonhouse.js` |

### Sofia's requirements, and where each one landed

1. **Blocky Minecraft art style** — every texture is generated in code at
   startup (`src/world/textures.js`): planks, plaster, cobble, shingles,
   leaves, lantern glass. Nearest-neighbour filtering, 16×16 tiles. No image
   files to load.
2. **A village you walk around** — 96×96 blocks, five buildings, paths, a
   pond, trees, hedges.
3. **You can go inside the buildings** — walk into a door and you're in. No
   prompt, no button.
4. **Play as any character** — body size, skin, eight hair styles, hair
   colour, top, trousers, shoes, and seven accessories (crown, cat ears,
   pointy hat…). Make as many characters as you like and switch between them.
5. **Build your own furniture out of blocks** — 17 blocks in the palette
   across four tabs. No furniture catalog: a chair is however many blocks she
   decides a chair is.
6. **Building is inside houses only** — enforced by an `editable` flag per
   zone. The village is authored and locked; every interior is hers.
7. **Talking villagers** — eight of them, with real voices (see below).
8. **A secret moon house** — a crescent sliced open down the front so all four
   floors are visible at once, with a glass atrium and vines hanging through
   it. You arrive on an island facing it, far enough back to take the whole
   thing in, and walk up a moonstone causeway to get inside. It's behind a
   hedge with one gap in it; nothing signposts it except a line of lanterns
   and something the librarian says.

### Explicitly not built

**No online player chat, no multiplayer, no accounts, no user-to-user
messaging.** The spec is explicit that when she said "chat feature" she meant
NPCs talking to her, and that this was checked with her directly. There is no
networking code in this repo at all.

---

## Villager voices

Dialogue is fixed, so the voices are pre-rendered at build time rather than
called at runtime — no per-playthrough API cost, no key in the browser, and no
network wait mid-conversation.

**As it stands now**, with no key configured, every line is spoken by the
browser's own `SpeechSynthesis`, tuned per villager (pitch and rate) so they
sound like different people. This works everywhere and needs no setup.

**To swap in ElevenLabs** (your key, your call):

```bash
ELEVENLABS_API_KEY=sk-... npm run voices
```

That writes `public/vo/<villager>-<line>.mp3` plus a `manifest.json`. The game
loads the manifest at startup and prefers a real recording wherever one exists,
falling back to the browser voice line by line. The script only regenerates
lines whose text actually changed, so re-running it after a dialogue edit is
cheap. Nothing about shipping depends on it.

Voices are assigned by name from whatever your ElevenLabs account has; override
one with e.g. `ELEVEN_VOICE_MILA=<voice id>`.

If you edit `src/npc/dialogue.js`, re-run `npm run voices`.

---

## Controls

**Laptop** — WASD or arrows to walk, Shift to run, Space to jump, mouse to
look. Right-click places a block, left-click removes one. `1`–`9` or the mouse
wheel picks a block, `E` talks, `C` swaps between third and first person, `Esc`
pauses.

**Phone** — left thumb anywhere on the left half of the screen is the
joystick, drag on the right half to look. Buttons for jump, place, remove and
talk. Tapping the screen also places a block.

---

## How it's put together

- **Three.js**, no framework, no state library. `src/main.js` is the whole glue
  layer.
- **Not a voxel engine.** Each place you can stand is a fixed-size `Zone` — a
  `Uint8Array` grid plus one `InstancedMesh` per block type, remeshed whenever
  it changes. A 20×14×18 room remeshes in well under a millisecond, so there's
  no chunking, no greedy meshing, no streaming, and no infinite terrain.
- **Collision** is AABB against the grid, resolved one axis at a time, with a
  one-block auto step-up so she never gets stuck on a doorstep.
- **Lighting**: lanterns are the whole mood, but one light per lantern would be
  hundreds of lights. A pool of eight point lights follows the player and
  attaches to the nearest glowing blocks (`src/core/lighting.js`).
- **Persistence** is IndexedDB with a localStorage fallback. Interiors are
  saved as a *diff* against the authored layout, so her furniture survives an
  update to the buildings themselves. There's no database because there's
  nothing to sync — if it ever needs to move between her phone and her laptop,
  that's a separate conversation.

### Layout

```
src/
  main.js            boot, frame loop, glue
  core/              input (keyboard/mouse/touch), save, lighting
  world/             blocks, textures, grid, builder DSL, the village, moon house
  player/            avatar construction + movement/camera
  npc/               villagers, dialogue, voice
  ui/                DOM interface, character-creator turntable
scripts/
  generate-voices.mjs  ElevenLabs pre-render
  check-world.mjs      zone/door/spawn layout checks (no browser)
  smoke-test.mjs       headless playthrough + screenshots
```

### Testing

```bash
npm run check     # ~1s, no browser — layout checks over every zone
npm test          # check, then build, then the full playthrough
```

`npm run check` walks every zone and verifies that doors point at zones that
exist, that the spawn points those doors ask for are defined, that you can
stand where you land, and that every doorway has somewhere to stand in it. It's
the fast loop when moving buildings around — it catches things like a hedge
gap that no longer lines up with the path leading to it.

`npm test` adds a headless Chromium playthrough: loads the village, walks into
the cottage, places and removes blocks, talks to a villager, makes a second
character and switches to them, visits every interior and the moon house,
reloads to confirm the save survived, and checks the phone layout. It fails on
any console error, and every probe asserts on a real value rather than a
possibly-undefined one. Screenshots land in `shots/`.

On a machine without a GPU, pass the browser explicitly:
`CHROMIUM_PATH=/path/to/chrome node scripts/smoke-test.mjs`.

---

## Still open with Sofia

From the spec, plus what came up building it:

- **What are the buildings?** She hadn't said. There are currently a cottage,
  a modern house, a bakery, an animal barn and a library — a starting set to
  react to rather than an answer. Swapping one out is a small change:
  `PLACEMENTS` in `src/world/village.js` and a matching room in
  `src/world/interiors.js`.
- **Does the village have a name?** It's called "The Village" everywhere,
  which is a placeholder.
- **Do houses belong to specific characters?** Right now anyone can go in any
  house, and each has one villager living in it.
- **Day/night? Weather?** Not built. The village sits at a permanent late
  afternoon; the moon house has its own night sky. Adding a day cycle is
  mostly a matter of animating the values in `Lighting.applyZone`.
- **The animal barn has no animals in it yet.** She asked for a village, not
  for animals, so this wasn't invented on her behalf — but a barn with empty
  stalls is an obvious thing for her to notice, and blocky animals would reuse
  the avatar builder almost as-is.
