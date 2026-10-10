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

Ten activities, each adaptive to the child's age and demonstrated skill:

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

Design details worth knowing:

- **Handwriting, not print** — letters and digits render in real handwriting
  fonts (Kavivanar for Tamil, Andika for Latin) so children trace the forms
  people actually write.
- **The guiding hand** — a gentle hint appears only when needed (a wrong
  attempt, or idle confusion) and fades away as the child succeeds.
- **Multi-touch drawing** — every finger draws its own stroke, just like a real
  crayon on paper.
- **Dynamic difficulty** — age sets a soft ceiling; recent clean rounds nudge
  the level up or down inside that band (zone of proximal development).
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
- Zero runtime dependencies beyond `react`, `react-dom`, `react-router`

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
├── index.css             fonts, theme tokens, shared animations
├── art/                  hand-drawn SVG artwork (shapes, world objects)
├── components/
│   ├── chrome.tsx        HoldButton · GameShell · EndCard — the shared frame
│   └── hint.tsx          GuideHand (adaptive hints) · SwipeableCard · PicLabel
├── data/
│   ├── content.ts        every Tamil word, colour, shape, number, praise phrase
│   └── content.test.ts   integrity guard: every card points at artwork that exists
├── games/                the ten activities — one file each
├── hooks/
│   └── useInstruction.ts spoken instruction line for a game
├── lib/
│   ├── age.ts            age → developmental stage
│   ├── store.tsx         settings, progress, session timer (localStorage only)
│   ├── speech.ts         Tamil-first speech, chimes, sequenced utterances
│   ├── trace.ts          stroke/shape/glyph classifier for the drawing game
│   ├── util.ts           shuffle / pick / sample + the handwriting font stack
│   └── *.test.ts(x)      unit tests for the logic above
├── screens/              Home · Onboarding · Parent dashboard · WindDown
└── test/setup.ts         jsdom stubs (speech, matchMedia, canvas…)
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
