/**
 * Talk with Khru Mali: a live Thai conversation (OpenAI Realtime).
 * #/talk lists the conversation games; #/talk/:scene is the call itself.
 */

import { h, deco } from '../core/dom.js';
import { ICONS } from '../data/deco.js';
import { SCENES, sceneById } from '../data/scenes.js';
import { allWords } from '../data/chapters.js';
import { settings, chapterState, chatSecondsLeft, addChatSeconds, earn, recordRound, claimStickers } from '../core/state.js';
import { isSeen } from '../core/srs.js';
import { startCall } from '../core/realtime.js';
import { stop as stopAudio } from '../core/audio.js';
import { go } from '../core/router.js';
import { isBundled } from '../core/assets.js';
import { statusBar, bottomNav, subHeader } from './common.js';
import { showResults } from './results.js';

export const TURN_POINTS = 5;
const MAX_TURN_REWARDS = 20;
const THAI = /[฀-๿]/;

export const sceneOpen = (scene) => settings().unlockAll || Boolean(chapterState(scene.needs).learned);

const clock = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

/** Why talking can't start right now, or null if it can. */
function blocker() {
  const st = settings();
  if (isBundled()) return 'Talking with Khru Mali needs the full app on its own server (npm run dev, or the Vercel link). This test copy has everything else.';
  if (!st.chatEnabled) return 'A grown-up has turned talking off.';
  if (!st.chatPasscode) return 'A grown-up needs to set up talking first (Grown-ups → Talk with Khru Mali).';
  if (chatSecondsLeft() <= 0) return "That's all the talking for today. Come back tomorrow!";
  return null;
}

/** #/talk */
export function talkListRoute(screen) {
  const why = blocker();
  const cards = SCENES.map((scene) => {
    const open = sceneOpen(scene);
    return h('button', {
      class: `scene-card ${open ? '' : 'locked'}`,
      disabled: open && !why ? null : true,
      onClick: () => go(`/talk/${scene.id}`),
    },
    deco(scene.icon, 'scene-icon'),
    h('div', null,
      h('b', null, scene.title),
      h('i', { class: 'th' }, scene.th),
      h('small', null, open ? scene.blurb : 'Opens after more chapters')),
    open ? null : deco(ICONS.lock, 'scene-lock'));
  });

  screen.classList.add('talk-screen');
  screen.append(
    statusBar(),
    subHeader('Talk with Khru Mali', '/'),
    h('main', { class: 'page' },
      h('div', { class: 'talk-hero' },
        deco(ICONS.mascot, 'talk-mascot'),
        h('p', null, 'Khru Mali talks Thai with you. Listen, then answer out loud. Every time you say something in Thai you get points!')),
      why
        ? h('div', { class: 'notice' }, deco(ICONS.lock, 'notice-icon'), h('p', null, why))
        : h('p', { class: 'hint' }, `${clock(chatSecondsLeft())} of talking left today`),
      h('div', { class: 'scene-list' }, cards)),
    bottomNav('/'),
  );
  return null;
}

