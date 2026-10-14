import { StrictMode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import WindDown from './WindDown';
import { StoreProvider } from '../lib/store';
import { flush, seedProfile } from '../test/helpers';

const BREATH = 4000; // one breath in, or one breath out

describe('WindDown', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    seedProfile({ settings: { sound: false } });
  });
  afterEach(() => vi.useRealTimers());

  it('breathes three full cycles before the offline idea appears', async () => {
    // StrictMode on purpose (the app runs under it in development): the cycle
    // used to be counted from inside another state updater, which StrictMode
    // runs twice — so the rest ended a whole breath early.
    render(
      <StrictMode>
        <StoreProvider>
          <WindDown />
        </StoreProvider>
      </StrictMode>,
    );
    expect(screen.getByText('உள்ளே இழு…')).toBeInTheDocument();
    await flush(BREATH);
    expect(screen.getByText('வெளியே விடு…')).toBeInTheDocument();

    // three cycles = six breaths; one is already behind us
    for (let breath = 2; breath <= 6; breath++) {
      expect(screen.queryByText(/hold to play again/)).not.toBeInTheDocument();
      await flush(BREATH);
    }
    expect(screen.getByText(/hold to play again/)).toBeInTheDocument();
    expect(screen.getByText(/TRY THIS/)).toBeInTheDocument();
  });
});
