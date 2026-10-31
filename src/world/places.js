/**
 * The places: the town street, and the inside of every building, cut open
 * down the front like a dollhouse so every room shows at once.
 *
 * Each place is plain data:
 *
 *   w, ground   width in world units (all places are 800 tall), and the
 *               ground line things fall to outside
 *   rooms       rectangles; the bottom edge of each one is a floor
 *   links       tap one (or drop someone on it) to go somewhere else
 *   things      [kind, x, dropFromY] — dropped in order when the place is
 *               first visited, so a loaf dropped above the counter lands on it
 *   people      who lives here: { personKey: x } or { personKey: [x, dropFromY] }
 *
 * The pictures for walls, roofs and skies are in src/art/scenes.js; the
 * drawing style (wallpaper, colours) is described here per room.
 */

export const START_PLACE = 'cottage';

// Interiors share one frame: two storeys, upstairs floor at 430, ground at 760.
const UP = { y: 130, h: 300 };
const DOWN = { y: 450, h: 310 };
const GROUND = 760;
const exitDoor = (x = 82) => ({ x, y: 600, w: 70, h: 160, to: 'town', kind: 'exit' });

export const PLACES = {
  town: {
    id: 'town',
    label: 'The Village',
    w: 3300,
    ground: 712,
    sky: 'day',
    rooms: [],
    links: [
      { x: 200, y: 400, w: 330, h: 312, to: 'cottage', kind: 'house' },
      { x: 660, y: 360, w: 380, h: 352, to: 'modern', kind: 'house' },
      { x: 1170, y: 400, w: 310, h: 312, to: 'bakery', kind: 'house' },
      { x: 1890, y: 370, w: 400, h: 342, to: 'barn', kind: 'house' },
      { x: 2410, y: 380, w: 360, h: 332, to: 'library', kind: 'house' },
      // The secret: one gap in the hedge at the far end of the street.
      { x: 3060, y: 520, w: 80, h: 192, to: 'moon', kind: 'gap' },
    ],
    things: [
      ['lamppost', 590, 0], ['lamppost', 1110, 0], ['lamppost', 2340, 0], ['lamppost', 2810, 0],
      ['bench', 1680, 0], ['bush', 130, 0], ['bush', 1540, 0], ['bush', 2300, 0], ['ball', 960, 0],
    ],
    people: { wren: 900, tomas: 1790 },
  },

  cottage: {
    id: 'cottage',
    label: 'The Cottage',
    w: 1500,
    ground: GROUND,
    sky: 'day',
    building: { x0: 80, x1: 1420, wall: '#f6ead3', roof: 'gable', roofColor: '#c0395b' },
    rooms: [
      { x: 80, ...UP, w: 680, paper: '#d9c7f2', pattern: 'dots', floor: 'wood', windows: [[300, 190]] },
      { x: 760, ...UP, w: 660, paper: '#fbd7e2', pattern: 'hearts', floor: 'wood', windows: [[1080, 190]] },
      { x: 80, ...DOWN, w: 560, paper: '#cdeee3', pattern: 'tiles', floor: 'tile', windows: [[330, 510]] },
      { x: 640, ...DOWN, w: 780, paper: '#fbe7b8', pattern: 'stripes', floor: 'wood', windows: [[1000, 510]] },
    ],
    links: [exitDoor()],
    things: [
      // Kitchen
      ['fridge', 210, 700], ['stove', 330, 700], ['counter', 500, 700], ['bread', 450, 600], ['apple', 540, 600],
      ['mug', 580, 600], ['clock', 470, 500],
      // Living room
      ['rug', 1060, 700], ['table', 820, 700], ['chair', 700, 700], ['chair', 940, 700], ['cookie', 800, 600],
      ['sofa', 1160, 700], ['floorlamp', 1360, 700], ['plant', 1290, 700], ['painting', 1160, 520],
      // Bedroom
      ['bed', 260, 380], ['nightstand', 430, 380], ['tablelamp', 430, 300], ['bookshelf', 640, 380],
      ['painting', 500, 180],
      // Loft
      ['rug', 1090, 380], ['toybox', 880, 380], ['teddy', 1000, 380], ['ball', 1120, 380],
      ['armchair', 1300, 380], ['lantern', 1180, 160],
    ],
    people: { mila: 1060 },
  },

  modern: {
    id: 'modern',
    label: 'The Modern House',
    w: 1600,
    ground: GROUND,
    sky: 'day',
    building: { x0: 80, x1: 1520, wall: '#eef1f7', roof: 'flat', roofColor: '#5a4d6b' },
    rooms: [
      { x: 80, ...UP, w: 760, paper: '#cfe3fb', pattern: 'plain', floor: 'carpet', windows: [[460, 180, 220]] },
      { x: 840, ...UP, w: 680, paper: '#d5f2ee', pattern: 'tiles', floor: 'tile', windows: [[1300, 190]] },
      { x: 80, ...DOWN, w: 1040, paper: '#f9f4ea', pattern: 'plain', floor: 'wood', windows: [[400, 500, 260], [860, 500, 160]] },
      { x: 1120, ...DOWN, w: 400, paper: '#d9dce4', pattern: 'bricks', floor: 'stone', windows: [] },
    ],
    links: [exitDoor()],
    things: [
      ['bed', 260, 380], ['desk', 600, 380], ['chair', 720, 380], ['tablelamp', 580, 300], ['book', 630, 300],
      ['painting', 690, 200], ['plant', 790, 380],
      ['bathtub', 1060, 380], ['plant', 1460, 380], ['clock', 1250, 200],
      ['rug', 420, 700], ['sofa', 300, 700], ['tv', 540, 700], ['floorlamp', 160, 700], ['piano', 720, 700],
      ['counter', 920, 700], ['fridge', 1066, 700], ['mug', 900, 600],
      ['toycar', 1260, 700], ['ball', 1400, 700],
    ],
    people: { oskar: 420 },
  },

  bakery: {
    id: 'bakery',
    label: 'The Bakery',
    w: 1420,
    ground: GROUND,
    sky: 'day',
    building: { x0: 80, x1: 1340, wall: '#fbe2c9', roof: 'gable', roofColor: '#8a5a35' },
    rooms: [
      { x: 80, ...UP, w: 1260, paper: '#fff1c9', pattern: 'stripes', floor: 'wood', windows: [[400, 190], [960, 190]] },
      { x: 80, ...DOWN, w: 780, paper: '#fbd7e2', pattern: 'stripes', floor: 'tile', windows: [[560, 500, 200]] },
      { x: 860, ...DOWN, w: 480, paper: '#f6ead3', pattern: 'tiles', floor: 'tile', windows: [] },
    ],
    links: [exitDoor()],
    things: [
      ['display', 360, 700], ['croissant', 300, 600], ['cookie', 380, 600], ['bread', 440, 600],
      ['table', 660, 700], ['chair', 560, 700], ['chair', 780, 700], ['mug', 640, 600], ['croissant', 700, 600],
      ['stove', 940, 700], ['counter', 1110, 700], ['bread', 1060, 600], ['bread', 1160, 600], ['clock', 1110, 500],
      ['bed', 260, 380], ['armchair', 560, 380], ['floorlamp', 680, 380], ['rug', 880, 380], ['table', 1000, 380],
      ['cookie', 1000, 300], ['plant', 1270, 380], ['painting', 820, 200],
    ],
    people: { bruno: 1000 },
  },

  barn: {
    id: 'barn',
    label: 'The Animal Barn',
    w: 1720,
    ground: GROUND,
    sky: 'day',
    building: { x0: 80, x1: 1640, wall: '#d9584f', roof: 'barn', roofColor: '#8a3a35' },
    rooms: [
      { x: 80, ...UP, w: 700, paper: '#f1d39a', pattern: 'planks', floor: 'hay', windows: [[430, 190]] },
      { x: 80, ...DOWN, w: 700, paper: '#f1d39a', pattern: 'planks', floor: 'hay', windows: [] },
      { x: 780, y: 130, h: 630, w: 860, paper: '#f5ddb0', pattern: 'planks', floor: 'hay', windows: [[1210, 200]] },
    ],
    links: [exitDoor()],
    things: [
      ['haybale', 200, 380], ['haybale', 330, 380], ['haybale', 265, 300], ['bed', 600, 380], ['lantern', 250, 160],
      ['haybale', 260, 700], ['chicken', 230, 600], ['chicken', 300, 600], ['carrot', 430, 700], ['pig', 560, 700],
      ['cow', 1000, 700], ['haybale', 1240, 700], ['haybale', 1380, 700], ['carrot', 1480, 700],
      ['lantern', 950, 300], ['lantern', 1450, 300],
    ],
    people: { poppy: 700 },
  },

  library: {
    id: 'library',
    label: 'The Library',
    w: 1500,
    ground: GROUND,
    sky: 'day',
    building: { x0: 80, x1: 1420, wall: '#cdd8ee', roof: 'gable', roofColor: '#3e5187' },
    rooms: [
      { x: 80, ...UP, w: 1340, paper: '#e7dcf6', pattern: 'stars', floor: 'carpet', windows: [[740, 180, 200]] },
      { x: 80, ...DOWN, w: 1340, paper: '#e0ecd8', pattern: 'stripes', floor: 'wood', windows: [[420, 510], [1060, 510]] },
    ],
    links: [exitDoor()],
    things: [
      ['bookshelf', 220, 380], ['bookshelf', 370, 380], ['bookshelf', 520, 380], ['armchair', 960, 380],
      ['floorlamp', 1060, 380], ['bookshelf', 1200, 380], ['rug', 940, 380], ['book', 960, 300],
      ['bookshelf', 660, 700], ['bookshelf', 810, 700], ['desk', 300, 700], ['chair', 420, 700], ['tablelamp', 260, 600],
      ['book', 340, 600], ['armchair', 1060, 700], ['rug', 1060, 700], ['plant', 1340, 700], ['clock', 1240, 500],
    ],
    people: { nell: 1200 },
  },

  moon: {
    id: 'moon',
    label: 'The Moon House',
    w: 1500,
    ground: GROUND,
    sky: 'night',
    building: { x0: 390, x1: 1110, roof: 'moon' },
    rooms: [
      { x: 520, y: 130, w: 460, h: 190, paper: '#4b3d72', pattern: 'stars', floor: 'moon', windows: [] },
      { x: 420, y: 340, w: 660, h: 200, paper: '#5a4a86', pattern: 'stars', floor: 'moon', windows: [] },
      { x: 460, y: 560, w: 580, h: 200, paper: '#4b3d72', pattern: 'stars', floor: 'moon', windows: [] },
    ],
    links: [{ x: 1370, y: 580, w: 110, h: 180, to: 'town', kind: 'exit' }],
    things: [
      ['bed', 660, 300], ['nightstand', 850, 300], ['tablelamp', 850, 240], ['lantern', 930, 150],
      ['armchair', 510, 520], ['floorlamp', 630, 520], ['bookshelf', 990, 520], ['lantern', 800, 360],
      ['rug', 760, 740], ['plant', 530, 740], ['table', 900, 740], ['mug', 880, 680], ['lantern', 640, 580],
    ],
    people: { luna: 760 },
  },
};

export function getPlace(id) {
  return PLACES[id] || null;
}

/** Where someone arrives when they come through the door. */
export function arrivalX(place) {
  const exit = place.links.find((l) => l.to === 'town');
  if (!exit || place.id === 'town') return 300;
  // Step in from the door, whichever side of the place it's on.
  return exit.x < place.w / 2 ? exit.x + exit.w + 70 : exit.x - 70;
}

/** Where someone lands on the street when they leave a building. */
export function townSpotFor(placeId) {
  const link = PLACES.town.links.find((l) => l.to === placeId);
  return link ? link.x + link.w / 2 : 300;
}
