/**
 * The packs in the shop.
 *
 * Plain data, no imports: things.js and person.js both read this, so it
 * can't depend on either of them.
 *
 * A pack only says what it is and what it costs. What's *in* it lives next to
 * the things themselves: a toy or a dress-up item belongs to a pack by
 * carrying `pack: '<id>'` in its own definition (src/art/things.js,
 * src/art/person.js). Anything without a `pack` is free and always there.
 *
 * To add a pack: add an entry here, then tag the new things / hair / extras
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
    emoji: '🍭',
    blurb: 'Cupcakes, lollipops, ice cream, a big cake and a gumball machine.',
    color: '#f4a7c4',
    price: 10,
  },
  {
    id: 'ocean',
    name: 'Ocean Pack',
    emoji: '🐚',
    blurb: 'A fish bowl, a beach ball, a rubber duck, a seashell and a surfboard.',
    color: '#8fd3e0',
    price: 10,
  },
  {
    id: 'animals',
    name: 'Animal Friends',
    emoji: '🐰',
    blurb: 'A kitty, a puppy and a bunny to look after — and bunny ears, bear ears and a unicorn horn.',
    color: '#e8c79a',
    price: 10,
  },
  {
    id: 'salon',
    name: 'Hair Salon',
    emoji: '💇',
    blurb: 'New hairstyles and new hair colours.',
    color: '#d9b8ef',
    price: 10,
  },
  {
    id: 'rainbow',
    name: 'Rainbow Pack',
    emoji: '🌈',
    blurb: 'A rainbow rug, a cloud lamp, a toy unicorn, a heart balloon and heart glasses.',
    color: '#f7d58a',
    price: 20,
  },
  {
    id: 'space',
    name: 'Space Pack',
    emoji: '🚀',
    blurb: 'A rocket, a telescope, a planet lamp, an alien friend and antennae.',
    color: '#9aa6e6',
    price: 20,
  },
  {
    id: 'castle',
    name: 'Castle Pack',
    emoji: '🏰',
    blurb: 'A throne, a royal bed, a treasure chest, a magic wand and a tiara.',
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
