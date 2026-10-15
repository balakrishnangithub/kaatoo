import { describe, expect, it } from 'vitest';
import {
  drum,
  GAPS,
  playSound,
  shift,
  sing,
  SOUNDS,
  voiceHarmonics,
  voicePair,
  type SoundId,
} from './sounds';

describe('big voice, little voice — the notes', () => {
  it("the two voices are exactly the level's gap apart", () => {
    for (const gap of GAPS) {
      const { big, little } = voicePair(gap);
      expect(12 * Math.log2(little / big)).toBeCloseTo(gap, 6);
    }
  });

  it('even two octaves apart, both stay where a phone speaker can carry them', () => {
    for (const middle of [shift(440, -3), shift(440, 3)]) {
      const { big, little } = voicePair(24, middle);
      expect(big).toBeGreaterThan(180);
      expect(little).toBeLessThan(1100);
    }
  });

  it('the ladder narrows step by step, from two octaves to one semitone', () => {
    expect(GAPS[0]).toBe(24);
    expect(GAPS.at(-1)).toBe(1);
    for (let i = 1; i < GAPS.length; i++) expect(GAPS[i]).toBeLessThan(GAPS[i - 1]);
  });
});

describe('sounds keep their timing even when nothing can be heard', () => {
  // jsdom has no WebAudio: audioOut() is null, exactly as with the sound off
  it("every sound reports its length, so the games' choreography is the same", () => {
    for (const id of Object.keys(SOUNDS) as SoundId[]) {
      expect(playSound(id)).toBe(SOUNDS[id].length);
      expect(SOUNDS[id].length).toBeGreaterThan(0.2);
      expect(SOUNDS[id].length).toBeLessThan(2);
    }
    expect(sing(440, { dur: 0.7 })).toBe(0.7);
    expect(drum()).toBeGreaterThan(0);
  });
});

describe('on a phone speaker, the low voice is not the quiet voice', () => {
  /** loudness of what a phone plays (harmonics at 300 Hz and up), after the note's gain */
  const onAPhone = (freq: number) => {
    const { weights, gain } = voiceHarmonics(freq);
    const energy = weights.reduce((s, w, i) => s + ((i + 1) * freq >= 300 ? w * w : 0), 0);
    return gain * Math.sqrt(energy);
  };

  it('every note of the game is equally loud where a phone can play it', () => {
    const notes = GAPS.flatMap((gap) => {
      const { big, little } = voicePair(gap, shift(440, -3));
      return [big, little];
    });
    const loudness = notes.map(onAPhone);
    for (const l of loudness) expect(l).toBeCloseTo(loudness[0], 6);
  });

  it('the harmonics a phone cannot play are turned down, not left to vanish unevenly', () => {
    const { weights } = voiceHarmonics(185);
    expect(weights[0]).toBeLessThan(0.5); // 185 Hz itself
    expect(weights[1]).toBeGreaterThan(0.4); // 370 Hz carries the pitch
  });
});
