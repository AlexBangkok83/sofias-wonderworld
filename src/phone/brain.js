// The phone's brain: what a villager says back when you call them up and type
// something.
//
// Sofia asked for a phone where you call people, type what you want to say,
// pick a voice, and send it — "like Roblox, but even more safe". So the only
// people on the other end of this phone are the villagers. There is no other
// player, no server and no AI service: every reply below is worked out right
// here on the device, and nothing she types ever leaves it.
//
// Two rules hold everything in this file together:
//
//   1. checkMessage() runs before anything is "sent". It stops private things
//      (phone numbers, emails, where you live, passwords, your school, your
//      last name) and unkind words, and says why. Nothing would actually go
//      anywhere, but the habit is the point — it's the habit she'll need on
//      any real chat.
//   2. Villagers never ask for anything personal, and never pretend to be real
//      people. Ask one "are you real?" and they tell you they're a game
//      character. scripts/check-phone.mjs fails the build if either slips.
//
// This file is pure — no DOM, no audio — so the check script can import it
// straight into Node.

import { VILLAGERS, getVillager } from '../npc/dialogue.js';

// ---------------------------------------------------------------------------
// Voices you can pick for yourself
// ---------------------------------------------------------------------------

/** Pitch and rate go straight to SpeechSynthesis, which clamps pitch to 0–2. */
export const PLAYER_VOICES = [
  { id: 'me', label: 'Me', emoji: '🙂', pitch: 1.1, rate: 1, sample: 'Hello! This is my voice.' },
  { id: 'mouse', label: 'Mouse', emoji: '🐭', pitch: 2, rate: 1.35, sample: 'Squeak squeak! Hello!' },
  { id: 'bear', label: 'Bear', emoji: '🐻', pitch: 0.3, rate: 0.8, sample: 'Hello. I am a big bear.' },
  { id: 'robot', label: 'Robot', emoji: '🤖', pitch: 0.6, rate: 0.7, sample: 'Beep boop. Hello, human.' },
  { id: 'fairy', label: 'Fairy', emoji: '🧚', pitch: 1.8, rate: 1.1, sample: 'Sparkle sparkle! Hello!' },
  { id: 'ghost', label: 'Ghost', emoji: '👻', pitch: 0.5, rate: 0.55, sample: 'Woooo. Hello there.' },
];

export function getPlayerVoice(id) {
  return PLAYER_VOICES.find((v) => v.id === id) || PLAYER_VOICES[0];
}

// ---------------------------------------------------------------------------
// The safety shield
// ---------------------------------------------------------------------------

const MAX_LENGTH = 120;

const SHIELD = {
  phone: '🛡️ That looks like a phone number. Phone numbers are private, so the phone didn’t send it. Keep them secret — even in games!',
  email: '🛡️ That looks like an email address. Emails are private, so the phone didn’t send it.',
  address: '🛡️ Where you live is private, so the phone didn’t send it. Keep it secret — even in games!',
  password: '🛡️ Passwords are top secret! Never type one to anybody — not even a friend.',
  school: '🛡️ The name of your school is private, so the phone didn’t send it.',
  surname: '🛡️ Your whole name is private. Your first name is enough!',
  unkind: '💛 Let’s use kind words. Can you say it a nicer way?',
};

// Words that can follow "my name is <first name>" without it being a surname.
const NOT_A_SURNAME = new Set([
  'and', 'but', 'i', 'im', 'iam', 'what', 'whats', 'the', 'too', 'also', 'so', 'hi',
  'hello', 'from', 'not', 'is', 'my', 'nice', 'ok', 'okay', 'yes', 'no', 'lol',
]);

const UNKIND = [
  /\bstupid\b/, /\bidiots?\b/, /\bdumb\b/, /\bshut up\b/, /\bhate you\b/, /\bugly\b/,
  /\blosers?\b/, /\bmorons?\b/, /\bjerks?\b/, /\bfat\b/, /\bfreaks?\b/,
  /\bf+u+c+k+\w*/, /\bsh[i1]t+\w*/, /\bbitch\w*/, /\bbastards?\b/, /\bdamn\w*/,
  /\bcrap\w*/, /\bass(hole)?s?\b/, /\bdickhead\w*/,
];

