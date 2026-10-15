# Contributing to Kaatoo (காட்டு)

Thank you for helping make a calmer corner of the internet for little children.
This guide is short on purpose — the codebase is too.

## The calm-tech contract

Every change must keep these promises. They are the product.

1. **Finite play.** Games end. No infinite feeds, no autoplay chains, no
   "just one more" mechanics.
2. **No persuasion architecture.** No points, streaks, badges-for-returning,
   push hooks, variable-ratio rewards, or countdown pressure. Praise is warm
   and generic ("மிக நன்று!"), never comparative or scarcity-based.
3. **Tamil first.** The primary spoken and printed language is Tamil; English
   rides along as an optional echo.
4. **Privacy is absolute.** No network calls for data, no analytics, no
   third-party SDKs. Everything lives in `localStorage`.
5. **Gentle failure.** Wrong attempts get a soft chime and, only when needed,
   the guiding hand — never red flashes, buzzers, or time penalties.
6. **Battery & performance matter.** rAF-throttle pointer work, pause when
   `document.hidden`, avoid per-second re-render storms. Children play on
   mid-range phones.

## Ground rules for code

- TypeScript, strict. **`npm run check` must pass** — that one command runs
  lint + format + unit tests + the production build, exactly what CI runs on
  every pull request. If it's green locally, it'll be green on GitHub.
- Tests live next to the code (`src/**/*.test.ts(x)`). New game logic, helpers,
  or content edits should come with a test — especially anything in `src/lib/`
  and `src/data/`, which the games silently depend on.
- Formatting is not a debate — Prettier decides (`npm run format`).
- Functional components + hooks. State lives in the game component; shared
  state lives only in `src/lib/store.tsx`.
- Pure helpers in `src/lib/`, React hooks in `src/hooks/`, reusable UI in
  `src/components/`. Don't export helpers from component files (fast refresh
  depends on it).
- One game = one file in `src/games/`. If a game grows past ~350 lines, split
  its modes into sibling components.
- Comment the _why_, especially where a choice protects the child (cite the
  reasoning inline, as the existing code does).

## The game recipe

Every round-based game is built from the same hooks — start from this:

```tsx
/** how many levels (from LEVELS.mygame), and what luck can do at each */
const LADDER: Ladder = { top: topLevel('mygame'), chance: (level) => 1 / OPTIONS[level] };

function deal(level: number): Board {
  /* a fresh board at this level */
}

export default function MyGame({ onHome }: { onHome: () => void }) {
  const [picked, setPicked] = useState<string[]>([]); // any per-round state of your own
  const { board, level, round, done, solved, misses, miss, solve, restart } = useRounds('mygame', {
    rounds: ROUNDS,
    ladder: LADDER,
    deal, // called with the level her play calls for, at the start of each round
    onDeal: () => setPicked([]), // reset your own per-round state here
  });
  const [wrong, flashWrong] = useFlash<string>();

  useInstruction('தமிழ் அறிவுரை', 'english echo', [round], !done);

  const choose = (option: Option) => {
    if (solved) return; // the round is answered — stray taps do nothing
    if (isRight(option)) {
      chimeGood();
      speak('சரி!', 'ta');
      solve(800); // records the round, then deals the next one (or ends the game)
    } else {
      miss(); // soft chime, and one more reason to offer help
      flashWrong(option.key);
    }
  };

  return (
    <div className="relative h-full">
      <GameShell ta="தமிழ் பெயர்" en="english name" art="someArt" onHome={onHome} tint="#…">
        <GuideHand target={…} layerRef={layerRef} guideKey="mygame"
                   active={!solved && !done} fireSignal={misses} />
        {/* play field */}
      </GameShell>
      {done && <EndCard onAgain={restart} onHome={onHome} />}
    </div>
  );
}
```

What each hook is for — each one replaces code that used to be hand-copied
into every game, where the copies had drifted apart:

- **`useRounds(gameId, { rounds, ladder, deal, onDeal })`** owns the round
  lifecycle: a double-tap on the right answer counts once, the last round ends
  the game instead of dealing a phantom question behind the end card, and
  nothing fires after the child has left. It picks each round's level from her
  skill estimate and calls `deal(level)` in the same update as the round
  change — so a new round never paints with the old round's state, and a level
  that changes only ever arrives with the next round, never under her finger.
  It records every round into the estimate and `recordWin` once per game;
  games never call those themselves.
