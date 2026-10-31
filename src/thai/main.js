/**
 * Learn Thai: boot and routes.
 * Plain JS like the village. See thai/PLAN.md for the design and the research
 * behind it.
 */

import '@fontsource/mali/thai-500.css';
import '@fontsource/mali/thai-700.css';
import '@fontsource/nunito/latin-600.css';
import '@fontsource/nunito/latin-800.css';
import '@fontsource/nunito/latin-ext-600.css';
import '@fontsource/nunito/latin-ext-800.css';
import './styles.css';

import { loadAudio, unlock } from './core/audio.js';
import { loadPictures } from './core/pictures.js';
import { route, startRouter } from './core/router.js';
import { homeRoute } from './ui/home.js';
import { chapterRoute } from './ui/chapter.js';
import { learnRoute } from './ui/learn.js';
import { lessonRoute } from './ui/lesson.js';
import { chapterGameRoute, practiceRoute } from './ui/play.js';
import { stickersRoute } from './ui/stickers.js';
import { swapRoute } from './ui/swap.js';
import { parentsRoute } from './ui/parents.js';

// Relative URLs (audio/, img/) need the trailing slash: /thai → /thai/
if (!location.pathname.endsWith('/') && !location.pathname.endsWith('.html')) {
  location.replace(`${location.pathname}/${location.search}${location.hash}`);
}

function installable() {
  const link = document.createElement('link');
  link.rel = 'manifest';
  link.href = 'manifest.webmanifest';
  document.head.append(link);
  const icon = document.createElement('link');
  icon.rel = 'apple-touch-icon';
  icon.href = 'deco/icon-180.png';
  document.head.append(icon);
  const test = new URLSearchParams(location.search).has('test');
  if (import.meta.env.PROD && !test && 'serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
}

async function boot() {
  installable();
  await Promise.all([loadAudio(), loadPictures()]);
  window.addEventListener('pointerdown', unlock, { once: true, capture: true });

  route('/', homeRoute);
  route('/lesson', lessonRoute);
  route('/practice', practiceRoute);
  route('/chapter/:id', chapterRoute);
  route('/learn/:id', learnRoute);
  route('/play/:chapter/:game', chapterGameRoute);
  route('/stickers', stickersRoute);
  route('/swap', swapRoute);
  route('/parents', parentsRoute);
  startRouter(document.getElementById('app'));
  document.body.classList.add('ready');
}

boot();
