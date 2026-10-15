import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent } from '@testing-library/react';
import Sort from './Sort';
import { COLORS } from '../data/content';
import {
  aboutToLevelUp,
  flush,
  nextLevel,
  renderWithStore,
  saved,
  seedProfile,
} from '../test/helpers';

const baskets = (c: HTMLElement) => [...c.querySelectorAll('[data-bin]')] as HTMLElement[];
/** the items still waiting to be sorted */
const tray = (c: HTMLElement) =>
  ([...c.querySelectorAll('button.aspect-square')] as HTMLElement[]).filter(
    (b) => !b.hasAttribute('data-bin'),
  );
const sortedChips = (c: HTMLElement) => c.querySelectorAll('[data-bin] .anim-pop').length;
/** level 0 sorts by colour: the basket whose colour the item is painted in */
const ownBasket = (c: HTMLElement, item: HTMLElement) => {
  const colour = COLORS.find((col) => item.innerHTML.includes(col.hex))!;
  return baskets(c).find((b) => b.getAttribute('data-bin') === colour.id)!;
};
const tapItem = (item: HTMLElement) => {
  fireEvent.pointerDown(item, { pointerId: 1 });
  fireEvent.pointerUp(item, { pointerId: 1 });
};
/** the dragged copy that follows the finger */
const ghost = (c: HTMLElement) => c.querySelector('.fixed.pointer-events-none');

describe('Sort', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('tap an item, tap its basket: it lands there; a wrong basket only wiggles', () => {
    seedProfile({ settings: { sound: false } });
    const { container } = renderWithStore(<Sort onHome={() => {}} />);
    const item = tray(container)[0];
    const right = ownBasket(container, item);
    const wrong = baskets(container).find((b) => b !== right)!;

    tapItem(item);
    fireEvent.click(wrong);
    expect(wrong.className).toContain('anim-wiggle');
    expect(tray(container)).toHaveLength(6); // still hers to place

    fireEvent.click(right);
    expect(tray(container)).toHaveLength(5);
    expect(sortedChips(container)).toBe(1);
  });

  it('a level-up on the last item waits for the next round — never re-deals mid-celebration', async () => {
    seedProfile({ settings: { sound: false }, progress: aboutToLevelUp('sort') });
    const { container } = renderWithStore(<Sort onHome={() => {}} />);
    for (let n = 0; n < 6; n++) {
      const item = tray(container)[0];
      tapItem(item);
      fireEvent.click(ownBasket(container, item));
    }
    expect(saved().progress.sort.outcomes).toEqual([1]);
    expect(nextLevel('sort', 0)).toBe(1); // the level did tip
    await flush(50);
    // her finished baskets stay as she left them until the round moves on
    expect(tray(container)).toHaveLength(0);
    expect(sortedChips(container)).toBe(6);
    await flush(700);
    expect(tray(container)).toHaveLength(6); // …and then a fresh round arrives
    expect(baskets(container)).toHaveLength(3); // …at the new level: three colours
  });

  it('a quick drag-and-drop leaves no ghost stuck to the screen', async () => {
    seedProfile({ settings: { sound: false } });
    const { container } = renderWithStore(<Sort onHome={() => {}} />);
    const item = tray(container)[0];
    fireEvent.pointerDown(item, { pointerId: 1, clientX: 100, clientY: 400 });
    fireEvent.pointerMove(item, { pointerId: 1, clientX: 160, clientY: 300 });
    await flush(20); // one frame: the ghost appears under the finger
    expect(ghost(container)).toBeTruthy();

    // the finger moves again and lifts before the next frame is drawn
    fireEvent.pointerMove(item, { pointerId: 1, clientX: 200, clientY: 250 });
    fireEvent.pointerUp(item, { pointerId: 1, clientX: 200, clientY: 250 });
    await flush(100);
    expect(ghost(container)).toBeNull(); // the pending frame must not bring it back
    expect(item.className).not.toContain('opacity-30');
  });
});
