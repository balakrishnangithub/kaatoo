// Registers the offline-first service worker (public/sw.js).
//
// Deliberately quiet: no update toasts, no reload prompts, no badges. This is
// a child's calm space — the worker simply makes the next visit instant and
// fully offline. Registration is a progressive enhancement: if the browser
// doesn't support service workers, the app works exactly as before.
//
// import.meta.env.BASE_URL keeps the path correct under any deploy base
// ("/kaatoo/" on GitHub Pages, "/" elsewhere) — Vite replaces it at build time.

export function registerServiceWorker(): void {
  if (!('serviceWorker' in navigator)) return;
  if (!import.meta.env.PROD) return; // dev server: no SW, keep HMR pristine

  window.addEventListener('load', () => {
    const url = `${import.meta.env.BASE_URL}sw.js`;
    navigator.serviceWorker.register(url).catch(() => {
      // Offline support is best-effort; never surface errors to a toddler.
    });
  });
}
