#!/usr/bin/env node
/**
 * Pre-render every villager line to an mp3 with ElevenLabs.
 *
 * Dialogue is fixed, so this runs once at build time rather than calling the
 * API during play. That means no per-playthrough cost, no API key shipped to
 * the browser, and no network wait in the middle of a conversation.
 *
 *   ELEVENLABS_API_KEY=sk-... npm run voices
 *
 * Output goes to public/vo/ as <npc>-<index>.mp3 plus a manifest.json listing
 * what exists. The game reads that manifest at startup; if it isn't there,
 * every line falls back to the browser's own speech synthesis and the game
 * plays exactly the same. Nothing here is required to ship.
 *
 * Re-run it whenever you edit src/npc/dialogue.js.
 */

import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

import { VILLAGERS } from '../src/npc/dialogue.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, '..', 'public', 'vo');
const MANIFEST = path.join(OUT_DIR, 'manifest.json');
const API = 'https://api.elevenlabs.io/v1';
const MODEL = process.env.ELEVENLABS_MODEL || 'eleven_multilingual_v2';

/**
 * Preferred ElevenLabs voice *names* per villager. Names are matched against
 * whatever the account actually has; anything unmatched falls back to the next
 * unused voice, so this works on any account without hardcoding voice ids.
 * Override a single villager with e.g. ELEVEN_VOICE_MILA=<voice id>.
 */
const VOICE_PREFERENCES = {
  mila: ['Charlotte', 'Alice', 'Lily'],
  oskar: ['Brian', 'Daniel', 'George'],
  bruno: ['Bill', 'Callum', 'Liam'],
  poppy: ['Lily', 'Alice', 'Charlotte'],
  nell: ['Matilda', 'Jessica', 'Sarah'],
  luna: ['Sarah', 'Matilda', 'Jessica'],
  tomas: ['George', 'Chris', 'Brian'],
  wren: ['Jessica', 'Lily', 'Alice'],
};

function fail(message) {
  console.error(`\n  ✗ ${message}\n`);
  process.exit(1);
}

async function fetchVoices(apiKey) {
  const res = await fetch(`${API}/voices`, { headers: { 'xi-api-key': apiKey } });
  if (!res.ok) fail(`Could not list voices (${res.status}). Check ELEVENLABS_API_KEY.`);
  const data = await res.json();
  return data.voices || [];
}

function assignVoices(voices) {
  const byName = new Map(voices.map((v) => [v.name.toLowerCase(), v.voice_id]));
  const used = new Set();
  const assignment = {};

  for (const id of Object.keys(VILLAGERS)) {
    const override = process.env[`ELEVEN_VOICE_${id.toUpperCase()}`];
    if (override) {
      assignment[id] = override;
      used.add(override);
      continue;
    }
    const preferred = (VOICE_PREFERENCES[id] || [])
      .map((name) => byName.get(name.toLowerCase()))
      .find((voiceId) => voiceId && !used.has(voiceId));
    if (preferred) {
      assignment[id] = preferred;
      used.add(preferred);
      continue;
    }
    const spare = voices.find((v) => !used.has(v.voice_id));
    if (!spare) fail('Not enough voices on this account to give the villagers distinct voices.');
    assignment[id] = spare.voice_id;
    used.add(spare.voice_id);
  }
  return assignment;
}

async function synthesize(apiKey, voiceId, text, villager) {
  const res = await fetch(`${API}/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
      Accept: 'audio/mpeg',
    },
    body: JSON.stringify({
      text,
      model_id: MODEL,
      voice_settings: {
        stability: 0.45,
        similarity_boost: 0.8,
        style: 0.35,
        use_speaker_boost: true,
        // Nudge toward the same pitch/pace the browser fallback uses.
        speed: Math.max(0.7, Math.min(1.2, villager.voice?.rate ?? 1)),
      },
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    fail(`Text-to-speech failed (${res.status}) for "${text.slice(0, 40)}…"\n    ${body.slice(0, 300)}`);
  }
  return Buffer.from(await res.arrayBuffer());
}

function hashLine(text, voiceId) {
  return createHash('sha1').update(`${MODEL}|${voiceId}|${text}`).digest('hex').slice(0, 12);
}

async function main() {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    fail('Set ELEVENLABS_API_KEY first.\n'
      + '    Without it the game still works — villagers use the browser voice instead.');
  }

  await mkdir(OUT_DIR, { recursive: true });

  // Reuse anything already rendered from identical text and voice.
  let previous = { lines: {}, hashes: {} };
  if (existsSync(MANIFEST)) {
    try {
      previous = JSON.parse(await readFile(MANIFEST, 'utf8'));
      previous.hashes = previous.hashes || {};
    } catch {
      previous = { lines: {}, hashes: {} };
    }
  }

  console.log('  Listing voices…');
  const assignment = assignVoices(await fetchVoices(apiKey));

  const manifest = { model: MODEL, voices: assignment, lines: {}, hashes: {} };
  let generated = 0;
  let reused = 0;

  for (const [npcId, villager] of Object.entries(VILLAGERS)) {
    const voiceId = assignment[npcId];
    for (const [index, text] of villager.lines.entries()) {
      const key = `${npcId}-${index}`;
      const file = `${key}.mp3`;
      const hash = hashLine(text, voiceId);

      if (previous.hashes?.[key] === hash && existsSync(path.join(OUT_DIR, file))) {
        manifest.lines[key] = file;
        manifest.hashes[key] = hash;
        reused += 1;
        continue;
      }

      process.stdout.write(`  ${villager.name} ${index + 1}/${villager.lines.length}… `);
      const audio = await synthesize(apiKey, voiceId, text, villager);
      await writeFile(path.join(OUT_DIR, file), audio);
      manifest.lines[key] = file;
      manifest.hashes[key] = hash;
      generated += 1;
      console.log('done');
    }
  }

  await writeFile(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`\n  ✓ ${generated} line(s) generated, ${reused} reused.`);
  console.log(`  → ${path.relative(process.cwd(), OUT_DIR)}\n`);
}

main().catch((error) => fail(error.message));
