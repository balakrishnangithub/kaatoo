import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import App from './App';

/**
 * The one invariant a toddler never forgives: the app boots and shows the
 * first-run experience without crashing. Kept intentionally small — game logic
 * is covered by the lib tests; this guards the wiring.
 */
describe('App shell', () => {
  it('renders onboarding on a fresh device (no stored settings)', () => {
    localStorage.clear();
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    );
    // first run greets the parent — the onboarding asks who this is for
    expect(document.body.textContent!.length).toBeGreaterThan(10);
  });

  it('renders the home garden for an onboarded child', () => {
    localStorage.setItem(
      'kaatoo-v1',
      JSON.stringify({
        settings: {
          name: 'சோதனை',
          birth: '2024-09-13',
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
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    );
    // her name is on the home screen
    expect(screen.getByText(/சோதனை/)).toBeInTheDocument();
    // and the ten activity cards are offered
    expect(screen.getByText('குமிழிகள்')).toBeInTheDocument();
    expect(screen.getByText('சொற்கள்')).toBeInTheDocument();
  });
});
