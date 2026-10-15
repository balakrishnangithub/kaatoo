/**
 * sounds.ts — everything the listening games play, synthesised on the device
 * (no recordings to license, download or cache; the same on every phone).
 *
 * Built for small speakers: a phone barely reproduces anything below ~300 Hz,
 * so every sound carries its identity in the 300 Hz–4 kHz band. A low "voice"
 * keeps its pitch there through its harmonics — the ear hears the fundamental
 * from them even when the speaker cannot play it (the "missing fundamental").
 *
 * Every function schedules its sound and returns how long it lasts (seconds),
 * so a game can time what happens next by it. Nothing plays while the app's
 * sound is off (`audioOut` returns null) — the length is still returned, so
 * the game's choreography stays the same.
 */
import { audioOut } from './audio';

type Out = { c: AudioContext; out: AudioNode };

/* ---------- small building blocks ---------- */

const noises = new WeakMap<AudioContext, AudioBuffer>();
/** two seconds of white noise, made once per context */
function noiseBuffer(c: AudioContext): AudioBuffer {
  let b = noises.get(c);
  if (!b) {
    b = c.createBuffer(1, c.sampleRate * 2, c.sampleRate);
    const d = b.getChannelData(0);
    let seed = 12345;
    for (let i = 0; i < d.length; i++) {
      seed = (seed * 16807) % 2147483647;
      d[i] = (seed / 2147483647) * 2 - 1;
    }
    noises.set(c, b);
  }
  return b;
}

/** a gain node with a quick-attack, smooth-release envelope */
function envelope(a: Out, t0: number, dur: number, peak: number, attack = 0.02, release = 0.12) {
  const g = a.c.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(peak, t0 + attack);
  g.gain.setValueAtTime(peak, Math.max(t0 + attack, t0 + dur - release));
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  g.connect(a.out);
  return g;
}

function osc(a: Out, type: OscillatorType, t0: number, dur: number) {
  const o = a.c.createOscillator();
  o.type = type;
  o.start(t0);
  o.stop(t0 + dur + 0.05);
  return o;
}

function noise(a: Out, t0: number, dur: number) {
  const s = a.c.createBufferSource();
  s.buffer = noiseBuffer(a.c);
  s.start(t0, Math.random());
  s.stop(t0 + dur + 0.05);
  return s;
}

function filter(a: Out, type: BiquadFilterType, freq: number, q = 1) {
  const f = a.c.createBiquadFilter();
  f.type = type;
  f.frequency.value = freq;
  f.Q.value = q;
  return f;
}

const dB = (db: number) => 10 ** (db / 20);

/* ---------- a voice singing one note (Big voice, little voice) ---------- */

/** below this, a phone speaker plays almost nothing */
const SPEAKER_FLOOR_HZ = 300;
const HARMONICS = 7;
const falloff = (n: number) => 1 / n ** 1.1;
/** loudness of the part of a note a phone can play, from its harmonic weights */
const audiblePart = (weights: number[], freq: number) =>
  Math.sqrt(weights.reduce((s, w, i) => s + ((i + 1) * freq >= SPEAKER_FLOOR_HZ ? w * w : 0), 0));

/**
 * The make-up of a sung note at `freq`: seven harmonics, gently falling off,
 * with any a phone cannot play turned down — and a gain that makes the part a
 * phone CAN play equally loud at every pitch. Without it the low voice would
 * also be the quiet voice on a phone, and loudness would give the answer away.
 * (The ear still hears the low pitch from the harmonics above it.)
 */
export function voiceHarmonics(freq: number): { weights: number[]; gain: number } {
  const weights = Array.from(
    { length: HARMONICS },
    (_, i) => falloff(i + 1) * ((i + 1) * freq < SPEAKER_FLOOR_HZ ? 0.35 : 1),
  );
  const full = Array.from({ length: HARMONICS }, (_, i) => falloff(i + 1));
  return { weights, gain: audiblePart(full, Infinity) / audiblePart(weights, freq) };
}

export interface SingOptions {
  /** seconds from now */
  at?: number;
  /** length in seconds */
  dur?: number;
  /** loudness offset in dB — the games rove it a little, so loudness is never the clue */
  gainDb?: number;
}

/** one sung note at `freq` Hz; returns its length in seconds */
export function sing(freq: number, { at = 0, dur = 0.7, gainDb = 0 }: SingOptions = {}): number {
  const a = audioOut();
  if (!a) return dur;
  const t0 = a.c.currentTime + at;
  const { weights, gain } = voiceHarmonics(freq);
  const g = envelope(a, t0, dur, 0.12 * gain * dB(gainDb), 0.05, 0.16);
  const o = osc(a, 'sine', t0, dur);
  // amplitudes exactly as weighted — normalising would undo the loudness matching
  const imag = new Float32Array([0, ...weights]);
  o.setPeriodicWave(
    a.c.createPeriodicWave(new Float32Array(imag.length), imag, { disableNormalization: true }),
  );
  o.frequency.value = freq;
  // a little vibrato makes it a voice, not a beep — ±0.2% (3 cents) is far
  // below the smallest step the game ever asks about (100 cents)
  const lfo = osc(a, 'sine', t0, dur);
  lfo.frequency.value = 5.5;
  const depth = a.c.createGain();
  depth.gain.value = freq * 0.002;
  lfo.connect(depth).connect(o.frequency);
  o.connect(g);
  return dur;
}

