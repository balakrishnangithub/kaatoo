import { describe, expect, it, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { StoreProvider, useStore } from './store';

/** minimal harness component exposing the bits of the store under test */
function Probe() {
  const s = useStore();
  return (
    <div>
      <span data-testid="name">{s.settings.name}</span>
      <span data-testid="stage">{s.stage}</span>
      <span data-testid="phase">{s.phase}</span>
      <span data-testid="plays">{s.progress.bubbles?.plays ?? 0}</span>
      <span data-testid="level">{s.levelFor('bubbles', 3)}</span>
      <button onClick={() => s.recordWin('bubbles')}>win</button>
      <button onClick={() => s.recordOutcome('bubbles', true)}>clean</button>
      <button onClick={() => s.recordOutcome('bubbles', false)}>struggle</button>
      <button onClick={() => s.goRest()}>rest</button>
      <button onClick={() => s.wake()}>wake</button>
    </div>
  );
}

const seed = () => {
  localStorage.setItem(
    'kaatoo-v1',
    JSON.stringify({
      settings: {
        name: 'சோதனை',
        birth: '2024-09-13', // ~2 years old → stage 0
        sessionMin: 15,
        sound: false,
        english: true,
        guide: true,
        stageOverride: null,
        onboarded: true,
      },
      progress: {},
      milestones: {},
    }),
  );
};

describe('store — persistence & skill engine', () => {
  beforeEach(() => {
    localStorage.clear();
    seed();
  });

  it('loads settings and derives the stage from age', () => {
    render(
      <StoreProvider>
        <Probe />
      </StoreProvider>,
    );
    expect(screen.getByTestId('name').textContent).toBe('சோதனை');
    expect(screen.getByTestId('stage').textContent).toBe('0'); // 2-year-old
  });

  it('recordWin persists progress to localStorage under kaatoo-v1', async () => {
    render(
      <StoreProvider>
        <Probe />
      </StoreProvider>,
    );
    fireEvent.click(screen.getByText('win'));
    await act(async () => {});
    const saved = JSON.parse(localStorage.getItem('kaatoo-v1')!);
    expect(saved.progress.bubbles.plays).toBe(1);
    expect(screen.getByTestId('plays').textContent).toBe('1');
  });

  it('migrates a legacy storage key instead of losing progress', () => {
    localStorage.clear();
    localStorage.setItem(
      'mazhalai-v1',
      JSON.stringify({
        settings: { name: 'பழைய' },
        progress: { bubbles: { plays: 9, wins: 9 } },
        milestones: {},
      }),
    );
    render(
      <StoreProvider>
        <Probe />
      </StoreProvider>,
    );
    expect(screen.getByTestId('plays').textContent).toBe('9');
    expect(localStorage.getItem('mazhalai-v1')).toBeNull();
    expect(localStorage.getItem('kaatoo-v1')).toBeTruthy();
  });

  it('rest phase toggles and wake returns to play', () => {
    render(
      <StoreProvider>
        <Probe />
      </StoreProvider>,
    );
    fireEvent.click(screen.getByText('rest'));
    expect(screen.getByTestId('phase').textContent).toBe('rest');
    fireEvent.click(screen.getByText('wake'));
    expect(screen.getByTestId('phase').textContent).toBe('play');
  });

  it('sustained clean play raises difficulty, struggling lowers it — within the age cap', () => {
    render(
      <StoreProvider>
        <Probe />
      </StoreProvider>,
    );
    // stage 0 → base level 0, cap 1
    expect(screen.getByTestId('level').textContent).toBe('0');
    // 4 clean rounds of the last 5 → step up (but never beyond the age cap of 1)
    for (let i = 0; i < 4; i++) fireEvent.click(screen.getByText('clean'));
    expect(screen.getByTestId('level').textContent).toBe('1');
    // struggling drops it right back down
    fireEvent.click(screen.getByText('struggle'));
    fireEvent.click(screen.getByText('struggle'));
    fireEvent.click(screen.getByText('struggle'));
    expect(screen.getByTestId('level').textContent).toBe('0');
  });
});
