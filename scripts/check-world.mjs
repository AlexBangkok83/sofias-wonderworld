#!/usr/bin/env node
/**
 * Layout checks for every zone — doors, spawn points, standing room — without
 * booting a browser. Runs in about a second, so it's the fast feedback loop
 * when moving buildings around.
 *
 *   npm run check
 */

import { validateWorld } from '../src/world/world.js';

const problems = validateWorld();

if (problems.length) {
  console.error(`\n  ✗ ${problems.length} layout problem(s):`);
  for (const problem of problems) console.error(`      • ${problem}`);
  console.error('');
  process.exit(1);
}

console.log('\n  ✓ Every zone, door and spawn point lines up.\n');
