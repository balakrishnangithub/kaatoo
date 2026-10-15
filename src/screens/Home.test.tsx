import { describe, expect, it } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import Home from './Home';
import { useStore } from '../lib/store';
import { renderWithStore, saved, seedProfile } from '../test/helpers';

/** stands in for a game finishing a round while the home screen is up */
function FinishARound() {
  const { recordWin, recordRound, skillOf } = useStore();
  return (
    <button
      onClick={() => {
        recordRound('odd', true, skillOf('odd'));
        recordWin('odd');
      }}
    >
      finish a round
    </button>
  );
}

const home = (
  <>
    <Home onOpen={() => {}} onParent={() => {}} />
    <FinishARound />
  </>
);
const soundButton = () => screen.getByLabelText('sound');

describe('Home — the sound button', () => {
  it('shows the stored setting from the very first paint', () => {
    seedProfile({ settings: { sound: false } });
    renderWithStore(home);
    expect(soundButton().textContent).toBe('🔇');
  });

  it('is the same switch as the parents’ setting: it persists', () => {
    seedProfile({ settings: { sound: true } });
    renderWithStore(home);
    expect(soundButton().textContent).toBe('🔊');
    fireEvent.click(soundButton());
    expect(soundButton().textContent).toBe('🔇');
    expect(saved().settings.sound).toBe(false);
  });

  it('stays off when a round is saved afterwards', () => {
    // it used to be a separate, unsaved flag that the next progress write undid
    seedProfile({ settings: { sound: true } });
    renderWithStore(home);
    fireEvent.click(soundButton());
    fireEvent.click(screen.getByText('finish a round'));
    expect(soundButton().textContent).toBe('🔇');
    expect(saved().settings.sound).toBe(false);
  });

  it('offers all ten activities', () => {
    seedProfile();
    renderWithStore(home);
    for (const name of ['வரையலாம்', 'குமிழிகள்', 'சொற்கள்', 'உணர்வுகள்'])
      expect(screen.getByText(name)).toBeInTheDocument();
    expect(document.querySelectorAll('.sticker.anim-pop')).toHaveLength(10);
  });
});
