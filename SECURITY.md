# Security Policy

Kaatoo is a fully client-side app: it has no server, no accounts, and makes no
network requests for data. All state lives in the browser's `localStorage` on
the child's own device.

That said, we take two things seriously:

1. **Dependency vulnerabilities** — we pin and review updates (Dependabot opens
   small grouped PRs). If you find a vulnerable dependency, tell us.
2. **Privacy regressions** — if you ever see Kaatoo attempt a network request
   for user data, that is a critical bug. Please report it immediately.

## Reporting

Please **do not** open a public issue for a sensitive report.
Email **light.bala@gmail.com** instead. We'll acknowledge within a few days and
fix before any public disclosure.

## Supported versions

Only the latest commit on `main` is supported. There are no back-port branches.
