<!-- Thank you for keeping Kaatoo calm. One focused change per PR, please. -->

## What a parent or toddler would notice

<!-- One or two sentences, in plain words. e.g. "The sort game now says the
     full name — colour and shape — when a piece is placed." -->

## Calm-tech contract

Confirm this change keeps the promises (see CONTRIBUTING.md):

- [ ] Play stays **finite** — no infinite feeds, autoplay chains, or "one more" hooks
- [ ] **No persuasion architecture** — no points, streaks, badges-for-returning, or pressure
- [ ] **Tamil stays first** — English only as the optional echo
- [ ] **No data leaves the device** — no analytics, network calls, or third-party SDKs
- [ ] Failure stays **gentle** — soft chime and the guiding hand, never red flashes or timers

## Checks

- [ ] `npm run check` passes locally (lint + format + tests + build)
- [ ] Played on a small phone viewport (360×800) with no overflow and no console errors
- [ ] New/changed logic has a test in `src/**/*.test.*`

## Screenshots (optional)

<!-- For any visual change, a before/after helps reviewers a lot. -->
