/**
 * Conversation games with Khru Mali (OpenAI Realtime). Used by the app to
 * list them and by the server (server/realtime.js) to write the tutor's
 * instructions, so a scene is defined in one place.
 *
 *   needs     chapter that must be learned before the scene opens
 *   chapters  chapters whose words are the topic of the scene
 *   setup     what Khru Mali does in this game (for the model, in English)
 */

export const SCENES = [
  {
    id: 'free',
    title: 'Chat with Khru Mali',
    th: 'คุยกับครูมะลิ',
    icon: '🐘',
    needs: 'hello',
    blurb: 'Talk about anything you like',
    chapters: ['hello', 'little-words'],
    setup: 'A friendly free chat. Ask about her day, her favourite things, food, animals, her family and pets, using the words she knows. Follow her lead.',
  },
  {
    id: 'friend',
    title: 'Meet a New Friend',
    th: 'เพื่อนใหม่',
    icon: '👋',
    needs: 'family',
    blurb: 'Say hello, your name and your age',
    chapters: ['hello', 'family', 'phrases'],
    setup: 'Pretend to be Ploy (พลอย), a new 7-year-old girl in her class. Greet her with สวัสดีค่ะ, ask her name (ชื่ออะไรคะ), her age (อายุเท่าไหร่คะ) and whether she has brothers or sisters. Help her answer with หนูชื่อ… ค่ะ and หนูอายุ… ขวบค่ะ. Say your own name and age too.',
  },
  {
    id: 'market',
    title: 'At the Fruit Market',
    th: 'ตลาดผลไม้',
    icon: '🥭',
    needs: 'fruit',
    blurb: 'Buy fruit and ask how much',
    chapters: ['fruit', 'numbers', 'little-words', 'colours'],
    setup: 'Pretend to run a fruit stall at a Thai market and she is your customer. Offer fruits one at a time, ask which she likes (ชอบอะไรคะ) and how many she wants, give small prices like สิบบาท, and get her to practise เท่าไหร่คะ and ขอบคุณค่ะ.',
  },
  {
    id: 'restaurant',
    title: 'At the Restaurant',
    th: 'ร้านอาหาร',
    icon: '🍜',
    needs: 'snacks',
    blurb: 'Order food and drinks',
    chapters: ['food', 'snacks', 'phrases', 'little-words'],
    setup: 'Pretend to be a waitress in a Thai restaurant. Take her order: ask what she wants to eat (กินอะไรคะ) and drink (ดื่มอะไรคะ), whether she wants it spicy (เผ็ดไหมคะ), then ask if it tastes good (อร่อยไหมคะ). Help her say เอาค่ะ, ไม่เอาค่ะ and อร่อยมาก.',
  },
  {
    id: 'zoo',
    title: 'A Trip to the Zoo',
    th: 'ไปสวนสัตว์',
    icon: '🦒',
    needs: 'wild',
    blurb: 'Talk about the animals you see',
    chapters: ['wild', 'farm', 'bugs', 'colours', 'numbers'],
    setup: 'Pretend you are walking round the zoo together. Point out one animal at a time ("ดูสิ! ช้าง!"), ask what animal it is (นี่ตัวอะไรคะ), what colour it is, how many there are, and whether she likes it.',
  },
  {
    id: 'toys',
    title: 'Show and Tell',
    th: 'ของเล่นของหนู',
    icon: '🧸',
    needs: 'toys',
    blurb: 'Tell Khru Mali about your toys',
    chapters: ['toys', 'colours', 'numbers', 'clothes'],
    setup: 'Ask about her favourite toys: what it is, what colour it is, how many she has, and what she likes to play. Be playful and curious, and tell her about a toy of yours too.',
  },
];

export const sceneById = (id) => SCENES.find((s) => s.id === id);
