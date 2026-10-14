import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { hush, setMuted, speak, speakPair, speakSeq } from './speech';
import { installFakeSpeech } from '../test/helpers';

/**
 * What the child HEARS. Speech bugs are invisible in a screenshot and silent
 * in a type-check: a line that is cut off after two syllables still "works".
 * These tests run the real engine against a synthesiser with a real queue.
 */
describe('speech — who gets to finish their sentence', () => {
  let voice: ReturnType<typeof installFakeSpeech>;

  beforeEach(() => {
    vi.useFakeTimers();
    voice = installFakeSpeech();
    setMuted(false);
  });
  afterEach(() => vi.useRealTimers());

  it('a new line interrupts the one being said', () => {
    speak('முதல் வரி');
    speak('இரண்டாம் வரி');
    vi.runAllTimers();
    expect(voice.spoken).toEqual(['இரண்டாம் வரி']);
    expect(voice.cancelled).toEqual(['முதல் வரி']);
  });

  it('a queued line waits its turn instead of cutting in', () => {
    speak('அறிவுரை');
    speak('கேள்வி', 'ta', { queue: true });
    vi.runAllTimers();
    expect(voice.spoken).toEqual(['அறிவுரை', 'கேள்வி']);
    expect(voice.cancelled).toEqual([]);
  });

  it('a pair is Tamil then English, and a quick second pair leaves no stray echo', () => {
    speakPair('பூனை', 'cat', true);
    vi.advanceTimersByTime(100); // she swipes on before the first card is finished
    speakPair('நாய்', 'dog', true);
    vi.runAllTimers();
    // the English of the card she left must never trail the card she is on
    expect(voice.spoken).toEqual(['நாய்', 'dog']);
  });

  it('a pair without the English echo is just the Tamil', () => {
    speakPair('பூனை', 'cat', false);
    vi.runAllTimers();
    expect(voice.spoken).toEqual(['பூனை']);
  });

  it('muting silences everything, at once', () => {
    speak('பேசுகிறேன்');
    setMuted(true);
    speak('இதுவும் இல்லை');
    vi.runAllTimers();
    expect(voice.spoken).toEqual([]);
  });

  it('hush stops the current line and everything queued behind it', () => {
    speakPair('பூனை', 'cat', true);
    hush();
    vi.runAllTimers();
    expect(voice.spoken).toEqual([]);
  });

  describe('speakSeq', () => {
    it('names every item in order, stepping the highlight with the voice', () => {
      const steps: number[] = [];
      const done = vi.fn();
      speakSeq(['ஒன்று', 'இரண்டு', 'மூன்று'], 'ta', { onStep: (i) => steps.push(i), onDone: done });
      vi.runAllTimers();
      expect(voice.spoken).toEqual(['ஒன்று', 'இரண்டு', 'மூன்று']);
      expect(steps).toEqual([0, 1, 2]);
      expect(done).toHaveBeenCalledTimes(1);
    });

    it('still walks the highlight when muted — the lesson works silently', () => {
      setMuted(true);
      const steps: number[] = [];
      const done = vi.fn();
      speakSeq(['ஒன்று', 'இரண்டு'], 'ta', { onStep: (i) => steps.push(i), onDone: done });
      vi.runAllTimers();
      expect(steps).toEqual([0, 1]);
      expect(done).toHaveBeenCalledTimes(1);
      expect(voice.spoken).toEqual([]);
    });

    it('cancelling before it has said anything leaves the instruction alone', () => {
      speak('அடுத்தது என்ன?'); // the instruction, already speaking
      const cancel = speakSeq(['சிவப்பு', 'நீலம்'], 'ta');
      cancel(); // e.g. the round was re-dealt straight away
      vi.runAllTimers();
      expect(voice.spoken).toEqual(['அடுத்தது என்ன?']);
    });

    it('cancelling after "correct!" was said does not swallow it', () => {
      const cancel = speakSeq(['சிவப்பு', 'நீலம்', 'சிவப்பு'], 'ta');
      vi.advanceTimersByTime(600); // mid-sequence: the first word is in the air
      speak('சரி!'); // she answered — this takes the floor…
      cancel(); // …and the round's cleanup runs right after
      vi.runAllTimers();
      expect(voice.spoken).toEqual(['சரி!']);
    });

    it('an interrupting line ends the sequence — it never resumes over it', () => {
      const done = vi.fn();
      speakSeq(['சிவப்பு', 'நீலம்', 'சிவப்பு'], 'ta', { onDone: done });
      vi.advanceTimersByTime(600);
      speak('சரி!');
      vi.runAllTimers();
      expect(voice.spoken).toEqual(['சரி!']);
      expect(done).not.toHaveBeenCalled();
    });

    it('cancelling mid-word stops the sequence and its voice', () => {
      const cancel = speakSeq(['சிவப்பு', 'நீலம்'], 'ta');
      vi.advanceTimersByTime(600);
      cancel(); // she left the game
      vi.runAllTimers();
      expect(voice.spoken).toEqual([]);
    });
  });
});
