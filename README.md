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

All five phases from the spec are built, plus the phone Sofia asked for
afterwards.

| Phase | What it is | Where the code lives |
|---|---|---|
| 1 | A room you can build in, saved between visits | `src/world/zone.js`, `src/core/save.js` |
| 2 | The village: five buildings, doors you walk through | `src/world/village.js`, `src/world/buildings.js` |
| 3 | Character creator, multiple saved characters | `src/player/avatar.js`, `src/ui/ui.js` |
| 4 | Eight villagers with proximity dialogue and voices | `src/npc/`, `scripts/generate-voices.mjs` |
| 5 | The secret moon house | `src/world/moonhouse.js` |
| + | A phone for calling the villagers | `src/phone/` |

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

### The phone

Sofia asked for a phone where you call people and talk to AI bots — "like
Roblox, but even more safe" — and described how it works: you write what you
say, you pick the voice, and it sends over.

- **Opening it:** 📱 at the top left, `P` on a laptop, or Phone in the menu.
- **Contacts are the villagers, and only the villagers.** Luna joins once
  you've found the moon house, so the phone doesn't give the secret away.
- **A call:** it rings, they pick up and say hello out loud. Then it's three
  numbered steps on repeat: **1** write it, **2** pick a voice (Me, Mouse,
  Bear, Robot, Fairy, Ghost — tapping one plays it, and 👂 Try it plays your
  message in it), **3** Send. Your message is spoken in the voice you picked,
  and the villager answers in theirs. Saying bye ends the call. The voice you
  picked is saved.
- **The safety shield:** before anything is sent, it's checked for phone
  numbers, email addresses, where you live, passwords, the name of your
  school, your surname, and unkind words. Those don't go, and the phone says
  why in a sentence a seven-year-old can read. Nothing would actually leave
  the device — there's no network — but it builds the habit she'll need on
  any real chat.
- **Villagers are honest.** Ask "are you real?" or to meet up, and they say
  they're game characters. They never ask anything personal.
  `scripts/check-phone.mjs` fails `npm run check` if a line ever does.
- **The "AI" is a hand-written brain** (`src/phone/brain.js`). It works out
  what you're talking about (hellos, jokes, favourites, feelings, the moon
  house, each villager's own topic), answers in character, and sends you to
  the right villager for topics that aren't theirs ("Bruno is the one who
  knows all about baking! You should call Bruno next."). It runs on the
  device: no key, no cost, no server, and it works in the GitHub Pages build.
- **Voices** are the browser's own speech, since phone lines are typed in and
  can't be pre-recorded. They follow the Villager voices setting.

### Explicitly not built

**No online player chat, no multiplayer, no accounts, no user-to-user
messaging.** The spec is explicit that when she said "chat feature" she meant
NPCs talking to her, and that this was checked with her directly. The phone
keeps to that: it only reaches villagers. There is no networking code in this
repo at all.

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
wheel picks a block, `E` talks, `P` opens the phone, `C` swaps between third
and first person, `Esc` pauses (or puts the phone away).

**Phone** — left thumb anywhere on the left half of the screen is the
joystick, drag on the right half to look. Buttons for jump, place, remove and
talk, and 📱 at the top left for the in-game phone. Tapping the screen also
places a block.

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
  phone/             the phone: brain.js (replies + safety shield), phone.js (screens)
  ui/                DOM interface, character-creator turntable
scripts/
  generate-voices.mjs  ElevenLabs pre-render
  check-world.mjs      zone/door/spawn layout checks (no browser)
  check-phone.mjs      safety shield + villager reply checks (no browser)
  smoke-test.mjs       headless playthrough + screenshots
```

### Testing

```bash
npm run check     # ~1s, no browser — layout checks over every zone, and the phone's brain
npm test          # check, then build, then the full playthrough
```

The phone half of `npm run check` feeds the safety shield things it must stop
(phone numbers, addresses, emails, passwords, surnames, unkind words) and
things it must let through ("I am 7", "my name is Sofia", "glass"), then talks
to every villager about forty different ways and checks they always answer,
never leave a `{placeholder}` showing, never ask for anything personal, and
never give Luna away before the moon house is found.

`npm run check` walks every zone and verifies that doors point at zones that
exist, that the spawn points those doors ask for are defined, that you can
stand where you land, and that every doorway has somewhere to stand in it. It's
the fast loop when moving buildings around — it catches things like a hedge
gap that no longer lines up with the path leading to it.

`npm test` adds a headless Chromium playthrough: loads the village, walks into
the cottage, places and removes blocks, talks to a villager, calls one on the
in-game phone (write, pick a voice, send, get stopped by the shield, say bye),
makes a second character and switches to them, visits every interior and the
moon house, reloads to confirm the save survived, and checks the layout and
touch controls on a phone-sized screen, in-game phone included. It fails on
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
- **Calling real people.** Not built, on purpose. Calls between real players
  would need accounts, a server, moderation, and a grown-up deciding who is
  allowed to call whom. That's Alex's decision, not something to slip in. The
  phone says "No strangers, ever", and right now the code keeps that promise.
- **A real AI brain.** The villagers' phone replies are hand-written, so
  anything truly open-ended gets a friendly "Hmm, I don't know! What do you
  think?". Swapping in a real model means replacing one function (`respond` in
  `src/phone/brain.js`), but it needs a server to hold an API key (GitHub
  Pages can't), it costs money per message, and what she types would go to an
  AI company. That's Alex's call too. The safety shield would still run first,
  on the device.
- **The animal barn has no animals in it yet.** She asked for a village, not
  for animals, so this wasn't invented on her behalf — but a barn with empty
  stalls is an obvious thing for her to notice, and blocky animals would reuse
  the avatar builder almost as-is.
