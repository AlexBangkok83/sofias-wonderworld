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
      shirt: 'mint', pants: 'brown', shoes: 'brown', accessory: 'flower', accessoryColor: 'rose',
    },
    lines: [
      'Oh, hello! Welcome to my cottage.',
      'You can build anything you like in here. I never mind.',
      'I light all the lanterns before it gets dark. It makes the whole room glow.',
      'The loft up there is my favourite spot. Try putting a bed in it!',
      'If you stack blocks you can make a chair, or a table, or a whole castle.',
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
      'If you build something up on the roof, I would like that a lot.',
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
      'You could build a big table in the middle. Everyone could sit down.',
    ],
  },
  poppy: {
    name: 'Poppy',
    role: 'Looks after the animals',
    voice: { pitch: 1.35, rate: 1.02 },
    character: {
      body: 'small', skin: 'porcelain', hair: 'buns', hairColor: 'blonde',
      shirt: 'yellow', pants: 'green', shoes: 'brown', accessory: 'ears', accessoryColor: 'brown',
    },
    lines: [
      'Hi! Careful, there is hay absolutely everywhere.',
      'The stalls are empty right now. You could make beds in them.',
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
      shirt: 'purple', pants: 'navy', shoes: 'black', accessory: 'none', accessoryColor: 'white',
    },
    lines: [
      'Shh — only joking. You can be as loud as you like in here.',
      'There are two floors of books. The balcony stairs are behind you.',
      'I read a story once about a house shaped like the moon.',
      'They say it is hidden behind a hedge, somewhere east of here.',
      'If you ever find it, come back and tell me what it was like.',
    ],
  },
  luna: {
    name: 'Luna',
    role: 'Keeper of the moon house',
    voice: { pitch: 1.15, rate: 0.85 },
    character: {
      body: 'medium', skin: 'lilac', hair: 'long', hairColor: 'platinum',
      shirt: 'lilac', pants: 'navy', shoes: 'purple', accessory: 'halo', accessoryColor: 'yellow',
    },
    lines: [
      'You found it. Almost nobody finds it.',
      'The whole house is cut open at the front, so you can see every floor at once.',
      'Walk up the stairs. They go all the way to the top horn.',
      'The vines grow down through the glass. I never trim them.',
      'You can build in here too. It is a house, after all.',
    ],
  },
  tomas: {
    name: 'Tomas',
    role: 'Stands by the pond',
    voice: { pitch: 0.9, rate: 0.95 },
    character: {
      body: 'medium', skin: 'light', hair: 'short', hairColor: 'brown',
      shirt: 'teal', pants: 'brown', shoes: 'black', accessory: 'none', accessoryColor: 'white',
    },
    lines: [
      'Nice day for it. The pond is my favourite bit of the village.',
      'Every house here is open. Just walk up to a door and keep walking.',
      'You cannot build out here in the village — only inside the houses.',
      'That was the rule the designer set, and I think it is a good one.',
    ],
  },
  wren: {
    name: 'Wren',
    role: 'Always on the path',
    voice: { pitch: 1.3, rate: 1.05 },
    character: {
      body: 'small', skin: 'light', hair: 'ponytail', hairColor: 'pink',
      shirt: 'rose', pants: 'lilac', shoes: 'white', accessory: 'bow', accessoryColor: 'white',
    },
    lines: [
      'Hello hello! Are you new here?',
      'The cottage is that way. It is the prettiest one, I think.',
      'You can be anyone you want, you know. Just change your character.',
      'I changed mine four times this morning.',
    ],
  },
};

export function getVillager(id) {
  return VILLAGERS[id] || null;
}
