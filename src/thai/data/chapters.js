/**
 * Every word and phrase in the Thai app, grouped into chapters.
 *
 * This file is the single source of truth. The audio script, the photo
 * script, the data checks and thai/VOCABULARY.md are all generated from it,
 * so a word added here flows everywhere.
 *
 * Each entry:
 *   th    Thai script, exactly as it should be spoken by the voice
 *   rom   pronunciation (see ROMANISATION below)
 *   en    English meaning, short enough for a card
 *   q     optional photo-search query, when the English alone would find the
 *         wrong picture (abstract words, Thai-specific things)
 *   fact  optional one-line "did you know", mostly literal meanings, which
 *         kids love and which genuinely help memory
 *
 * Phrases are written the way a girl says them: ค่ะ (kâ) ends a statement,
 * คะ (ká) ends a question, and a child calls herself หนู (nǒo).
 *
 * Chapter order mixes "most useful first" with something fun every few
 * chapters, so the path never turns into a chore.
 */

/**
 * ROMANISATION — simplified Paiboon-style, chosen to read naturally for an
 * English speaker while still marking tones.
 *
 *   Tones on the first vowel letter:  mid (none)  low à  falling â  high á  rising ǎ
 *   Consonants:  g ก   k ข ค   j จ   ch ฉ ช   d ด   dt ต   t ถ ท   b บ   bp ป   p ผ พ
 *   Vowels:      a aa   i ee   ue (ึ ื)   u oo   e   ae (แ)   o (short)   oh (โ)
 *                aw (อ)   oe (เ-อ)   ia   uea   ua   ai   ao   am   oi   aai   aao   iw
 *
 * Avoids RTGS "ph/th/kh", which English readers say wrong (as in "Phuket").
 */

export const ROMANISATION_NOTE =
  'Tone marks: none = mid, à = low, â = falling, á = high, ǎ = rising.';

const w = (th, rom, en, extra = {}) => ({ th, rom, en, ...extra });

export const LANDS = [
  { id: 1, name: 'First Steps', th: 'ก้าวแรก', color: '#f4b942' },
  { id: 2, name: 'Count & Colour', th: 'นับและสี', color: '#ef6f6c' },
  { id: 3, name: 'My Day', th: 'วันของหนู', color: '#56a3a6' },
  { id: 4, name: 'Out & About', th: 'ไปเที่ยว', color: '#7c6fd6' },
  { id: 5, name: 'Big Wide World', th: 'โลกกว้าง', color: '#4caf7a' },
  { id: 6, name: 'Wonder World', th: 'โลกมหัศจรรย์', color: '#e86fa8' },
];

