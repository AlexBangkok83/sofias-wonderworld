#!/usr/bin/env node
/**
 * Checks for the phone's brain — no browser, runs in well under a second.
 *
 *   node scripts/check-phone.mjs     (also part of `npm run check`)
 *
 * The safety shield is the part of the phone that has to be right, so most of
 * this is about that: private things and unkind words get stopped, ordinary
 * chatter gets through, villagers never ask for anything personal, and they
 * never claim to be real people.
 */

import { VILLAGERS } from '../src/npc/dialogue.js';
import {
  checkMessage, createCall, answer, farewell, respond, contactList, allPhoneLines,
  PERSONA_IDS, PLAYER_VOICES, getPlayerVoice,
} from '../src/phone/brain.js';

const problems = [];
const expect = (condition, message) => {
  if (!condition) problems.push(message);
};

// --- The shield stops private things and unkind words ---------------------

const BLOCKED = {
  phone: [
    'my number is 0812345678',
    'call me on 081 234 5678',
    'ring me at +44 7700 900123',
    'my phone number is secret',
  ],
  email: ['my email is sofia@example.com', 'SOFIA.B@mail.co.uk'],
  address: [
    'I live at 12 Rose Street',
    'i live on the corner',
    'my address is the big house',
    'our house is at the end of the road',
    'come to 14 sukhumvit soi',
  ],
  password: ['my password is bunny123', 'the passcode is 1234'],
  school: ['my school is called Greenfield', 'I go to Greenfield primary'],
  surname: ['my name is Sofia Smith', 'my last name is Smith', 'my full name is a secret'],
  unkind: ['you are stupid', 'SHUT UP', 'i hate you', 'you’re ugly', 'idiot!!', 'loser', 'what the f*ck', 'fuck'],
};
for (const [reason, messages] of Object.entries(BLOCKED)) {
  for (const message of messages) {
    const result = checkMessage(message);
    expect(!result.ok, `shield let "${message}" through (expected it to stop ${reason})`);
    if (!result.ok) {
      expect(result.reason === reason || (reason === 'unkind' && message.includes('*')),
        `"${message}" was stopped as ${result.reason}, expected ${reason}`);
      expect(result.shield && result.shield.length > 10, `"${message}" was stopped with no explanation`);
    }
  }
}

const ALLOWED = [
  'hi', 'Hello Mila!', 'I am 7', 'I am 7 years old', 'I have 3 cats', 'my name is Sofia',
  'my name is Sofia and I like cake', 'I live in the village', 'what is your favourite colour?',
  'I built 100 blocks today', 'I am in class 2', 'glass', 'I have a grass block', 'passing by',
  'tell me a joke', 'I love you', 'are you real?', 'bye', 'what time is it in 2026', 'poop',
  'can you hear me', 'I go to the park',
];
for (const message of ALLOWED) {
  const result = checkMessage(message);
  expect(result.ok, `shield stopped harmless "${message}" (${result.reason})`);
}

expect(checkMessage('   ').reason === 'empty', 'blank message should be "empty"');
expect(checkMessage('x'.repeat(500)).text.length <= 120, 'long messages should be trimmed to 120');

// --- Villagers never ask for anything personal ----------------------------

const NOSY = [
  /where do you live/i, /what('|’)?s your (address|school|number|phone|email|password|last name|surname|full name)/i,
  /what is your (address|school|number|phone|email|password|last name|surname|full name)/i,
  /how old are you/i, /send (me )?a (photo|picture|pic)/i, /what school/i, /tell me your/i,
  /keep (it|this) (a )?secret from/i, /don('|’)?t tell/i,
];
const lines = allPhoneLines();
expect(lines.length > 150, `expected plenty of phone lines, found ${lines.length}`);
for (const line of lines) {
  for (const pattern of NOSY) {
    expect(!pattern.test(line), `a villager asks for something personal: "${line}"`);
  }
  expect(!/\{(?!player\}|name\}|other\}|said\}|owner\}|topic\})/.test(line), `unknown placeholder in "${line}"`);
}

// --- Every villager is set up for the phone -------------------------------

for (const id of Object.keys(VILLAGERS)) {
  expect(PERSONA_IDS.includes(id), `${id} has no phone personality`);
}

const contacts = contactList({ moonFound: false });
expect(!contacts.some((c) => c.id === 'luna'), 'Luna is in the phone before the moon house is found');
expect(contacts.length === Object.keys(VILLAGERS).length - 1, `expected ${Object.keys(VILLAGERS).length - 1} contacts, got ${contacts.length}`);
expect(contactList({ moonFound: true }).some((c) => c.id === 'luna'), 'Luna never shows up in the phone');
for (const c of contacts) expect(c.emoji && c.name && c.role, `contact ${c.id} is missing details`);

