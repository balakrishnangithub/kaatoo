// Speech + gentle sound engine.
// Tamil-first spoken output via the device speech synthesizer; soft synthesized
// chimes via WebAudio (no files, no ads, no loud reward sounds).

import { audioOut, setAudible } from './audio';

type Lang = 'ta' | 'en';

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

function pickVoice(lang: Lang): SpeechSynthesisVoice | null {
  if (!voicesReady.length) refreshVoices();
  // offline, a cloud voice (Edge's "Online (Natural)" ones) cannot speak — use one on the device
  const offline = typeof navigator !== 'undefined' && navigator.onLine === false;
  const vs = offline ? voicesReady.filter((v) => v.localService) : voicesReady;
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

/** One voice per language. Tamil is slower and slightly higher — friendly for toddlers. */
const VOICE: Record<Lang, { fallback: string; rate: number }> = {
  ta: { fallback: 'ta-IN', rate: 0.82 },
  en: { fallback: 'en-IN', rate: 0.9 },
};

function utterance(text: string, lang: Lang): SpeechSynthesisUtterance {
  const u = new SpeechSynthesisUtterance(text);
  const voice = pickVoice(lang);
  if (voice) u.voice = voice;
  u.lang = voice?.lang ?? VOICE[lang].fallback;
  u.rate = VOICE[lang].rate;
  u.pitch = 1.12;
  u.volume = 0.95;
  return u;
}

let muted = false;
const canSpeak = () => !muted && 'speechSynthesis' in window;

/** the speakSeq currently holding the floor — any other line takes it away */
let activeSeq: object | null = null;

/** Stop talking: drops whatever is being said and everything queued behind it. */
export function hush() {
  activeSeq = null;
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
}

export function setMuted(m: boolean) {
  muted = m;
  setAudible(!m);
  if (m) hush();
}

export interface SpeakOptions {
  /** wait for whatever is already being said instead of cutting it off */
  queue?: boolean;
}

/**
 * Speak a phrase. By default it interrupts — the newest line is the one that
 * matters. Pass `{ queue: true }` for a line that must FOLLOW the previous one
 * (a question after its instruction), so neither is clipped.
 */
export function speak(text: string, lang: Lang = 'ta', opts?: SpeakOptions) {
  if (!canSpeak()) return;
  if (!opts?.queue) hush();
  window.speechSynthesis.speak(utterance(text, lang));
}

/**
 * Tamil then English — how the app introduces English gradually. Both lines go
 * to the synthesizer together, so a later line can never land between them.
 */
export function speakPair(ta: string, en: string, withEnglish: boolean, opts?: SpeakOptions) {
  speak(ta, 'ta', opts);
  if (withEnglish) speak(en, 'en', { queue: true });
}

/**
 * Speak a sequence of words one after another — each utterance starts ONLY
 * after the previous one fully ends (no cutting words off mid-way).
 * onStep(i) fires as word i is handed to the voice, so visuals can highlight
 * in step with it. Returns a cancel function.
 * If speech is unavailable/muted, steps still advance on a calm timer so the
 * animation keeps working silently.
 *
 * A sequence never talks over anyone: an interrupting speak() ends it, and
 * cancelling it only silences its own words — never a line spoken since.
 */
export function speakSeq(
  texts: string[],
  lang: Lang,
  opts?: { onStep?: (i: number) => void; onDone?: () => void; gapMs?: number },
): () => void {
  const me = {};
  let cancelled = false;
  let held = false; // we have taken the floor at least once
  let speaking = false; // one of OUR words is with the synthesizer right now
  let timer = 0;
  const gap = opts?.gapMs ?? 260;

  const step = (i: number) => {
    if (cancelled) return;
    if (held && activeSeq !== me) return; // someone else spoke — the lesson yields
    if (i >= texts.length) {
      if (activeSeq === me) activeSeq = null;
      opts?.onDone?.();
      return;
    }
    opts?.onStep?.(i);
    if (!canSpeak()) {
      // silent mode: still walk through the items at a reading pace
      timer = window.setTimeout(() => step(i + 1), 900);
      return;
    }
    activeSeq = me;
    held = true;
    const u = utterance(texts[i], lang);
    let advanced = false;
    const next = () => {
      if (advanced || cancelled) return;
      advanced = true;
      speaking = false;
      window.clearTimeout(timer);
      timer = window.setTimeout(() => step(i + 1), gap);
    };
    u.onend = next;
    u.onerror = next;
    // safety: some engines occasionally drop onend — never stall the lesson
    timer = window.setTimeout(next, 2600 + texts[i].length * 220);
    speaking = true;
    window.speechSynthesis.speak(u);
  };

  // let any instruction line currently playing finish its first beat
  timer = window.setTimeout(() => step(0), 420);
  return () => {
    cancelled = true;
    window.clearTimeout(timer);
    if (speaking && activeSeq === me) hush();
  };
}

// ---------------- gentle tones ----------------
function tone(freq: number, at: number, dur = 0.22, type: OscillatorType = 'sine', vol = 0.16) {
  const a = audioOut();
  if (!a) return;
  const { c, out } = a;
  const t = c.currentTime + at;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(out);
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

/**
 * Which voices this device will use — for the parents' corner. Voice lists
 * arrive late on some browsers, so `onChange` is called again when they do.
 * Returns an unsubscribe function.
 */
export function watchVoices(
  onChange: (v: { ta: SpeechSynthesisVoice | null; en: SpeechSynthesisVoice | null }) => void,
): () => void {
  if (!('speechSynthesis' in window)) {
    onChange({ ta: null, en: null });
    return () => {};
  }
  const report = () => {
    refreshVoices();
    onChange({ ta: pickVoice('ta'), en: pickVoice('en') });
  };
  report();
  window.speechSynthesis.addEventListener?.('voiceschanged', report);
  const late = window.setTimeout(report, 800);
  return () => {
    window.speechSynthesis.removeEventListener?.('voiceschanged', report);
    window.clearTimeout(late);
  };
}
