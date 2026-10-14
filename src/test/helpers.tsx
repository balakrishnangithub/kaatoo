import type { ReactNode } from 'react';
import { act, render } from '@testing-library/react';
import { renderToStaticMarkup } from 'react-dom/server';
import { vi } from 'vitest';
import { Art, type ArtId } from '../art';
import { birthDateFor } from '../lib/age';
import { StoreProvider, type ActProg, type Settings } from '../lib/store';

/** Shared test helpers — one copy of the things every game test needs. */

/** Store an onboarded child. The birth date is relative to today (a
 *  two-year-old → stage 0), so no test goes stale as the calendar moves on. */
export function seedProfile({
  settings = {},
  progress = {},
}: { settings?: Partial<Settings>; progress?: Record<string, Partial<ActProg>> } = {}) {
  localStorage.clear();
  localStorage.setItem(
    'kaatoo-v1',
    JSON.stringify({
      settings: {
        name: 'சோதனை',
        birth: birthDateFor(2),
        sessionMin: 15,
        sound: true,
        english: false,
        guide: true,
        stageOverride: null,
        onboarded: true,
        ...settings,
      },
      progress,
      milestones: {},
    }),
  );
}

/** what the app has persisted so far */
export const saved = () => JSON.parse(localStorage.getItem('kaatoo-v1') ?? '{}');

/** recent outcomes one clean round short of a level-up — the next one tips it */
export const aboutToLevelUp = (gameId: string) => ({
  [gameId]: { plays: 3, wins: 3, outcomes: [1, 1, 1] },
});

export function renderWithStore(ui: ReactNode) {
  return render(<StoreProvider>{ui}</StoreProvider>);
}

/** advance fake timers and let React settle */
export async function flush(ms: number) {
  await act(async () => {
    vi.advanceTimersByTime(ms);
  });
}

/** the artwork inside an element, independent of the size it is drawn at */
export const artOf = (el: Element) => el.querySelector('svg')?.innerHTML ?? '';
/** the same fingerprint for an artwork id */
export function artFor(id: ArtId): string {
  const host = document.createElement('div');
  host.innerHTML = renderToStaticMarkup(<Art id={id} />);
  return artOf(host);
}

interface Utterance {
  text: string;
  onend?: (() => void) | null;
  onerror?: (() => void) | null;
}

/**
 * A speech synthesiser that keeps a real queue, so tests can assert what a
 * child would actually HEAR: `spoken` lists the lines that played to the end,
 * `cancelled` the ones cut off or dropped. A line takes a little while to say
 * (drive it with fake timers), and — like a browser — a cancelled line reports
 * back asynchronously, as an error.
 */
export function installFakeSpeech() {
  const spoken: string[] = [];
  const cancelled: string[] = [];
  let queue: Utterance[] = [];
  let current: Utterance | null = null;
  let timer = 0;

  const next = () => {
    if (current || !queue.length) return;
    const u = (current = queue.shift()!);
    timer = window.setTimeout(
      () => {
        current = null;
        spoken.push(u.text);
        u.onend?.();
        next();
      },
      200 + u.text.length * 40,
    );
  };

  Object.defineProperty(window, 'speechSynthesis', {
    configurable: true,
    value: {
      speak(u: Utterance) {
        queue.push(u);
        next();
      },
      cancel() {
        const dropped = [...(current ? [current] : []), ...queue];
        window.clearTimeout(timer);
        current = null;
        queue = [];
        for (const u of dropped) {
          cancelled.push(u.text);
          window.setTimeout(() => u.onerror?.(), 0);
        }
      },
      getVoices: () => [],
      onvoiceschanged: null,
    },
  });

  return { spoken, cancelled };
}