/** `semitones` above (or below) `freq` */
export const shift = (freq: number, semitones: number) => freq * 2 ** (semitones / 12);

/** semitones between the two voices of "big voice, little voice", level by level */
export const GAPS = [24, 12, 7, 5, 3, 2, 1] as const;

/**
 * Two voices `gap` semitones apart, around a middle note that moves every
 * round (within three semitones of A4): which one sang is then heard by
 * comparing the two, never by remembering one exact note. Even two octaves
 * apart the low voice stays above ~180 Hz, where a phone speaker still plays
 * its harmonics.
 */
export function voicePair(gap: number, middle = shift(440, Math.random() * 6 - 3)) {
  return { big: shift(middle, -gap / 2), little: shift(middle, gap / 2) };
}

/* ---------- a drum ---------- */

const DRUM_LENGTH = 0.35;

/** one drum stroke at audio time `t0` — see `drum` */
function stroke(a: Out, t0: number, low: boolean, gainDb: number) {
  const dur = DRUM_LENGTH;
  // a hand drum, not a bass drum: its note sits where a phone speaker plays
  const f = low ? 240 : 320;
  // the skin
  const body = osc(a, 'sine', t0, dur);
  body.frequency.setValueAtTime(f * 1.5, t0);
  body.frequency.exponentialRampToValueAtTime(f * 0.85, t0 + 0.18);
  body.connect(envelope(a, t0, dur, 0.42 * dB(gainDb), 0.004, 0.3));
  // its ring
  const ring = osc(a, 'triangle', t0, 0.22);
  ring.frequency.setValueAtTime(f * 2.3, t0);
  ring.frequency.exponentialRampToValueAtTime(f * 2, t0 + 0.2);
  ring.connect(envelope(a, t0, 0.22, 0.3 * dB(gainDb), 0.003, 0.2));
  // the stick
  const tap = noise(a, t0, 0.04);
  tap
    .connect(filter(a, 'bandpass', 2600, 1.2))
    .connect(envelope(a, t0, 0.04, 0.45 * dB(gainDb), 0.001, 0.035));
}

/**
 * One drum stroke: a skin that drops in pitch (felt on a laptop), its upper
 * partial (heard on a phone) and the stick's tap. `low` for the big drum.
 * Returns its length in seconds.
 */
export function drum({ at = 0, low = false, gainDb = 0 } = {}): number {
  const a = audioOut();
  if (a) stroke(a, a.c.currentTime + at, low, gainDb);
  return DRUM_LENGTH;
}

/* ---------- things and animals (What's that sound?) ---------- */

interface ThingSound {
  /** seconds — the same whether or not anything is heard, so timing never changes */
  length: number;
  play: (a: Out, t0: number) => void;
}

