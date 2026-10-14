import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { EndCard, HoldButton } from './chrome';
import { PRAISE } from '../data/content';
import { flush, installFakeSpeech, renderWithStore, seedProfile } from '../test/helpers';

describe('HoldButton — the parent gate', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  const gate = () => screen.getByText('hold').closest('button')!;
  const lift = (pointerId: number) => {
    fireEvent.pointerUp(gate(), { pointerId });
    fireEvent.pointerLeave(gate(), { pointerId });
  };

  it('opens after a full hold', async () => {
    const onDone = vi.fn();
    render(<HoldButton onDone={onDone}>hold</HoldButton>);
    fireEvent.pointerDown(gate(), { pointerId: 1 });
    await flush(1300);
    expect(onDone).not.toHaveBeenCalled(); // not yet
    await flush(300);
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('a tap — or a hold let go early — does nothing', async () => {
    const onDone = vi.fn();
    render(<HoldButton onDone={onDone}>hold</HoldButton>);
    fireEvent.pointerDown(gate(), { pointerId: 1 });
    await flush(900);
    lift(1);
    await flush(3000);
    expect(onDone).not.toHaveBeenCalled();
  });

  it('a little hand mashing it with two fingers cannot open it', async () => {
    // Each extra finger used to start a second clock that nothing could stop:
    // it kept running after both fingers had lifted, and opened the gate.
    const onDone = vi.fn();
    render(<HoldButton onDone={onDone}>hold</HoldButton>);
    fireEvent.pointerDown(gate(), { pointerId: 1 });
    fireEvent.pointerDown(gate(), { pointerId: 2 });
    await flush(100);
    lift(1);
    lift(2);
    await flush(3000);
    expect(onDone).not.toHaveBeenCalled();
  });
});

describe('EndCard', () => {
  let voice: ReturnType<typeof installFakeSpeech>;
  beforeEach(() => {
    vi.useFakeTimers();
    voice = installFakeSpeech();
  });
  afterEach(() => vi.useRealTimers());

  const card = <EndCard onAgain={() => {}} onHome={() => {}} />;

  it('praises in Tamil only when the English echo is switched off', async () => {
    seedProfile({ settings: { english: false } });
    renderWithStore(card);
    await flush(5000);
    expect(voice.spoken).toHaveLength(1);
    expect(PRAISE.map((p) => p.ta)).toContain(voice.spoken[0]);
  });

  it('with the echo on, the English says the same thing as the Tamil', async () => {
    seedProfile({ settings: { english: true } });
    renderWithStore(card);
    await flush(5000);
    const [ta, en] = voice.spoken;
    expect(PRAISE).toContainEqual({ ta, en });
  });

  it('offers again / home / rest — and only rest once the session is over', async () => {
    seedProfile({ settings: { sound: false, sessionMin: 5 } });
    renderWithStore(card);
    expect(screen.getByLabelText('again')).toBeInTheDocument();
    expect(screen.getByLabelText('home')).toBeInTheDocument();
    expect(screen.getByLabelText('rest')).toBeInTheDocument();

    await flush(5 * 60 * 1000);
    expect(screen.queryByLabelText('again')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('home')).not.toBeInTheDocument();
    expect(screen.getByLabelText('rest time')).toBeInTheDocument();
  });
});