expect(PLAYER_VOICES.length >= 4, 'expected at least four voices to pick from');
for (const v of PLAYER_VOICES) {
  expect(v.pitch >= 0 && v.pitch <= 2 && v.rate >= 0.5 && v.rate <= 2, `voice ${v.id} is out of range`);
}
expect(getPlayerVoice('nope').id === 'me', 'an unknown voice should fall back to "me"');

// --- Conversations ---------------------------------------------------------

const PROBES = [
  'hi', 'how are you?', 'what is your name', 'what are you doing', 'where do you live',
  'how old are you', 'tell me a joke', 'what is your favourite colour', 'whats ur fav food',
  'favourite animal?', 'I feel sad', 'I am scared', 'I am bored', 'I am so angry', 'I am happy',
  'I love you', 'thank you', 'my name is Star', 'what is my name', 'do you like pizza',
  'do you like rainbows', 'I want to build a castle', 'lets play', 'I like bread', 'I like cows',
  'I like books', 'I like the stars', 'tell me about the moon', 'are you real', 'are you a robot',
  'can we meet in real life', 'yes', 'no', 'maybe', 'why is the sky blue?', 'banana',
  'asdfghjkl', '', 'ring ring', 'good morning', 'wat r u doing', 'goodbye',
];

for (const id of Object.keys(VILLAGERS)) {
  for (const moonFound of [false, true]) {
    const call = createCall(id, { playerName: 'Sofia', moonFound });
    const hello = answer(call);
    expect(hello && !hello.includes('{'), `${id} greeting is broken: "${hello}"`);
    expect(!/\bfriend\b/.test(hello) || hello.includes('Sofia') || !hello.includes('{player}'), `${id} greeting ignored the player name`);
    for (const probe of PROBES) {
      const { text } = respond(call, probe);
      expect(typeof text === 'string' && text.length > 1, `${id} had nothing to say to "${probe}"`);
      expect(!/\{\w+\}/.test(text), `${id} left a placeholder in "${text}" (said to "${probe}")`);
      expect(!/undefined|null|NaN/.test(text), `${id} said "${text}" to "${probe}"`);
      if (!moonFound) {
        expect(!/\bLuna\b/.test(text) || id === 'luna', `${id} gave away Luna before the moon house was found: "${text}"`);
      }
    }
    expect(farewell(call).length > 1, `${id} has no goodbye`);
  }
}

const reply = (id, message, ctx = { playerName: 'Sofia' }) => respond(createCall(id, ctx), message);

expect(reply('mila', 'bye!').hangUp === true, 'saying bye should end the call');
expect(reply('mila', 'goodnight mila').hangUp === true, 'goodnight should end the call');
expect(!reply('mila', 'hello').hangUp, 'hello should not end the call');
expect(/Oskar/.test(reply('oskar', 'who are you?').text), 'asking Oskar his name should mention Oskar');
expect(/Sofia/.test(reply('nell', 'what is my name').text), 'villager should know the player name');
expect(/Characters/.test(reply('nell', 'whats my name', { playerName: '' }).text), 'nameless player should be pointed at Characters');
expect(/pretend|game character/i.test(reply('wren', 'are you real?').text), 'villagers must say they are not real people');
expect(/game|real-life/i.test(reply('wren', 'can we meet in real life').text), 'villagers must not agree to meet up');
expect(/Bruno/.test(reply('poppy', 'I love bread').text), 'Poppy should send you to Bruno about bread');
expect(/Poppy/.test(reply('bruno', 'I like horses').text), 'Bruno should send you to Poppy about animals');
expect(!/Bruno/.test(reply('bruno', 'I love bread').text), 'Bruno should talk about bread himself');
expect(/Nell/.test(reply('mila', 'I like the stars', { moonFound: false }).text), 'stars should point to Nell before the moon house');
expect(/Luna/.test(reply('mila', 'I like the stars', { moonFound: true }).text), 'stars should point to Luna after the moon house');
expect(/hedge|lanterns/.test(reply('nell', 'where is the moon house').text), 'Nell should hint at the moon house');
expect(/Star/.test(reply('tomas', 'my name is star').text), 'introducing yourself should be answered by name');
expect(/grown-up/.test(reply('mila', 'I feel sad').text), 'the first sad reply should mention telling a grown-up');

const jokeCall = createCall('bruno', {});
const jokes = new Set(Array.from({ length: 5 }, () => respond(jokeCall, 'tell me a joke').text));
expect(jokes.size === 5, `asking for five jokes in a row gave ${jokes.size} different ones`);

const chatCall = createCall('mila', {});
const first = respond(chatCall, 'banana').text;
const second = respond(chatCall, 'banana').text;
expect(first !== second, 'the same message twice should not get the same reply twice');

// ---------------------------------------------------------------------------

if (problems.length) {
  console.error(`\n  ✗ ${problems.length} phone problem(s):`);
  for (const problem of problems) console.error(`      • ${problem}`);
  console.error('');
  process.exit(1);
}
console.log('  ✓ Phone: the shield, the contacts and every villager’s replies check out.\n');
