# Sofia's Village

A cozy dollhouse sandbox. Every house in the village is cut open down the
front so you can see every room at once, and you play with it by hand: pick
up anyone and anything, drop them somewhere else, tap things to see what they
do. No goals, no scores, no losing.

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
Or use GitHub Pages: `docs/index.html` is a single-file build of the game
(`npm run build && npm run standalone`, then copy `dist/standalone.html` over
it).

---

## What it is

It used to be a blocky 3D village you walked around and built in with blocks.
Sofia wanted it to be a dollhouse game instead of a block game, so it was
rebuilt from the ground up as one. Her characters, her shop purchases and the
piggy bank all carried over; the block building did not.

### Playing

- **Drag anyone and anything.** People, furniture, food, toys, animals. Let
  go and it drops straight down onto the floor or the table underneath.
  Move a table and whatever was on it falls off.
- **Sit and sleep.** Drop someone on a chair, sofa, bench or hay bale and they
  sit. Drop them on a bed and they lie down, eyes closed, under the blanket.
  Drop them in the bath and they sit in it.
- **Hold things.** Drop something small onto a person and it goes in their
  hand. It goes wherever they go.
- **Eat.** Tap food to take a bite. Three bites and it's gone.
- **Tap things.** Lamps, the TV, the oven and the fridge switch on and off; the
  piano plays notes; the cow moos; the chickens bawk; villagers talk.
- **Go places.** Tap a house on the street to go inside, or drag someone onto
  a door to take them with you. 🏘 goes back out to the street.
- **The toy box (🧸).** Everyone and everything is in here. Tap a tile to drop
  it in, or drag it up to put it exactly where you want. Drag anything back
  onto the toy box to put it away.
- **Make people.** Characters: size, skin, eight hairstyles (more in the shop),
  hair colour, dress / t-shirt / shorts, colours, and an extra (crown, cat
  ears, pointy hat…). New people pop up wherever you are.
- **Several fingers at once** all work: carry two things at the same time.

### The places

| Place | What's there |
|---|---|
| The street | Five houses, lamp posts, a bench by the pond, Wren and Tomas — and a hedge at the far end |
| The Cottage | Kitchen, living room, bedroom, a loft full of toys. Mila lives here, and so does Sofia |
| The Modern House | Big living room with a piano and a TV, a bedroom, a bathroom with a bath, a garage. Oskar |
| The Bakery | The shop with a cake display, the kitchen, Bruno's flat upstairs |
| The Animal Barn | A cow, a pig, two chickens, hay bales, and a bed in the loft. Poppy |
| The Library | Two floors of bookshelves and reading chairs. Nell |
| The Moon House | The secret. A house shaped like the moon, cut open, with three floors, vines and lanterns. Luna |

The Moon House is still a secret: there's one gap in the hedge at the very
end of the street, a trail of little lanterns leading to it, and something
the librarian says. Nothing else points to it.

### Sofia's requirements, and where each one landed

1. **Toca Boca-style, not Minecraft** (her change of mind) — a hand-played
   dollhouse in its own original art: round heads, dot eyes, rosy cheeks, flat
   bright colours and a soft outline. Every picture is drawn in code as SVG
   (`src/art/`), so there are no image files and it's sharp on any screen.
2. **A village** — a street of five houses plus the secret one.
3. **You can go inside the buildings** — every one, cut open like a dollhouse.
4. **Play as any character** — make as many as you like; everyone, villagers
   included, can be picked up and played with.
5. **Talking villagers** — eight of them, with real voices (see below).
6. **A secret moon house** — see above.
7. **A shop with money you never see** — see below.

### Explicitly not built

**No online player chat, no multiplayer, no accounts, no user-to-user
messaging.** The spec is explicit that when she said "chat feature" she meant
villagers talking to her, and that this was checked with her directly. There
is no networking code in this repo at all.

---

## The shop

