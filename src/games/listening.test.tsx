import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import Voices from './Voices';
import Sounds from './Sounds';
import Listen from './Listen';
import Drums from './Drums';
import { flush, installFakeSpeech, renderWithStore, saved, seedProfile } from '../test/helpers';
import { LEVELS, LISTEN_FIND, SOUND_FIND } from '../data/levels';
import { PAIR_WORDS } from '../data/content';
import { ART } from '../art';
import { PATTERNS } from '../lib/rhythm';
import { GAPS } from '../lib/sounds';

/**
 * The four listening games, played the way a child would: the sound comes
 * first, and only then do her taps count.
 */

const option = (label: string) => screen.getByLabelText(label);

/** let time pass the way it does for her — in small steps, so each sound, line
 *  and turn can start the next one (one big jump would run in a single batch) */
async function wait(ms: number) {
  for (let left = ms; left > 0; left -= 200) await flush(Math.min(200, left));
}

describe('every listening game needs sound', () => {
  for (const [name, Game] of [
    ['voices', Voices],
    ['sounds', Sounds],
    ['listen', Listen],
    ['drums', Drums],
  ] as const) {
    it(`${name}: with the sound off it says so and offers the switch — it never plays silently`, () => {
      seedProfile({ settings: { sound: false } });
      renderWithStore(<Game onHome={() => {}} />);
      fireEvent.click(option('sound on'));
      expect(saved().settings.sound).toBe(true);
      expect(screen.queryByLabelText('sound on')).not.toBeInTheDocument();
    });
  }
});

describe('Big voice, little voice', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    installFakeSpeech();
    seedProfile({ settings: { sound: true } });
  });
  afterEach(() => vi.useRealTimers());

  /** the instruction, then both voices, then the hidden one */
  const hearRound = () => wait(9000);

  it('taps while the voices are still singing are not answers', async () => {
    renderWithStore(<Voices onHome={() => {}} />);
    await wait(3000); // the instruction is over; the voices have begun
    fireEvent.click(option('elephant'));
    fireEvent.click(option('bird'));
    expect(saved().progress.voices).toBeUndefined();
  });

  it('once the hidden voice has sung, one of the two is right and the round is recorded', async () => {
    renderWithStore(<Voices onHome={() => {}} />);
    await hearRound();
    fireEvent.click(option('elephant'));
    fireEvent.click(option('bird'));
    // whichever was hidden, the round ended exactly once
    expect(saved().progress.voices.skill.n).toBe(1);
  });
});

describe("What's that sound?", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    installFakeSpeech();
    seedProfile({ settings: { sound: true } });
  });
  afterEach(() => vi.useRealTimers());

  it('plays, then waits for her; five rounds, then the end card', async () => {
    renderWithStore(<Sounds onHome={() => {}} />);
    for (let round = 0; round < 5; round++) {
      await wait(6000);
      // try the pictures in turn, as a child who is not sure would
      for (const b of [...document.querySelectorAll('.grid button')] as HTMLElement[]) {
        fireEvent.click(b);
        await wait(3000);
        if (saved().progress.sounds?.skill?.n === round + 1) break;
      }
    }
    await wait(3000);
    expect(screen.getByLabelText('again')).toBeInTheDocument();
    expect(saved().progress.sounds.skill.n).toBe(5);
  });
});

describe('Listen closely', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    seedProfile({ settings: { sound: true } });
  });
  afterEach(() => vi.useRealTimers());

  it('says the word, never shows it, and waits until it has been said', async () => {
    const voice = installFakeSpeech();
    renderWithStore(<Listen onHome={() => {}} />);
    await wait(10_000);
    const asked = voice.spoken.find((l) => l.endsWith('எங்கே?'))!;
    expect(asked).toBeTruthy();
    expect(document.body.textContent).not.toContain(asked); // heard, not read
  });
});

describe('Drum with me', () => {
  beforeEach(() => {
    vi.useFakeTimers({
      toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date', 'performance'],
    });
    installFakeSpeech();
    seedProfile({ settings: { sound: true } });
  });
  afterEach(() => vi.useRealTimers());

  const drumAt = async (gapMs: number, n: number) => {
    for (let i = 0; i < n; i++) {
      fireEvent.pointerDown(option('drum'));
      await wait(gapMs);
    }
  };

  it('she drums freely first; then drumming along at her own pace passes the first round', async () => {
    renderWithStore(<Drums onHome={() => {}} />);
    await wait(4000); // "hit the drum!" has been said
    await drumAt(480, 8); // her own pace: 480 ms
    await wait(3000); // "drum with me" — and the elephant starts
    await drumAt(480, 9); // along with it
    await wait(2000);
    expect(saved().progress.drums.outcomes).toEqual([1]);
  });

  it('not drumming at all is not a pass — and after three goes the round moves on kindly', async () => {
    renderWithStore(<Drums onHome={() => {}} />);
    await wait(12_000); // the warm-up passes without a tap
    await wait(40_000); // three silent tries
    // the first round ended as "not yet", and the game went on to the next
    expect(saved().progress.drums.outcomes[0]).toBe(0);
  });
});

describe('the listening games have exactly the levels the parents are told about', () => {
  it('one level per gap, pattern and picture table', () => {
    expect(GAPS).toHaveLength(LEVELS.voices.length);
    expect(PATTERNS).toHaveLength(LEVELS.drums.length);
    expect(LISTEN_FIND).toHaveLength(LEVELS.listen.length);
    expect(SOUND_FIND).toHaveLength(LEVELS.sounds.length);
  });

  it('every word she may hear has its picture', () => {
    for (const w of PAIR_WORDS) expect(ART[w.art]).toBeTruthy();
  });
});
