/**
 * Mints short-lived OpenAI Realtime sessions for the "Talk with Khru Mali"
 * conversations. Used by the Vercel function (api/realtime-token.js) and by
 * the Vite dev server, so both behave the same.
 *
 * The real OPENAI_API_KEY never leaves the server. The browser gets a
 * client secret that expires in two minutes, only good for opening one
 * session, with the tutor's instructions already baked in server-side. A
 * family passcode (CHAT_PASSCODE) stops strangers who find the URL from
 * spending the credits.
 *
 * Environment:
 *   OPENAI_API_KEY   required
 *   CHAT_PASSCODE    required; the grown-up types the same code in the app
 *   REALTIME_MODEL   optional, default gpt-realtime-2.1 (gpt-realtime-2.1-mini is cheaper)
 *   REALTIME_VOICE   optional, default marin (the same voice as the word clips)
 */

import { timingSafeEqual } from 'node:crypto';
import { CHAPTERS } from '../src/thai/data/chapters.js';
import { sceneById } from '../src/thai/data/scenes.js';

const ENGLISH_HELP = {
  little: 'Use English only when she is clearly stuck, and then just a few words.',
  some: 'Use a little English to help: after a Thai sentence with a new word, add a very short English meaning.',
  lots: 'She is a beginner: after each Thai sentence, say what it means in English, then invite her to answer in Thai.',
};

const THAI = /^[฀-๿ ]+$/;
const MAX_KNOWN = 150;
const RATE_LIMIT = 30; // sessions per hour per address, per server instance
const recent = new Map();

function cleanName(name) {
  const n = String(name || '').replace(/[^\p{L} '-]/gu, '').trim().slice(0, 20);
  return n || 'Sofia';
}

function cleanWords(list) {
  if (!Array.isArray(list)) return [];
  return [...new Set(list.map((w) => String(w).trim()).filter((w) => w.length <= 40 && THAI.test(w)))].slice(0, MAX_KNOWN);
}

function samePasscode(given, expected) {
  const a = Buffer.from(String(given || ''));
  const b = Buffer.from(String(expected || ''));
  return a.length === b.length && timingSafeEqual(a, b);
}

function rateLimited(ip) {
  const now = Date.now();
  const hits = (recent.get(ip) || []).filter((t) => now - t < 3600e3);
  hits.push(now);
  recent.set(ip, hits);
  return hits.length > RATE_LIMIT;
}

/** The tutor's instructions for one conversation. */
export function tutorInstructions({ name, scene, known, englishHelp }) {
  const topic = CHAPTERS.filter((c) => scene.chapters.includes(c.id)).flatMap((c) => c.words.map((w) => w.th));
  return [
    `You are Khru Mali (ครูมะลิ), a kind, playful elephant who teaches Thai in a children's learning app. You are talking by voice with ${name}, a 7-year-old girl whose first language is English. She lives in Thailand and is learning Thai.`,
    '',
    'How to talk:',
    '- Speak Thai in very short, simple sentences of 3 to 7 words. Speak slowly and clearly, with careful tones.',
    `- You are female: end statements with ค่ะ and questions with คะ. ${name} is a girl, so encourage her to end with ค่ะ/คะ and to call herself หนู.`,
    '- Use the words she already knows (listed below) as much as you can. Bring in at most one new word at a time and give its English meaning.',
    '- Ask one simple question, then stop and wait for her. Keep each of your turns under about 12 seconds.',
    `- ${ENGLISH_HELP[englishHelp] || ENGLISH_HELP.some}`,
    '- If she answers in English, happily say it in Thai for her, slowly, and invite her to say it back.',
    '- If she already said it well in Thai, do not ask her to repeat it: praise her and move the game on.',
    '- Praise her often and specifically (เก่งมาก, เยี่ยมเลย, ถูกต้องค่ะ). Never tell her she is wrong: just say the right Thai warmly and let her try again.',
    '- Keep everything friendly and suitable for a young child. Never ask for personal details such as her surname, address, school name, phone number or photos. If she brings up something unsuitable or scary, gently steer back to the game.',
    '- If she asks who you are, you are Khru Mali the elephant teacher from her Learn Thai app.',
    '',
    `Today's game: ${scene.setup}`,
    '',
    `Words she knows: ${known.length ? known.join(', ') : '(she is just starting)'}`,
    `Topic words for this game: ${topic.join(', ')}`,
    '',
    `Begin now: greet ${name} warmly by name in Thai and start the game with one short question.`,
  ].join('\n');
}

/**
 * Handles a token request. Returns { status, body } for the caller to send.
 * body in: { passcode, scene, name, known: [Thai words], englishHelp }
 */
export async function handleTokenRequest(input, { env = process.env, ip = 'local' } = {}) {
  if (!env.OPENAI_API_KEY || !env.CHAT_PASSCODE) {
    return { status: 503, body: { error: 'not-configured', message: 'The server needs OPENAI_API_KEY and CHAT_PASSCODE set.' } };
  }
  if (!samePasscode(input?.passcode, env.CHAT_PASSCODE)) {
    return { status: 401, body: { error: 'passcode', message: 'The family passcode is not right.' } };
  }
  if (rateLimited(ip)) {
    return { status: 429, body: { error: 'busy', message: 'Too many conversations this hour. Try again later.' } };
  }
  const scene = sceneById(input?.scene);
  if (!scene) return { status: 400, body: { error: 'scene', message: 'Unknown conversation.' } };

  const model = env.REALTIME_MODEL || 'gpt-realtime-2.1';
  const instructions = tutorInstructions({
    name: cleanName(input.name),
    scene,
    known: cleanWords(input.known),
    englishHelp: input.englishHelp,
  });

  const res = await fetch('https://api.openai.com/v1/realtime/client_secrets', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      expires_after: { anchor: 'created_at', seconds: 120 },
      session: {
        type: 'realtime',
        model,
        instructions,
        max_output_tokens: 1000,
        audio: {
          input: {
            noise_reduction: { type: 'near_field' },
            transcription: { model: 'gpt-4o-mini-transcribe', language: 'th' },
            // A child pauses mid-sentence: wait for her to really finish.
            turn_detection: { type: 'semantic_vad', eagerness: 'low' },
          },
          output: { voice: env.REALTIME_VOICE || 'marin', speed: 0.9 },
        },
      },
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.value) {
    return { status: 502, body: { error: 'openai', message: data.error?.message || `OpenAI said ${res.status}` } };
  }
  return { status: 200, body: { value: data.value, expires_at: data.expires_at, model } };
}