Packs of new things, bought with in-game money she never sees. The shop is
a whole screen, like walking into a toy shop: a striped awning, a sign, and
a wooden shelf of pack boxes that slides sideways.

- **Every pack is a box** with what's inside drawn on the front, and a tag
  hanging off its corner: **Buy**, **Not yet 🌙**, or **Yours ✓**. The boxes
  she can buy bob gently on the shelf.
- **Tap a box and it opens up big**: everything inside it, with names, and
  one big button. **Not yet 🌙** (there isn't enough yet) just says to come
  back another day.
- **Buy is one tap**, and then it's unboxed: the box wobbles, the lid pops
  off, everything jumps out one at a time, confetti, ta-da. **Play with
  them!** goes straight to the new things (the toy box, or Characters for a
  pack of looks); **Keep shopping** goes back to the shelf.
- **Money arrives by itself, once a day.** The first time she opens the game
  on a new day, the day's money goes into a hidden piggy bank. Days she
  doesn't play still count, up to a week's worth at once.
- **There is no number anywhere.** Not on the screen, not in the shop, not on
  a pack. The shop code is never even handed the balance or the prices, and
  the smoke test fails if a digit ever appears in the shop.
- **Locked things are just not there.** The toy box and the character creator
  only show what she has. The shop shows what's in each pack before buying.

Open it from the gold 🛍 button at the top, the pause menu, or the title
screen. Esc (or ‹ Back) steps back out one screen at a time.

| Pack | Costs | What's in it |
|---|---|---|
| 🍭 Candy | 1 day | Cupcake, lollipop, ice cream, a big cake, a gumball machine |
| 🐚 Ocean | 1 day | Fish bowl, beach ball, seashell, rubber duck, surfboard |
| 🐰 Animal Friends | 1 day | A kitty, a puppy and a bunny; bunny ears, bear ears, unicorn horn |
| 💇 Hair Salon | 1 day | Pigtails, mohawk, big puff; cherry, teal and silver hair |
| 🌈 Rainbow | 2 days | Rainbow rug, cloud lamp, toy unicorn, heart balloon (it floats up); heart glasses |
| 🚀 Space | 2 days | Rocket (tap it to blast off), telescope, planet lamp, alien friend; antennae |
| 🏰 Castle | 3 days | Throne, royal bed, treasure chest, magic wand; tiara |

So on day one she can pick any one of the first four, and owning everything
takes eleven days of money. Everything that's free stays free.

**Changing the numbers:** the daily amount and the week cap are at the top of
`src/shop/piggybank.js`; each pack's price is in `src/shop/packs.js` (a
one-day pack costs exactly the daily amount).

**Adding a pack:** add an entry to `PACKS` in `src/shop/packs.js`, then tag
the new things with it — `pack: 'yourpack'` on a thing in
`src/art/things.js`, or on a hairstyle, hair colour or extra in
`src/art/person.js`. `npm run check` fails if a pack is empty or something
points at a pack that doesn't exist.

"Start over" in the pause menu empties the piggy bank and the packs along
with everything else.

---

## Villager voices

Dialogue is fixed, so the voices are pre-rendered at build time rather than
called at runtime — no per-playthrough API cost, no key in the browser, and no
network wait mid-conversation.

**As it stands now**, with no key configured, every line is spoken by the
browser's own `SpeechSynthesis`, tuned per villager (pitch and rate) so they
sound like different people. This works everywhere and needs no setup. Tap a
villager to hear their next line.

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

If you edit `src/npc/dialogue.js`, re-run `npm run voices`. (Some lines changed
for the dollhouse — they used to talk about building with blocks.)

---

## How it's put together

- **No framework, no canvas, no 3D.** Each place is an SVG backdrop with the
  people and things as absolutely-positioned SVGs on top, inside one div that's
  scaled to fit the screen height and slid sideways when the place is wider
  than the screen. `src/main.js` is the glue.
