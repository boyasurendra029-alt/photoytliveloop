// studio.js — Live Photo Host: static photos + AI voice host that reacts to YouTube live chat.
(function () {
  'use strict';
  const $ = (s) => document.querySelector(s);
  const W = 1080, H = 1920;
  const LS = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* ignore */ } },
  };
  const params = new URLSearchParams(location.search);
  const SPEED = Math.max(1, parseFloat(params.get('fast')) || 1); // testing only
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms / SPEED));
  const uid = () => Math.random().toString(36).slice(2, 10);

  // ---------------- default sentences per language ----------------
  const TPL = {
    te: {
      welcome: 'అందరికీ స్వాగతం! ఈ లైవ్ కి వచ్చినందుకు ధన్యవాదాలు. చాట్ లో మీ సమాధానాలు రాయండి!',
      correct: '{name}, మీ సమాధానం కరెక్ట్! శభాష్!',
      also: '{names} కూడా సరిగ్గా చెప్పారు! సూపర్!',
      wrong: '{name}, దగ్గరగా వచ్చారు! మళ్ళీ ప్రయత్నించండి!',
      timeup: 'సమయం అయిపోయింది! సరైన సమాధానం {answer}.',
      newv: '{names}, లైవ్ కి స్వాగతం!',
      engage: 'ఈ లైవ్ నచ్చితే లైక్ చేయండి!\nఛానెల్ ని సబ్స్క్రైబ్ చేయడం మర్చిపోవద్దు!\nమీ ఫ్రెండ్స్ ని కూడా ఈ లైవ్ కి పిలవండి!\nచాట్ లో మీ సమాధానం రాయండి!',
      convo: "మీరు ఏ ఊరు నుంచి చూస్తున్నారు? చాట్ లో మీ ఊరి పేరు రాయండి!\nమీకు ఇష్టమైన సినిమా ఏది? చాట్ లో చెప్పండి!\nమీ ఫేవరెట్ హీరో ఎవరు? కామెంట్ చేయండి!\nమీకు ఇష్టమైన పాట ఏది? చాట్ లో రాయండి!\nమీరు ఇప్పుడు ఏం చేస్తున్నారు? చెప్పండి, వింటాను!\nమీ ఫ్రెండ్ పేరు చాట్ లో రాసి, వాళ్ళని కూడా ఈ లైవ్ కి పిలవండి!\nమీకు ఇష్టమైన తెలుగు వంటకం ఏది?\nఈ ఫోటో మీకు ఎలా అనిపించింది? ఒక్క మాటలో చెప్పండి!\nమీ ఊరిలో ప్రసిద్ధి చెందింది ఏమిటి?",
      readc: "{name} ఇలా అంటున్నారు: {text}. చాలా బాగా చెప్పారు!",
      hurry: "త్వరగా! ఇంకా కొన్ని సెకన్లే మిగిలాయి!",
    },
    en: {
      welcome: 'Hello everyone, welcome to the live! Thanks for joining. Type your answers in the chat!',
      correct: '{name}, that is the right answer! Well done!',
      also: '{names} got it right too! Great job!',
      wrong: '{name}, good try! Have another go!',
      timeup: "Time is up! The correct answer is {answer}.",
      newv: 'Welcome to the live, {names}!',
      engage: 'If you are enjoying the live, hit the like button!\nDo not forget to subscribe to the channel!\nInvite your friends to join this live!\nWrite your answer in the chat!',
      convo: "Where are you watching from? Type your city in the chat!\nWhat is your favourite movie? Tell us in the chat!\nWho is your favourite actor? Drop a comment!\nWhat is your favourite song right now?\nWhat are you doing right now? Tell me, I am listening!\nWrite a friend's name in the chat and invite them to this live!\nWhat is your favourite food?\nHow does this photo make you feel? Say it in one word!",
      readc: "{name} says: {text}. Nicely said!",
      hurry: "Hurry up! Only a few seconds left!",
    },
    hi: {
      welcome: 'सभी को नमस्कार, लाइव में आपका स्वागत है! चैट में अपने जवाब लिखिए!',
      correct: '{name}, आपका जवाब बिल्कुल सही है! शाबाश!',
      also: '{names} ने भी सही जवाब दिया! बहुत बढ़िया!',
      wrong: '{name}, अच्छी कोशिश! फिर से कोशिश कीजिए!',
      timeup: 'समय खत्म! सही जवाब है {answer}.',
      newv: '{names}, लाइव में आपका स्वागत है!',
      engage: 'लाइव अच्छा लग रहा है तो लाइक करें!\nचैनल को सब्सक्राइब करना न भूलें!\nअपने दोस्तों को भी बुलाइए!\nचैट में अपना जवाब लिखिए!',
      convo: "आप कहाँ से देख रहे हैं? चैट में अपने शहर का नाम लिखिए!\nआपकी पसंदीदा फिल्म कौन सी है? चैट में बताइए!\nआपका पसंदीदा हीरो कौन है? कमेंट कीजिए!\nआप अभी क्या कर रहे हैं? बताइए, मैं सुन रहा हूँ!\nअपने दोस्त का नाम लिखिए और उन्हें भी लाइव में बुलाइए!\nयह फोटो देखकर कैसा लगा? एक शब्द में बताइए!",
      readc: "{name} कहते हैं: {text}. बहुत बढ़िया!",
      hurry: "जल्दी कीजिए! बस कुछ ही सेकंड बचे हैं!",
    },
    ta: {
      welcome: 'அனைவருக்கும் வணக்கம்! லைவ்க்கு வரவேற்கிறோம். சாட்டில் உங்கள் பதில்களை எழுதுங்கள்!',
      correct: '{name}, உங்கள் பதில் சரி! பாராட்டுகள்!',
      also: '{names} உம் சரியாகச் சொன்னார்கள்! அருமை!',
      wrong: '{name}, நல்ல முயற்சி! மீண்டும் முயற்சி செய்யுங்கள்!',
      timeup: 'நேரம் முடிந்தது! சரியான பதில் {answer}.',
      newv: '{names}, லைவ்க்கு வரவேற்கிறோம்!',
      engage: 'லைவ் பிடித்திருந்தால் லைக் செய்யுங்கள்!\nசேனலை சப்ஸ்கிரைப் செய்ய மறக்காதீர்கள்!\nஉங்கள் நண்பர்களையும் அழைக்கவும்!\nசாட்டில் உங்கள் பதிலை எழுதுங்கள்!',
      convo: "நீங்கள் எந்த ஊரிலிருந்து பார்க்கிறீர்கள்? சாட்டில் எழுதுங்கள்!\nஉங்களுக்குப் பிடித்த படம் எது? சாட்டில் சொல்லுங்கள்!\nஉங்களுக்குப் பிடித்த நடிகர் யார்? கமெண்ட் செய்யுங்கள்!\nநீங்கள் இப்போது என்ன செய்கிறீர்கள்? சொல்லுங்கள்!\nஉங்கள் நண்பரின் பெயரை எழுதி, அவரையும் லைவ்க்கு அழையுங்கள்!\nஇந்தப் படம் எப்படி இருக்கிறது? ஒரே வார்த்தையில் சொல்லுங்கள்!",
      readc: "{name} சொல்கிறார்: {text}. நன்றாகச் சொன்னீர்கள்!",
      hurry: "சீக்கிரம்! சில வினாடிகளே உள்ளன!",
    },
  };
  const TPL_FIELDS = { welcome: '#tWelcome', correct: '#tCorrect', also: '#tAlso', wrong: '#tWrong', timeup: '#tTimeup', newv: '#tNewv', engage: '#tEngage', convo: '#tConvo', readc: '#tReadc', hurry: '#tHurry' };

  // ---------------- state ----------------
  const S = {
    photos: [], // {id, blob, url, w, h, cfg:{z,x,y}, caption, answer, intro, dur}
    sel: -1,
    cfg: Object.assign({
      video: '', chan: '', lang: 'te', voiceURI: '', rate: 1, pitch: 1, vol: 1,
      engageSec: 90, after: 8, motion: 'in', greet: true, wrong: true, loop: true,
      xQ: false, xWin: false, xTimer: false, xBadge: false, read: true, convoSec: 45, shuffle: false,
    }, LS.get('studio.cfg', {})),
    runId: 0, paused: false, skip: 0, demo: false, chat: null, running: false,
    cur: null, seenUsers: new Set(), newQ: [], wrongQ: [], alsoQ: [], lastNew: 0, lastWrong: 0, lastEngage: 0, engageIdx: 0, lastRead: 0, lastConvo: 0, convoIdx: 0, chatQ: [], order: [],
    chatStatus: 'idle', msgCount: 0,
  };

  // ---------------- IndexedDB (photos persist in this browser) ----------------
  const DB = {
    db: null,
    open() {
      return new Promise((res) => {
        try {
          const r = indexedDB.open('photohost', 1);
          r.onupgradeneeded = () => r.result.createObjectStore('photos', { keyPath: 'id' });
          r.onsuccess = () => { DB.db = r.result; res(true); };
          r.onerror = () => res(false);
        } catch (e) { res(false); }
      });
    },
    all() {
      return new Promise((res) => {
        if (!DB.db) return res([]);
        try { const q = DB.db.transaction('photos').objectStore('photos').getAll(); q.onsuccess = () => res(q.result || []); q.onerror = () => res([]); } catch (e) { res([]); }
      });
    },
    put(rec) { if (!DB.db) return; try { DB.db.transaction('photos', 'readwrite').objectStore('photos').put(rec); } catch (e) { /* ignore */ } },
    del(id) { if (!DB.db) return; try { DB.db.transaction('photos', 'readwrite').objectStore('photos').delete(id); } catch (e) { /* ignore */ } },
  };
  function persist(p) {
    if (!p) return;
    DB.put({ id: p.id, order: S.photos.indexOf(p), blob: p.blob, cfg: p.cfg, caption: p.caption, answer: p.answer, intro: p.intro, dur: p.dur });
  }
  function persistAll() { S.photos.forEach(persist); }
  let saveT = null;
  const persistSoon = () => { clearTimeout(saveT); saveT = setTimeout(() => persist(S.photos[S.sel]), 400); };

  function loadImage(blob) {
    return new Promise((res, rej) => {
      const url = URL.createObjectURL(blob);
      const im = new Image();
      im.onload = () => res({ url, w: im.naturalWidth, h: im.naturalHeight });
      im.onerror = () => rej(new Error('bad image'));
      im.src = url;
    });
  }
  async function addPhoto(blob, extra) {
    const info = await loadImage(blob);
    const p = Object.assign({ id: uid(), blob, url: info.url, w: info.w, h: info.h, cfg: { z: 1, x: 0, y: 0 }, caption: '', answer: '', intro: '', dur: '' }, extra || {});
    p.url = info.url; p.w = info.w; p.h = info.h;
    S.photos.push(p);
    return p;
  }

  // ---------------- layout maths (same for editor, stage and PNG export) ----------------
  function layoutImg(p, w, h) {
    const base = Math.max(w / p.w, h / p.h);
    const s = base * p.cfg.z;
    const iw = p.w * s, ih = p.h * s;
    return { w: iw, h: ih, l: (w - iw) / 2 + p.cfg.x * w, t: (h - ih) / 2 + p.cfg.y * h };
  }
  const containZ = (p) => Math.min(W / p.w, H / p.h) / Math.max(W / p.w, H / p.h);
  function place(img, p, w, h) {
    const L = layoutImg(p, w, h);
    img.style.width = L.w + 'px'; img.style.height = L.h + 'px'; img.style.left = L.l + 'px'; img.style.top = L.t + 'px';
  }

  // ---------------- setup UI: thumbnails + editor ----------------
  function renderThumbs() {
    const box = $('#thumbs');
    box.innerHTML = '';
    S.photos.forEach((p, i) => {
      const d = document.createElement('div');
      d.className = 'th' + (i === S.sel ? ' sel' : '') + (p.answer ? ' q' : '');
      d.style.backgroundImage = `url(${p.url})`;
      d.innerHTML = `<b>${i + 1}</b>`;
      d.addEventListener('click', () => select(i));
      box.appendChild(d);
    });
    $('#editor').hidden = S.sel < 0;
  }
  function select(i) {
    S.sel = i;
    const p = S.photos[i];
    renderThumbs();
    if (!p) return;
    $('#pvbg').style.backgroundImage = `url(${p.url})`;
    $('#pvimg').src = p.url;
    $('#fCap').value = p.caption || '';
    $('#fAns').value = p.answer || '';
    $('#fIntro').value = p.intro || '';
    $('#fDur').value = p.dur || '';
    redrawPv();
  }
  function redrawPv() {
    const p = S.photos[S.sel];
    if (!p) return;
    place($('#pvimg'), p, 270, 480);
    $('#zoom').value = p.cfg.z;
  }
  function bindEditor() {
    const pv = $('#pv');
    const ptr = new Map();
    let pinch0 = 0, z0 = 1;
    pv.addEventListener('pointerdown', (e) => { pv.setPointerCapture(e.pointerId); ptr.set(e.pointerId, { x: e.clientX, y: e.clientY }); if (ptr.size === 2) { const [a, b] = [...ptr.values()]; pinch0 = Math.hypot(a.x - b.x, a.y - b.y); z0 = S.photos[S.sel].cfg.z; } });
    pv.addEventListener('pointermove', (e) => {
      const p = S.photos[S.sel];
      if (!p || !ptr.has(e.pointerId)) return;
      const prev = ptr.get(e.pointerId);
      ptr.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (ptr.size === 2) {
        const [a, b] = [...ptr.values()];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (pinch0) p.cfg.z = Math.max(0.3, Math.min(4, z0 * (d / pinch0)));
      } else {
        const r = pv.getBoundingClientRect();
        p.cfg.x += (e.clientX - prev.x) / r.width;
        p.cfg.y += (e.clientY - prev.y) / r.height;
      }
      redrawPv(); persistSoon();
    });
    const up = (e) => { ptr.delete(e.pointerId); pinch0 = 0; };
    pv.addEventListener('pointerup', up); pv.addEventListener('pointercancel', up);
    pv.addEventListener('wheel', (e) => { e.preventDefault(); const p = S.photos[S.sel]; if (!p) return; p.cfg.z = Math.max(0.3, Math.min(4, p.cfg.z * (e.deltaY < 0 ? 1.06 : 0.94))); redrawPv(); persistSoon(); }, { passive: false });
    $('#zoom').addEventListener('input', (e) => { const p = S.photos[S.sel]; if (!p) return; p.cfg.z = parseFloat(e.target.value); redrawPv(); persistSoon(); });
    $('#bFill').addEventListener('click', () => { const p = S.photos[S.sel]; p.cfg = { z: 1, x: 0, y: 0 }; redrawPv(); persist(p); });
    $('#bFit').addEventListener('click', () => { const p = S.photos[S.sel]; p.cfg = { z: containZ(p), x: 0, y: 0 }; redrawPv(); persist(p); });
    $('#bReset').addEventListener('click', () => $('#bFill').click());
    const move = (d) => { const i = S.sel, j = i + d; if (j < 0 || j >= S.photos.length) return; [S.photos[i], S.photos[j]] = [S.photos[j], S.photos[i]]; S.sel = j; persistAll(); renderThumbs(); };
    $('#bLeft').addEventListener('click', () => move(-1));
    $('#bRight').addEventListener('click', () => move(1));
    $('#bDel').addEventListener('click', () => {
      const p = S.photos[S.sel]; if (!p) return;
      if (!confirm('Delete this photo?')) return;
      DB.del(p.id); URL.revokeObjectURL(p.url); S.photos.splice(S.sel, 1); persistAll();
      if (S.photos.length) select(Math.min(S.sel, S.photos.length - 1)); else { S.sel = -1; renderThumbs(); }
    });
    $('#bSave').addEventListener('click', () => exportPng(S.photos[S.sel]));
    const field = (sel, key, fn) => $(sel).addEventListener('input', (e) => { const p = S.photos[S.sel]; if (!p) return; p[key] = fn ? fn(e.target.value) : e.target.value; persistSoon(); if (key === 'answer') renderThumbs(); });
    field('#fCap', 'caption'); field('#fAns', 'answer'); field('#fIntro', 'intro'); field('#fDur', 'dur');
    $('#fileIn').addEventListener('change', async (e) => {
      const files = Array.from(e.target.files || []).filter((f) => /^image\//.test(f.type));
      let first = -1;
      for (const f of files) { try { const p = await addPhoto(f); persist(p); if (first < 0) first = S.photos.length - 1; } catch (err) { /* skip */ } }
      e.target.value = '';
      if (first >= 0) select(first);
    });
  }
  async function exportPng(p) {
    if (!p) return;
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const x = c.getContext('2d');
    const im = await new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.src = p.url; });
    const bg = layoutImg({ w: p.w, h: p.h, cfg: { z: 1, x: 0, y: 0 } }, W, H);
    try { x.filter = 'blur(40px) brightness(.55)'; } catch (e) { /* ignore */ }
    x.drawImage(im, bg.l - 60, bg.t - 60, bg.w + 120, bg.h + 120);
    x.filter = 'none';
    const L = layoutImg(p, W, H);
    x.drawImage(im, L.l, L.t, L.w, L.h);
    c.toBlob((b) => { const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'photo-' + (S.photos.indexOf(p) + 1) + '-1080x1920.png'; a.click(); }, 'image/png');
  }

  // ---------------- voice (browser speech synthesis) ----------------
  const hasTTS = 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
  const TTS = { q: [], busy: false, voice: null };
  function listVoices() { return hasTTS ? (speechSynthesis.getVoices() || []) : []; }
  function fillVoices() {
    const sel = $('#selVoice');
    const lang = $('#selLang').value;
    const all = listVoices();
    const match = all.filter((v) => (v.lang || '').toLowerCase().replace('_', '-').startsWith(lang));
    const use = match.length ? match : all;
    const srv = (S.srvVoices || []).filter((v) => v.lang.toLowerCase().startsWith(lang));
    sel.innerHTML = '';
    srv.forEach((v) => { const o = document.createElement('option'); o.value = 'srv:' + v.id; o.textContent = '★ ' + v.label + ' — Neural (best)'; sel.appendChild(o); });
    use.forEach((v) => { const o = document.createElement('option'); o.value = v.voiceURI; o.textContent = v.name + ' (' + v.lang + ')'; sel.appendChild(o); });
    if (S.cfg.voiceManual && S.cfg.voiceURI && Array.from(sel.options).some((o) => o.value === S.cfg.voiceURI)) sel.value = S.cfg.voiceURI;
    const hint = $('#voiceHint');
    if (!hasTTS && !srv.length) { hint.hidden = false; hint.textContent = '⚠ This browser has no voice engine. Use Chrome or Edge.'; }
    else if (!all.length && !srv.length) { hint.hidden = false; hint.textContent = 'Voices are still loading… (tap Test voice in a moment)'; }
    else if (!match.length && !srv.length) { hint.hidden = false; hint.textContent = '⚠ No ' + $('#selLang').selectedOptions[0].textContent + ' voice on this device — showing all voices. Add a neural voice (see TTS-SETUP.md) or use Microsoft Edge / Chrome on Android.'; }
    else hint.hidden = true;
    $('#neuralHint').textContent = srv.length
      ? '★ Neural voices are active — natural, human-like speech.'
      : 'Want the most natural Telugu voice? Add a free speech key on Vercel (2 minutes) — see TTS-SETUP.md. Until then your device voice is used.';
    pickVoice();
  }
  function pickVoice() {
    const v = $('#selVoice').value || '';
    if (v.indexOf('srv:') === 0) { TTS.server = v.slice(4); TTS.voice = null; return; }
    TTS.server = null;
    TTS.voice = listVoices().find((x) => x.voiceURI === v) || null;
  }
  const ttsCache = new Map();
  async function serverUrl(text) {
    const key = TTS.server + '|' + S.cfg.rate + '|' + S.cfg.pitch + '|' + text;
    if (ttsCache.has(key)) return ttsCache.get(key);
    const r = await fetch('/api/tts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text, voice: TTS.server, rate: S.cfg.rate, pitch: S.cfg.pitch }) });
    if (!r.ok || !/audio/.test(r.headers.get('content-type') || '')) throw new Error('tts');
    const url = URL.createObjectURL(await r.blob());
    if (ttsCache.size > 80) { const k = ttsCache.keys().next().value; URL.revokeObjectURL(ttsCache.get(k)); ttsCache.delete(k); }
    ttsCache.set(key, url);
    return url;
  }
  const clean = (n) => {
    const t = String(n || '').replace(/^@/, '').replace(/[^\p{L}\p{M}\p{N} ._-]/gu, '').replace(/[._-]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 22);
    return t || ({ te: 'మిత్రమా', hi: 'दोस्त', ta: 'நண்பரே' }[S.cfg.lang] || 'friend');
  };
  function setTalking() { /* nothing on screen: the photo is the only thing viewers see */ }
  // priority: 3 = correct answer, 2 = reactions/greetings, 1 = filler
  function say(text, pri) {
    return new Promise((resolve) => {
      text = String(text || '').trim();
      if (!text) return resolve();
      pri = pri || 1;
      if (TTS.q.length >= 4) {
        let idx = -1, low = 9;
        TTS.q.forEach((it, i) => { if (it.pri < low || (it.pri === low && idx < 0)) { low = it.pri; idx = i; } });
        if (low <= pri) { const d = TTS.q.splice(idx, 1)[0]; d.resolve(); } else return resolve();
      }
      TTS.q.push({ text, pri, resolve });
      pump();
    });
  }
  function pump() {
    if (TTS.busy || S.paused || !TTS.q.length) return;
    TTS.q.sort((a, b) => b.pri - a.pri);
    const it = TTS.q.shift();
    TTS.busy = true; setTalking(true);
    S.spoken = (S.spoken || []); S.spoken.push(it.text);
    let done = false, usedDevice = false;
    const fin = () => { if (done) return; done = true; clearTimeout(guard); TTS.audio = null; TTS.busy = false; setTalking(false); it.resolve(); setTimeout(pump, 120 / SPEED); };
    const guard = setTimeout(fin, (it.text.length * 160 + 15000) / SPEED);
    const device = () => {
      if (usedDevice || done) return;
      usedDevice = true;
      if (!hasTTS) return fin();
      try {
        const u = new SpeechSynthesisUtterance(it.text);
        const dv = TTS.voice || listVoices().find((v) => (v.lang || '').toLowerCase().startsWith(S.cfg.lang));
        if (dv) { u.voice = dv; u.lang = dv.lang; } else u.lang = { te: 'te-IN', en: 'en-IN', hi: 'hi-IN', ta: 'ta-IN' }[S.cfg.lang] || 'en-US';
        u.rate = S.cfg.rate; u.pitch = S.cfg.pitch; u.volume = S.cfg.vol;
        u.onend = fin; u.onerror = fin;
        speechSynthesis.speak(u);
      } catch (e) { fin(); }
    };
    if (TTS.server) {
      serverUrl(it.text).then((url) => {
        if (done) return;
        const a = new Audio(url); TTS.audio = a; a.volume = S.cfg.vol;
        a.onended = fin; a.onerror = device;
        const pr = a.play(); if (pr && pr.catch) pr.catch(device);
      }).catch(device);
    } else device();
  }
  function stopSpeech() { TTS.q.splice(0).forEach((i) => i.resolve()); try { if (TTS.audio) TTS.audio.pause(); } catch (e) { /* ignore */ } TTS.audio = null; try { speechSynthesis.cancel(); } catch (e) { /* ignore */ } TTS.busy = false; setTalking(false); }
  setInterval(() => { try { if (hasTTS && speechSynthesis.paused && !S.paused) speechSynthesis.resume(); } catch (e) { /* ignore */ } }, 5000);

  // ---------------- sentences ----------------
  const T = () => ({
    welcome: $('#tWelcome').value, correct: $('#tCorrect').value, also: $('#tAlso').value, wrong: $('#tWrong').value,
    timeup: $('#tTimeup').value, newv: $('#tNewv').value, engage: $('#tEngage').value,
    convo: $('#tConvo').value, readc: $('#tReadc').value, hurry: $('#tHurry').value,
  });
  const fill = (tpl, o) => String(tpl || '').replace(/\{name\}/g, o.name || '').replace(/\{names\}/g, o.names || '').replace(/\{answer\}/g, o.answer || '');
  const joinNames = (arr) => {
    const w = { te: ' మరియు ', en: ' and ', hi: ' और ', ta: ' மற்றும் ' }[S.cfg.lang] || ' and ';
    return arr.length <= 1 ? (arr[0] || '') : arr.slice(0, -1).join(', ') + w + arr[arr.length - 1];
  };
  function loadTpl(lang, force) {
    const saved = force ? null : LS.get('studio.tpl.' + lang, null);
    const t = Object.assign({}, TPL[lang] || TPL.en, saved || {});
    Object.keys(TPL_FIELDS).forEach((k) => { $(TPL_FIELDS[k]).value = t[k] || ''; });
  }
  const saveTpl = () => LS.set('studio.tpl.' + $('#selLang').value, T());

  // ---------------- answer matching ----------------
  const norm = (s) => String(s || '').toLowerCase().normalize('NFC').replace(/[^\p{L}\p{M}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();
  function lev(a, b) {
    if (Math.abs(a.length - b.length) > 1) return 9;
    const dp = Array.from({ length: a.length + 1 }, (_, i) => [i]);
    for (let j = 1; j <= b.length; j++) dp[0][j] = j;
    for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return dp[a.length][b.length];
  }
  function isCorrect(text, answers) {
    let t = norm(text).replace(/^(ans|answer|answers|జవాబు|సమాధానం|उत्तर|जवाब|பதில்)\s+/, '');
    if (!t) return false;
    for (const a of answers) {
      const n = norm(a);
      if (!n) continue;
      if (t === n) return true;
      if (n.length >= 3 && t.length <= n.length + 40 && (' ' + t + ' ').includes(' ' + n + ' ')) return true;
      if (n.length >= 3 && /[ఀ-౿ऀ-ॿ஀-௿]/.test(n) && t.length <= n.length + 40 && t.includes(n)) return true; // suffixes attach to the word
      if (/^[a-z0-9 ]+$/.test(n) && n.length >= 5 && lev(t, n) <= 1) return true;
    }
    return false;
  }
  const answersOf = (p) => String(p.answer || '').split(',').map((s) => s.trim()).filter(Boolean);

  // ---------------- chat ----------------
  function extractId(input) {
    const s = String(input || '').trim();
    if (/^[\w-]{11}$/.test(s)) return s;
    try {
      const u = new URL(/^https?:\/\//i.test(s) ? s : 'https://' + s);
      const host = u.hostname.replace(/^(www\.|m\.)/, '');
      if (host === 'youtu.be') { const id = u.pathname.slice(1).split('/')[0]; return /^[\w-]{11}$/.test(id) ? id : null; }
      if (host.endsWith('youtube.com')) {
        const v = u.searchParams.get('v');
        if (v && /^[\w-]{11}$/.test(v)) return v;
        const m = u.pathname.match(/^\/(?:live|shorts|embed|v)\/([\w-]{11})/);
        if (m) return m[1];
      }
    } catch (e) { /* ignore */ }
    return null;
  }
  const isChannelRef = (s) => /^@[\w.\-]{2,}$/.test(String(s).trim()) || /youtube\.com\/(@[\w.\-%]+|channel\/|c\/|user\/)/i.test(String(s));

  function onChat(msgs) {
    for (const m of msgs) {
      S.msgCount++;
      const key = m.uid || m.name;
      const name = clean(m.name);
      if (!S.seenUsers.has(key)) { S.seenUsers.add(key); if (S.cfg.greet) { S.newQ.push(name); if (S.newQ.length > 12) S.newQ.shift(); } }
      const cc = S.cur;
      if (S.cfg.read && !(cc && cc.answers.length && isCorrect(m.text, cc.answers))) {
        const rd = readable(m.text);
        if (rd) { S.chatQ.push({ name, text: rd }); if (S.chatQ.length > 10) S.chatQ.shift(); }
      }
      const c = S.cur;
      if (!c || c.revealed || !c.answers.length) continue;
      if (c.solved.has(key)) continue;
      if (isCorrect(m.text, c.answers)) {
        c.solved.set(key, { name, photo: m.photo || '' });
        if (c.solved.size === 1) firstWinner(name, m.photo, c);
        else S.alsoQ.push(name);
      } else if (S.cfg.wrong && String(m.text || '').trim().length <= 40) {
        S.wrongQ.push(name); if (S.wrongQ.length > 8) S.wrongQ.shift();
      }
    }
  }
  function readable(raw) {
    raw = String(raw || '');
    if (/https?:|www\.|\.com|\.in\b|@/i.test(raw)) return '';
    const t = raw.replace(/[^\p{L}\p{M}\p{N}\s.,!?'-]/gu, ' ').replace(/\s+/g, ' ').trim();
    if (t.length < 4 || t.length > 80 || !/\p{L}{2,}/u.test(t) || /^(ans(wer)?\s*)?[a-d1-4]$/i.test(t)) return '';
    if (/^answer\s+\S{1,3}$/i.test(t)) return '';
    return t;
  }
  function firstWinner(name, photo, c) {
    const t = T();
    say(fill(t.correct, { name, answer: c.answers[0] }), 3);
    $('#wName').textContent = name;
    $('#wSub').textContent = '✔ ' + ({ te: 'సరైన సమాధానం!', hi: 'सही जवाब!', ta: 'சரியான பதில்!' }[S.cfg.lang] || 'Correct answer!');
    const av = $('#wAv'); av.hidden = !photo; av.src = photo || '';
    av.onerror = () => { av.hidden = true; };
    $('#winner').hidden = !S.cfg.xWin;
    reveal(c);
    c.afterAt = performance.now() + (S.cfg.after * 1000) / SPEED;
  }
  function reveal(c) {
    c.revealed = true;
    const q = $('#qbox'); q.hidden = !S.cfg.xQ; q.classList.add('ans');
    $('#qsub').textContent = '✔ ' + c.answers[0];
  }

  // chat-driven reactions (one thing at a time, never overlapping)
  function reactTick() {
    if (!S.running || S.paused || TTS.busy || TTS.q.length) return;
    const now = performance.now(), gap = (ms) => (ms * 1000) / (SPEED * 1000);
    const t = T();
    if (S.alsoQ.length) {
      const names = Array.from(new Set(S.alsoQ.splice(0))).slice(0, 3);
      say(fill(t.also, { names: joinNames(names) }), 2); return;
    }
    if (S.newQ.length && now - S.lastNew > 14000 / SPEED) {
      const names = Array.from(new Set(S.newQ.splice(0))).slice(-3);
      S.lastNew = now; say(fill(t.newv, { names: joinNames(names) }), 2); return;
    }
    if (S.wrongQ.length && S.cur && !S.cur.revealed && now - S.lastWrong > 16000 / SPEED) {
      const nm = S.wrongQ[(Math.random() * S.wrongQ.length) | 0]; S.wrongQ.length = 0;
      S.lastWrong = now; say(fill(t.wrong, { name: nm }), 2); return;
    }
    if (S.cfg.read && S.chatQ.length && now - S.lastRead > 24000 / SPEED) {
      const it = S.chatQ[(Math.random() * S.chatQ.length) | 0]; S.chatQ.length = 0;
      S.lastRead = now; say(String(t.readc || '').replace(/\{name\}/g, it.name).replace(/\{text\}/g, it.text), 2); return;
    }
    const cl = String(t.convo || '').split('\n').map((x) => x.trim()).filter(Boolean);
    if (cl.length && now - S.lastConvo > (S.cfg.convoSec * 1000) / SPEED) {
      S.lastConvo = now; say(cl[S.convoIdx++ % cl.length], 2); return;
    }
    const lines = String(t.engage || '').split('\n').map((s) => s.trim()).filter(Boolean);
    if (lines.length && now - S.lastEngage > (S.cfg.engageSec * 1000) / SPEED) {
      S.lastEngage = now; say(lines[S.engageIdx++ % lines.length], 1);
    }
  }

  // ---------------- stage: photos ----------------
  let layerFlip = 0;
  function showPhoto(p, durSec) {
    const wrap = $('#layers');
    const L = document.createElement('div');
    L.className = 'layer';
    const bg = document.createElement('div'); bg.className = 'pvbg'; bg.style.backgroundImage = `url(${p.url})`;
    const mv = document.createElement('div'); mv.className = 'mover';
    const img = document.createElement('img'); img.src = p.url; place(img, p, W, H);
    mv.appendChild(img);
    if (S.cfg.motion !== 'none') { mv.classList.add('mv-' + S.cfg.motion); mv.style.setProperty('--dur', durSec + 's'); }
    L.appendChild(bg); L.appendChild(mv);
    wrap.appendChild(L);
    requestAnimationFrame(() => requestAnimationFrame(() => L.classList.add('on')));
    const old = Array.from(wrap.children).filter((x) => x !== L);
    old.forEach((o) => { o.classList.remove('on'); setTimeout(() => o.remove(), 1100); });
  }
  function fitText(el, len) { el.style.fontSize = (len > 90 ? 38 : len > 55 ? 44 : 52) + 'px'; }

  async function waitFor(fn, runId) { // poll every 250ms until fn() true
    while (S.runId === runId && !fn()) await sleep(250);
    return S.runId === runId;
  }
  async function playPhoto(p, runId) {
    const answers = answersOf(p);
    const dur = Math.max(5, parseInt(p.dur, 10) || (answers.length ? 59 : 40));
    S.cur = { p, answers, solved: new Map(), revealed: false, afterAt: 0 };
    const c = S.cur;
    $('#winner').hidden = true;
    $('#qbox').classList.remove('ans');
    $('#qsub').textContent = '';
    const cap = (p.caption || '').trim();
    $('#qbox').hidden = !S.cfg.xQ || (!cap && !answers.length);
    $('#qtext').textContent = cap || '❓';
    fitText($('#qtext'), cap.length);
    showPhoto(p, dur);
    const intro = (p.intro || '').trim() || cap;
    if (intro) say(intro, 2);
    $('#timer').hidden = !S.cfg.xTimer || !answers.length;
    const t0 = performance.now();
    S.skip = 0;
    const ok = await waitFor(() => {
      if (S.paused) { c.pausedAt = c.pausedAt || performance.now(); return false; }
      if (c.pausedAt) { const d = performance.now() - c.pausedAt; c.pausedAt = 0; c.t0shift = (c.t0shift || 0) + d; if (c.afterAt) c.afterAt += d; }
      const el = (performance.now() - t0 - (c.t0shift || 0)) * SPEED / 1000;
      const left = Math.max(0, Math.ceil(dur - el));
      $('#timerNum').textContent = left;
      if (answers.length && !c.revealed) {
        if (!c.half && dur >= 30 && el >= dur / 2) { c.half = true; if (intro) say(intro, 2); }
        if (!c.hurry && dur > 25 && left <= 10 && left > 0) { c.hurry = true; say(T().hurry, 2); }
      }
      $('#timer').classList.toggle('low', left <= 10);
      if (S.skip) return true;
      if (c.afterAt && performance.now() >= c.afterAt && S.cfg.after >= 0) return true;
      return el >= dur;
    }, runId);
    if (!ok) return false;
    if (answers.length && !c.revealed && !S.skip) {
      reveal(c);
      await say(fill(T().timeup, { answer: answers[0] }), 3);
      await sleep(2500);
    }
    S.skip = 0;
    return S.runId === runId;
  }

  async function runShow() {
    const runId = ++S.runId;
    S.running = true;
    stopSpeech();
    S.lastEngage = performance.now(); S.lastNew = performance.now(); S.lastRead = performance.now();
    S.lastConvo = performance.now() - Math.max(0, (S.cfg.convoSec - 20) * 1000) / SPEED;
    say(fill(T().welcome, {}), 2);
    let i = 0;
    while (S.runId === runId) {
      const n = S.photos.length;
      if (i % n === 0 || S.order.length !== n) {
        S.order = S.photos.map((_, k) => k);
        if (S.cfg.shuffle) for (let k = n - 1; k > 0; k--) { const r = (Math.random() * (k + 1)) | 0; [S.order[k], S.order[r]] = [S.order[r], S.order[k]]; }
      }
      const pk = S.order[i % n];
      const p = S.photos[pk];
      S.idx = pk;
      const ok = await playPhoto(p, runId);
      if (!ok) return;
      if (S.back) { i = Math.max(0, i - 1); S.back = false; } else i++;
      if (!S.cfg.loop && i >= S.photos.length) { await say(({ te: 'ధన్యవాదాలు! మళ్ళీ కలుద్దాం!', hi: 'धन्यवाद! फिर मिलेंगे!', ta: 'நன்றி! மீண்டும் சந்திப்போம்!', en: 'Thank you all! See you next time!' })[S.cfg.lang], 3); return; }
    }
  }

  // ---------------- start / stop ----------------
  function readCfg() {
    S.cfg = Object.assign(S.cfg, {
      video: $('#inVideo').value.trim(), chan: $('#inChan').value.trim(), lang: $('#selLang').value, voiceURI: $('#selVoice').value,
      rate: parseFloat($('#rRate').value), pitch: parseFloat($('#rPitch').value), vol: parseFloat($('#rVol').value),
      engageSec: Math.max(20, parseInt($('#inEngage').value, 10) || 90), after: Math.max(0, parseInt($('#inAfter').value, 10) || 0),
      motion: $('#selMotion').value, greet: $('#chkGreet').checked, wrong: $('#chkWrong').checked, loop: $('#chkLoop').checked,
      xQ: $('#xQ').checked, xWin: $('#xWin').checked, xTimer: $('#xTimer').checked, xBadge: $('#xBadge').checked,
      read: $('#chkRead').checked, shuffle: $('#chkShuffle').checked, convoSec: Math.max(15, parseInt($('#inConvo').value, 10) || 45),
    });
    LS.set('studio.cfg', S.cfg);
    saveTpl();
  }
  function fillCfg() {
    const c = S.cfg;
    $('#inVideo').value = c.video; $('#inChan').value = c.chan; $('#selLang').value = c.lang;
    $('#rRate').value = c.rate; $('#rPitch').value = c.pitch; $('#rVol').value = c.vol;
    $('#inEngage').value = c.engageSec; $('#inAfter').value = c.after; $('#selMotion').value = c.motion;
    $('#chkGreet').checked = c.greet; $('#chkWrong').checked = c.wrong; $('#chkLoop').checked = c.loop;
    $('#xQ').checked = c.xQ; $('#xWin').checked = c.xWin; $('#xTimer').checked = c.xTimer; $('#xBadge').checked = c.xBadge;
    $('#chkRead').checked = c.read; $('#chkShuffle').checked = c.shuffle; $('#inConvo').value = c.convoSec;
    loadTpl(c.lang, false);
  }
  function err(msg) { const e = $('#setupErr'); e.hidden = !msg; e.textContent = msg || ''; }

  const FAKE = ['Ravi', 'Sita', 'Kiran', 'Anil', 'Divya', 'Mahesh', 'Lakshmi', 'Venkat', 'Pooja', 'Suresh', 'Harsha', 'Madhu'];
  function startDemoChat() {
    let n = 0;
    S.chat = { stop() { clearInterval(this.t); }, t: setInterval(() => {
      if (S.paused) return;
      const who = FAKE[(Math.random() * FAKE.length) | 0] + ((Math.random() * 30) | 0);
      const c = S.cur; let text;
      const r = Math.random();
      if (c && c.answers.length && r < 0.22) text = c.answers[0];
      else if (r < 0.6) text = ['hi', 'hello 🙏', 'super', 'wow', 'అన్నా', 'D', 'nice'][(Math.random() * 7) | 0];
      else text = 'answer ' + ['a', 'b', 'c'][(Math.random() * 3) | 0];
      onChat([{ id: 'd' + n++, uid: who, name: who, photo: '', text }]);
    }, 1400 / SPEED) };
  }

  function start(demo) {
    err('');
    readCfg();
    if (!S.photos.length) return err('Add at least one photo first.');
    if (!demo && !(extractId(S.cfg.video) || isChannelRef(S.cfg.video))) return err('Paste your YouTube live link (or channel link), or try Demo.');
    pickVoice();
    try { const a = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA='); const pr = a.play(); if (pr && pr.catch) pr.catch(() => {}); } catch (e) { /* ignore */ }
    S.demo = !!demo; S.paused = false; S.seenUsers = new Set(); S.newQ = []; S.wrongQ = []; S.alsoQ = []; S.chatQ = []; S.spoken = [];
    $('#chName').textContent = S.cfg.chan; $('#topbar').hidden = !S.cfg.xBadge;
    $('#setup').classList.add('hidden');
    $('#layers').innerHTML = '';
    if (S.chat) S.chat.stop();
    if (demo) startDemoChat();
    else {
      S.chat = new window.ChatClient({
        video: extractId(S.cfg.video) || S.cfg.video, apiKey: '', onMessages: onChat,
        onStatus: (st) => { S.chatStatus = st.text; updateHost(); },
      });
      S.chat.start();
    }
    if (hasTTS) { try { speechSynthesis.cancel(); } catch (e) { /* ignore */ } }
    runShow();
    updateHost(); pokeGear();
  }
  function stop() {
    S.runId++; S.running = false; stopSpeech();
    if (S.chat) S.chat.stop();
    $('#setup').classList.remove('hidden');
  }

  // ---------------- host controls ----------------
  function updateHost() { $('#hostStatus').textContent = `${S.demo ? '🧪 DEMO' : '📡 LIVE'} · ${S.chatStatus} · photo ${(S.idx || 0) + 1}/${S.photos.length} · 💬 ${S.msgCount}${S.paused ? ' · ⏸' : ''}`; }
  function togglePause() { S.paused = !S.paused; $('#pauseBadge').hidden = !S.paused; if (S.paused) { try { speechSynthesis.pause(); if (TTS.audio) TTS.audio.pause(); } catch (e) { /* ignore */ } } else { try { speechSynthesis.resume(); if (TTS.audio) TTS.audio.play(); } catch (e) { /* ignore */ } pump(); } updateHost(); }
  function pokeGear() { const g = $('#gear'); g.classList.add('vis'); clearTimeout(pokeGear.t); pokeGear.t = setTimeout(() => g.classList.remove('vis'), 3000); }
  window.addEventListener('mousemove', pokeGear); window.addEventListener('touchstart', pokeGear, { passive: true });
  $('#gear').addEventListener('click', () => { $('#host').hidden = !$('#host').hidden; updateHost(); });
  $('#hPause').addEventListener('click', togglePause);
  $('#hNext').addEventListener('click', () => { S.skip = 1; });
  $('#hPrev').addEventListener('click', () => { S.back = true; S.skip = 1; });
  $('#hWelcome').addEventListener('click', () => say(fill(T().welcome, {}), 3));
  $('#hStop').addEventListener('click', stop);
  window.addEventListener('keydown', (e) => {
    if (/INPUT|TEXTAREA|SELECT/.test(e.target.tagName || '') || !S.running) return;
    const k = e.key.toLowerCase();
    if (k === 'h') $('#host').hidden = !$('#host').hidden;
    else if (k === ' ') { e.preventDefault(); togglePause(); }
    else if (k === 'n') S.skip = 1;
  });
  setInterval(() => { reactTick(); if (S.running && !$('#host').hidden) updateHost(); }, 1000 / SPEED);

  // ---------------- boot ----------------
  function rescale() {
    const s = Math.min(innerWidth / W, innerHeight / H);
    $('#stage').style.transform = `translate(-50%,-50%) scale(${s})`;
  }
  addEventListener('resize', rescale); rescale();

  $('#selLang').addEventListener('change', () => { S.cfg.lang = $('#selLang').value; loadTpl(S.cfg.lang, false); fillVoices(); });
  $('#selVoice').addEventListener('change', () => { S.cfg.voiceURI = $('#selVoice').value; S.cfg.voiceManual = true; LS.set('studio.cfg', S.cfg); pickVoice(); });
  $('#bTest').addEventListener('click', () => {
    readCfg(); pickVoice(); stopSpeech();
    say(fill(T().correct, { name: ({ te: 'రవి', hi: 'रवि', ta: 'ரவி' })[S.cfg.lang] || 'Ravi' }), 3);
  });
  $('#bTplReset').addEventListener('click', () => loadTpl($('#selLang').value, true));
  Object.values(TPL_FIELDS).forEach((s) => $(s).addEventListener('input', saveTpl));
  $('#btnStart').addEventListener('click', () => start(false));
  $('#btnDemo').addEventListener('click', () => start(true));
  if (hasTTS) { speechSynthesis.onvoiceschanged = fillVoices; }
  fetch('/api/tts?check=1').then((r) => r.json()).then((j) => { S.srvVoices = (j && j.voices) || []; fillVoices(); }).catch(() => {});

  bindEditor();
  fillCfg();
  fillVoices();
  DB.open().then(DB.all).then(async (rows) => {
    rows.sort((a, b) => (a.order || 0) - (b.order || 0));
    for (const r of rows) { try { await addPhoto(r.blob, { id: r.id, cfg: r.cfg || { z: 1, x: 0, y: 0 }, caption: r.caption || '', answer: r.answer || '', intro: r.intro || '', dur: r.dur || '' }); } catch (e) { /* skip bad */ } }
    if (S.photos.length) select(0);
    if (params.get('autostart') === 'demo') setTimeout(() => start(true), 200);
  });

  window.__studio = { S, isCorrect, norm, onChat, say, TPL };
})();
