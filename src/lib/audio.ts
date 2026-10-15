/**
 * audio.ts — the one WebAudio output every sound in the app goes through.
 *
 * Small speakers and many devices are the constraint here:
 *  - everything passes a gentle limiter, so two chimes landing together (or a
 *    chime over a game's own sound) never clip into a harsh crackle on a
 *    phone speaker;
 *  - browsers only let a page make sound after a touch. The first touch
 *    anywhere unlocks it (see `installAudioUnlock`), so a game that plays a
 *    sound from a timer — not straight from a tap — is heard on every device;
 *  - on an iPhone with the ring/silent switch set to silent, WebAudio is muted
 *    by default; asking for the "playback" audio session (iOS 17+) lets the
 *    child hear the games as she would hear a video.
 */

let ctx: AudioContext | null = null;
let master: AudioNode | null = null;
let audible = true;

/** the app's sound setting — while off, nothing is sent to the speaker */
export function setAudible(on: boolean) {
  audible = on;
}

function context(): AudioContext | null {
  try {
    if (!ctx) {
      const Ctor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      ctx = new Ctor();
      // a soft limiter: transparent at normal levels, rounds off any overlap
      const limiter = ctx.createDynamicsCompressor();
      limiter.threshold.value = -12;
      limiter.knee.value = 8;
      limiter.ratio.value = 6;
      limiter.attack.value = 0.003;
      limiter.release.value = 0.2;
      limiter.connect(ctx.destination);
      master = limiter;
    }
    if (ctx.state === 'suspended') void ctx.resume().catch(() => {});
    return ctx;
  } catch {
    return null;
  }
}

/** where a sound is played: the context and its output — or null while muted or unsupported */
export function audioOut(): { c: AudioContext; out: AudioNode } | null {
  if (!audible) return null;
  const c = context();
  return c && master ? { c, out: master } : null;
}

const isIOS = () =>
  /iP(hone|ad|od)/.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

/**
 * Unlock sound on the first touch (or key), then step aside. Without this, a
 * phone that has not yet been touched inside a game stays silent when that
 * game plays a sound on its own — the hidden note, the next drum beat.
 */
export function installAudioUnlock() {
  const unlock = () => {
    const session = (navigator as unknown as { audioSession?: { type: string } }).audioSession;
    if (session && audible) {
      try {
        session.type = 'playback'; // iPhone: play through the silent switch, like a video
      } catch {
        /* older iOS — nothing to do */
      }
    }
    const c = context();
    if (c) {
      // one silent sample: the iOS way of waking the output
      const src = c.createBufferSource();
      src.buffer = c.createBuffer(1, 1, 22050);
      src.connect(c.destination);
      src.start(0);
    }
    // iOS speaks only after a first utterance inside a touch
    if (isIOS() && 'speechSynthesis' in window) {
      const u = new SpeechSynthesisUtterance(' ');
      u.volume = 0;
      window.speechSynthesis.speak(u);
    }
    if (!c || c.state === 'running') {
      window.removeEventListener('pointerdown', unlock, true);
      window.removeEventListener('keydown', unlock, true);
    }
  };
  window.addEventListener('pointerdown', unlock, true);
  window.addEventListener('keydown', unlock, true);
}