- **Everything is drawn in code.** `src/art/kit.js` has the handful of shape
  helpers; `person.js`, `things.js` and `scenes.js` draw people, every thing,
  and every place from them.
- **Landing is one rule** (`src/world/physics.js`): let go of something and it
  drops straight down to the first floor or table top below. Furniture only
  stands on floors; small things also land on tables.
- **Pointer events** handle mouse, touch and pen the same way, one drag per
  finger. Only the painted parts of a person catch a finger; things can be
  grabbed anywhere inside their outline.
- **Persistence** is IndexedDB with a localStorage fallback. Each place is set
  up from its authored layout the first time she visits (`src/world/seed.js`)
  and after that is saved exactly as she leaves it. Saves from the old 3D
  version keep her characters, piggy bank and packs.

### Layout

```
src/
  main.js            boot, glue, saving
  art/               the drawing kit; people, things, place backdrops
  world/             places (data), landing rules, first-visit setup, the stage
  shop/              the packs, and the hidden daily piggy bank
  npc/               villager lines and voices
  ui/                menus, toy box, character creator, shop screen, sounds
  core/save.js       IndexedDB / localStorage
scripts/
  generate-voices.mjs  ElevenLabs pre-render
  check-world.mjs      places, doors, furniture and landing checks (no browser)
  check-shop.mjs       piggy bank and pack checks (no browser)
  smoke-test.mjs       headless playthrough with real drags + screenshots
```

### Testing

```bash
npm run check     # ~1s, no browser — places and the shop's rules
npm test          # check, then build, then the full playthrough
```

`npm run check` draws every thing and every place, and checks that every door
leads somewhere that exists and every building has a way back out, that no
furniture pokes through a wall, that every villager lives somewhere and is
standing on something, and that things land where they should (on a table,
on the floor when the table's gone, upstairs when dropped upstairs, balloons
up to the ceiling). It also checks the shop's rules: money is paid once a day
and never twice, missed days count up to the cap, a phone clock that jumps
backwards doesn't leave her stuck, a pack can't be bought without enough or
bought twice, and the shop is never handed a number.

`npm test` adds a headless Chromium playthrough that plays it with a real
mouse and real touch events: hands Mila an apple and eats it in three taps,
sits Sofia on the sofa, puts Mila to bed, switches the lamp, fridge, oven and
toy box, moves the table and checks the cookie falls off, drops the teddy from
high up, taps a villager, brings things out of the toy box and puts one back,
taps into the bakery, carries Wren down the street to the library door, finds
the Moon House, goes shopping (opens a box to see what's inside, buys it and
checks all five things jump out, checks there's no number on screen, that the
next pack says "Not yet", that Esc steps back to the shelf, and that it can be
bought the next day), finds the new things in the toy box and the new ears in
the creator, makes a character, reloads to confirm everything was saved, then
on a phone drags with a finger, swipes the street, moves two things with two
fingers at once, and buys from the 🛍 button (checking the Buy button fits on
a phone held sideways, and that "Play with them!" goes to the new things). It fails on any console error. Screenshots land in `shots/`.

On a machine where Playwright's own browser isn't installed, pass one:
`CHROMIUM_PATH=/path/to/chrome node scripts/smoke-test.mjs`.

---

## Still open with Sofia

- **Is this the Toca Boca feel she meant?** It's an original dollhouse in that
  spirit, not a copy of any of their games. The fastest way to find out is to
  hand her the phone.
- **The shop.** Which packs does she want next, and is a day's money the right
  pace? Nothing tells her when there's enough for something new — she finds
  out by opening the shop. A small sparkle on 🛍 when something has become
  buyable would be easy to add, if she'd like that and it doesn't count as
  "seeing the money".
- **Dress up villagers?** Right now only her own characters can be changed in
  the creator; villagers keep their looks.
- **More places?** A new place is one entry in `src/world/places.js` plus a
  door on the street.
- **Does the village have a name?** It's called "The Village" everywhere,
  which is a placeholder.
