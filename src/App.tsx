import { useEffect, useState } from 'react';
import { StoreProvider, useStore } from './lib/store';
import Home from './screens/Home';
import Onboarding from './screens/Onboarding';
import Parent from './screens/Parent';
import WindDown from './screens/WindDown';
import Bubbles from './games/Bubbles';
import Words from './games/Words';
import Draw from './games/Draw';
import Sort from './games/Sort';
import Shadow from './games/Shadow';
import Odd from './games/Odd';
import Pattern from './games/Pattern';
import Count from './games/Count';
import Sizes from './games/Sizes';
import Emotions from './games/Emotions';

type Screen = 'home' | 'parent' | string;

const GAMES: Record<string, React.ComponentType<{ onHome: () => void }>> = {
  bubbles: Bubbles,
  words: Words,
  draw: Draw,
  sort: Sort,
  shadow: Shadow,
  odd: Odd,
  pattern: Pattern,
  count: Count,
  sizes: Sizes,
  emotions: Emotions,
};

function Shell() {
  const [screen, setScreen] = useState<Screen>(() => {
    const p = new URLSearchParams(window.location.search).get('screen');
    return p ?? 'home';
  });
  const { phase, timeLeft, goRest, settings } = useStore();

  const home = () => setScreen('home');
  const Game = GAMES[screen];

  // ?rest=1 opens straight into the wind-down (handy for testing)
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('rest')) goRest();
  }, [goRest]);

  // if time runs out while idling on home, drift into rest on its own
  useEffect(() => {
    if (screen === 'home' && timeLeft <= 0 && phase === 'play') {
      const id = window.setTimeout(goRest, 1200);
      return () => window.clearTimeout(id);
    }
  }, [screen, timeLeft, phase, goRest]);

  // very first open: meet the parent first, collect who this is for
  const needsOnboarding = !settings.onboarded && screen === 'home' && phase === 'play';

  return (
    <div className="h-full max-w-5xl mx-auto">
      {needsOnboarding ? (
        <Onboarding />
      ) : (
        <>
          {screen === 'home' && <Home onOpen={setScreen} onParent={() => setScreen('parent')} />}
          {screen === 'parent' && <Parent onBack={home} />}
          {Game && <Game onHome={home} />}
          {phase === 'rest' && <WindDown />}
        </>
      )}
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  );
}