/** what each picture sounds like, synthesised; every one carries its identity above 300 Hz */
export const SOUNDS = {
  /** two pairs of tweets, each a quick rising whistle */
  bird: {
    length: 0.8,
    play(a, t0) {
      for (const [start, from, to] of [
        [0, 2600, 4200],
        [0.16, 2900, 4600],
        [0.5, 2600, 4200],
        [0.66, 2900, 4800],
      ] as const) {
        const o = osc(a, 'sine', t0 + start, 0.11);
        o.frequency.setValueAtTime(from, t0 + start);
        o.frequency.exponentialRampToValueAtTime(to, t0 + start + 0.1);
        o.connect(envelope(a, t0 + start, 0.11, 0.17, 0.01, 0.06));
      }
    },
  },
  /** "mooo": a low buzzy voice through a mouth that opens, then closes */
  cow: {
    length: 1.3,
    play(a, t0) {
      const o = osc(a, 'sawtooth', t0, 1.3);
      o.frequency.setValueAtTime(150, t0);
      o.frequency.linearRampToValueAtTime(128, t0 + 0.9);
      o.frequency.linearRampToValueAtTime(105, t0 + 1.3);
      const mouth = filter(a, 'lowpass', 300, 4);
      mouth.frequency.setValueAtTime(300, t0);
      mouth.frequency.linearRampToValueAtTime(900, t0 + 0.35);
      mouth.frequency.linearRampToValueAtTime(600, t0 + 1.0);
      mouth.frequency.linearRampToValueAtTime(280, t0 + 1.3);
      o.connect(mouth).connect(envelope(a, t0, 1.3, 0.26, 0.12, 0.3));
    },
  },
  /** "mee-ow": a high voice gliding up then down, the mouth widening then closing */
  cat: {
    length: 0.85,
    play(a, t0) {
      const o = osc(a, 'sawtooth', t0, 0.85);
      o.frequency.setValueAtTime(560, t0);
      o.frequency.linearRampToValueAtTime(760, t0 + 0.3);
      o.frequency.linearRampToValueAtTime(480, t0 + 0.85);
      const mouth = filter(a, 'bandpass', 900, 3);
      mouth.frequency.setValueAtTime(800, t0);
      mouth.frequency.linearRampToValueAtTime(1900, t0 + 0.3);
      mouth.frequency.linearRampToValueAtTime(900, t0 + 0.85);
      o.connect(mouth).connect(envelope(a, t0, 0.85, 0.4, 0.06, 0.25));
    },
  },
  /** a trumpeting call: a brassy, wavering note with breath in it */
  elephant: {
    length: 1.0,
    play(a, t0) {
      const o = osc(a, 'sawtooth', t0, 1.0);
      o.frequency.setValueAtTime(420, t0);
      o.frequency.linearRampToValueAtTime(640, t0 + 0.25);
      o.frequency.linearRampToValueAtTime(600, t0 + 1.0);
      const wobble = osc(a, 'sine', t0, 1.0);
      wobble.frequency.value = 9;
      const depth = a.c.createGain();
      depth.gain.value = 18;
      wobble.connect(depth).connect(o.frequency);
      o.connect(filter(a, 'bandpass', 1300, 2.5)).connect(envelope(a, t0, 1.0, 0.38, 0.04, 0.3));
      const breath = noise(a, t0, 1.0);
      breath.connect(filter(a, 'bandpass', 1500, 2)).connect(envelope(a, t0, 1.0, 0.1, 0.05, 0.3));
    },
  },
  /** a drum: two quick strokes and a big one */
  drum: {
    length: 0.95,
    play(a, t0) {
      stroke(a, t0, false, 0);
      stroke(a, t0 + 0.28, false, -2);
      stroke(a, t0 + 0.56, true, 0);
    },
  },
  /** a car horn: "beep beep" — two notes together, twice */
  car: {
    length: 0.55,
    play(a, t0) {
      for (const start of [0, 0.3]) {
        for (const f of [392, 494]) {
          const o = osc(a, 'square', t0 + start, 0.2);
          o.frequency.value = f;
          o.connect(filter(a, 'lowpass', 2400, 0.7)).connect(
            envelope(a, t0 + start, 0.2, 0.07, 0.01, 0.05),
          );
        }
      }
    },
  },
  /** a balloon popping: a sharp crack and a soft thump */
  balloon: {
    length: 0.3,
    play(a, t0) {
      noise(a, t0, 0.09)
        .connect(filter(a, 'highpass', 900, 0.7))
        .connect(envelope(a, t0, 0.09, 0.6, 0.001, 0.08));
      const thump = osc(a, 'sine', t0, 0.12);
      thump.frequency.setValueAtTime(320, t0);
      thump.frequency.exponentialRampToValueAtTime(120, t0 + 0.1);
      thump.connect(envelope(a, t0, 0.12, 0.3, 0.002, 0.1));
    },
  },
  /** a ball bouncing: "boing" three times, each bounce quicker and softer */
  ball: {
    length: 1.0,
    play(a, t0) {
      let t = 0;
      let gap = 0.42;
      let vol = 0.3;
      for (let i = 0; i < 3; i++) {
        const o = osc(a, 'sine', t0 + t, 0.16);
        o.frequency.setValueAtTime(700, t0 + t);
        o.frequency.exponentialRampToValueAtTime(260, t0 + t + 0.15);
        o.connect(envelope(a, t0 + t, 0.16, vol, 0.003, 0.12));
        t += gap;
        gap *= 0.7;
        vol *= 0.75;
      }
    },
  },
  /** rain from a cloud: a soft hiss with drops pattering through it */
  cloud: {
    length: 1.4,
    play(a, t0) {
      noise(a, t0, 1.4)
        .connect(filter(a, 'bandpass', 2400, 0.6))
        .connect(envelope(a, t0, 1.4, 0.14, 0.25, 0.4));
      for (let i = 0; i < 18; i++) {
        const at = t0 + 0.1 + Math.random() * 1.1;
        const drop = osc(a, 'sine', at, 0.03);
        drop.frequency.setValueAtTime(1800 + Math.random() * 1600, at);
        drop.frequency.exponentialRampToValueAtTime(900, at + 0.025);
        drop.connect(envelope(a, at, 0.03, 0.12, 0.001, 0.025));
      }
    },
  },
} satisfies Record<string, ThingSound>;

export type SoundId = keyof typeof SOUNDS;

/** play a thing's sound `at` seconds from now; returns its length in seconds */
export function playSound(id: SoundId, at = 0): number {
  const a = audioOut();
  if (a) SOUNDS[id].play(a, a.c.currentTime + at);
  return SOUNDS[id].length;
}
