import { defineConfig, loadEnv } from 'vite';
import basicSsl from '@vitejs/plugin-basic-ssl';
import { fileURLToPath } from 'node:url';

const page = (p) => fileURLToPath(new URL(p, import.meta.url));

/**
 * Serves POST /api/realtime-token during `npm run dev` and `npm run preview`,
 * the same way the Vercel function does in production. Reads OPENAI_API_KEY
 * and CHAT_PASSCODE from .env.local (git-ignored).
 */
function realtimeTokenApi() {
  const attach = (server, mode) => {
    const env = { ...process.env, ...loadEnv(mode, process.cwd(), '') };
    server.middlewares.use('/api/realtime-token', async (req, res) => {
      let raw = '';
      for await (const chunk of req) raw += chunk;
      let body = {};
      try { body = JSON.parse(raw || '{}'); } catch { /* empty body */ }
      let out;
      try {
        const { handleTokenRequest } = await import('./server/realtime.js');
        out = req.method === 'POST'
          ? await handleTokenRequest(body, { env, ip: req.socket.remoteAddress })
          : { status: 405, body: { error: 'method' } };
      } catch (err) { // never take the dev server down with it
        out = { status: 500, body: { error: 'server', message: err.message } };
      }
      res.statusCode = out.status;
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Cache-Control', 'no-store');
      res.end(JSON.stringify(out.body));
    });
  };
  return {
    name: 'realtime-token-api',
    configureServer(server) { attach(server, server.config.mode); },
    configurePreviewServer(server) { attach(server, 'production'); },
  };
}

// `npm run dev:phone` serves over https (a self-signed certificate), because
// phones only allow the microphone on https pages: talking and Say It need it.
export default defineConfig(({ mode }) => ({
  base: './',
  plugins: [realtimeTokenApi(), ...(mode === 'phone' ? [basicSsl()] : [])],
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
}));
