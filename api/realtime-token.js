/**
 * Vercel function: POST /api/realtime-token
 * Mints a short-lived OpenAI Realtime session for a conversation with
 * Khru Mali. All the logic lives in server/realtime.js.
 *
 * Set OPENAI_API_KEY and CHAT_PASSCODE in the Vercel project's environment
 * variables (Settings → Environment Variables).
 */

import { handleTokenRequest } from '../server/realtime.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method' });
    return;
  }
  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  try {
    const { status, body: out } = await handleTokenRequest(body || {}, { ip });
    res.status(status).json(out);
  } catch (err) {
    res.status(500).json({ error: 'server', message: err.message });
  }
}
