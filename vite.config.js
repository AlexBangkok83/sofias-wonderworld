import { defineConfig } from 'vite';

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
  },
});