/** Lower-case, straighten apostrophes, drop punctuation, squash spaces. */
export function normalize(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[’‘`]/g, "'")
    .replace(/[^a-z0-9@.'\s-]/g, ' ')
    .replace(/[.-]/g, ' ')
    .replace(/'/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    // A few ways a seven-year-old is likely to spell things.
    .replace(/\bu\b/g, 'you')
    .replace(/\bur\b/g, 'your')
    .replace(/\br\b/g, 'are')
    .replace(/\bwat\b/g, 'what')
    .replace(/\bwats\b/g, 'whats')
    .replace(/\b(favorite|favrite|favrit|favourit|fav|fave)\b/g, 'favourite')
    .replace(/\bcolor\b/g, 'colour');
}

/**
 * Decide whether a message may be sent.
 *
 * Returns `{ ok: true, text }` with the trimmed text, or
 * `{ ok: false, reason, shield }` where `shield` is what to tell her.
 * An empty message is `{ ok: false, reason: 'empty' }` with no shield.
 */
export function checkMessage(raw) {
  const text = String(raw || '').replace(/\s+/g, ' ').trim().slice(0, MAX_LENGTH);
  if (!text) return { ok: false, reason: 'empty', shield: '' };

  const lower = text.toLowerCase().replace(/[’‘`]/g, "'");
  const words = normalize(text);
  const block = (reason) => ({ ok: false, reason, shield: SHIELD[reason] });

  // Seven or more digits, however they're spaced out, is a phone number as
  // far as this is concerned. Ages, counts of blocks, years — all shorter.
  if ((lower.match(/\d/g) || []).length >= 7) return block('phone');
  if (/\b(my|our) (phone|mobile|cell|telephone|home) ?(number|no)\b/.test(words)) return block('phone');
  if (/[a-z0-9._%+-]+@[a-z0-9-]+\.[a-z]/.test(lower)) return block('email');
  if (/\bpassword\b|\bpasscode\b|\bpin (number|code)\b/.test(words)) return block('password');
  if (/\b(my|our) (home )?address\b/.test(words)
    || /\bi live (at|on)\b/.test(words)
    || /\b(my|our) (house|flat|apartment) is (at|on)\b/.test(words)
    || /\b\d+ \w+ (street|st|road|rd|avenue|ave|lane|ln|drive|dr|close|court|ct|way|soi)\b/.test(words)) {
    return block('address');
  }
  if (/\b(my|our) school (is|name|called)\b|\bi go to \w+ (school|primary|academy)\b/.test(words)) {
    return block('school');
  }
  if (/\bmy (last|full|whole|real|second|family) name\b|\bmy surname\b/.test(words)) return block('surname');
  const named = words.match(/\bmy name is (\w+) (\w+)/);
  if (named && !NOT_A_SURNAME.has(named[2])) return block('surname');

  // `normalize` drops symbols, so starred-out swears get their own look.
  if (UNKIND.some((re) => re.test(words)) || /\b(f[*#@u]+c?k|sh[*#@i1]t|b[*#@i1]tch)/.test(lower)) {
    return block('unkind');
  }

  return { ok: true, text };
}

// ---------------------------------------------------------------------------
// Who's in the phone
// ---------------------------------------------------------------------------

/** Shared lines every villager can fall back on. `{player}` and `{name}` get filled in. */
const SHARED = {
  greetBack: ['Hi again, {player}!', 'Hello hello!', 'Hiya! I’m still here.'],
  thanks: ['You’re welcome, {player}!', 'Any time!', 'No problem at all.'],
  yes: ['Yay!', 'Brilliant!', 'Hooray!'],
  no: ['Oh, okay!', 'That’s alright.', 'Fair enough!'],
  maybe: ['Maybe! Who knows?', 'Hmm, we’ll see!'],
  real: [
    'I’m a villager in your game, so I’m pretend — the phone does my talking! But I’m really happy you called.',
    'Nope, I’m a game character, made of blocks and a bit of computer magic. The real people in your life are the best ones to hang out with!',
  ],
  meet: [
    'I live inside the game, so I can’t meet up in real life! But you can visit me in the village any time.',
    'I can’t come out of the game! Real-life play dates are for real-life friends. But you can always come and find me in the village.',
  ],
  myName: ['You’re {player}! I’d know you anywhere.', 'It’s {player}, of course!'],
  noName: ['Hmm, I don’t know yet! You can give your character a name in Characters.'],
  meetYou: ['Nice to meet you, {said}! I’m {name}.', 'Hello, {said}! What a lovely name.'],
  sad: [
    'Oh no, {player}. I’m sorry you feel sad. Sending you a big blocky hug! If something is really bothering you, telling a grown-up you love can help a lot.',
    'Aww. Everybody feels sad sometimes. I’m here, and I’m listening.',
  ],
  scared: [
    'That’s okay — everybody gets scared sometimes. Nothing in the village can hurt you, I promise.',
    'Take a big breath with me. In… and out. You’re safe here.',
  ],
  angry: [
    'Oof, that’s a grumpy feeling. Let’s take three big breaths together. One… two… three. Any better?',
    'Grr! It’s okay to feel cross. Stomping your feet sometimes helps!',
  ],
  happy: ['Yay! That makes me happy too!', 'Hooray! I love hearing that.', 'That’s wonderful, {player}!'],
  love: ['Aww! You’re my friend too, {player}.', 'That’s the nicest thing anyone has said to me today!', 'Best friends! Hooray!'],
  likes: ['{said}? Ooh, yes, I like {said} a lot!', 'I think {said} is lovely. Do you like {said} too?'],
  refer: [
    '{owner} is the one who knows all about {topic}! You should call {owner} next.',
    'Ooh, {topic}! That makes me think of {owner}. Give {owner} a ring!',
  ],
  question: [
    'Hmm, good question! I don’t know. What do you think?',
    'That’s a tricky one! Let me think… nope, my brain is made of blocks!',
    'I’m not sure! Maybe {other} knows? They know lots of things.',
  ],
  chat: ['Ooh, tell me more!', 'Really? Wow!', 'Haha, you’re funny, {player}!', 'Mm-hmm! And then what?', 'I love talking to you.'],
  jokes: [
    'What do you call a sleeping dinosaur? A dino-snore!',
    'Why did the teddy bear say no to pudding? Because it was already stuffed!',
    'What do you call a dog that does magic tricks? A labracadabrador!',
    'What has ears but can’t hear? A field of corn!',
    'Why can’t a bicycle stand up on its own? Because it’s two tired!',
    'What do you call a pig that does karate? A pork chop!',
  ],
};

/**
 * Each villager's personality on the phone. Their in-person lines live in
 * dialogue.js; these are the same people, so they should sound like it.
 */
const PERSONAS = {
  mila: {
    emoji: '🌸',
    greet: ['Hello, {player}! It’s Mila. I was just lighting the lanterns.', 'Oh, {player}! How lovely of you to call.'],
    bye: ['Bye bye, {player}! Come and visit the cottage soon.', 'Bye! I’ll leave a lantern on for you.'],
    intro: ['It’s Mila! I live in the cottage with all the lanterns.'],
    howAreYou: ['I’m cosy and happy, thank you! How are you?', 'Very well! The cottage smells of flowers today. How are you?'],
    doing: ['I’m lighting lanterns. One, two, three… lots of lanterns!', 'I’m sitting up in the loft, looking out of the window.'],
    home: ['I live in the cottage. It’s the one that glows at night.'],
    age: ['Old enough to light all the lanterns by myself!'],
    favourite: { colour: 'Rose pink, like the flower in my hair!', food: 'Warm bread from Bruno’s bakery, with jam.', animal: 'Bunnies! They have the softest ears.', thing: 'Lanterns. Definitely lanterns.' },
    topic: ['The lanterns make the whole room glow at night. You can put lantern blocks in my cottage too!', 'I love flowers. I always wear one in my hair.', 'The loft is my favourite spot. Have you been up there?'],
    build: ['If you stack blocks you can make a chair, or a table, or a whole castle!', 'You can build anything you like in my cottage. I never mind.'],
    play: ['Let’s play hide and seek! I’ll count to ten… you go and hide somewhere in the village!'],
    joke: ['Why did the lantern go to school? To get a little brighter!'],
    moon: ['The moon house? Ask Nell at the library. She knows all the old stories.'],
    moonFound: ['You found the moon house? Wow! Was it glowing?'],
    cheer: ['Come to the cottage and I’ll light every lantern just for you.'],
    bored: ['Ooh, come and build a bed up in my loft!'],
    chat: ['That sounds lovely.', 'Hehe! You always make me smile.'],
  },
  oskar: {
    emoji: '🏠',
    greet: ['Hey, {player}! Oskar here.', 'Oh, hey! Nice of you to call.'],
    bye: ['See you, {player}! Come and look at the big windows.', 'Bye! Talk soon.'],
    intro: ['It’s Oskar. I live in the modern house with the big windows.'],
    howAreYou: ['Pretty good, thanks! How about you?', 'Good! Very sunny in here today. How are you?'],
    doing: ['I’m looking out of my big windows at the garden.', 'I’m tidying the garage. It’s mostly empty, so that was quick.'],
    home: ['The modern house — the one with the big windows and the garage.'],
    age: ['Grown-up enough to have a garage!'],
    favourite: { colour: 'Navy blue. Very smart.', food: 'Pancakes. Lots of them.', animal: 'Owls. They’re clever.', thing: 'Windows. I just like seeing outside!' },
    topic: ['I like big windows. You can see the whole garden.', 'There’s a whole upstairs in my house. Have a look!', 'If you build something on my roof, I would like that a lot.'],
    build: ['Build something up on my roof! I’ve always wanted a roof garden.', 'My garage is empty. You could fill it with anything.'],
    play: ['Race you to the pond! Ready… steady… go!'],
    joke: ['What did one wall say to the other wall? I’ll meet you at the corner!'],
    moon: ['A moon house? Never seen it. Nell at the library might know.'],
    moonFound: ['You found a house shaped like a moon? That’s amazing.'],
    cheer: ['Come over and we can look at the garden together.'],
    bored: ['You could fill up my garage with something fun!'],
    chat: ['Nice. That’s a good one.', 'Ha! Cool.'],
  },
  bruno: {
    emoji: '🥖',
    greet: ['Bruno’s Bakery! Oh, it’s you, {player}! Hello!', 'Hello hello! Bruno here, with flour on my nose.'],
    bye: ['Bye, {player}! I’ll keep a bun warm for you.', 'Bye bye! The oven needs me.'],
    intro: ['It’s Bruno, the baker! I make all the bread in the village.'],
    howAreYou: ['Warm and floury! How are you?', 'Busy busy! The oven’s been going since sunrise. How are you?'],
    doing: ['Baking bread! What else?', 'I’m icing a very tall cake. Wobble wobble!'],
    home: ['At the bakery, of course! Follow the smell of bread.'],
    age: ['Old enough to have baked ten thousand loaves!'],
    favourite: { colour: 'Golden brown, like a perfect loaf.', food: 'Fresh bread, warm from the oven. Mmm!', animal: 'Ducks. I give them my crumbs.', thing: 'My big oven. It’s my best friend.' },
    topic: ['Ooh, yummy! I bake something fresh every single morning.', 'I could bake you a cake! What flavour do you like?', 'Take whatever you want off the shelves. It’s all fresh.'],
    build: ['You could build a big table in the bakery. Everyone could sit down together!'],
    play: ['Let’s play bakery! You be the customer. What would you like to buy?'],
    joke: ['Why did the baker stop making doughnuts? He got tired of the hole thing!'],
    moon: ['The moon house? Never been. Nell at the library knows the stories.'],
    moonFound: ['You found the moon house? I bet it looks like a big round biscuit!'],
    cheer: ['Come to the bakery and I’ll save you the biggest cookie.'],
    bored: ['Come and help me in the bakery! You can build some new shelves.'],
    chat: ['Sorry, I’ve got flour in my ears! But that sounds great.', 'Ha! You’re a good one.'],
  },
  poppy: {
    emoji: '🐣',
    greet: ['Hi! It’s Poppy! Careful, I’ve got hay everywhere.', 'Hi {player}! The chickens say hello too!'],
    bye: ['Bye bye! The animals say bye too!', 'Bye {player}! Moo! That was the cow.'],
    intro: ['It’s Poppy! I look after the animals in the barn.'],
    howAreYou: ['I’m great! A bit hay-y. How are you?', 'Happy as a piglet in mud! How are you?'],
    doing: ['I’m about to feed everyone. Want to help?', 'I’m sweeping hay. There is SO much hay.'],
    home: ['In the barn! I sleep in the loft sometimes. It’s warmer up there.'],
    age: ['Old enough to look after a whole barn!'],
    favourite: { colour: 'Sunshine yellow!', food: 'Carrots. I share them with the bunnies.', animal: 'All of them! But mostly baby chicks.', thing: 'The hay loft. It’s cosy.' },
    topic: ['I love animals! The stalls in the barn are empty right now — you could make beds in them.', 'Do you want to help me feed everyone later?', 'Baby chicks are the fluffiest thing in the whole world.'],
    build: ['You could build beds in the stalls for the animals!'],
    play: ['Let’s play farm! You can be the farmer and I’ll be a very noisy chicken. Bawk!'],
    joke: ['What do you call a sleeping cow? A bull-dozer!'],
    moon: ['The moon house? Ooh! Ask Nell, she knows everything.'],
    moonFound: ['You found the moon house?! Were there any moon bunnies?'],
    cheer: ['Come to the barn. Cuddles from the animals fix everything.'],
    bored: ['Come and help me feed the animals!'],
    chat: ['One of the chickens just said hello too! Bawk!', 'Ooh! Ooh! That’s so cool!'],
  },
  nell: {
    emoji: '📚',
    greet: ['Hello, {player}! This is Nell, at the library. I can be loud on the phone.', 'Oh, hello! I was just reading. What a nice surprise.'],
    bye: ['Goodbye, {player}! Come and read with me soon.', 'Bye! The end. Hehe.'],
    intro: ['It’s Nell, the librarian. I look after all the books.'],
    howAreYou: ['Very well, thank you! I’m halfway through a brilliant story. How are you?', 'I’m lovely, thank you. How are you?'],
    doing: ['I’m reading, of course!', 'I’m putting books back on the shelves. There are two whole floors of them.'],
    home: ['In the library! Two floors of books and a balcony.'],
    age: ['Older than most of my books, but younger than some!'],
    favourite: { colour: 'Purple, like the cover of my favourite book.', food: 'Tea and biscuits, while I read.', animal: 'Owls. They’re very wise.', thing: 'Stories. Especially ones with secrets in them.' },
    topic: ['I love stories. Every book is a little door to somewhere new.', 'There are two floors of books. The balcony stairs are at the back.', 'Shh — only joking. You can be as loud as you like in the library.'],
    build: ['You could build a reading nook in the library! With lots of cushions.'],
    play: ['Let’s play make-up-a-story! Once upon a time, there was a girl who found a secret house…'],
    joke: ['Why did the book join the police? Because it wanted to go undercover!'],
    moon: ['I read a story once about a house shaped like the moon. They say it’s hidden behind a hedge, east of the village.', 'Follow the line of lanterns. That’s all I’m saying!'],
    moonFound: ['You found it?! Oh, I knew it was real. Tell me everything!'],
    cheer: ['Come to the library and I’ll read you the happiest story I know.'],
    bored: ['Bored? I know a secret… look for a house shaped like the moon!'],
    chat: ['That would make a wonderful story.', 'How interesting! I should write that down.'],
  },
  tomas: {
    emoji: '🦆',
    greet: ['Hello, {player}! Tomas here, down by the pond.', 'Oh, hi! I can hear the ducks from here.'],
    bye: ['Bye, {player}! Wave if you walk past the pond.', 'See you later! Quack quack — that’s from the ducks.'],
    intro: ['It’s Tomas! I’m usually standing by the pond.'],
    howAreYou: ['Pretty good! Nice day for it. How are you?', 'Very calm. Ponds are good for that. How are you?'],
    doing: ['Watching the ducks. They’re very busy.', 'Just standing by the pond. It’s my favourite bit of the village.'],
    home: ['I’m always by the pond, in the middle of the village.'],
    age: ['Old enough to know every duck by name!'],
    favourite: { colour: 'Teal, like the pond.', food: 'Sandwiches by the water.', animal: 'Ducks, obviously!', thing: 'The pond. It’s the best bit of the village.' },
    topic: ['The pond is my favourite bit of the village.', 'There are ducks on the pond today. One of them looks like it’s wearing a hat.'],
    build: ['You can’t build out in the village — only inside the houses. But inside, anything goes!'],
    play: ['Let’s play duck, duck, goose! You go first.'],
    joke: ['Why are fish so clever? Because they live in schools!'],
    moon: ['A moon house? I don’t know about that. Nell at the library might.'],
    moonFound: ['The moon house is real? Well, I never!'],
    cheer: ['Come and sit by the pond with me. The ducks always cheer me up.'],
    bored: ['Every house in the village is open. Pick one you haven’t been in!'],
    chat: ['I’m just watching the ducks. Go on, I’m listening!', 'Ha, nice.'],
  },
  wren: {
    emoji: '🎀',
    greet: ['Hello hello! It’s Wren! Hi {player}!', 'Ooh, a phone call! Hi! It’s Wren!'],
    bye: ['Bye bye bye! Call me again soon!', 'Byeee, {player}!'],
    intro: ['It’s Wren! I’m always out on the path.'],
    howAreYou: ['Super duper! How are you?', 'Amazing! I changed my outfit again. How are you?'],
    doing: ['Walking up and down the path! Hello, path!', 'Changing my outfit. I’ve changed it four times this morning!'],
    home: ['I’m always out on the path. I like seeing everyone go by!'],
    age: ['Old enough to choose my own outfits!'],
    favourite: { colour: 'Pink! Pink pink pink!', food: 'Strawberry cupcakes.', animal: 'Kittens, because they’re tiny.', thing: 'Bows. I have lots.' },
    topic: ['You can be anyone you want, you know. Just change your character!', 'I love bows. And sparkles. And bows with sparkles.', 'Ooh, what are you wearing today?'],
    build: ['Build something sparkly! Then show me!'],
    play: ['Let’s play tag! You’re it! Hehe!'],
    joke: ['What do elves learn at school? The elf-abet!'],
    moon: ['A moon house? Ooh! Nell at the library knows all the secrets!'],
    moonFound: ['You found the moon house?! No way! Was it sparkly?'],
    cheer: ['Do a twirl! Twirling always makes me feel better.'],
    bored: ['Make a brand new character! I do it all the time.'],
    chat: ['Ooh! Ooh! That’s so cool!', 'Wow wow wow!'],
  },
  luna: {
    emoji: '🌙',
    greet: ['Hello, {player}. You found my number too.', 'Ah, {player}. The stars said you might call.'],
    bye: ['Goodbye, {player}. The moon will be here when you come back.', 'Sleep well, wherever you are.'],
    intro: ['It’s Luna. I keep the moon house.'],
    howAreYou: ['Calm and starry, thank you. How are you?', 'Very peaceful. The vines grew a little today. How are you?'],
    doing: ['Watching the stars from the top horn of the moon.', 'Listening to the vines grow.'],
    home: ['In the moon house, of course. Behind the hedge, where almost nobody looks.'],
    age: ['As old as the moon. Or maybe just a little bit younger.'],
    favourite: { colour: 'Lilac, like the sky just before night.', food: 'Moon cakes!', animal: 'Fireflies. They’re like tiny stars.', thing: 'The view from the very top.' },
    topic: ['The stars are very bright tonight. They always are, up here.', 'The vines grow down through the glass. I never trim them.'],
    build: ['You can build in the moon house too. It is a house, after all.'],
    play: ['Let’s count the stars. One… two… oh, there are too many!'],
    joke: ['Why did the moon skip dinner? Because it was full!'],
    moon: ['The whole house is cut open at the front, so you can see every floor at once.', 'Walk up the stairs. They go all the way to the top horn.'],
    moonFound: ['The whole house is cut open at the front, so you can see every floor at once.'],
    cheer: ['Come and look at the stars with me. They make everything feel small and gentle.'],
    bored: ['Have you been all the way up to the top horn yet?'],
    chat: ['The stars are listening too.', 'Mmm. How lovely.'],
  },
};

const FALLBACK_PERSONA = PERSONAS.tomas;

// Topics every villager recognises. The one who owns a topic talks about it;
// everyone else sends you to them — which is also how she learns who's who.
const TOPICS = [
  { owner: 'bruno', label: 'baking', words: /\b(bread|cakes?|cookies?|biscuits?|bake|baking|baker|bakery|oven|food|hungry|eat|eating|snacks?|pizza|cupcakes?|muffins?|donuts?|doughnuts?|croissants?|pies?|buns?)\b/ },
  { owner: 'poppy', label: 'animals', words: /\b(animals?|cows?|pigs?|piglets?|horses?|ponys?|ponies|chickens?|chicks?|sheep|goats?|dogs?|puppy|puppies|cats?|kittens?|bunny|bunnies|rabbits?|hay|barn|farm|pets?)\b/ },
  { owner: 'nell', label: 'books and stories', words: /\b(books?|read|reading|stories|story|library|librarian)\b/ },
  { owner: 'tomas', label: 'the pond', words: /\b(pond|fish|fishing|ducks?|ducklings?|frogs?|water|swim|swimming|lake)\b/ },
  { owner: 'mila', label: 'lanterns and flowers', words: /\b(lanterns?|lights?|flowers?|cottage|loft|candles?|roses?)\b/ },
  { owner: 'oskar', label: 'the house with big windows', words: /\b(windows?|garage|roof|garden|cars?|modern|upstairs)\b/ },
  { owner: 'wren', label: 'outfits and characters', words: /\b(outfits?|clothes|dress|dresses|hair|hairstyles?|costumes?|characters?|shoes|bows?|fashion|sparkles?|sparkly)\b/ },
  { owner: 'luna', label: 'the stars', words: /\b(stars?|night|sky|vines?|space|planets?)\b/, secret: true },
];

/** Villagers in the order they appear in the phone. Luna stays secret until you've found her house. */
export function contactList({ moonFound = false } = {}) {
  return Object.keys(VILLAGERS)
    .filter((id) => id !== 'luna' || moonFound)
    .map((id) => ({
      id,
      name: VILLAGERS[id].name,
      role: VILLAGERS[id].role,
      emoji: (PERSONAS[id] || FALLBACK_PERSONA).emoji,
    }));
}

export function personaEmoji(id) {
  return (PERSONAS[id] || FALLBACK_PERSONA).emoji;
}

// ---------------------------------------------------------------------------
// A call
// ---------------------------------------------------------------------------

/**
 * Start a call. The returned object is the call's memory — which lines have
 * been used — so replies cycle instead of repeating back to back.
 */
export function createCall(villagerId, { playerName = '', moonFound = false } = {}) {
  return {
    id: villagerId,
    villager: getVillager(villagerId) || { name: villagerId, role: '' },
    persona: PERSONAS[villagerId] || FALLBACK_PERSONA,
    playerName: String(playerName || '').trim(),
    moonFound,
    used: {},
    turns: 0,
  };
}

function pick(call, key, list) {
  const lines = list && list.length ? list : SHARED.chat;
  const n = call.used[key] || 0;
  call.used[key] = n + 1;
  return lines[n % lines.length];
}

function fill(call, line, extra = {}) {
  const ids = Object.keys(VILLAGERS).filter((id) => id !== call.id && (id !== 'luna' || call.moonFound));
  const other = VILLAGERS[ids[call.turns % ids.length]]?.name || 'Nell';
  const values = {
    player: call.playerName || 'friend',
    name: call.villager.name,
    other,
    ...extra,
  };
  const text = line.replace(/\{(\w+)\}/g, (match, key) => (key in values ? values[key] : match));
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** What the villager says when they pick up. */
export function answer(call) {
  return fill(call, pick(call, 'greet', call.persona.greet));
}

/** How a villager says goodbye when you hang up on them. */
export function farewell(call) {
  return fill(call, pick(call, 'bye', call.persona.bye));
}

/** "favourite colour" → "colour", and so on. */
function favouriteKind(words) {
  const after = (words.match(/\bfavourite (\w+)/) || [])[1] || '';
  if (/^colou?rs?$/.test(after)) return 'colour';
  if (/^(food|foods|snack|snacks|treat|treats|dinner|lunch|breakfast|pudding|dessert|sweet|sweets)$/.test(after)) return 'food';
  if (/^(animal|animals|pet|pets|bird|birds)$/.test(after)) return 'animal';
  return 'thing';
}

const GREETING = /^(hi+|hey+|hello+|helo+|hiya|howdy|yo|good (morning|afternoon|evening)|ring ring)\b/;

/**
 * Work out what the villager says back to `raw`. Assumes checkMessage has
 * already passed it. Returns `{ text, hangUp }` — `hangUp` is true when the
 * message was a goodbye.
 */
export function respond(call, raw) {
  const words = normalize(raw);
  const p = call.persona;
  const say = (key, list, extra) => fill(call, pick(call, key, list), extra);
  call.turns += 1;

  if (/\b(bye+|goodbye|good night|goodnight|see you|see ya|cya|gotta go|got to go|have to go|talk later|ttyl)\b/.test(words)) {
    return { text: say('bye', p.bye), hangUp: true };
  }

  // Honesty first: a villager never lets her think they're a real person.
  if (/\b(meet (up|me|you)|in real life|irl|in person|come to my house|come over to my)\b/.test(words)) {
    return { text: say('meet', SHARED.meet) };
  }
  if (/\bare you (real|a real|a robot|a bot|human|a human|a person|ai|an ai|alive|pretend|fake)\b|\bis this (real|a robot|a bot)\b/.test(words)) {
    return { text: say('real', SHARED.real) };
  }

  if (/\b(what is my name|whats my name|do you know my name|who am i|do you know who i am)\b/.test(words)) {
    return { text: say('myName', call.playerName ? SHARED.myName : SHARED.noName) };
  }
  if (/\b(what is your name|whats your name|who are you|who is this|whos this|who is it|whos that)\b/.test(words)) {
    return { text: say('intro', p.intro) };
  }
  if (/\b(how are you|how are things|hows it going|how is it going|how you doing|are you ok|are you okay|you ok)\b/.test(words)) {
    return { text: say('howAreYou', p.howAreYou) };
  }

  if (/\b(sad|upset|crying|cry|lonely|unhappy|bad day|not (happy|good|great|fine|ok|okay))\b/.test(words)) {
    return { text: `${say('sad', SHARED.sad)} ${say('cheer', p.cheer)}` };
  }
  if (/\b(scared|afraid|frightened|nightmares?|worried|nervous)\b/.test(words)) {
    return { text: say('scared', SHARED.scared) };
  }
  if (/\b(angry|mad|cross|grumpy|annoyed|furious)\b/.test(words)) {
    return { text: say('angry', SHARED.angry) };
  }
  if (/\b(bored|boring|nothing to do)\b/.test(words)) {
    return { text: say('bored', p.bored) };
  }

  if (/\b(jokes?|make me laugh|something funny|funny thing)\b/.test(words)) {
    return { text: say('joke', [...p.joke, ...SHARED.jokes]) };
  }
  if (/\bfavourite\b/.test(words)) {
    const kind = favouriteKind(words);
    return { text: say(`fav-${kind}`, [p.favourite[kind]]) };
  }

  if (/\bmoon\b/.test(words)) {
    const lines = call.id === 'luna' ? p.moon : call.moonFound ? p.moonFound : p.moon;
    return { text: say('moon', lines) };
  }

  if (/\bhow old\b/.test(words)) return { text: say('age', p.age) };
  if (/\bwhere (do you live|are you|is your (house|home))\b/.test(words)) return { text: say('home', p.home) };
  if (/\b(what are you doing|what you doing|what are you up to|wyd|what do you do)\b/.test(words)) {
    return { text: say('doing', p.doing) };
  }

  if (/\b(i love you|love you|i like you|you are my friend|youre my friend|be my friend|best friends?|do you like me)\b/.test(words)) {
    return { text: say('love', SHARED.love) };
  }
  if (/\b(thank you|thanks|thank|thx|ty)\b/.test(words)) return { text: say('thanks', SHARED.thanks) };

  const introduced = words.match(/\bmy name is (\w+)/);
  if (introduced) {
    const said = introduced[1].charAt(0).toUpperCase() + introduced[1].slice(1);
    return { text: say('meetYou', SHARED.meetYou, { said }) };
  }

  if (/\b(build|building|built|blocks?)\b/.test(words)) return { text: say('build', p.build) };
  if (/\b(play|playing|hide and seek|tag)\b/.test(words)) return { text: say('play', p.play) };

  const topic = TOPICS.find((t) => t.words.test(words));
  if (topic) {
    // Luna is a secret until you've found her house, so before that, the
    // stars point you at Nell and her story instead.
    const owner = topic.secret && !call.moonFound ? 'nell' : topic.owner;
    if (owner === call.id) {
      return { text: say('topic', topic.secret && !call.moonFound ? p.moon : p.topic) };
    }
    const label = topic.secret && !call.moonFound ? 'old stories about the sky' : topic.label;
    return { text: say('refer', SHARED.refer, { owner: VILLAGERS[owner].name, topic: label }) };
  }

  const liked = words.match(/\bdo you like (\w+(?: \w+){0,2})/);
  if (liked) return { text: say('likes', SHARED.likes, { said: liked[1] }) };

  if (GREETING.test(words)) return { text: say('greetBack', SHARED.greetBack) };
  if (/^(yes|yeah|yep|yup|yay|sure|ok|okay|of course)\b/.test(words)) return { text: say('yes', SHARED.yes) };
  if (/^(no|nope|nah|not really)\b/.test(words)) return { text: say('no', SHARED.no) };
  if (/^(maybe|perhaps|i dont know|idk|hmm+|um+)\b/.test(words)) return { text: say('maybe', SHARED.maybe) };
  if (/\b(happy|excited|great|good|fine|awesome|amazing|super|fantastic|wonderful|brilliant)\b/.test(words)) {
    return { text: say('happy', SHARED.happy) };
  }

  if (/\?\s*$/.test(String(raw)) || /^(what|why|how|where|when|who|which|can|could|do|does|did|is|are|will|would|should)\b/.test(words)) {
    return { text: say('question', SHARED.question) };
  }
  return { text: say('chat', [...p.chat, ...SHARED.chat]) };
}

/** Every line a villager could say on the phone — used by the safety check. */
export function allPhoneLines() {
  const lines = [];
  const walk = (value) => {
    if (typeof value === 'string') lines.push(value);
    else if (Array.isArray(value)) value.forEach(walk);
    else if (value && typeof value === 'object') Object.values(value).forEach(walk);
  };
  walk(SHARED);
  for (const persona of Object.values(PERSONAS)) {
    const { emoji, ...rest } = persona;
    walk(rest);
  }
  return lines;
}

export const PERSONA_IDS = Object.keys(PERSONAS);