export const CHAPTERS = [
  // ───────────────────────────── Land 1: First Steps ─────────────────────────────
  {
    id: 'hello', land: 1, title: 'Hello!', th: 'สวัสดี',
    words: [
      w('สวัสดีค่ะ', 'sà-wàt-dee kâ', 'hello', { q: 'thai wai greeting', fact: 'Girls end with ค่ะ (kâ). Boys say ครับ (kráp).' }),
      w('ขอบคุณค่ะ', 'kàwp-kun kâ', 'thank you', { q: 'child saying thank you receiving gift' }),
      w('ขอโทษค่ะ', 'kǎw-tôht kâ', 'sorry', { q: 'child apologizing' }),
      w('ไม่เป็นไร', 'mâi-bpen-rai', "it's okay", { q: 'smiling woman reassuring', fact: 'Thai people say this all the time. It means "it\'s nothing".' }),
      w('ใช่', 'châi', 'yes', { q: 'child nodding yes thumbs up' }),
      w('ไม่ใช่', 'mâi châi', 'no', { q: 'child shaking head no' }),
      w('บ๊ายบาย', 'báai-baai', 'bye-bye', { q: 'child waving goodbye' }),
      w('สบายดีไหมคะ', 'sà-baai-dee mǎi ká', 'how are you?', { q: 'friends greeting each other smiling', fact: 'In a question, girls say คะ (ká). The tone goes up!' }),
      w('สบายดีค่ะ', 'sà-baai-dee kâ', "I'm fine", { q: 'happy girl smiling' }),
      w('ฝันดีนะ', 'fǎn-dee ná', 'sweet dreams', { q: 'child sleeping in bed', fact: 'Word by word: "dream good".' }),
      w('เก่งมาก', 'gèng mâak', 'well done!', { q: 'child clapping hands' }),
      w('รักนะ', 'rák ná', 'love you', { q: 'parent hugging child' }),
    ],
  },
  {
    id: 'family', land: 1, title: 'My Family', th: 'ครอบครัว',
    words: [
      w('แม่', 'mâe', 'mum', { q: 'mother portrait smiling' }),
      w('พ่อ', 'pâw', 'dad', { q: 'father portrait smiling' }),
      w('พี่สาว', 'pêe-sǎao', 'big sister', { q: 'teenage girl portrait' }),
      w('พี่ชาย', 'pêe-chaai', 'big brother', { q: 'teenage boy portrait' }),
      w('น้อง', 'náwng', 'little brother or sister', { q: 'toddler smiling' }),
      w('เด็ก', 'dèk', 'child', { q: 'child playing' }),
      w('คุณยาย', 'kun-yaai', 'grandma', { q: 'grandmother smiling' }),
      w('คุณตา', 'kun-dtaa', 'grandpa', { q: 'grandfather smiling', fact: 'ตา also means "eye"!' }),
      w('ครอบครัว', 'krâwp-krua', 'family', { q: 'family portrait' }),
      w('เพื่อน', 'pûean', 'friend', { q: 'two girls best friends' }),
      w('ครู', 'kroo', 'teacher', { q: 'teacher in classroom' }),
      w('หนู', 'nǒo', 'me (a child talking)', { q: 'girl pointing at herself', fact: 'Thai kids call themselves หนู. It also means "mouse"!' }),
    ],
  },
  {
    id: 'farm', land: 1, title: 'Pets & Farm', th: 'สัตว์เลี้ยง',
    words: [
      w('แมว', 'maew', 'cat'),
      w('หมา', 'mǎa', 'dog'),
      w('ไก่', 'gài', 'chicken', { q: 'chicken hen' }),
      w('เป็ด', 'bpèt', 'duck'),
      w('หมู', 'mǒo', 'pig'),
      w('วัว', 'wua', 'cow'),
      w('ม้า', 'máa', 'horse', { fact: 'Careful! หมา (mǎa) is dog, ม้า (máa) is horse.' }),
      w('แพะ', 'páe', 'goat'),
      w('แกะ', 'gàe', 'sheep'),
      w('กระต่าย', 'grà-dtàai', 'rabbit'),
      w('หนู', 'nǒo', 'mouse', { fact: 'Same word as "me" when a child is talking!' }),
      w('ปลา', 'bplaa', 'fish', { q: 'goldfish' }),
    ],
  },
  {
    id: 'little-words', land: 1, title: 'Little Words', th: 'คำเล็กๆ',
    words: [
      w('ดี', 'dee', 'good', { q: 'thumbs up' }),
      w('ไม่ดี', 'mâi dee', 'not good', { q: 'thumbs down' }),
      w('ชอบ', 'châwp', 'like', { q: 'girl loves ice cream happy' }),
      w('ไม่ชอบ', 'mâi châwp', "don't like", { q: 'child refusing vegetables disgusted' }),
      w('ได้', 'dâai', 'can / okay', { q: 'ok hand sign' }),
      w('ไม่ได้', 'mâi dâai', "can't", { q: 'stop hand gesture' }),
      w('อีก', 'èek', 'again / more', { q: 'child asking for more' }),
      w('หมดแล้ว', 'mòt láew', 'all gone', { q: 'empty plate' }),
      w('ช่วยด้วย', 'chûai dûai', 'help!', { q: 'child calling for help' }),
      w('อะไร', 'à-rai', 'what?', { q: 'confused child question' }),
      w('ที่ไหน', 'têe-nǎi', 'where?', { q: 'child searching with magnifying glass' }),
      w('เท่าไหร่', 'tâo-rài', 'how much?', { q: 'price tag shopping market' }),
    ],
  },
  {
    id: 'food', land: 1, title: 'Yummy Food', th: 'อาหาร',
    words: [
      w('ข้าว', 'kâao', 'rice', { q: 'bowl of white rice', fact: 'ข้าว (kâao) is rice. ขาว (kǎao) is white. Listen to the tone!' }),
      w('ไข่', 'kài', 'egg', { q: 'eggs', fact: 'ไข่ (kài) egg and ไก่ (gài) chicken sound close. Which came first?' }),
      w('ไข่ดาว', 'kài-daao', 'fried egg', { q: 'fried egg sunny side up', fact: 'Word by word: "star egg"!' }),
      w('ขนมปัง', 'kà-nǒm-bpang', 'bread'),
      w('ก๋วยเตี๋ยว', 'gǔai-dtǐao', 'noodle soup', { q: 'thai noodle soup bowl' }),
      w('ไก่ทอด', 'gài-tâwt', 'fried chicken'),
      w('ไส้กรอก', 'sâi-gràwk', 'sausage'),
      w('ต้มยำ', 'dtôm-yam', 'tom yum soup', { q: 'tom yum soup' }),
      w('แกง', 'gaeng', 'curry', { q: 'thai curry bowl' }),
      w('พิซซ่า', 'pít-sâa', 'pizza'),
      w('แฮมเบอร์เกอร์', 'haem-boe-gôe', 'burger'),
      w('เฟรนช์ฟรายส์', 'fren-fraai', 'chips / fries', { q: 'french fries' }),
      w('ลูกชิ้น', 'lôok-chín', 'meatball skewer', { q: 'thai meatball skewers street food' }),
    ],
  },

  // ─────────────────────────── Land 2: Count & Colour ───────────────────────────
  {
    id: 'numbers', land: 2, title: 'Numbers 0–10', th: 'ตัวเลข',
    words: [
      w('ศูนย์', 'sǒon', 'zero', { n: 0 }),
      w('หนึ่ง', 'nùeng', 'one', { n: 1 }),
      w('สอง', 'sǎwng', 'two', { n: 2 }),
      w('สาม', 'sǎam', 'three', { n: 3 }),
      w('สี่', 'sèe', 'four', { n: 4 }),
      w('ห้า', 'hâa', 'five', { n: 5, fact: 'Thai people type 555 to laugh, because ห้า sounds like "ha"!' }),
      w('หก', 'hòk', 'six', { n: 6 }),
      w('เจ็ด', 'jèt', 'seven', { n: 7 }),
      w('แปด', 'bpàet', 'eight', { n: 8 }),
      w('เก้า', 'gâo', 'nine', { n: 9 }),
      w('สิบ', 'sìp', 'ten', { n: 10 }),
    ],
  },
  {
    id: 'colours', land: 2, title: 'Colours', th: 'สี',
    words: [
      w('สีแดง', 'sěe-daeng', 'red', { swatch: '#e53935' }),
      w('สีส้ม', 'sěe-sôm', 'orange', { swatch: '#fb8c00', id: 'orange-colour' }),
      w('สีเหลือง', 'sěe-lǔeang', 'yellow', { swatch: '#fdd835' }),
      w('สีเขียว', 'sěe-kǐao', 'green', { swatch: '#43a047' }),
      w('สีฟ้า', 'sěe-fáa', 'light blue', { swatch: '#4fc3f7', fact: 'Word by word: "sky colour".' }),
      w('สีน้ำเงิน', 'sěe-náam-ngoen', 'dark blue', { swatch: '#1e3a8a', fact: 'Thai has two blues: ฟ้า (sky) and น้ำเงิน (dark blue).' }),
      w('สีม่วง', 'sěe-mûang', 'purple', { swatch: '#8e24aa' }),
      w('สีชมพู', 'sěe-chom-poo', 'pink', { swatch: '#f48fb1' }),
      w('สีน้ำตาล', 'sěe-náam-dtaan', 'brown', { swatch: '#795548', fact: 'น้ำตาล also means "sugar". Brown is "sugar colour"!' }),
      w('สีดำ', 'sěe-dam', 'black', { swatch: '#212121' }),
      w('สีขาว', 'sěe-kǎao', 'white', { swatch: '#fafafa' }),
      w('สีเทา', 'sěe-tao', 'grey', { swatch: '#9e9e9e' }),
    ],
  },
  {
    id: 'fruit', land: 2, title: 'Fruit', th: 'ผลไม้',
    words: [
      w('กล้วย', 'glûai', 'banana'),
      w('มะม่วง', 'má-mûang', 'mango'),
      w('แตงโม', 'dtaeng-moh', 'watermelon'),
      w('ส้ม', 'sôm', 'orange', { q: 'orange fruit' }),
      w('แอปเปิ้ล', 'áep-bpôen', 'apple'),
      w('องุ่น', 'à-ngùn', 'grapes'),
      w('สับปะรด', 'sàp-bpà-rót', 'pineapple'),
      w('มะพร้าว', 'má-práao', 'coconut'),
      w('สตรอว์เบอร์รี่', 'sà-dtraw-boe-rêe', 'strawberry'),
      w('มะนาว', 'má-naao', 'lime'),
      w('เชอร์รี่', 'choe-rêe', 'cherry'),
      w('ทุเรียน', 'tú-rian', 'durian', { fact: 'The king of fruits. Very smelly, very Thai!' }),
    ],
  },
  {
    id: 'body', land: 2, title: 'My Body', th: 'ร่างกาย',
    words: [
      w('หัว', 'hǔa', 'head', { q: 'child head portrait' }),
      w('ตา', 'dtaa', 'eye', { q: 'child eye close up', fact: 'ตา also means "grandpa"!' }),
      w('หู', 'hǒo', 'ear', { q: 'child ear close up' }),
      w('จมูก', 'jà-mòok', 'nose', { q: 'nose close up' }),
      w('ปาก', 'bpàak', 'mouth', { q: 'smiling mouth close up' }),
      w('ฟัน', 'fan', 'teeth', { q: 'child teeth smile' }),
      w('มือ', 'mue', 'hand', { q: 'child hand palm' }),
      w('นิ้ว', 'níw', 'finger', { q: 'pointing finger' }),
      w('แขน', 'kǎen', 'arm', { q: 'child arm muscle flex' }),
      w('ขา', 'kǎa', 'leg', { q: 'child legs running' }),
      w('เท้า', 'táo', 'foot', { q: 'bare feet' }),
      w('ผม', 'pǒm', 'hair', { q: 'girl long hair' }),
    ],
  },
  {
    id: 'magic', land: 2, title: 'Magic & Make-Believe', th: 'โลกแห่งเวทมนตร์',
    words: [
      w('ไดโนเสาร์', 'dai-noh-sǎo', 'dinosaur', { q: 'dinosaur model t rex' }),
      w('มังกร', 'mang-gawn', 'dragon', { q: 'dragon statue' }),
      w('ยูนิคอร์น', 'yoo-ní-kawn', 'unicorn', { q: 'unicorn toy' }),
      w('นางเงือก', 'naang-ngûeak', 'mermaid', { q: 'mermaid costume' }),
      w('นางฟ้า', 'naang-fáa', 'fairy', { q: 'girl fairy costume wings', fact: 'Word by word: "sky lady".' }),
      w('เจ้าหญิง', 'jâo-yǐng', 'princess', { q: 'girl princess costume crown' }),
      w('ผี', 'pěe', 'ghost', { q: 'ghost costume sheet halloween' }),
      w('หุ่นยนต์', 'hùn-yon', 'robot', { q: 'toy robot' }),
      w('แม่มด', 'mâe-mót', 'witch', { q: 'child witch costume hat' }),
      w('ปราสาท', 'bpraa-sàat', 'castle'),
      w('ซูเปอร์ฮีโร่', 'soo-bpôe-hee-rôh', 'superhero', { q: 'child superhero cape' }),
      w('ไม้กายสิทธิ์', 'máai-gaai-yá-sìt', 'magic wand', { q: 'magic wand sparkles' }),
    ],
  },

  // ─────────────────────────────── Land 3: My Day ───────────────────────────────
  {
    id: 'feelings', land: 3, title: 'Feelings', th: 'ความรู้สึก',
    words: [
      w('ดีใจ', 'dee-jai', 'happy', { q: 'happy child laughing', fact: 'Word by word: "good heart". Lots of Thai feelings use ใจ (heart).' }),
      w('เสียใจ', 'sǐa-jai', 'sad', { q: 'sad child' }),
      w('โกรธ', 'gròht', 'angry', { q: 'angry child face' }),
      w('กลัว', 'glua', 'scared', { q: 'scared child' }),
      w('ตกใจ', 'dtòk-jai', 'surprised', { q: 'surprised child face', fact: 'Word by word: "heart falls"!' }),
      w('เหนื่อย', 'nùeai', 'tired', { q: 'tired child yawning after sport' }),
      w('ง่วง', 'ngûang', 'sleepy', { q: 'sleepy child yawning' }),
      w('หิว', 'hǐw', 'hungry', { q: 'hungry child waiting for food' }),
      w('ป่วย', 'bpùai', 'sick', { q: 'sick child in bed thermometer' }),
      w('ร้อน', 'ráwn', 'hot', { q: 'hot sunny day sweating' }),
      w('หนาว', 'nǎao', 'cold', { q: 'child cold winter shivering' }),
      w('ตลก', 'dtà-lòk', 'funny', { q: 'children laughing at something funny' }),
      w('เขิน', 'kǒen', 'shy', { q: 'shy girl hiding face' }),
    ],
  },
  {
    id: 'actions-1', land: 3, title: 'Doing Things', th: 'ทำอะไร',
    words: [
      w('กิน', 'gin', 'eat', { q: 'child eating' }),
      w('ดื่ม', 'dùem', 'drink', { q: 'child drinking water glass' }),
      w('นอน', 'nawn', 'sleep', { q: 'child sleeping' }),
      w('วิ่ง', 'wîng', 'run', { q: 'child running' }),
      w('เดิน', 'doen', 'walk', { q: 'child walking' }),
      w('ว่ายน้ำ', 'wâai-náam', 'swim', { q: 'child swimming pool' }),
      w('เล่น', 'lên', 'play', { q: 'children playing' }),
      w('ร้องเพลง', 'ráwng-pleng', 'sing', { q: 'girl singing microphone' }),
      w('เต้น', 'dtên', 'dance', { q: 'girl dancing' }),
      w('ร้องไห้', 'ráwng-hâi', 'cry', { q: 'child crying' }),
      w('หัวเราะ', 'hǔa-ráw', 'laugh', { q: 'child laughing' }),
      w('ดู', 'doo', 'look / watch', { q: 'child looking through binoculars' }),
    ],
  },
  {
    id: 'snacks', land: 3, title: 'Snacks & Drinks', th: 'ขนมและน้ำ',
    words: [
      w('น้ำ', 'náam', 'water', { q: 'glass of water' }),
      w('นม', 'nom', 'milk', { q: 'glass of milk' }),
      w('น้ำส้ม', 'náam-sôm', 'orange juice', { fact: 'Word by word: "orange water".' }),
      w('ชานมไข่มุก', 'chaa-nom kài-múk', 'bubble tea', { fact: 'Word by word: "pearl milk tea".' }),
      w('น้ำแข็ง', 'náam-kǎeng', 'ice', { q: 'ice cubes', fact: 'Word by word: "hard water"!' }),
      w('ไอติม', 'ai-dtim', 'ice cream', { q: 'ice cream cone' }),
      w('เค้ก', 'kék', 'cake', { q: 'slice of cake' }),
      w('คุกกี้', 'kúk-gêe', 'cookie', { q: 'chocolate chip cookies' }),
      w('ช็อกโกแลต', 'chók-goh-láet', 'chocolate', { q: 'chocolate bar' }),
      w('ลูกอม', 'lôok-om', 'sweets / candy', { q: 'colorful candy', fact: 'อม means "keep in your mouth".' }),
      w('โดนัท', 'doh-nát', 'doughnut', { q: 'donut sprinkles' }),
      w('ป๊อปคอร์น', 'bpáwp-kawn', 'popcorn'),
    ],
  },
  {
    id: 'home', land: 3, title: 'At Home', th: 'ที่บ้าน',
    words: [
      w('บ้าน', 'bâan', 'house', { q: 'house exterior' }),
      w('ประตู', 'bprà-dtoo', 'door', { q: 'front door' }),
      w('หน้าต่าง', 'nâa-dtàang', 'window'),
      w('เตียง', 'dtiang', 'bed', { q: 'kids bed bedroom' }),
      w('เก้าอี้', 'gâo-êe', 'chair', { q: 'wooden chair' }),
      w('โต๊ะ', 'dtó', 'table', { q: 'wooden table' }),
      w('ห้องน้ำ', 'hâwng-náam', 'bathroom / toilet', { q: 'bathroom toilet', fact: 'Word by word: "water room".' }),
      w('ทีวี', 'tee-wee', 'TV', { q: 'television living room' }),
      w('โทรศัพท์', 'toh-rá-sàp', 'phone', { q: 'smartphone' }),
      w('นาฬิกา', 'naa-lí-gaa', 'clock', { q: 'wall clock' }),
      w('แปรงสีฟัน', 'bpraeng-sěe-fan', 'toothbrush'),
      w('กุญแจ', 'gun-jae', 'key', { q: 'house key' }),
    ],
  },
  {
    id: 'wild', land: 3, title: 'Wild Animals', th: 'สัตว์ป่า',
    words: [
      w('ช้าง', 'cháang', 'elephant', { q: 'asian elephant', fact: 'The elephant is the national animal of Thailand.' }),
      w('ลิง', 'ling', 'monkey'),
      w('เสือ', 'sǔea', 'tiger', { fact: 'เสือ (sǔea) tiger, เสื้อ (sûea) shirt. Only the tone is different!' }),
      w('สิงโต', 'sǐng-dtoh', 'lion'),
      w('หมี', 'měe', 'bear'),
      w('ยีราฟ', 'yee-râap', 'giraffe'),
      w('ม้าลาย', 'máa-laai', 'zebra', { fact: 'Word by word: "stripy horse".' }),
      w('งู', 'ngoo', 'snake'),
      w('จระเข้', 'jaw-rá-kê', 'crocodile'),
      w('นกแก้ว', 'nók-gâew', 'parrot'),
      w('เต่า', 'dtào', 'turtle'),
      w('ฮิปโป', 'híp-bpoh', 'hippo', { q: 'hippopotamus' }),
      w('จิงโจ้', 'jing-jôh', 'kangaroo'),
      w('แพนด้า', 'paen-dâa', 'panda', { q: 'giant panda' }),
    ],
  },

  // ───────────────────────────── Land 4: Out & About ────────────────────────────
  {
    id: 'toys', land: 4, title: 'Toys & Play', th: 'ของเล่น',
    words: [
      w('ลูกบอล', 'lôok-bawn', 'ball', { q: 'colorful ball' }),
      w('ตุ๊กตาหมี', 'dtúk-gà-dtaa-měe', 'teddy bear', { fact: 'Word by word: "bear doll".' }),
      w('ตุ๊กตา', 'dtúk-gà-dtaa', 'doll'),
      w('ลูกโป่ง', 'lôok-bpòhng', 'balloon', { q: 'balloons' }),
      w('ว่าว', 'wâao', 'kite', { q: 'kite flying sky' }),
      w('ตัวต่อ', 'dtua-dtàw', 'building blocks', { q: 'toy building blocks' }),
      w('เกม', 'gem', 'video game', { q: 'game controller' }),
      w('จิ๊กซอว์', 'jík-saw', 'jigsaw puzzle', { q: 'jigsaw puzzle pieces' }),
      w('ลูกเต๋า', 'lôok-dtǎo', 'dice'),
      w('สีเทียน', 'sěe-tian', 'crayons', { fact: 'Word by word: "candle colour".' }),
      w('ฟองสบู่', 'fawng-sà-bòo', 'bubbles', { q: 'child blowing soap bubbles' }),
      w('ชิงช้า', 'ching-cháa', 'swing', { q: 'child on swing playground' }),
    ],
  },
  {
    id: 'clothes', land: 4, title: 'Clothes', th: 'เสื้อผ้า',
    words: [
      w('เสื้อ', 'sûea', 'shirt / top', { q: 't-shirt' }),
      w('กางเกง', 'gaang-geng', 'trousers', { q: 'jeans trousers' }),
      w('ชุดกระโปรง', 'chút-grà-bprohng', 'dress', { q: 'girls dress' }),
      w('รองเท้า', 'rawng-táo', 'shoes', { q: 'kids sneakers' }),
      w('หมวก', 'mùak', 'hat', { q: 'sun hat' }),
      w('ถุงเท้า', 'tǔng-táo', 'socks', { q: 'colorful socks', fact: 'Word by word: "foot bag".' }),
      w('ถุงมือ', 'tǔng-mue', 'gloves', { fact: 'Word by word: "hand bag"!' }),
      w('แว่นตา', 'wâen-dtaa', 'glasses', { q: 'eyeglasses' }),
      w('ชุดว่ายน้ำ', 'chút-wâai-náam', 'swimsuit'),
      w('เสื้อกันหนาว', 'sûea-gan-nǎao', 'jumper / coat', { q: 'winter jacket', fact: 'Word by word: "shirt that stops cold".' }),
      w('กระเป๋า', 'grà-bpǎo', 'bag', { q: 'school backpack' }),
      w('มงกุฎ', 'mong-gùt', 'crown', { q: 'tiara crown' }),
    ],
  },
  {
    id: 'phrases', land: 4, title: 'Things I Can Say', th: 'หนูพูดได้',
    words: [
      w('หนูชื่อโซเฟียค่ะ', 'nǒo chûe Soh-fia kâ', 'My name is Sofia.', { q: 'name tag sticker' }),
      w('หนูอายุเจ็ดขวบค่ะ', 'nǒo aa-yú jèt kùap kâ', "I'm seven years old.", { q: 'birthday cake candles number seven' }),
      w('หนูหิวแล้วค่ะ', 'nǒo hǐw láew kâ', "I'm hungry.", { q: 'child holding empty plate fork' }),
      w('อร่อยมาก', 'à-ròi mâak', 'very yummy!', { q: 'child enjoying food delicious' }),
      w('ไปห้องน้ำได้ไหมคะ', 'bpai hâwng-náam dâai mǎi ká', 'May I go to the toilet?', { q: 'toilet sign' }),
      w('หนูไม่เข้าใจค่ะ', 'nǒo mâi kâo-jai kâ', "I don't understand.", { q: 'confused girl shrugging' }),
      w('ไปเล่นกันเถอะ', 'bpai lên gan tòe', "Let's go and play!", { q: 'kids running to playground' }),
      w('ขออีกได้ไหมคะ', 'kǎw èek dâai mǎi ká', 'Can I have more, please?', { q: 'child holding out bowl' }),
      w('เอาค่ะ', 'ao kâ', 'Yes, please.', { q: 'child accepting a gift happily' }),
      w('ไม่เอาค่ะ', 'mâi ao kâ', 'No, thank you.', { q: 'child politely refusing food' }),
      w('น่ารักจัง', 'nâa-rák jang', 'So cute!', { q: 'cute puppy' }),
      w('เจอกันพรุ่งนี้', 'joe gan prûng-née', 'See you tomorrow!', { q: 'kids waving goodbye after school' }),
    ],
  },
  {
    id: 'go', land: 4, title: 'Things That Go', th: 'ยานพาหนะ',
    words: [
      w('รถ', 'rót', 'car'),
      w('รถเมล์', 'rót-me', 'bus', { q: 'city bus' }),
      w('รถไฟ', 'rót-fai', 'train', { fact: 'Word by word: "fire car"!' }),
      w('เครื่องบิน', 'krûeang-bin', 'aeroplane', { q: 'airplane sky', fact: 'Word by word: "flying machine".' }),
      w('เรือ', 'ruea', 'boat', { q: 'longtail boat thailand' }),
      w('จักรยาน', 'jàk-grà-yaan', 'bicycle'),
      w('มอเตอร์ไซค์', 'maw-dtoe-sai', 'motorbike', { q: 'scooter motorbike' }),
      w('ตุ๊กตุ๊ก', 'dtúk-dtúk', 'tuk-tuk', { q: 'tuk tuk bangkok' }),
      w('แท็กซี่', 'táek-sêe', 'taxi', { q: 'bangkok taxi' }),
      w('รถดับเพลิง', 'rót-dàp-ploeng', 'fire engine', { q: 'fire truck' }),
      w('รถพยาบาล', 'rót-pá-yaa-baan', 'ambulance'),
      w('จรวด', 'jà-rùat', 'rocket', { q: 'rocket launch' }),
      w('เฮลิคอปเตอร์', 'he-lí-káwp-dtôe', 'helicopter'),
    ],
  },
  {
    id: 'bugs', land: 4, title: 'Bugs & Birds', th: 'แมลงและนก',
    words: [
      w('นก', 'nók', 'bird', { q: 'small bird' }),
      w('นกฮูก', 'nók-hôok', 'owl'),
      w('เพนกวิน', 'pen-gwin', 'penguin'),
      w('นกยูง', 'nók-yoong', 'peacock'),
      w('ผีเสื้อ', 'pěe-sûea', 'butterfly', { fact: 'Word by word: "ghost shirt"!' }),
      w('ผึ้ง', 'pûeng', 'bee'),
      w('มด', 'mót', 'ant'),
      w('แมงมุม', 'maeng-mum', 'spider'),
      w('กบ', 'gòp', 'frog'),
      w('หอยทาก', 'hǒi-tâak', 'snail'),
      w('เต่าทอง', 'dtào-tawng', 'ladybird', { q: 'ladybug', fact: 'Word by word: "golden turtle".' }),
      w('หนอน', 'nǎwn', 'caterpillar', { q: 'caterpillar' }),
      w('ยุง', 'yung', 'mosquito'),
    ],
  },

  // ─────────────────────────── Land 5: Big Wide World ───────────────────────────
  {
    id: 'actions-2', land: 5, title: 'More Doing Things', th: 'ทำอะไรอีก',
    words: [
      w('ฟัง', 'fang', 'listen', { q: 'child listening headphones' }),
      w('วาดรูป', 'wâat-rôop', 'draw', { q: 'child drawing' }),
      w('อาบน้ำ', 'àap-náam', 'have a bath', { q: 'child bath bubbles' }),
      w('กอด', 'gàwt', 'hug', { q: 'children hugging' }),
      w('ขี่จักรยาน', 'kèe-jàk-grà-yaan', 'ride a bike', { q: 'child riding bicycle' }),
      w('อ่านหนังสือ', 'àan-nǎng-sǔe', 'read', { q: 'child reading book' }),
      w('เขียน', 'kǐan', 'write', { q: 'child writing notebook' }),
      w('ปีน', 'bpeen', 'climb', { q: 'child climbing wall' }),
      w('คิด', 'kít', 'think', { q: 'child thinking' }),
      w('ยิ้ม', 'yím', 'smile', { q: 'child big smile' }),
      w('ซ่อน', 'sâwn', 'hide', { q: 'child hiding hide and seek' }),
      w('ตื่นนอน', 'dtùen-nawn', 'wake up', { q: 'child waking up stretching bed' }),
    ],
  },
  {
    id: 'school', land: 5, title: 'School', th: 'โรงเรียน',
    words: [
      w('โรงเรียน', 'rohng-rian', 'school', { q: 'school building' }),
      w('หนังสือ', 'nǎng-sǔe', 'book', { q: 'books' }),
      w('ดินสอ', 'din-sǎw', 'pencil'),
      w('ปากกา', 'bpàak-gaa', 'pen'),
      w('ยางลบ', 'yaang-lóp', 'rubber / eraser', { q: 'eraser' }),
      w('กรรไกร', 'gan-grai', 'scissors'),
      w('ไม้บรรทัด', 'máai-ban-tát', 'ruler'),
      w('กระดาษ', 'grà-dàat', 'paper', { q: 'sheets of paper' }),
      w('พู่กัน', 'pôo-gan', 'paintbrush'),
      w('คอมพิวเตอร์', 'kawm-piw-dtôe', 'computer', { q: 'laptop computer' }),
      w('นักเรียน', 'nák-rian', 'student', { q: 'thai school student uniform' }),
      w('การบ้าน', 'gaan-bâan', 'homework', { q: 'child doing homework', fact: 'Word by word: "house work"!' }),
    ],
  },
  {
    id: 'places', land: 5, title: 'Places', th: 'สถานที่',
    words: [
      w('โรงพยาบาล', 'rohng-pá-yaa-baan', 'hospital'),
      w('วัด', 'wát', 'temple', { q: 'thai temple' }),
      w('ตลาด', 'dtà-làat', 'market', { q: 'thai market' }),
      w('ร้านค้า', 'ráan-káa', 'shop', { q: 'small shop storefront' }),
      w('ห้าง', 'hâang', 'shopping mall'),
      w('สวนสนุก', 'sǔan-sà-nùk', 'theme park', { q: 'amusement park ferris wheel', fact: 'Word by word: "fun garden".' }),
      w('สวนสัตว์', 'sǔan-sàt', 'zoo', { fact: 'Word by word: "animal garden".' }),
      w('สนามบิน', 'sà-nǎam-bin', 'airport'),
      w('สนามเด็กเล่น', 'sà-nǎam-dèk-lên', 'playground', { fact: 'Word by word: "field where children play".' }),
      w('ชายหาด', 'chaai-hàat', 'beach', { q: 'tropical beach' }),
      w('ร้านอาหาร', 'ráan-aa-hǎan', 'restaurant'),
      w('ห้องสมุด', 'hâwng-sà-mùt', 'library'),
    ],
  },
  {
    id: 'veggies', land: 5, title: 'Vegetables', th: 'ผัก',
    words: [
      w('ผัก', 'pàk', 'vegetables', { q: 'fresh vegetables' }),
      w('แครอท', 'kae-ràwt', 'carrot'),
      w('ข้าวโพด', 'kâao-pôht', 'corn', { q: 'corn cob' }),
      w('มะเขือเทศ', 'má-kǔea-têt', 'tomato'),
      w('แตงกวา', 'dtaeng-gwaa', 'cucumber'),
      w('เห็ด', 'hèt', 'mushroom'),
      w('พริก', 'prík', 'chilli', { q: 'red chili peppers' }),
      w('หัวหอม', 'hǔa-hǎwm', 'onion'),
      w('กระเทียม', 'grà-tiam', 'garlic'),
      w('มันฝรั่ง', 'man-fà-ràng', 'potato'),
      w('บรอกโคลี', 'bràwk-koh-lêe', 'broccoli'),
      w('ถั่ว', 'tùa', 'beans / nuts', { q: 'peanuts' }),
    ],
  },
  {
    id: 'sea', land: 5, title: 'Under the Sea', th: 'ใต้ทะเล',
    words: [
      w('ทะเล', 'tá-le', 'sea', { q: 'ocean waves' }),
      w('ปลาวาฬ', 'bplaa-waan', 'whale'),
      w('ปลาโลมา', 'bplaa-loh-maa', 'dolphin'),
      w('ฉลาม', 'chà-lǎam', 'shark'),
      w('ปลาหมึก', 'bplaa-mùek', 'octopus', { fact: 'Word by word: "ink fish".' }),
      w('ปู', 'bpoo', 'crab'),
      w('กุ้ง', 'gûng', 'prawn', { q: 'shrimp' }),
      w('หอย', 'hǒi', 'seashell', { q: 'seashell beach' }),
      w('แมวน้ำ', 'maew-náam', 'seal', { fact: 'Word by word: "water cat"!' }),
      w('ปลาปักเป้า', 'bplaa-bpàk-bpâo', 'pufferfish'),
      w('ปลาการ์ตูน', 'bplaa-gaa-dtoon', 'clownfish', { fact: 'Word by word: "cartoon fish"!' }),
      w('แมงกะพรุน', 'maeng-gà-prun', 'jellyfish'),
    ],
  },

  // ──────────────────────────── Land 6: Wonder World ────────────────────────────
  {
    id: 'sky', land: 6, title: 'Sky & Weather', th: 'ฟ้าและอากาศ',
    words: [
      w('พระอาทิตย์', 'prá-aa-tít', 'sun', { q: 'sun sky' }),
      w('พระจันทร์', 'prá-jan', 'moon', { q: 'full moon' }),
      w('ดาว', 'daao', 'star', { q: 'starry night sky' }),
      w('เมฆ', 'mêk', 'cloud', { q: 'white cloud blue sky' }),
      w('ฝน', 'fǒn', 'rain'),
      w('ฟ้าร้อง', 'fáa-ráwng', 'thunder', { q: 'thunderstorm', fact: 'Word by word: "the sky shouts"!' }),
      w('ฟ้าผ่า', 'fáa-pàa', 'lightning'),
      w('หิมะ', 'hì-má', 'snow'),
      w('ลม', 'lom', 'wind', { q: 'windy trees blowing' }),
      w('สายรุ้ง', 'sǎai-rúng', 'rainbow'),
      w('ร่ม', 'rôm', 'umbrella'),
      w('โลก', 'lôhk', 'the Earth', { q: 'planet earth from space' }),
    ],
  },
  {
    id: 'nature', land: 6, title: 'Nature', th: 'ธรรมชาติ',
    words: [
      w('ต้นไม้', 'dtôn-máai', 'tree'),
      w('ดอกไม้', 'dàwk-máai', 'flower', { q: 'colorful flowers' }),
      w('ใบไม้', 'bai-máai', 'leaf', { q: 'green leaf' }),
      w('ภูเขา', 'poo-kǎo', 'mountain'),
      w('ภูเขาไฟ', 'poo-kǎo-fai', 'volcano', { fact: 'Word by word: "fire mountain"!' }),
      w('ไฟ', 'fai', 'fire', { q: 'campfire' }),
      w('หิน', 'hǐn', 'rock', { q: 'rocks stones' }),
      w('ทะเลทราย', 'tá-le-saai', 'desert', { fact: 'Word by word: "sand sea".' }),
      w('เกาะ', 'gàw', 'island', { q: 'tropical island thailand' }),
      w('ป่า', 'bpàa', 'forest', { q: 'jungle forest' }),
      w('แม่น้ำ', 'mâe-náam', 'river', { fact: 'Word by word: "mother water".' }),
      w('น้ำตก', 'náam-dtòk', 'waterfall', { fact: 'Word by word: "falling water".' }),
    ],
  },
  {
    id: 'jobs', land: 6, title: 'Jobs', th: 'อาชีพ',
    words: [
      w('หมอ', 'mǎw', 'doctor'),
      w('หมอฟัน', 'mǎw-fan', 'dentist', { fact: 'Word by word: "teeth doctor".' }),
      w('ตำรวจ', 'dtam-rùat', 'police officer', { q: 'police officer' }),
      w('นักดับเพลิง', 'nák-dàp-ploeng', 'firefighter'),
      w('นักบิน', 'nák-bin', 'pilot', { q: 'airline pilot' }),
      w('ชาวนา', 'chaao-naa', 'farmer', { q: 'rice farmer field' }),
      w('เชฟ', 'chéf', 'chef'),
      w('นักบินอวกาศ', 'nák-bin-à-wá-gàat', 'astronaut', { fact: 'Word by word: "space pilot".' }),
      w('นักร้อง', 'nák-ráwng', 'singer', { q: 'singer on stage' }),
      w('ศิลปิน', 'sǐn-lá-bpin', 'artist', { q: 'artist painting canvas' }),
      w('นักวิทยาศาสตร์', 'nák-wít-tá-yaa-sàat', 'scientist', { q: 'scientist laboratory' }),
      w('ช่างซ่อมรถ', 'châang-sâwm-rót', 'mechanic', { q: 'car mechanic' }),
    ],
  },
  {
    id: 'party', land: 6, title: 'Parties & Festivals', th: 'งานฉลอง',
    words: [
      w('วันเกิด', 'wan-gòet', 'birthday', { q: 'child birthday party', fact: 'Word by word: "born day".' }),
      w('ของขวัญ', 'kǎwng-kwǎn', 'present', { q: 'wrapped gift box' }),
      w('ปาร์ตี้', 'bpaa-dtêe', 'party', { q: 'party decorations confetti' }),
      w('เทียน', 'tian', 'candle', { q: 'candles' }),
      w('ดอกไม้ไฟ', 'dàwk-máai-fai', 'fireworks', { fact: 'Word by word: "fire flowers"!' }),
      w('เพลง', 'pleng', 'song', { q: 'music notes sheet music' }),
      w('กลอง', 'glawng', 'drum'),
      w('กีตาร์', 'gee-dtâa', 'guitar'),
      w('เปียโน', 'bpia-noh', 'piano'),
      w('ฟักทอง', 'fák-tawng', 'pumpkin', { q: 'halloween pumpkin' }),
      w('สงกรานต์', 'sǒng-graan', 'Songkran', { q: 'songkran water festival', fact: 'Thai New Year in April: everyone splashes water!' }),
      w('ลอยกระทง', 'loi-grà-tong', 'Loy Krathong', { q: 'loy krathong', fact: 'In November people float little lotus boats on the water.' }),
    ],
  },
];

/** Short spoken feedback, pre-rendered with the same voice as the words. */
export const PRAISE = [
  w('เก่งมาก', 'gèng mâak', 'Well done!'),
  w('ถูกต้อง', 'tòok-dtâwng', 'Correct!'),
  w('เยี่ยมเลย', 'yîam loei', 'Excellent!'),
  w('สุดยอด', 'sùt-yâwt', 'Awesome!'),
  w('ใช่แล้ว', 'châi láew', "That's right!"),
];

export const TRY_AGAIN = [
  w('ลองอีกครั้งนะ', 'lawng èek kráng ná', 'Try again!'),
  w('เกือบแล้ว', 'gùeap láew', 'Almost!'),
];

/** Lowercase, hyphenated slug of the English meaning. */
export function slug(text) {
  return text
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/** Stable id for save data: chapter id + word slug. */
export function wordId(chapter, word) {
  return `${chapter.id}:${word.id || slug(word.en)}`;
}

/** Every word, flattened, each tagged with its chapter and id. */
export function allWords() {
  return CHAPTERS.flatMap((chapter) =>
    chapter.words.map((word) => ({ ...word, id: wordId(chapter, word), chapter: chapter.id })),
  );
}
