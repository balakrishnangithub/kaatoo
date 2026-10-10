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

Every game follows the same skeleton — copy it:

```tsx
export default function MyGame({ onHome }: { onHome: () => void }) {
  const { levelFor, recordWin, recordOutcome } = useStore();
  const level = levelFor('mygame', MAX_LEVEL);
  const [round, setRound] = useState(0);
  const [ended, setEnded] = useState(false);
  const [misses, setMisses] = useState(0);
  const done = ended || round >= ROUNDS;

  useInstruction('தமிழ் அறிவுரை', 'english echo', [round], !done);

  // …round logic; on finishing the LAST round: recordWin + setEnded(true)
  //    instead of setRound — nothing may appear or speak behind the EndCard.

  return (
    <div className="relative h-full">
      <GameShell ta="தமிழ் பெயர்" en="english name" art="someArt" onHome={onHome} tint="#…">
        <GuideHand target={…} layerRef={layerRef} guideKey="mygame"
                   active={!done} fireSignal={misses} />
        {/* play field */}
      </GameShell>
      {done && <EndCard onAgain={restart} onHome={onHome} />}
    </div>
  );
}
```

Rules that make games feel uniform:

- **Rounds are finite** (`ROUNDS` constant, usually 3–5). The last round sets
  `ended` — no phantom question behind the end card, no speech overlap.
- **`useInstruction(…, !done)`** — the instructor goes quiet when the game ends.
- **GuideHand with `fireSignal={misses}`** for tap-choice games — help answers
  a mistake, never anticipates. Free-play games (draw, bubbles) use the idle
  hand instead.
- **`recordOutcome(gameId, clean)`** once per round — that's the skill signal
  that drives difficulty. `recordWin(gameId)` once per game.
- **Speech**: `speak(ta, 'ta')` for single lines, `speakPair` for Tamil+English,
  `speakSeq` when highlights must follow the voice word by word. Always speak
  the _full_ name of a thing ("சிவப்பு வட்டம்"), never a fragment.
- **Cards**: use `SwipeableCard` with `behindNext`/`behindPrev` so every card
  deck in the app swipes the same way.
- **Letters/digits** always render with `style={{ fontFamily: HAND_FONT }}`.

## Adding a new game

1. Create `src/games/MyGame.tsx` following the recipe above.
2. Register it in the `GAMES` map in `src/App.tsx`.
3. Add its home-screen card to `ACTIVITIES` in `src/data/content.ts`
   (id, Tamil + English label, an artwork id, a pastel background).
4. If it needs new artwork, add a hand-drawn SVG component in `src/art/`
   (flat shapes, cream outlines, no gradients-heavy effects — see the existing
   ones for the visual language).
5. Verify: `npm run lint && npm run build`, then play it on a phone viewport
   (360×800 and 390×844) and a tablet viewport (800×1280). It must fit with no
   scrolling and no console errors.

## Device checklist

The app targets low/mid-range Androids, iPhones, and tablets. Before merging:

- [ ] 360×800 (small Android) · 390×844 (iPhone) · 412×915 (large Android) · 800×1280 (tablet)
- [ ] No horizontal/vertical overflow on any screen
- [ ] Sounds can be muted; the game is fully playable muted
- [ ] Session timer pause/resume works when the tab is backgrounded
- [ ] `localStorage` cleared → onboarding appears; everything still works

## Pull requests

- One focused change per PR. Describe _what a parent or toddler would notice_.
- Keep the calm-tech contract; if a change trades it off, the PR needs a
  written justification in the description.
- Be kind in review. Many contributors here are parents, not professional
  engineers — that is a feature.
