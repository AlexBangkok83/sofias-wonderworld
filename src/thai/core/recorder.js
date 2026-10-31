/** Recording her voice for Say It. Nothing is uploaded or kept. */

let stream = null;

export async function micStream() {
  if (stream && stream.active) return stream;
  stream = await navigator.mediaDevices.getUserMedia({
    audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
  });
  return stream;
}

export function releaseMic() {
  if (stream) stream.getTracks().forEach((t) => t.stop());
  stream = null;
}

/** Starts recording; returns { stop() → Promise<{ blob, seconds }> }. */
export function startRecording(source) {
  const types = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm'];
  const type = types.find((t) => window.MediaRecorder?.isTypeSupported?.(t));
  const rec = new MediaRecorder(source, type ? { mimeType: type } : undefined);
  const chunks = [];
  const started = performance.now();
  rec.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
  rec.start();
  return {
    stop: () => new Promise((resolve) => {
      rec.onstop = () => resolve({
        blob: new Blob(chunks, { type: rec.mimeType || 'audio/webm' }),
        seconds: (performance.now() - started) / 1000,
      });
      if (rec.state !== 'inactive') rec.stop();
    }),
  };
}

/** Plays a recording; resolves when it ends. */
export function playBlob(blob) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(blob);
    const a = new Audio(url);
    const finish = () => { URL.revokeObjectURL(url); resolve(); };
    a.onended = finish;
    a.onerror = finish;
    a.play().catch(finish);
    setTimeout(finish, 8000);
  });
}
