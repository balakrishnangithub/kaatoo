import { Profiler } from 'react';
import { afterEach, describe, expect, it, beforeEach, vi } from 'vitest';
import { screen, fireEvent, act } from '@testing-library/react';
import { useStore, useTimeLeft } from './store';
import { speak } from './speech';
import { birthDateFor } from './age';
import { chooseLevel, updateSkill } from './skill';
import { flush, installFakeSpeech, renderWithStore, saved, seedProfile } from '../test/helpers';

/** minimal harness component exposing the bits of the store under test */
function Probe() {
  const s = useStore();
  // what a game does: open at the estimate's level, record each round into it
  const level = chooseLevel(s.skillOf('bubbles'), { top: 3 });
  const round = (score: number) =>
    s.recordRound(
      'bubbles',
      score === 1,
      updateSkill(s.skillOf('bubbles'), { level, score, chance: 0 }, Date.now()),
    );
  return (
    <div>
      <span data-testid="name">{s.settings.name}</span>
      <span data-testid="stage">{s.stage}</span>
      <span data-testid="phase">{s.phase}</span>
      <span data-testid="expired">{String(s.expired)}</span>
      <span data-testid="plays">{s.progress.bubbles?.plays ?? 0}</span>
      <span data-testid="level">{level}</span>
      <button onClick={() => s.recordWin('bubbles')}>win</button>
      <button onClick={() => round(1)}>clean</button>
      <button onClick={() => round(0)}>struggle</button>
      <button onClick={() => s.goRest()}>rest</button>
      <button onClick={() => s.wake()}>wake</button>
      <button onClick={() => s.updateSettings({ sound: !s.settings.sound })}>sound</button>
      <button onClick={() => s.resetAll()}>reset</button>
    </div>
  );
}

/** the only thing that reads the ticking clock */
function Clock() {
  return <span data-testid="left">{useTimeLeft()}</span>;
}

/** how many times each half of the harness has rendered */
const renders = { probe: 0, clock: 0 };
function Harness() {
  return (
    <>
      <Profiler id="probe" onRender={() => (renders.probe += 1)}>
        <Probe />
      </Profiler>
      <Profiler id="clock" onRender={() => (renders.clock += 1)}>
        <Clock />
      </Profiler>
    </>
  );
}

describe('store — persistence & skill engine', () => {
  beforeEach(() => seedProfile({ settings: { sound: false } }));

  it('loads settings and derives the stage from age', () => {
    renderWithStore(<Probe />);
    expect(screen.getByTestId('name').textContent).toBe('சோதனை');
    expect(screen.getByTestId('stage').textContent).toBe('0'); // 2-year-old
  });

  it('recordWin persists progress to localStorage under kaatoo-v1', async () => {
    renderWithStore(<Probe />);
    fireEvent.click(screen.getByText('win'));
    await act(async () => {});
    expect(saved().progress.bubbles.plays).toBe(1);
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
    renderWithStore(<Probe />);
    expect(screen.getByTestId('plays').textContent).toBe('9');
    expect(localStorage.getItem('mazhalai-v1')).toBeNull();
    expect(localStorage.getItem('kaatoo-v1')).toBeTruthy();
  });

  it('a fresh profile is a two-year-old as of today, whenever today is', () => {
    localStorage.clear();
    renderWithStore(<Probe />);
    expect(screen.getByTestId('stage').textContent).toBe('0');
    expect(saved().settings.birth).toBe(birthDateFor(2));
    expect(saved().settings.onboarded).toBe(false);
  });

  it('reset returns to a fresh, not-yet-onboarded profile', () => {
    renderWithStore(<Probe />);
    fireEvent.click(screen.getByText('win'));
    fireEvent.click(screen.getByText('reset'));
    expect(screen.getByTestId('plays').textContent).toBe('0');
    expect(saved().settings.onboarded).toBe(false);
  });

  it('a stored session length of zero is repaired, not obeyed', () => {
    seedProfile({ settings: { sessionMin: 0 } });
    renderWithStore(<Harness />);
    // zero minutes would mean resting forever, with the settings out of reach
    expect(screen.getByTestId('expired').textContent).toBe('false');
    expect(screen.getByTestId('left').textContent).toBe('900');
  });

  it('rest phase toggles and wake returns to play', () => {
    renderWithStore(<Probe />);
    fireEvent.click(screen.getByText('rest'));
    expect(screen.getByTestId('phase').textContent).toBe('rest');
    fireEvent.click(screen.getByText('wake'));
    expect(screen.getByTestId('phase').textContent).toBe('play');
  });

  const level = () => screen.getByTestId('level').textContent;

  it('a game she has never played starts where her age — or the parent — says', () => {
    renderWithStore(<Probe />);
    expect(level()).toBe('0'); // a two-year-old
    seedProfile({ settings: { stageOverride: 2 } });
    renderWithStore(<Probe />);
    expect(screen.getAllByTestId('level')[1].textContent).toBe('2');
  });

  it('her rounds, not her age, set the level — with no age ceiling', () => {
    renderWithStore(<Probe />);
    for (let i = 0; i < 20; i++) fireEvent.click(screen.getByText('clean'));
    expect(level()).toBe('3'); // a two-year-old at the top level
    for (let i = 0; i < 8; i++) fireEvent.click(screen.getByText('struggle'));
    expect(level()).toBe('0');
  });

  it('each round is saved: the estimate, and the dot the parents see', () => {
    renderWithStore(<Probe />);
    fireEvent.click(screen.getByText('clean'));
    fireEvent.click(screen.getByText('struggle'));
    expect(saved().progress.bubbles.outcomes).toEqual([1, 0]);
    expect(saved().progress.bubbles.skill.n).toBe(2);
  });

  it('a game played under the old rules starts exactly where those rules had her', () => {
    // a two-year-old with four clean rounds: the old rules had stepped her up to 1
    seedProfile({ progress: { bubbles: { plays: 2, wins: 2, outcomes: [1, 1, 1, 1] } } });
    renderWithStore(<Probe />);
    expect(level()).toBe('1');
  });

  it('…including a step down for a child who was struggling', () => {
    seedProfile({
      settings: { stageOverride: 2 },
      progress: { bubbles: { plays: 2, wins: 2, outcomes: [1, 0, 0, 0] } },
    });
    renderWithStore(<Probe />);
    expect(level()).toBe('1');
  });
});

