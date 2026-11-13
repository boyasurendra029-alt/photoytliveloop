// api/tts.js — natural (neural) Telugu / Hindi / Tamil / English voice for the Photo Host.
// Your speech key stays on the server (Vercel Environment Variables) — it is never sent to the browser.
//
//   Option A (recommended, free monthly allowance): Azure Speech
//       AZURE_SPEECH_KEY     = <key>          AZURE_SPEECH_REGION = centralindia   (or your region)
//   Option B: Google Cloud Text-to-Speech
//       GOOGLE_TTS_KEY       = <API key>
//
// GET  /api/tts?check=1  → which voices are available
// POST /api/tts {text, voice, rate, pitch} → audio/mpeg

const AZURE = [
  { id: 'azure:te-IN-ShrutiNeural', label: 'Shruti (Telugu, female)', lang: 'te-IN' },
  { id: 'azure:te-IN-MohanNeural', label: 'Mohan (Telugu, male)', lang: 'te-IN' },
  { id: 'azure:hi-IN-SwaraNeural', label: 'Swara (Hindi, female)', lang: 'hi-IN' },
  { id: 'azure:hi-IN-MadhurNeural', label: 'Madhur (Hindi, male)', lang: 'hi-IN' },
  { id: 'azure:ta-IN-PallaviNeural', label: 'Pallavi (Tamil, female)', lang: 'ta-IN' },
  { id: 'azure:ta-IN-ValluvarNeural', label: 'Valluvar (Tamil, male)', lang: 'ta-IN' },
  { id: 'azure:en-IN-NeerjaNeural', label: 'Neerja (English-India, female)', lang: 'en-IN' },
  { id: 'azure:en-IN-PrabhatNeural', label: 'Prabhat (English-India, male)', lang: 'en-IN' },
];
const GOOGLE = [
  { id: 'google:te-IN-Standard-A', label: 'Google Telugu (female)', lang: 'te-IN' },
  { id: 'google:te-IN-Standard-B', label: 'Google Telugu (male)', lang: 'te-IN' },
  { id: 'google:hi-IN-Neural2-A', label: 'Google Hindi (female)', lang: 'hi-IN' },
  { id: 'google:hi-IN-Neural2-B', label: 'Google Hindi (male)', lang: 'hi-IN' },
  { id: 'google:ta-IN-Standard-A', label: 'Google Tamil (female)', lang: 'ta-IN' },
  { id: 'google:ta-IN-Standard-B', label: 'Google Tamil (male)', lang: 'ta-IN' },
  { id: 'google:en-IN-Neural2-A', label: 'Google English-India (female)', lang: 'en-IN' },
  { id: 'google:en-IN-Neural2-B', label: 'Google English-India (male)', lang: 'en-IN' },
];

const azureOn = () => !!(process.env.AZURE_SPEECH_KEY && process.env.AZURE_SPEECH_REGION);
const googleOn = () => !!process.env.GOOGLE_TTS_KEY;
const available = () => [].concat(azureOn() ? AZURE : [], googleOn() ? GOOGLE : []);
const esc = (s) => String(s).replace(/[<>&"']/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' }[c]));
const clamp = (n, a, b, d) => { n = parseFloat(n); return Number.isFinite(n) ? Math.max(a, Math.min(b, n)) : d; };

// only your own website may use your key (stops strangers burning your quota)
function sameSite(req) {
  const host = (req.headers['x-forwarded-host'] || req.headers.host || '').split(',')[0].trim().toLowerCase();
  const o = String(req.headers.origin || req.headers.referer || '');
  if (!o) return true; // same-origin GET/POST from some browsers omit it
  try { return new URL(o).host.toLowerCase() === host; } catch (e) { return false; }
}

async function azureSpeak(voiceName, text, rate, pitch) {
  const lang = voiceName.slice(0, 5);
  const ssml = `<speak version='1.0' xml:lang='${lang}'><voice name='${voiceName}'><prosody rate='${Math.round((rate - 1) * 100)}%' pitch='${Math.round((pitch - 1) * 50)}%'>${esc(text)}</prosody></voice></speak>`;
  const r = await fetch(`https://${process.env.AZURE_SPEECH_REGION}.tts.speech.microsoft.com/cognitiveservices/v1`, {
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key': process.env.AZURE_SPEECH_KEY,
      'Content-Type': 'application/ssml+xml',
      'X-Microsoft-OutputFormat': 'audio-24khz-48kbitrate-mono-mp3',
      'User-Agent': 'photo-host',
    },
    body: ssml,
  });
  if (!r.ok) throw new Error('Azure TTS ' + r.status);
  return Buffer.from(await r.arrayBuffer());
}

async function googleSpeak(voiceName, text, rate, pitch) {
  const r = await fetch('https://texttospeech.googleapis.com/v1/text:synthesize?key=' + encodeURIComponent(process.env.GOOGLE_TTS_KEY), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      input: { text },
      voice: { languageCode: voiceName.slice(0, 5), name: voiceName },
      audioConfig: { audioEncoding: 'MP3', speakingRate: rate, pitch: (pitch - 1) * 10 },
    }),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.audioContent) throw new Error('Google TTS ' + r.status);
  return Buffer.from(j.audioContent, 'base64');
}

async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      res.setHeader('Cache-Control', 'no-store');
      res.status(200).json({ ok: true, voices: available() });
      return;
    }
    if (req.method !== 'POST') { res.status(405).json({ ok: false }); return; }
    if (!sameSite(req)) { res.status(403).json({ ok: false, message: 'forbidden' }); return; }
    let body = req.body;
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
    body = body || {};
    const text = String(body.text || '').replace(/\s+/g, ' ').trim().slice(0, 300);
    const voice = available().find((v) => v.id === body.voice);
    if (!text || !voice) { res.status(400).json({ ok: false, message: 'bad request' }); return; }
    const rate = clamp(body.rate, 0.6, 1.5, 1), pitch = clamp(body.pitch, 0.5, 1.6, 1);
    const [engine, name] = [voice.id.split(':')[0], voice.id.split(':')[1]];
    const audio = engine === 'azure' ? await azureSpeak(name, text, rate, pitch) : await googleSpeak(name, text, rate, pitch);
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).send(audio);
  } catch (e) {
    res.status(502).json({ ok: false, message: (e && e.message) || 'tts error' });
  }
}

module.exports = handler;
module.exports._test = { available, esc };
