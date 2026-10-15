import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import Words from '../games/Words';
import Emotions from '../games/Emotions';
import type { ArtId } from '../art';
import { EMOTIONS, WORDS } from '../data/content';
import {
  artFor,
  artOf,
  flush,
  installFakeSpeech,
  renderWithStore,
  saved,
  seedProfile,
} from '../test/helpers';

/**
 * Words and Emotions are the same "look, then find" activity with different
 * cards, so they are tested together — through the real games.
 */

const options = (c: HTMLElement) => [...c.querySelectorAll('.grid button')] as HTMLElement[];
const question = (c: HTMLElement) =>
  [...c.querySelectorAll('button')].find((b) => b.textContent?.includes('எங்கே?'))!;
/** the picture the find question is asking for */
function rightOption(c: HTMLElement, cards: { art: ArtId; ta: string }[]) {
  const asked = question(c).textContent!;
  const card = cards.find((k) => asked.startsWith(k.ta + ' '))!;
  return options(c).find((o) => artOf(o) === artFor(card.art))!;
}
const openFind = () => fireEvent.click(screen.getByText('கண்டுபிடி'));

describe('look → find', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  describe('find rounds', () => {
    it('words: a double-tap on the right picture counts once', async () => {
      seedProfile({ settings: { sound: false } });
      const { container } = renderWithStore(<Words onHome={() => {}} />);
      fireEvent.click(screen.getByText('விலங்குகள்'));
      openFind();
      const right = rightOption(container, WORDS);
      fireEvent.click(right);
      fireEvent.click(right);
      await flush(1000);
      expect(saved().progress.words.outcomes).toEqual([1]);
    });

    it('emotions: a double-tap on the right face counts once', async () => {
      seedProfile({ settings: { sound: false } });
      const { container } = renderWithStore(<Emotions onHome={() => {}} />);
      openFind();
      const right = rightOption(container, EMOTIONS);
      fireEvent.click(right);
      fireEvent.click(right);
      await flush(1000);
      expect(saved().progress.emotions.outcomes).toEqual([1]);
    });

    it('five rounds, then the end card — and "again" starts a fresh five', async () => {
      seedProfile({ settings: { sound: false } });
      const { container } = renderWithStore(<Emotions onHome={() => {}} />);
      openFind();
      for (let round = 0; round < 5; round++) {
        fireEvent.click(rightOption(container, EMOTIONS));
        await flush(800);
      }
      expect(screen.getByLabelText('again')).toBeInTheDocument();
      expect(saved().progress.emotions).toMatchObject({ plays: 1, outcomes: [1, 1, 1, 1, 1] });

      fireEvent.click(screen.getByLabelText('again'));
      expect(screen.queryByLabelText('again')).not.toBeInTheDocument();
      // five clean answers from a new child: the next sitting opens a level up
      expect(options(container).length).toBeGreaterThan(2);
    });

    it('the answer starts to pulse after two misses — in both games', async () => {
      for (const [Game, cards, enter] of [
        [Words, WORDS, () => fireEvent.click(screen.getByText('விலங்குகள்'))],
        [Emotions, EMOTIONS, () => {}],
      ] as const) {
        // three pictures (level 1), so there are two wrong ones to try
        seedProfile({ settings: { sound: false, stageOverride: 1 } });
        const { container, unmount } = renderWithStore(<Game onHome={() => {}} />);
        enter();
        openFind();
        const right = rightOption(container, cards);
        const [wrongA, wrongB] = options(container).filter((o) => o !== right);

        fireEvent.click(wrongA);
        expect(wrongA.className).toContain('anim-wiggle');
        expect(right.className).not.toContain('anim-hint');
        await flush(1000); // an unhurried child: the wiggle is long over
        fireEvent.click(wrongB);
        expect(right.className).toContain('anim-hint');
        unmount();
      }
    });
  });

  it('when the session time runs out, the deck closes with a rest-only end card', async () => {
    seedProfile({ settings: { sound: false, sessionMin: 5 } });
    renderWithStore(<Emotions onHome={() => {}} />);
    expect(screen.queryByLabelText('rest time')).not.toBeInTheDocument();
    await flush(5 * 60 * 1000);
    expect(screen.getByLabelText('rest time')).toBeInTheDocument();
    expect(screen.queryByLabelText('again')).not.toBeInTheDocument();
  });

  describe('what she hears', () => {
    it('words: the category name, then the first card — neither cut off', async () => {
      const voice = installFakeSpeech();
      seedProfile({ settings: { english: true } });
      renderWithStore(<Words onHome={() => {}} />);
      await flush(10_000); // "what shall we look at?" has been said
      voice.spoken.length = 0;

      fireEvent.click(screen.getByText('விலங்குகள்'));
      await flush(10_000);
      expect(voice.cancelled).toEqual([]);
      expect(voice.spoken).toEqual(['விலங்குகள்', 'பூனை', 'cat']);
    });

    it('emotions: the find instruction is heard in full, then the question', async () => {
      const voice = installFakeSpeech();
      seedProfile({ settings: { english: true } });
      const { container } = renderWithStore(<Emotions onHome={() => {}} />);
      await flush(20_000); // the first card has been read out
      voice.spoken.length = 0;

      openFind();
      await flush(20_000);
      expect(voice.cancelled).toEqual([]);
      expect(voice.spoken).toEqual([
        'உணர்வைக் கண்டுபிடி',
        'find the feeling',
        question(container).textContent!.replace(' 🔊', ''),
      ]);
    });

    it('finishing the deck says "now find it!" and then asks — without clipping it', async () => {
      const voice = installFakeSpeech();
      seedProfile();
      const { container } = renderWithStore(<Emotions onHome={() => {}} />);
      for (let card = 0; card < EMOTIONS.length - 1; card++) {
        fireEvent.click(screen.getByText('→'));
      }
      await flush(20_000);
      voice.spoken.length = 0;
      voice.cancelled.length = 0;

      fireEvent.click(screen.getByText('✓')); // past the last card
      await flush(20_000);
      expect(voice.cancelled).toEqual([]);
      expect(voice.spoken).toEqual([
        'இப்போ கண்டுபிடி!',
        'உணர்வைக் கண்டுபிடி',
        question(container).textContent!.replace(' 🔊', ''),
      ]);
    });

    it('swiping on interrupts the card she left, and switching tabs silences it', async () => {
      const voice = installFakeSpeech();
      seedProfile();
      renderWithStore(<Emotions onHome={() => {}} />);
      await flush(100); // the first card has only just begun
      fireEvent.click(screen.getByText('→'));
      await flush(20_000);
      expect(voice.cancelled).toHaveLength(1);
      expect(voice.spoken).toEqual([`${EMOTIONS[1].ta}. ${EMOTIONS[1].line}`]);

      fireEvent.click(screen.getByText('→'));
      await flush(100);
      openFind(); // she changed her mind mid-sentence
      await flush(20_000);
      expect(voice.spoken).not.toContain(`${EMOTIONS[2].ta}. ${EMOTIONS[2].line}`);
    });
  });
});
