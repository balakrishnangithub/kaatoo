import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';
import { flush, seedProfile } from './test/helpers';

/**
 * The one invariant a toddler never forgives: the app boots and shows the
 * first-run experience without crashing. Kept intentionally small — game logic
 * is covered by the lib tests; this guards the wiring.
 */
describe('App shell', () => {
  afterEach(() => window.history.replaceState({}, '', '/'));

  it('renders onboarding on a fresh device (no stored settings)', () => {
    localStorage.clear();
    render(<App />);
    // first run greets the parent — the onboarding asks who this is for
    expect(screen.getByText(/Welcome/)).toBeInTheDocument();
    expect(screen.getByText(/let's begin/)).toBeInTheDocument();
  });

  it('renders the home garden for an onboarded child', () => {
    seedProfile({ settings: { sound: false } });
    render(<App />);
    // her name is on the home screen
    expect(screen.getByText(/சோதனை/)).toBeInTheDocument();
    // and the ten activity cards are offered
    expect(screen.getByText('குமிழிகள்')).toBeInTheDocument();
    expect(screen.getByText('சொற்கள்')).toBeInTheDocument();
  });

  it('?screen=<game> opens straight into that game', () => {
    seedProfile({ settings: { sound: false } });
    window.history.replaceState({}, '', '/?screen=count');
    render(<App />);
    expect(screen.getByText('counting')).toBeInTheDocument();
  });

  it('when the session time runs out on the home screen, it drifts into rest by itself', async () => {
    vi.useFakeTimers();
    try {
      seedProfile({ settings: { sound: false, sessionMin: 5 } });
      render(<App />);
      await flush(5 * 60 * 1000 - 1000);
      expect(screen.queryByText(/rest time/)).not.toBeInTheDocument(); // a second to go
      await flush(1000); // time's up…
      await flush(1200); // …and after a short pause, rest
      expect(screen.getByText(/rest time/)).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it('an unknown ?screen falls back to home instead of a blank page', () => {
    seedProfile({ settings: { sound: false } });
    for (const bogus of ['nope', 'toString', '']) {
      window.history.replaceState({}, '', `/?screen=${bogus}`);
      const { unmount } = render(<App />);
      expect(screen.getByText('குமிழிகள்')).toBeInTheDocument();
      unmount();
    }
  });
});