/** #/talk/:scene */
export function talkCallRoute(screen, sceneId) {
  const scene = sceneById(sceneId);
  if (!scene || !sceneOpen(scene) || blocker()) { go('/talk'); return null; }

  let call = null;
  let ended = false;
  let turns = 0;
  let earned = 0;
  let timer = 0;
  let wrappingUp = false;

  const status = h('div', { class: 'call-status' }, 'Ready when you are');
  const left = h('div', { class: 'chip call-timer' }, clock(chatSecondsLeft()));
  const mascot = deco(ICONS.mascot, 'call-mascot');
  const log = h('div', { class: 'call-log' });
  const bubbles = new Map();
  const errorBox = h('div', { class: 'call-error', hidden: true });

  const startBtn = h('button', { class: 'btn primary start-call' }, deco(ICONS.phone, 'btn-icon'), 'Start talking');
  const againBtn = h('button', { class: 'btn secondary small', disabled: true, onClick: () => call?.again() }, deco(ICONS.turtle, 'btn-icon'), 'Again, slowly');
  const helpBtn = h('button', { class: 'btn secondary small', disabled: true, onClick: () => call?.help() }, deco(ICONS.bulb, 'btn-icon'), 'Help me');
  const endBtn = h('button', { class: 'btn danger small', onClick: () => finish() }, 'End');

  const STATUS = {
    connecting: 'Calling Khru Mali…',
    thinking: 'Khru Mali is thinking…',
    speaking: 'Khru Mali is talking',
    listening: "I'm listening…",
    'your-turn': 'Your turn! Say something in Thai',
  };

  function bubble(id, who, text) {
    let el = bubbles.get(id);
    if (!el) {
      el = h('div', { class: `bubble-line ${who}` });
      bubbles.set(id, el);
      log.append(el);
    }
    el.textContent = text;
    log.scrollTop = log.scrollHeight;
  }

  function showError(err) {
    const messages = {
      passcode: 'The family passcode is not right. A grown-up can fix it in Grown-ups.',
      'not-configured': "Talking isn't set up on the server yet. A grown-up needs to add OPENAI_API_KEY and CHAT_PASSCODE.",
      mic: 'The microphone is blocked. Allow it for this site and try again.',
    };
    teardown(); // a dropped call must let go of the microphone
    errorBox.hidden = false;
    errorBox.textContent = messages[err.code] || err.message || 'Something went wrong.';
    status.textContent = 'Not connected';
    startBtn.hidden = false;
    startBtn.disabled = false;
    againBtn.disabled = true;
    helpBtn.disabled = true;
  }

  /** Talking time only counts once Khru Mali is really on the line. */
  function startClock() {
    if (timer) return;
    timer = setInterval(() => {
      addChatSeconds(1);
      const remaining = chatSecondsLeft();
      left.textContent = clock(remaining);
      if (remaining <= 20 && !wrappingUp && call) { wrappingUp = true; call.goodbye(); }
      if (remaining <= 0) finish();
    }, 1000);
  }

  async function begin() {
    errorBox.hidden = true;
    startBtn.disabled = true;
    stopAudio();
    const st = settings();
    try {
      call = await startCall({
        passcode: st.chatPasscode,
        scene: scene.id,
        name: st.name,
        known: allWords().filter((w) => isSeen(w.id)).map((w) => w.th),
        englishHelp: st.englishHelp,
      }, {
        onState(state) {
          status.textContent = STATUS[state] || status.textContent;
          screen.dataset.state = state;
          if (state !== 'connecting' && state !== 'ended') {
            startClock();
            againBtn.disabled = false;
            helpBtn.disabled = false;
          }
        },
        onTutorText: (id, text) => bubble(id, 'tutor', text),
        onChildText(id, text) {
          bubble(id, 'child', text);
          if (THAI.test(text) && turns < MAX_TURN_REWARDS) {
            turns++;
            earned += earn(TURN_POINTS);
          }
        },
        onLevel(level) { mascot.style.transform = `scale(${1 + level * 0.18})`; },
        onError: showError,
      });
    } catch (err) {
      showError(err);
      return;
    }
    if (ended) { teardown(); return; }
    startBtn.hidden = true;
  }
  startBtn.addEventListener('click', begin);

  function teardown() {
    clearInterval(timer);
    timer = 0;
    if (call) call.hangup();
    call = null;
  }

  function finish() {
    if (ended) return;
    ended = true;
    teardown();
    if (!turns) { go('/talk'); return; }
    recordRound({ right: turns, wrong: 0 });
    showResults(screen, {
      title: 'Great talking!',
      stars: turns >= 6 ? 3 : turns >= 3 ? 2 : 1,
      earned,
      lost: 0,
      stickers: claimStickers(),
      note: `You said ${turns} thing${turns === 1 ? '' : 's'} in Thai. +${TURN_POINTS} points each!`,
      onAgain: () => go(`/talk/${scene.id}?again=${Date.now()}`),
      onDone: () => go('/talk'),
    });
  }

  screen.classList.add('call-screen');
  screen.append(
    h('div', { class: 'game-top' },
      h('button', { class: 'icon-btn quit', 'aria-label': 'End', onClick: () => finish() }, '✕'),
      h('div', { class: 'call-title' }, h('b', null, scene.title), h('i', { class: 'th' }, scene.th)),
      left),
    h('div', { class: 'call-stage' }, mascot, status),
    errorBox,
    startBtn,
    log,
    h('div', { class: 'call-controls' }, againBtn, helpBtn, endBtn),
    h('p', { class: 'hint call-hint' }, `Up to ${MAX_TURN_REWARDS * TURN_POINTS} points a call. Talking uses the microphone.`),
  );

  return () => { ended = true; teardown(); };
}

