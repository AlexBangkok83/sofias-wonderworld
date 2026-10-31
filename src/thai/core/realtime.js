/**
 * A live voice call with Khru Mali over WebRTC (OpenAI Realtime).
 *
 * 1. Ask our own server (/api/realtime-token) for a two-minute client secret.
 *    The server holds the API key and writes the tutor's instructions.
 * 2. Open a WebRTC connection straight to OpenAI with that secret: the
 *    microphone goes up, Khru Mali's voice comes back, and a data channel
 *    carries events (transcripts, who is talking).
 */

const CALLS_URL = 'https://api.openai.com/v1/realtime/calls';

export class CallError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

export async function requestSession(payload) {
  let res;
  try {
    res = await fetch('/api/realtime-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new CallError('offline', 'Could not reach the server. Are you online?');
  }
  const data = await res.json().catch(() => ({}));
  if (res.status === 404) throw new CallError('not-configured', 'Talking needs the app to run on its server (Vercel or npm run dev).');
  if (!res.ok) throw new CallError(data.error || 'server', data.message || `Server said ${res.status}`);
  return data;
}

/**
 * Starts a call. handlers: { onState(state), onTutorText(id, text, done),
 * onChildText(id, text), onLevel(0..1), onError(err) }
 * States: connecting, thinking, speaking, listening, your-turn, ended.
 * Returns { send(event), again(), help(), goodbye(), hangup() }.
 */
export async function startCall(payload, handlers) {
  const { onState = () => {}, onTutorText = () => {}, onChildText = () => {}, onLevel = () => {}, onError = () => {} } = handlers;
  onState('connecting');

  const session = await requestSession(payload);

  let mic;
  try {
    mic = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
    });
  } catch {
    throw new CallError('mic', 'The microphone is blocked. Allow it in the browser settings and try again.');
  }

  const pc = new RTCPeerConnection();
  const speaker = new Audio();
  speaker.autoplay = true;
  speaker.playsInline = true;
  let meter = null;

  pc.ontrack = (e) => {
    speaker.srcObject = e.streams[0];
    meter = levelMeter(e.streams[0], onLevel);
  };
  let reported = false;
  const fail = (message) => {
    if (reported) return;
    reported = true;
    onError(new CallError('network', message));
  };
  pc.onconnectionstatechange = () => {
    if (pc.connectionState === 'failed') fail('The call could not connect. Check the internet connection and try again.');
    if (pc.connectionState === 'disconnected') fail('The call dropped.');
  };
  pc.addTrack(mic.getAudioTracks()[0], mic);

  const channel = pc.createDataChannel('oai-events');
  const send = (event) => {
    if (channel.readyState === 'open') channel.send(JSON.stringify(event));
  };
  const tutorText = new Map();

  const connectTimeout = setTimeout(() => {
    if (channel.readyState !== 'open') fail('The call could not connect. Check the internet connection and try again.');
  }, 20000);
  channel.onopen = () => {
    clearTimeout(connectTimeout);
    onState('thinking');
    send({ type: 'response.create' }); // Khru Mali speaks first
  };
  channel.onmessage = (msg) => {
    let e;
    try { e = JSON.parse(msg.data); } catch { return; }
    switch (e.type) {
      case 'input_audio_buffer.speech_started': onState('listening'); break;
      case 'input_audio_buffer.speech_stopped': onState('thinking'); break;
      case 'conversation.item.input_audio_transcription.completed':
        if (e.transcript?.trim()) onChildText(e.item_id, e.transcript.trim());
        break;
      case 'output_audio_buffer.started': onState('speaking'); break;
      case 'output_audio_buffer.stopped': onState('your-turn'); break;
      case 'response.output_audio_transcript.delta':
      case 'response.audio_transcript.delta': {
        const text = (tutorText.get(e.item_id) || '') + (e.delta || '');
        tutorText.set(e.item_id, text);
        onTutorText(e.item_id, text, false);
        break;
      }
      case 'response.output_audio_transcript.done':
      case 'response.audio_transcript.done':
        onTutorText(e.item_id, e.transcript || tutorText.get(e.item_id) || '', true);
        break;
      case 'error':
        onError(new CallError('openai', e.error?.message || 'Something went wrong.'));
        break;
      default:
    }
  };

  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  const answer = await fetch(CALLS_URL, {
    method: 'POST',
    body: offer.sdp,
    headers: { Authorization: `Bearer ${session.value}`, 'Content-Type': 'application/sdp' },
  });
  if (!answer.ok) {
    mic.getTracks().forEach((t) => t.stop());
    pc.close();
    throw new CallError('openai', `Could not start the call (${answer.status}).`);
  }
  await pc.setRemoteDescription({ type: 'answer', sdp: await answer.text() });

  const ask = (instructions) => send({ type: 'response.create', response: { instructions } });

  return {
    send,
    again: () => ask('Say your last sentence again, more slowly, with very clear tones. Then wait for her.'),
    help: () => ask('She is stuck. In one short English sentence, say what you asked her. Then give her a very short Thai answer she can say, slowly, and invite her to say it. Then wait.'),
    goodbye: () => ask('Time is up for today. Say a warm, short goodbye in Thai (and one sentence in English), praise her, and say see you tomorrow.'),
    hangup() {
      clearTimeout(connectTimeout);
      reported = true; // no error popups after hanging up
      try { channel.close(); } catch { /* already closed */ }
      mic.getTracks().forEach((t) => t.stop());
      pc.getSenders().forEach((s) => s.track?.stop());
      pc.close();
      speaker.srcObject = null;
      if (meter) meter.stop();
      onState('ended');
    },
  };
}

/** Reports how loud Khru Mali is (0..1), so the mascot can bounce while she talks. */
function levelMeter(stream, onLevel) {
  let ctx;
  try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch { return null; }
  const source = ctx.createMediaStreamSource(stream);
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 256;
  source.connect(analyser);
  const data = new Uint8Array(analyser.frequencyBinCount);
  let raf = 0;
  const tick = () => {
    analyser.getByteTimeDomainData(data);
    let sum = 0;
    for (const v of data) sum += (v - 128) ** 2;
    onLevel(Math.min(1, Math.sqrt(sum / data.length) / 40));
    raf = requestAnimationFrame(tick);
  };
  tick();
  return { stop() { cancelAnimationFrame(raf); ctx.close(); } };
}
