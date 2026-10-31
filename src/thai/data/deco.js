/**
 * Decoration only: the mascot, game icons, stickers. These are Microsoft's
 * Fluent 3D emoji (MIT), copied into public/thai/deco/ by
 * `npm run thai:deco`. Word pictures are never emoji. They are real photos
 * (see scripts/thai-photos.mjs).
 */

export const ICONS = {
  mascot: '🐘',
  star: '⭐',
  fire: '🔥',
  crown: '👑',
  lock: '🔒',
  speaker: '🔊',
  turtle: '🐢',
  gift: '🎁',
  trophy: '🏆',
  coin: '🪙',
  gem: '💎',
  party: '🎉',
  target: '🎯',
  sparkles: '✨',
  books: '📚',
  calendar: '📅',
  gear: '⚙️',
  house: '🏠',
  sticker: '🌟',
  learn: '📖',
  memory: '🃏',
  listen: '👂',
  bubbles: '🫧',
  read: '🔤',
  yesno: '✅',
  lesson: '🎒',
  practice: '🔁',
  camera: '📷',
};

/** One badge per chapter, shown on the home path. */
export const CHAPTER_ICONS = {
  hello: '👋', family: '👨‍👩‍👧', farm: '🐔', 'little-words': '💬', food: '🍜',
  numbers: '🔢', colours: '🎨', fruit: '🥭', body: '🖐️', magic: '🦄',
  feelings: '😊', 'actions-1': '🏃‍♀️', snacks: '🍦', home: '🏡', wild: '🐘',
  toys: '🧸', clothes: '👗', phrases: '🗣️', go: '🛺', bugs: '🦋',
  'actions-2': '🚴‍♀️', school: '🏫', places: '🛕', veggies: '🥕', sea: '🐠',
  sky: '🌈', nature: '🌳', jobs: '🧑‍🚒', party: '🎉',
};

/** Earned one at a time as lifetime points grow. Thai-themed first. */
export const STICKERS = [
  ['elephant', '🐘', 'Chang the Elephant'],
  ['tuktuk', '🛺', 'Tuk-tuk'],
  ['mango', '🥭', 'Mango'],
  ['lotus', '🪷', 'Lotus'],
  ['temple', '🛕', 'Temple'],
  ['tiger', '🐯', 'Tiger'],
  ['unicorn', '🦄', 'Unicorn'],
  ['rainbow', '🌈', 'Rainbow'],
  ['icecream', '🍦', 'Ice Cream'],
  ['dolphin', '🐬', 'Dolphin'],
  ['butterfly', '🦋', 'Butterfly'],
  ['hibiscus', '🌺', 'Hibiscus'],
  ['balloon', '🎈', 'Balloon'],
  ['teddy', '🧸', 'Teddy'],
  ['dino', '🦖', 'Dino'],
  ['panda', '🐼', 'Panda'],
  ['watermelon', '🍉', 'Watermelon'],
  ['rocket', '🚀', 'Rocket'],
  ['clownfish', '🐠', 'Clownfish'],
  ['parrot', '🦜', 'Parrot'],
  ['donut', '🍩', 'Donut'],
  ['bow', '🎀', 'Bow'],
  ['cat', '🐱', 'Kitty'],
  ['puppy', '🐶', 'Puppy'],
  ['bunny', '🐰', 'Bunny'],
  ['fox', '🦊', 'Fox'],
  ['koala', '🐨', 'Koala'],
  ['octopus', '🐙', 'Octopus'],
  ['flamingo', '🦩', 'Flamingo'],
  ['sunflower', '🌻', 'Sunflower'],
  ['strawberry', '🍓', 'Strawberry'],
  ['cupcake', '🧁', 'Cupcake'],
  ['carousel', '🎠', 'Carousel'],
  ['kite', '🪁', 'Kite'],
  ['castle', '🏰', 'Castle'],
  ['moon', '🌙', 'Moon'],
  ['owl', '🦉', 'Owl'],
  ['turtle', '🐢', 'Turtle'],
  ['peacock', '🦚', 'Peacock'],
  ['bubbletea', '🧋', 'Bubble Tea'],
];

/** Surprise stickers: dropped at random after a perfect round, never earned on a schedule. */
export const SHINY_STICKERS = [
  ['crystal', '🔮', 'Crystal Ball'],
  ['gem', '💎', 'Diamond'],
  ['crown', '👑', 'Crown'],
  ['wand', '🪄', 'Magic Wand'],
  ['dragon', '🐉', 'Dragon'],
  ['shooting', '🌠', 'Shooting Star'],
  ['ringed', '🪐', 'Planet'],
  ['mermaid', '🧜‍♀️', 'Mermaid'],
];

/** Codepoint filename used by the Fluent 3D emoji package, e.g. "1f418". */
export function codepoints(emoji) {
  return [...emoji].map((c) => c.codePointAt(0).toString(16)).join('-');
}

/** Local file name for an emoji under public/thai/deco/. */
export function decoFile(emoji) {
  return `${codepoints(emoji)}.webp`;
}
