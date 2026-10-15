# காட்டு · Kaatoo

**A calm, Tamil-first learning garden for little children (ages 2–6).**
No ads. No autoplay. No tricks. Everything stays on the device.

[![CI](https://github.com/balakrishnangithub/kaatoo/actions/workflows/ci.yml/badge.svg)](https://github.com/balakrishnangithub/kaatoo/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

Kaatoo (காட்டு) is a private-by-design progressive web app
built to be the healthy alternative to algorithmic video feeds: short, finite,
voice-guided Tamil learning games that end on their own and gently wind down
when the session is over.

---

## Why it exists

Toddler video platforms are engineered to be hard to put down. Kaatoo is
engineered to be easy to put down:

- **Finite by design** — every game is a handful of rounds, then a calm end card.
  Nothing autoplays, nothing infinite-scrolls, nothing dangles a "next" hook.
- **A real session boundary** — a parent-chosen session length ends in a
  breathing wind-down screen and ideas for offline play.
- **Tamil first** — the instructor speaks Tamil; English is an optional echo.
- **No persuasion architecture** — no points, streaks, loot, leaderboards,
  notifications, or reward pressure. Praise is warm, not manipulative.
- **No data leaves the device** — all progress lives in the browser's
  `localStorage`. There is no account, no server, no analytics, no upload.

## What's inside

Fourteen activities, each adapting to what the child can actually do — four of
them train the ear:

| Game                | What it teaches                                                                         |
| ------------------- | --------------------------------------------------------------------------------------- |
| குமிழிகள் · Bubbles | pop-and-discover: colours, shapes, numbers                                              |
| வார்த்தைகள் · Words | Tamil vocabulary cards (look → find)                                                    |
| வரை · Draw          | freehand tracing of shapes, digits, Tamil & Latin letters — with real handwriting fonts |
| வகைப்படுத்து · Sort | sort by colour, shape, category                                                         |
| நிழல் · Shadow      | match an object to its shadow                                                           |
| வேறு · Odd one out  | spot the different one                                                                  |
| அமைப்பு · Pattern   | copy & extend patterns (voice-synced)                                                   |
| எண் · Count         | count and match numerals                                                                |
| அளவு · Sizes        | big → small ordering, with a sorting celebration                                        |
| உணர்வு · Emotions   | feelings vocabulary (look → find)                                                       |
| சத்தம் · Sounds     | hear a sound, find what made it — sounds made on the device                             |
| பாடல் · Voices      | pitch by ear: did the big elephant (low) or the little bird (high) sing?                |
| கேள் · Listen       | the sounds inside Tamil words, down to பல் / பால்                                       |
| தாளம் · Drums       | drum along at her own pace, then echo short rhythms                                     |

Design details worth knowing:

- **Handwriting, not print** — letters and digits render in real handwriting
  fonts (Kavivanar for Tamil, Andika for Latin) so children trace the forms
  people actually write.
- **The guiding hand** — a gentle hint appears only when needed (a wrong
  attempt, or idle confusion) and fades away as the child succeeds.
- **Multi-touch drawing** — every finger draws its own stroke, just like a real
  crayon on paper.
- **Difficulty that follows her, not her age** — every game keeps a running
  skill estimate (Elo-style, corrected for lucky guesses), updated after each
  round, and deals the next round at the hardest level she should still get
  right about four times in five. Age only picks where a new game starts;
  there is no age ceiling. Every fourth round is an easy one, mashing counts
  for less, and time away makes the estimate quick to move again
  (`src/lib/skill.ts`).
- **Listening games built for small speakers** — every sound is made on the
  device (no recordings), carries its identity above 300 Hz where phone
  speakers still play, and the pitch game varies loudness so only pitch can
  tell the voices apart. The drum game judges only the gaps between taps, so
  each phone's touch and audio delay cancels out. Research notes are in the
  parents' corner and each game file.
- **Runs on modest hardware** — no blur or heavy effects behind overlays, a
  drawing canvas capped at 2× resolution, one shared audio output with a soft
  limiter (no crackle on phone speakers), sound unlocked on the first touch,
  and on iPhone it plays through the silent switch. The parents' corner shows
  which Tamil voice the device has, and how to add one.
- **Built for small hands** — tap, swipe, and drag all work everywhere; swiping
  a card reveals the next card underneath it.

## Tech stack

Plain and boring on purpose — easy to read, easy to host, easy to maintain:

- **React 19 + TypeScript + Vite**
- **Tailwind CSS 3** for styling; hand-drawn inline SVG for all artwork
- **Web Speech API** (`speechSynthesis`) for the instructor's voice — uses the
  device's own Tamil voice, fully offline
- **Canvas + pointer events** for the drawing board; a small custom stroke
  classifier (`src/lib/trace.ts`) judges tracings — no ML model, no network
- Zero runtime dependencies beyond `react` and `react-dom`

## Getting started

Requires Node.js ≥ 20.

```bash
npm install
npm run dev            # develop at http://localhost:3000
npm run check          # lint + format + unit tests + build — the one command CI runs
npm run test           # unit tests (Vitest)
npm run lint           # ESLint
npm run format         # Prettier — auto-format
npm run build          # type-check + production build into dist/
npm run preview        # serve the production build locally
```

`dist/` is fully static — host it anywhere (GitHub Pages, Netlify, a Raspberry
Pi on the home Wi-Fi). `base: './'` is set, so any sub-folder works. A GitHub
Actions workflow (`.github/workflows/deploy.yml`) already publishes `main` to
GitHub Pages on every push — just enable **Settings → Pages → GitHub Actions**.

## Project structure

```
src/
├── App.tsx               screen switch: home / parent / the ten games
├── App.test.tsx          boots-and-renders smoke tests
├── main.tsx              entry point
├── registerSW.ts         registers the offline service worker (production only)
├── index.css             fonts, theme tokens, shared animations
├── art/                  hand-drawn SVG artwork (shapes, world objects)
├── components/
│   ├── chrome.tsx        HoldButton · GameShell · EndCard — the shared frame
│   ├── hint.tsx          GuideHand (adaptive hints) · SwipeableCard
│   ├── lookfind.tsx      the "look, then find" activity behind Words and Emotions
│   └── listening.tsx     what the listening games share: the sound gate, the replay bubble
├── data/
│   ├── content.ts        every Tamil word, colour, shape, number, praise phrase
│   ├── levels.ts         what each level of each game asks of her
│   └── content.test.ts   integrity guard: every card points at artwork that exists
├── games/                the fourteen activities — one file each, loaded when opened
├── hooks/
│   ├── useRounds.ts      the round lifecycle every tap-choice game shares
│   ├── useSkill.ts       a game's live skill estimate: open, record, next level
│   ├── useTimers.ts      timeouts that cannot outlive the screen
│   ├── useFlash.ts       a value that clears itself (the wrong-tap wiggle)
│   ├── useGuide.ts       how much help she still gets (the adaptive fade)
│   ├── useElementSize.ts a play field measuring itself
│   └── useInstruction.ts spoken instruction line for a game
├── lib/
│   ├── age.ts            age → developmental stage
│   ├── skill.ts          the skill model: estimate, update, choose the next level
│   ├── store.tsx         settings, progress, session timer (localStorage only)
│   ├── audio.ts          the shared WebAudio output: limiter, unlock on first touch
│   ├── sounds.ts         every sound the listening games play, made on the device
│   ├── rhythm.ts         the drum game's patterns, judged by the gaps between taps
│   ├── listen.ts         "listen closely" rounds, by how alike the names sound
│   ├── speech.ts         Tamil-first speech, chimes, sequenced utterances
│   ├── trace.ts          stroke/shape/glyph classifier for the drawing game
│   ├── seriation.ts      big-to-small layout maths for the sizes game
│   ├── util.ts           shuffle / pick / sample + the handwriting font stack
│   └── *.test.ts(x)      unit tests for the logic above
├── screens/              Home · Onboarding · Parent dashboard · WindDown
└── test/
    ├── setup.ts          jsdom stubs (speech, matchMedia, canvas…)
    └── helpers.tsx       shared test helpers (seeded profile, fake speech queue…)

public/sw.js              the service worker (offline-first)
vite-plugin-sw.ts         stamps each build's fingerprint + file list into it
```

## Privacy

There is nothing to leak. The app makes **zero network requests** for data
(the only requests are the static font files it ships with). All state is a
single `localStorage` key (`kaatoo-v1`). Clearing the browser data resets
everything. There is no telemetry of any kind.

## Contributing

Contributions are welcome — see [CONTRIBUTING.md](CONTRIBUTING.md). The short
version: keep it calm, keep it finite, keep it Tamil-first, keep `npm run lint`
clean, and never add a dependency you can't justify to a parent.

## License

[MIT](LICENSE) © Kaatoo contributors.
