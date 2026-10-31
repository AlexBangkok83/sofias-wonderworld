// Villagers and what they say.
//
// Lines are fixed, which is the whole reason the voice pipeline can pre-render
// them to audio files instead of calling a TTS API at runtime. If you edit a
// line here, re-run `npm run voices` so the recording matches.
//
// Sofia asked for villagers who talk to her. She did not ask for — and it was
// checked with her directly — any kind of player-to-player chat. There is no
// networking anywhere in this game.

export const VILLAGERS = {
  mila: {
    name: 'Mila',
    role: 'Lives in the cottage',
    voice: { pitch: 1.25, rate: 0.95 },
    character: {
      body: 'medium', skin: 'warm', hair: 'braids', hairColor: 'chestnut',
      outfit: 'dress', shirt: 'mint', pants: 'brown', shoes: 'brown', accessory: 'flower', accessoryColor: 'rose',
    },
    lines: [
      'Oh, hello! Welcome to my cottage.',
      'Move anything you like in here. I never mind.',
      'I light all the lanterns before it gets dark. It makes the whole room glow.',
      'The loft up there is my favourite spot. Try putting a bed in it!',
      'Sit me on the sofa. It is the comfiest one in the village.',
    ],
  },
  oskar: {
    name: 'Oskar',
    role: 'Lives in the modern house',
    voice: { pitch: 0.85, rate: 0.98 },
    character: {
      body: 'tall', skin: 'olive', hair: 'short', hairColor: 'black',
      shirt: 'navy', pants: 'grey', shoes: 'black', accessory: 'none', accessoryColor: 'white',
    },
    lines: [
      'Hey! Big windows, aren\'t they? I like being able to see the garden.',
      'There\'s a whole upstairs. Go on, have a look.',
      'My garage is for storing things. Mostly it is empty.',
      'Play the piano for me? Just tap it.',
    ],
  },
  bruno: {
    name: 'Bruno',
    role: 'The baker',
    voice: { pitch: 0.95, rate: 0.92 },
    character: {
      body: 'medium', skin: 'tan', hair: 'curly', hairColor: 'ginger',
      shirt: 'cream', pants: 'red', shoes: 'brown', accessory: 'hat', accessoryColor: 'white',
    },
    lines: [
      'Morning! The oven has been going since before sunrise.',
      'It smells like bread in here all day long. I am used to it now.',
      'Take whatever you want off the shelves. It is all fresh.',
      'Hungry? Tap the bread and have a bite.',
    ],
  },
  poppy: {
    name: 'Poppy',
    role: 'Looks after the animals',
    voice: { pitch: 1.35, rate: 1.02 },
    character: {
      body: 'small', skin: 'porcelain', hair: 'buns', hairColor: 'blonde',
      outfit: 'shorts', shirt: 'yellow', pants: 'green', shoes: 'brown', accessory: 'ears', accessoryColor: 'brown',
    },
    lines: [
      'Hi! Careful, there is hay absolutely everywhere.',
      'Tap the cow. She always has something to say.',
      'I sleep in the loft sometimes. It is warmer up there.',
      'Do you want to help me feed everyone later?',
    ],
  },
  nell: {
    name: 'Nell',
    role: 'The librarian',
    voice: { pitch: 1.1, rate: 0.88 },
    character: {
      body: 'tall', skin: 'deep', hair: 'long', hairColor: 'black',
      outfit: 'dress', shirt: 'purple', pants: 'navy', shoes: 'black', accessory: 'none', accessoryColor: 'white',
    },
    lines: [
      'Shh — only joking. You can be as loud as you like in here.',
      'There are two floors of books. Upstairs is the quiet bit.',
      'I read a story once about a house shaped like the moon.',
      'They say it is hidden behind a hedge, right at the end of the street.',
      'If you ever find it, come back and tell me what it was like.',
    ],
  },
  luna: {
    name: 'Luna',
    role: 'Keeper of the moon house',
    voice: { pitch: 1.15, rate: 0.85 },
    character: {
      body: 'medium', skin: 'lilac', hair: 'long', hairColor: 'platinum',
      outfit: 'dress', shirt: 'lilac', pants: 'navy', shoes: 'purple', accessory: 'halo', accessoryColor: 'yellow',
    },
    lines: [
      'You found it. Almost nobody finds it.',
      'The whole house is cut open at the front, so you can see every floor at once.',
      'The bed at the top is the best place to watch the stars.',
      'The vines grow down through the glass. I never trim them.',
      'You can move anything in here too. It is a house, after all.',
    ],
  },
  tomas: {
    name: 'Tomas',
    role: 'Lives by the pond',
    voice: { pitch: 0.9, rate: 0.95 },
    character: {
      body: 'medium', skin: 'light', hair: 'short', hairColor: 'brown',
      shirt: 'teal', pants: 'brown', shoes: 'black', accessory: 'none', accessoryColor: 'white',
    },
    lines: [
      'Nice day for it. The pond is my favourite bit of the village.',
      'Every house here is open. Tap one to go inside.',
      'You can take anyone with you. Drag them onto a door.',
      'Whoever designed this village did a lovely job, I think.',
    ],
  },
  wren: {
    name: 'Wren',
    role: 'Always out on the street',
    voice: { pitch: 1.3, rate: 1.05 },
    character: {
      body: 'small', skin: 'light', hair: 'ponytail', hairColor: 'pink',
      outfit: 'dress', shirt: 'rose', pants: 'lilac', shoes: 'white', accessory: 'bow', accessoryColor: 'white',
    },
    lines: [
      'Hello hello! Are you new here?',
      'The cottage is that way. It is the prettiest one, I think.',
      'You can make new people too, you know. Look in Characters.',
      'I changed mine four times this morning.',
    ],
  },
};

export function getVillager(id) {
  return VILLAGERS[id] || null;
}
