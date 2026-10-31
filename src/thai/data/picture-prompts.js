/**
 * What each word's picture should show, for generating the pictures
 * (scripts/thai-pictures.mjs). Not loaded by the app.
 *
 * A word not listed here gets "a <English word>", or its photo-search query
 * if it has one. Colours and numbers are drawn by the app, not pictured.
 *
 * People are children about Sofia's age wherever it makes sense, set in
 * Thailand where that's what the word means (the wai, Thai food, tuk-tuks).
 */

export const STYLE =
  'A bright, friendly, realistic photograph for a children\'s picture dictionary. '
  + 'One clear subject, centred, filling most of the frame, simple soft-coloured background, '
  + 'natural light, sharp focus. Family friendly. No text, no letters, no numbers, no watermark.';

const GIRL = 'a Thai girl about seven years old';
const BOY = 'a Thai boy about seven years old';

// Wording note: Higgsfield's safety filter blocks children shown "in bed" or
// described as "distressing", even innocently. Show feelings through a small
// story instead (a dropped ice cream, a tissue and a blanket).
export const PROMPTS = {
  // Hello!
  'hello:hello': `${GIRL} smiling and doing the Thai wai greeting: palms pressed together at her chest, head slightly bowed`,
  'hello:thank-you': `${GIRL} doing a small wai as she receives a wrapped present from a grown-up's hands, smiling`,
  'hello:sorry': `${GIRL} looking apologetic beside a spilled glass of juice on a table, hands together, eyes down`,
  'hello:its-okay': 'a kind Thai woman smiling warmly and gesturing "never mind" with a relaxed open hand',
  'hello:yes': `${GIRL} nodding happily with a big smile, one fist raised in a cheerful "yes!"`,
  'hello:no': `${GIRL} shaking her head with a playful frown, one hand held up to say no`,
  'hello:bye-bye': `${GIRL} with a school backpack waving goodbye at the front door of a house`,
  'hello:how-are-you': 'two Thai schoolgirls meeting in a school yard, greeting each other happily',
  'hello:im-fine': `${GIRL} smiling, relaxed and cheerful, hands on hips`,
  'hello:sweet-dreams': 'a girl asleep in bed hugging a teddy bear, soft moonlight through the window',
  'hello:well-done': `${GIRL} clapping her hands and cheering`,
  'hello:love-you': 'a mother hugging her young daughter, both smiling, eyes closed',

  // My Family
  'family:mum': 'a smiling mother in her thirties, head and shoulders portrait',
  'family:dad': 'a smiling father in his thirties, head and shoulders portrait',
  'family:big-sister': 'a smiling teenage girl with her arm around her little sister',
  'family:big-brother': 'a smiling teenage boy with his arm around his little sister',
  'family:little-brother-or-sister': 'a happy toddler sitting on the floor with toy blocks',
  'family:child': 'a happy child playing in a park',
  'family:grandma': 'a smiling grandmother with grey hair',
  'family:grandpa': 'a smiling grandfather with grey hair',
  'family:family': 'a happy family of four, mother, father and two children, sitting together on a sofa',
  'family:friend': 'two seven-year-old girls laughing together, best friends',
  'family:teacher': 'a friendly Thai teacher standing in front of a classroom blackboard, holding a book',
  'family:me-a-child-talking': `${GIRL} pointing at herself with a happy face`,

  // Pets & Farm
  'farm:cat': 'a cute cat sitting',
  'farm:dog': 'a friendly dog sitting',
  'farm:chicken': 'a single hen standing on grass, whole body visible',
  'farm:duck': 'a white duck',
  'farm:pig': 'a pink pig on a farm',
  'farm:cow': 'a cow in a green field',
  'farm:horse': 'a brown horse in a field',
  'farm:goat': 'a goat',
  'farm:sheep': 'a fluffy sheep',
  'farm:rabbit': 'a fluffy rabbit',
  'farm:mouse': 'a small grey mouse',
  'farm:fish': 'a goldfish in a bowl',

  // Little Words
  'little-words:good': `${BOY} giving a big thumbs up`,
  'little-words:not-good': `${BOY} giving a thumbs down with a frown`,
  'little-words:like': `${GIRL} happily licking an ice lolly, eyes closed in delight`,
  'little-words:dont-like': 'a child pushing away a plate of broccoli with a disgusted face',
  'little-words:can-okay': `${GIRL} making an OK sign with her fingers, smiling`,
  'little-words:cant': `${BOY} holding up his palm in a firm stop gesture`,
  'little-words:again-more': `${BOY} holding up an empty bowl, asking for more`,
  'little-words:all-gone': 'an empty plate with a few crumbs and a fork, on a table',
  'little-words:help': 'a small girl on tiptoe trying to reach a toy on a high shelf, calling for help',
  'little-words:what': `${GIRL} with a puzzled face, one finger on her chin, eyebrows raised`,
  'little-words:where': `${BOY} searching with a big magnifying glass`,
  'little-words:how-much': 'a hand holding a small price tag next to mangoes at a Thai market stall',

  // Yummy Food
  'food:rice': 'a bowl of steamed white jasmine rice',
  'food:egg': 'three eggs in a small basket',
  'food:fried-egg': 'a fried egg with crispy edges, sunny side up, on a plate',
  'food:bread': 'a loaf of bread with a few slices cut',
  'food:noodle-soup': 'a bowl of Thai noodle soup with meatballs, bean sprouts and herbs',
  'food:fried-chicken': 'crispy fried chicken pieces on a plate',
  'food:sausage': 'grilled sausages on a plate',
  'food:tom-yum-soup': 'a bowl of Thai tom yum soup with prawns, lemongrass, mushrooms and chillies',
  'food:curry': 'a bowl of Thai green curry with a plate of rice beside it',
  'food:pizza': 'a whole pizza',
  'food:burger': 'a burger',
  'food:chips-fries': 'french fries in a paper cone',
  'food:meatball-skewer': 'Thai grilled meatball skewers on bamboo sticks',

  // Fruit
  'fruit:banana': 'a bunch of bananas',
  'fruit:mango': 'a ripe yellow mango, with one cut open',
  'fruit:watermelon': 'a slice of watermelon',
  'fruit:orange': 'an orange fruit with a leaf',
  'fruit:apple': 'a red apple',
  'fruit:grapes': 'a bunch of purple grapes',
  'fruit:pineapple': 'a pineapple',
  'fruit:coconut': 'a fresh green coconut with a straw, Thai style',
  'fruit:strawberry': 'strawberries',
  'fruit:lime': 'green limes, one cut in half',
  'fruit:cherry': 'a pair of red cherries',
  'fruit:durian': 'a spiky durian fruit with one cut open showing yellow flesh',

  // My Body
  'body:head': 'a smiling child\'s head and shoulders, front view',
  'body:eye': 'close-up of a child\'s eye',
  'body:ear': 'close-up of a child\'s ear',
  'body:nose': 'close-up of a child\'s nose',
  'body:mouth': 'close-up of a child\'s smiling mouth',
  'body:teeth': 'close-up of a child\'s big toothy smile',
  'body:hand': 'a child\'s open hand, palm facing the camera',
  'body:finger': 'a child\'s hand pointing one finger up',
  'body:arm': 'a child flexing an arm to show a muscle',
  'body:leg': 'a child standing on one leg, legs in shorts, from the waist down',
  'body:foot': 'a child\'s bare foot on grass',
  'body:hair': 'a girl with long shiny black hair, seen from behind',

  // Magic & Make-Believe
  'magic:dinosaur': 'a friendly green T-rex dinosaur in a jungle, cartoonishly cute but realistic',
  'magic:dragon': 'a friendly little green dragon with small wings sitting on a rock',
  'magic:unicorn': 'a white unicorn with a rainbow mane in a flowery meadow',
  'magic:mermaid': `${GIRL} in a sparkly mermaid-tail costume sitting on the sand at the beach`,
  'magic:fairy': `${GIRL} in a fairy costume with glittery wings in a garden`,
  'magic:princess': `${GIRL} wearing a princess dress and a tiara`,
  'magic:ghost': 'a child in a white bedsheet ghost costume with two eye holes, cute, Halloween',
  'magic:robot': 'a friendly toy robot',
  'magic:witch': `${GIRL} in a witch costume with a pointy black hat and a broom`,
  'magic:castle': 'a fairytale castle with towers on a hill',
  'magic:superhero': `${GIRL} in a red superhero cape and mask, hands on hips`,
  'magic:magic-wand': 'a sparkly magic wand with a star on the tip, glitter in the air',

  // Feelings
  'feelings:happy': `${GIRL} laughing happily`,
  'feelings:sad': `${GIRL} in a school uniform with a disappointed pout, looking down at an ice cream cone she dropped on the pavement`,
  'feelings:angry': `${BOY} with an angry face, arms crossed`,
  'feelings:scared': `${GIRL} looking scared, hands on her cheeks`,
  'feelings:surprised': `${BOY} looking surprised, mouth open in an O, eyebrows up`,
  'feelings:tired': `${BOY} looking tired and sweaty after football, slumped on a bench`,
  'feelings:sleepy': `${GIRL} yawning sleepily in pyjamas`,
  'feelings:hungry': `${BOY} holding his tummy, looking hungry at an empty table`,
  'feelings:sick': 'a child wrapped in a cosy blanket on a sofa, blowing their nose into a tissue, a cup of warm tea beside them',
  'feelings:hot': `${GIRL} on a very hot sunny day, sweating and fanning herself`,
  'feelings:cold': `${GIRL} shivering in a scarf and woolly hat in the snow`,
  'feelings:funny': 'two children laughing hard at something funny',
  'feelings:shy': `${GIRL} looking shy, peeking out from behind her hands`,

  // Doing Things
  'actions-1:eat': `${GIRL} eating noodles with chopsticks`,
  'actions-1:drink': `${BOY} drinking a glass of water`,
  'actions-1:sleep': `${BOY} sleeping peacefully in bed`,
  'actions-1:run': `${GIRL} running fast in a park`,
  'actions-1:walk': `${BOY} walking along a path`,
  'actions-1:swim': `${GIRL} swimming in a pool with goggles`,
  'actions-1:play': 'children playing together with toys on a rug',
  'actions-1:sing': `${GIRL} singing into a toy microphone`,
  'actions-1:dance': `${GIRL} dancing happily`,
  'actions-1:cry': 'a young woman crying, tears rolling down her cheeks, holding a tissue',
  'actions-1:laugh': `${BOY} laughing out loud`,
  'actions-1:look-watch': `${GIRL} looking through binoculars`,

  // Snacks & Drinks
  'snacks:water': 'a glass of water',
  'snacks:milk': 'a glass of milk',
  'snacks:orange-juice': 'a glass of orange juice beside an orange',
  'snacks:bubble-tea': 'a cup of Thai milk tea with tapioca pearls and a wide straw',
  'snacks:ice': 'ice cubes',
  'snacks:ice-cream': 'an ice cream cone',
  'snacks:cake': 'a slice of strawberry cake on a plate',
  'snacks:cookie': 'chocolate chip cookies',
  'snacks:chocolate': 'a bar of chocolate broken into pieces',
  'snacks:sweets-candy': 'a pile of colourful wrapped sweets',
  'snacks:doughnut': 'a pink doughnut with sprinkles',
  'snacks:popcorn': 'a striped bucket of popcorn',

  // At Home
  'home:house': 'a pretty house with a garden',
  'home:door': 'a wooden front door',
  'home:window': 'a window with open curtains',
  'home:bed': 'a child\'s bed with a colourful duvet',
  'home:chair': 'a wooden chair',
  'home:table': 'a wooden table',
  'home:bathroom-toilet': 'a clean bright bathroom with a toilet',
  'home:tv': 'a television in a living room',
  'home:phone': 'a smartphone',
  'home:clock': 'a round wall clock',
  'home:toothbrush': 'a toothbrush with toothpaste',
  'home:key': 'a house key',

  // Wild Animals
  'wild:elephant': 'an Asian elephant',
  'wild:monkey': 'a monkey sitting in a tree',
  'wild:tiger': 'a tiger',
  'wild:lion': 'a lion',
  'wild:bear': 'a brown bear',
  'wild:giraffe': 'a giraffe',
  'wild:zebra': 'a zebra',
  'wild:snake': 'a green snake on a branch',
  'wild:crocodile': 'a crocodile by a river',
  'wild:parrot': 'a colourful parrot',
  'wild:turtle': 'a turtle',
  'wild:hippo': 'a hippopotamus',
  'wild:kangaroo': 'a kangaroo',
  'wild:panda': 'a giant panda eating bamboo',

  // Toys & Play
  'toys:ball': 'a colourful ball',
  'toys:teddy-bear': 'a teddy bear',
  'toys:doll': 'a doll',
  'toys:balloon': 'a bunch of colourful balloons',
  'toys:kite': 'a colourful kite flying in a blue sky',
  'toys:building-blocks': 'a stack of colourful toy building blocks',
  'toys:video-game': 'a game controller',
  'toys:jigsaw-puzzle': 'colourful jigsaw puzzle pieces',
  'toys:dice': 'two dice',
  'toys:crayons': 'a box of crayons',
  'toys:bubbles': `${GIRL} blowing soap bubbles`,
  'toys:swing': 'a child on a playground swing',

  // Clothes
  'clothes:shirt-top': 'a child\'s t-shirt laid flat',
  'clothes:trousers': 'a pair of children\'s jeans laid flat',
  'clothes:dress': 'a girl\'s summer dress on a hanger',
  'clothes:shoes': 'a pair of children\'s trainers',
  'clothes:hat': 'a straw sun hat',
  'clothes:socks': 'a pair of colourful socks',
  'clothes:gloves': 'a pair of woolly gloves',
  'clothes:glasses': 'a pair of glasses',
  'clothes:swimsuit': 'a child\'s swimsuit',
  'clothes:jumper-coat': 'a child\'s warm winter coat',
  'clothes:bag': 'a child\'s school backpack',
  'clothes:crown': 'a sparkly tiara crown',

  // Things I Can Say
  'phrases:my-name-is-sofia': `${GIRL} waving hello and pointing to a blank name sticker on her shirt`,
  'phrases:im-seven-years-old': 'a birthday cake with seven lit candles',
  'phrases:im-hungry': `${GIRL} holding an empty plate and a fork, looking hungry`,
  'phrases:very-yummy': `${GIRL} eating Thai mango sticky rice with a delighted face`,
  'phrases:may-i-go-to-the-toilet': `${GIRL} raising her hand in a classroom`,
  'phrases:i-dont-understand': `${GIRL} shrugging with a puzzled face, palms up`,
  'phrases:lets-go-and-play': 'two children running happily towards a playground',
  'phrases:can-i-have-more-please': `${GIRL} holding out her empty bowl to her mother`,
  'phrases:yes-please': `${GIRL} happily taking a plate of fruit with both hands`,
  'phrases:no-thank-you': `${GIRL} politely shaking her head and holding up a hand to refuse a plate of food`,
  'phrases:so-cute': 'a fluffy puppy with big eyes',
  'phrases:see-you-tomorrow': 'children waving goodbye to each other at the school gate',

  // Things That Go
  'go:car': 'a small red car',
  'go:bus': 'a city bus in Bangkok',
  'go:train': 'a train',
  'go:aeroplane': 'an aeroplane flying in a blue sky',
  'go:boat': 'a colourful Thai longtail boat on clear water',
  'go:bicycle': 'a bicycle',
  'go:motorbike': 'a scooter motorbike',
  'go:tuk-tuk': 'a colourful tuk-tuk on a Bangkok street',
  'go:taxi': 'a pink taxi in Bangkok',
  'go:fire-engine': 'a red fire engine',
  'go:ambulance': 'an ambulance',
  'go:rocket': 'a rocket launching into the sky',
  'go:helicopter': 'a helicopter flying',

  // Bugs & Birds
  'bugs:bird': 'a small colourful bird on a branch',
  'bugs:owl': 'an owl',
  'bugs:penguin': 'a penguin',
  'bugs:peacock': 'a peacock with its tail spread',
  'bugs:butterfly': 'a butterfly on a flower',
  'bugs:bee': 'a bee on a flower',
  'bugs:ant': 'an ant, close-up',
  'bugs:spider': 'a spider in its web',
  'bugs:frog': 'a green frog',
  'bugs:snail': 'a snail on a leaf',
  'bugs:ladybird': 'a ladybird on a leaf',
  'bugs:caterpillar': 'a green caterpillar on a leaf',
  'bugs:mosquito': 'a mosquito, close-up',

  // More Doing Things
  'actions-2:listen': `${GIRL} listening to music with headphones`,
  'actions-2:draw': `${BOY} drawing a picture with crayons`,
  'actions-2:have-a-bath': 'a child in a bubble bath with a rubber duck',
  'actions-2:hug': 'two children hugging',
  'actions-2:ride-a-bike': `${GIRL} riding a bicycle with a helmet on`,
  'actions-2:read': `${GIRL} reading a book`,
  'actions-2:write': `${BOY} writing in a notebook with a pencil`,
  'actions-2:climb': 'a child climbing a climbing wall',
  'actions-2:think': `${BOY} thinking hard, looking up, hand on chin`,
  'actions-2:smile': `${GIRL} with a big beaming smile`,
  'actions-2:hide': 'a child hiding behind a curtain, peeking out',
  'actions-2:wake-up': `${GIRL} waking up and stretching in bed in the morning sun`,

  // School
  'school:school': 'a Thai school building with a flag pole and a playground',
  'school:book': 'a stack of colourful books',
  'school:pencil': 'a yellow pencil',
  'school:pen': 'a pen',
  'school:rubber-eraser': 'a pink rubber eraser',
  'school:scissors': 'a pair of children\'s scissors',
  'school:ruler': 'a ruler',
  'school:paper': 'a stack of white paper',
  'school:paintbrush': 'a paintbrush with paint on it',
  'school:computer': 'a laptop computer',
  'school:student': `${GIRL} in a Thai school uniform with a backpack`,
  'school:homework': `${BOY} doing homework at a desk`,

  // Places
  'places:hospital': 'a hospital building',
  'places:temple': 'a golden Thai temple with a pointed roof',
  'places:market': 'a busy Thai market with fruit stalls',
  'places:shop': 'a small shop front full of goods',
  'places:shopping-mall': 'inside a big bright shopping mall',
  'places:theme-park': 'a theme park with a big ferris wheel',
  'places:zoo': 'a zoo with giraffes behind a fence and visitors watching',
  'places:airport': 'an airport terminal with a plane outside the window',
  'places:playground': 'a colourful playground with a slide',
  'places:beach': 'a tropical beach in Thailand with palm trees',
  'places:restaurant': 'a cosy restaurant with tables',
  'places:library': 'a library with tall bookshelves',

  // Vegetables
  'veggies:vegetables': 'a basket of fresh vegetables',
  'veggies:carrot': 'carrots',
  'veggies:corn': 'a corn cob',
  'veggies:tomato': 'a red tomato',
  'veggies:cucumber': 'a cucumber',
  'veggies:mushroom': 'mushrooms',
  'veggies:chilli': 'red chillies',
  'veggies:onion': 'an onion',
  'veggies:garlic': 'a garlic bulb',
  'veggies:potato': 'potatoes',
  'veggies:broccoli': 'broccoli',
  'veggies:beans-nuts': 'peanuts in their shells',

  // Under the Sea
  'sea:sea': 'blue ocean waves',
  'sea:whale': 'a whale swimming underwater',
  'sea:dolphin': 'a dolphin jumping out of the sea',
  'sea:shark': 'a shark swimming underwater',
  'sea:octopus': 'an octopus underwater',
  'sea:crab': 'a red crab on the sand',
  'sea:prawn': 'a prawn',
  'sea:seashell': 'a seashell on the beach',
  'sea:seal': 'a seal lying on a rock',
  'sea:pufferfish': 'a puffed-up pufferfish underwater',
  'sea:clownfish': 'an orange and white clownfish in an anemone',
  'sea:jellyfish': 'a glowing jellyfish underwater',

  // Sky & Weather
  'sky:sun': 'the bright sun in a blue sky',
  'sky:moon': 'a full moon in a dark night sky',
  'sky:star': 'a sky full of twinkling stars',
  'sky:cloud': 'a fluffy white cloud in a blue sky',
  'sky:rain': 'rain falling, big raindrops splashing in a puddle',
  'sky:thunder': 'a dark thunderstorm with heavy clouds',
  'sky:lightning': 'a lightning bolt in a stormy sky',
  'sky:snow': 'snow falling on pine trees',
  'sky:wind': 'trees bending in a strong wind, leaves blowing',
  'sky:rainbow': 'a rainbow over green hills',
  'sky:umbrella': 'a colourful open umbrella',
  'sky:the-earth': 'planet Earth seen from space',

  // Nature
  'nature:tree': 'a big green tree',
  'nature:flower': 'a colourful flower',
  'nature:leaf': 'a green leaf',
  'nature:mountain': 'a mountain',
  'nature:volcano': 'a volcano with smoke rising',
  'nature:fire': 'a campfire',
  'nature:rock': 'a pile of rocks',
  'nature:desert': 'a sandy desert with dunes',
  'nature:island': 'a small tropical island in Thailand',
  'nature:forest': 'a lush green jungle forest',
  'nature:river': 'a river flowing through green land',
  'nature:waterfall': 'a waterfall in the jungle',

  // Jobs
  'jobs:doctor': 'a friendly doctor with a stethoscope',
  'jobs:dentist': 'a friendly dentist holding a tooth mirror',
  'jobs:police-officer': 'a friendly Thai police officer in uniform',
  'jobs:firefighter': 'a firefighter in uniform and helmet',
  'jobs:pilot': 'an airline pilot in uniform',
  'jobs:farmer': 'a Thai rice farmer in a straw hat in a green rice field',
  'jobs:chef': 'a chef in a white hat cooking',
  'jobs:astronaut': 'an astronaut in a space suit',
  'jobs:singer': 'a singer singing on a stage',
  'jobs:artist': 'an artist painting at an easel',
  'jobs:scientist': 'a scientist in a lab coat with a test tube',
  'jobs:mechanic': 'a mechanic fixing a car',

  // Parties & Festivals
  'party:birthday': 'a child\'s birthday party with a cake and balloons',
  'party:present': 'a wrapped present with a big bow',
  'party:party': 'party decorations, streamers and confetti',
  'party:candle': 'lit candles',
  'party:fireworks': 'colourful fireworks in the night sky',
  'party:song': 'sheet music on a music stand',
  'party:drum': 'a drum',
  'party:guitar': 'a guitar',
  'party:piano': 'a piano',
  'party:pumpkin': 'a carved Halloween pumpkin lantern',
  'party:songkran': 'children laughing and splashing water at the Songkran festival in Thailand',
  'party:loy-krathong': 'a small krathong, a banana-leaf lotus boat with a candle and flowers, floating on a river at night',
};

/** The full prompt for a word. */
export function promptFor(word) {
  const subject = PROMPTS[word.id] || word.q || `a ${word.en}`;
  return `${STYLE}\nSubject: ${subject}.`;
}