describe('store — the sound setting is the one mute switch', () => {
  let voice: ReturnType<typeof installFakeSpeech>;
  beforeEach(() => {
    vi.useFakeTimers();
    voice = installFakeSpeech();
  });
  afterEach(() => vi.useRealTimers());

  /** try to say a line; was it heard? */
  const heard = async (line: string) => {
    speak(line);
    await flush(2000);
    return voice.spoken.includes(line);
  };

  it('is in force from the first render', async () => {
    seedProfile({ settings: { sound: false } });
    renderWithStore(<Probe />);
    expect(await heard('ஒன்று')).toBe(false);
  });

  it('turning sound off persists, and survives later progress writes', async () => {
    seedProfile({ settings: { sound: true } });
    renderWithStore(<Probe />);
    expect(await heard('ஒன்று')).toBe(true);

    fireEvent.click(screen.getByText('sound'));
    expect(saved().settings.sound).toBe(false);
    expect(await heard('இரண்டு')).toBe(false);

    // the regression: saving a round used to switch the sound back on by itself
    fireEvent.click(screen.getByText('clean'));
    fireEvent.click(screen.getByText('win'));
    expect(await heard('மூன்று')).toBe(false);
  });
});

describe('store — the session clock', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    seedProfile({ settings: { sound: false, sessionMin: 5 } });
  });
  afterEach(() => vi.useRealTimers());

  it('ticks down once a second and expires at zero', async () => {
    renderWithStore(<Harness />);
    expect(screen.getByTestId('left').textContent).toBe('300');
    await flush(3000);
    expect(screen.getByTestId('left').textContent).toBe('297');
    expect(screen.getByTestId('expired').textContent).toBe('false');
    await flush(297_000);
    expect(screen.getByTestId('left').textContent).toBe('0');
    expect(screen.getByTestId('expired').textContent).toBe('true');
  });

  it('a tick re-renders only what shows the clock — not every screen that uses the store', async () => {
    renderWithStore(<Harness />);
    const before = { ...renders };
    for (let second = 0; second < 10; second++) await flush(1000);
    expect(renders.clock - before.clock).toBe(10);
    expect(renders.probe - before.probe).toBe(0);
  });

  it('does not tick while resting', async () => {
    renderWithStore(<Harness />);
    fireEvent.click(screen.getByText('rest'));
    await flush(5000);
    expect(screen.getByTestId('left').textContent).toBe('300');
  });
});
