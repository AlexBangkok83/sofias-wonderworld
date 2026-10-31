import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

const page = (p) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  base: './',
  server: {
    host: true,   // so Sofia can open it on her phone over the local network
    port: 5173,
  },
  build: {
    target: 'es2020',
    outDir: 'dist',
    sourcemap: true,
    // No shared polyfill chunk: the village must stay one self-contained
    // script so scripts/build-standalone.mjs can inline it.
    modulePreload: { polyfill: false },
    rolldownOptions: {
      // Two separate apps from one build: the village at /, Learn Thai at /thai/.
      input: {
        index: page('./index.html'),
        thai: page('./thai/index.html'),
      },
    },
  },
});