- **Levels** are described once, in `src/data/levels.ts` (what each level asks,
  in plain words for the parents' corner). A game's `Ladder` says how many there
  are, the chance of a lucky clean round at each (`chance`: 1/3 for one
  picture out of three), and, for rounds of several decisions, how many
  (`steps`, for partial credit). Get `chance` right: it is what stops a child
  who is guessing from being promoted. Games without rounds (Bubbles, Draw)
  use `useSkill` directly — `opening`, `record(level, score)`, `next(level)`.
- **Never read the level during a round** to decide what to show — use the
  `level` (or the `board`) `useRounds` dealt. The tap that ends a round is what
  moves the estimate.

- **`useTimers()`** — arm follow-ups with `later(fn, ms)`, never a bare
  `setTimeout`: they are disarmed when the game unmounts.
- **`useFlash()`** — the 450 ms wiggle on a wrong tap.

Rules that make games feel uniform:

- **Rounds are finite** (`ROUNDS` constant, usually 3–5).
- **`useInstruction(…, !done)`** — the instructor goes quiet when the game ends.
- **GuideHand with `fireSignal={misses}`** for tap-choice games — help answers
  a mistake, never anticipates. Free-play games (draw, bubbles) use the idle
  hand instead.
- **Speech**: `speak(ta, 'ta')` for single lines, `speakPair` for Tamil+English,
  `speakSeq` when highlights must follow the voice word by word. A line
  interrupts whatever is being said; pass `{ queue: true }` when it must
  _follow_ the previous line instead (a round's question after the opening
  instruction) — otherwise one of the two is cut off after a syllable. Always
  speak the _full_ name of a thing ("சிவப்பு வட்டம்"), never a fragment.
- **Cards**: use `SwipeableCard` with `behindNext`/`behindPrev` so every card
  deck in the app swipes the same way. A "look, then find" vocabulary game is
  just `LookFind` with its own cards (see Words and Emotions).
- **Letters/digits** always render with `style={{ fontFamily: HAND_FONT }}`.
- **Styling**: `btn-chunky` and `sticker` live in Tailwind's components layer,
  so a utility on the same element wins (`btn-chunky bg-sun` is yellow). Keep
  them there. And put `anim-pop` on a _child_ of anything positioned with a
  transform — an animation outranks the element's own `transform`.

## Adding a new game

1. Add its home-screen card to `ACTIVITIES` in `src/data/content.ts`
   (id, Tamil + English label, an artwork id, a pastel background). That
   creates its `GameId`.
2. Create `src/games/MyGame.tsx` following the recipe above.
3. Register it in the `GAMES` map in `src/App.tsx` — the compiler insists:
   the map is keyed by `GameId`, so a missing or misspelt entry does not build.
4. If it needs new artwork, add a hand-drawn SVG component in `src/art/`
   (flat shapes, cream outlines, no gradients-heavy effects — see the existing
   ones for the visual language).
5. Verify: `npm run lint && npm run build`, then play it on a phone viewport
   (360×800 and 390×844) and a tablet viewport (800×1280). It must fit with no
   scrolling and no console errors.

## Device checklist

The app targets mid-range and flagship Androids, iPhones, Android tablets and
touch laptops — e.g. Galaxy M47 5G, Galaxy Note20, Galaxy S23 Ultra, Galaxy
Tab S7, iPhone 13, iPhone 17, Lenovo Yoga 7i. Before merging:

- [ ] Phones, as the page sees them inside the browser: 360×640 (the smallest)
      · 384×760 (Galaxy M47, Chrome) · 390×664 (iPhone 13, Safari) · 412×839
      (Note20) · 360×700 (S23 Ultra, zoomed display) — and installed to the home
      screen: 390×844 · 402×874 (iPhone 17) · 384×824 (S23 Ultra)
- [ ] Tablet both ways: 800×1192 and 1280×712 (Galaxy Tab S7)
- [ ] Laptop: 1280×720 with touch, 1536×864 with a mouse (Yoga 7i)
- [ ] Each game at its **easiest and hardest level** (the hardest has the most
      pieces on screen) — no horizontal/vertical overflow, every button reachable
- [ ] With the CPU throttled 4× in DevTools (a mid-range phone), Bubbles and the
      Sizes celebration still move smoothly
- [ ] The parents' corner voice check names a Tamil voice (or explains how to add one)
- [ ] Sounds can be muted; the game is fully playable muted
- [ ] Session timer pause/resume works when the tab is backgrounded
- [ ] `localStorage` cleared → onboarding appears; everything still works

## Pull requests

- One focused change per PR. Describe _what a parent or toddler would notice_.
- Keep the calm-tech contract; if a change trades it off, the PR needs a
  written justification in the description.
- Be kind in review. Many contributors here are parents, not professional
  engineers — that is a feature.
