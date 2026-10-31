/**
 * The packs in the shop.
 *
 * Plain data, no imports: blocks.js and avatar.js both read this to label
 * things, so it can't depend on either of them.
 *
 * A pack only says what it is and what it costs. What's *in* it lives next to
 * the things themselves: a block or a dress-up item belongs to a pack by
 * carrying `pack: '<id>'` in its own definition (src/world/blocks.js,
 * src/player/avatar.js). Anything without a `pack` is free and always there.
 *
 * To add a pack: add an entry here, then tag the new blocks / hair / extras
 * with its id. `npm run check` fails if a pack ends up empty or something
 * points at a pack that doesn't exist.
 *
 * `price` is in piggy-bank coins and is never shown anywhere. See
 * src/shop/piggybank.js for how much arrives each day.
 */

export const PACKS = [
  {
    id: 'candy',
    name: 'Candy Pack',
    tab: 'Candy',
    emoji: '🍭',
    blurb: 'Blocks you could almost eat.',
    color: '#f4a7c4',
    price: 10,
  },
  {
    id: 'ocean',
    name: 'Ocean Pack',
    tab: 'Ocean',
    emoji: '🐚',
    blurb: 'Sea glass, coral and wobbly seaweed.',
    color: '#8fd3e0',
    price: 10,
  },
  {
    id: 'animals',
    name: 'Animal Friends',
    tab: 'Animals',
    emoji: '🐰',
    blurb: 'Bunny ears, bear ears, a unicorn horn — and hay for the barn.',
    color: '#e8c79a',
    price: 10,
  },
  {
    id: 'salon',
    name: 'Hair Salon',
    tab: 'Salon',
    emoji: '💇',
    blurb: 'New hairstyles and new hair colours.',
    color: '#d9b8ef',
    price: 10,
  },
  {
    id: 'rainbow',
    name: 'Rainbow Pack',
    tab: 'Rainbow',
    emoji: '🌈',
    blurb: 'Rainbows, fluffy clouds, glitter lamps and heart glasses.',
    color: '#f7d58a',
    price: 20,
  },
  {
    id: 'space',
    name: 'Space Pack',
    tab: 'Space',
    emoji: '🚀',
    blurb: 'Starry sky blocks, planets, rocket metal and antennae.',
    color: '#9aa6e6',
    price: 20,
  },
  {
    id: 'castle',
    name: 'Castle Pack',
    tab: 'Castle',
    emoji: '🏰',
    blurb: 'Castle bricks, gold, a royal carpet, torches and a tiara.',
    color: '#e6a07c',
    price: 30,
  },
];

export const PACK_BY_ID = new Map(PACKS.map((pack) => [pack.id, pack]));

export function getPack(id) {
  return PACK_BY_ID.get(id) || null;
}

/** Is this block / hairstyle / extra available, given the packs she owns? */
export function isUnlocked(item, owned) {
  return !item.pack || owned.has(item.pack);
}
