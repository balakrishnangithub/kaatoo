// Speech + gentle sound engine.
// Tamil-first spoken output via the device speech synthesizer; soft synthesized
// chimes via WebAudio (no files, no ads, no loud reward sounds).

let voicesReady: SpeechSynthesisVoice[] = [];

function refreshVoices() {
  if (!('speechSynthesis' in window)) return;
  const v = window.speechSynthesis.getVoices();
  if (v.length) voicesReady = v;
}
if ('speechSynthesis' in window) {
  refreshVoices();
  window.speechSynthesis.onvoiceschanged = refreshVoices;
}

function pickVoice(lang: 'ta' | 'en'): SpeechSynthesisVoice | null {
  if (!voicesReady.length) refreshVoices();
  const vs = voicesReady;
  const find = (fn: (v: SpeechSynthesisVoice) => boolean) => vs.find(fn) ?? null;
  if (lang === 'ta') {
    return (
      find((v) => v.lang === 'ta-IN') ??
      find((v) => v.lang.startsWith('ta')) ??
      find((v) => /tamil/i.test(v.name))
    );
  }
  return (
    find((v) => v.lang === 'en-IN') ??
    find((v) => v.lang === 'en-US') ??
    find((v) => v.lang.startsWith('en'))
  );
}

let muted = false;
export function setMuted(m: boolean) {
  muted = m;
  if (m && 'speechSynthesis' in window) window.speechSynthesis.cancel();
}
export function isMuted() {
  return muted;
}

/** Speak a phrase. Tamil is slower and slightly higher — friendly for toddlers. */
export function speak(text: string, lang: 'ta' | 'en' = 'ta') {
  if (muted || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  const voice = pickVoice(lang);
  if (voice) u.voice = voice;
  u.lang = voice?.lang ?? (lang === 'ta' ? 'ta-IN' : 'en-US');
  u.rate = lang === 'ta' ? 0.82 : 0.9;
  u.pitch = 1.12;
  u.volume = 0.95;
  window.speechSynthesis.speak(u);
}

/**
 * Speak a sequence of words one after another — each utterance starts ONLY
 * after the previous one fully ends (no cutting words off mid-way).
 * onStep(i) fires as word i STARTS, so visuals can highlight in perfect sync
 * with the voice. Returns a cancel function.
 * If speech is unavailable/muted, steps still advance on a calm timer so the
 * animation keeps working silently.
 */
export function speakSeq(
  texts: string[],
  lang: 'ta' | 'en',
  opts?: { onStep?: (i: number) => void; onDone?: () => void; gapMs?: number },
): () => void {
  let cancelled = false;
  let timer = 0;
  const gap = opts?.gapMs ?? 260;
  const canSpeak = !muted && 'speechSynthesis' in window;

  const step = (i: number) => {
    if (cancelled) return;
    if (i >= texts.length) {
      opts?.onDone?.();
      return;
    }
    opts?.onStep?.(i);
    if (!canSpeak) {
      // silent mode: still walk through the items at a reading pace
      timer = window.setTimeout(() => step(i + 1), 900);
      return;
    }
    const u = new SpeechSynthesisUtterance(texts[i]);
    const voice = pickVoice(lang);
    if (voice) u.voice = voice;
    u.lang = voice?.lang ?? (lang === 'ta' ? 'ta-IN' : 'en-US');
    u.rate = 0.82;
    u.pitch = 1.12;
    u.volume = 0.95;
    let advanced = false;
    const next = () => {
      if (advanced || cancelled) return;
      advanced = true;
      timer = window.setTimeout(() => step(i + 1), gap);
    };
    u.onend = next;
    u.onerror = next;
    // safety: some engines occasionally drop onend — never stall the lesson
    timer = window.setTimeout(next, 2600 + texts[i].length * 220);
    window.speechSynthesis.speak(u);
  };

  // let any instruction line currently playing finish its first beat
  timer = window.setTimeout(() => step(0), 420);
  return () => {
    cancelled = true;
    window.clearTimeout(timer);
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  };
}

/** Tamil then English — how the app introduces English gradually. */
export function speakPair(ta: string, en: string, withEnglish: boolean) {
  if (muted) return;
  speak(ta, 'ta');
  if (!withEnglish || !('speechSynthesis' in window)) return;
  const u = new SpeechSynthesisUtterance(en);
  const voice = pickVoice('en');
  if (voice) u.voice = voice;
  u.lang = voice?.lang ?? 'en-IN';
  u.rate = 0.88;
  u.pitch = 1.1;
  window.setTimeout(() => {
    if (!muted) window.speechSynthesis.speak(u);
  }, 350);
}

// ---------------- gentle tones ----------------
let ctx: AudioContext | null = null;
function ac(): AudioContext | null {
  try {
    if (!ctx)
      ctx = new (
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      )();
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(freq: number, at: number, dur = 0.22, type: OscillatorType = 'sine', vol = 0.16) {
  const c = ac();
  if (!c || muted) return;
  const t = c.currentTime + at;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(c.destination);
  o.start(t);
  o.stop(t + dur + 0.05);
}

/** soft two-note marimba-ish "well done" */
export function chimeGood() {
  tone(523.25, 0, 0.24, 'sine', 0.14);
  tone(783.99, 0.12, 0.34, 'sine', 0.12);
}
/** tiny low blip for "not quite" — never harsh */
export function chimeSoft() {
  tone(220, 0, 0.16, 'sine', 0.07);
}
/** bubble pop */
export function chimePop() {
  tone(880 + Math.random() * 220, 0, 0.09, 'triangle', 0.1);
}
/** page turn / card flip */
export function chimeTap() {
  tone(660, 0, 0.07, 'sine', 0.06);
}
