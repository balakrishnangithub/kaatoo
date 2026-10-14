/// <reference types="vitest/config" />
import { execSync } from 'node:child_process';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { serviceWorkerBuild } from './vite-plugin-sw';

// short commit id stamped into the footer, so a screen recording always shows
// exactly which build is running (offline app + CDN caches make "did I get the
// update?" otherwise unanswerable). Works in CI and for local builds alike.
let appBuild = 'dev';
try {
  appBuild = execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
    .toString()
    .trim();
} catch {
  /* no git here (e.g. source tarball) — stay on 'dev' */
}

// https://vite.dev/config/
export default defineConfig({
  base: './', // relative paths — the app can be hosted from any sub-folder
  define: {
    __APP_BUILD__: JSON.stringify(appBuild),
  },
  // With base './', Vite's runtime asset-URL join uses document.baseURI, which
  // breaks in some contexts (blob/module workers, unusual mount points).
  // Emitting explicitly relative URLs is deterministic everywhere, so hashed
  // assets always resolve next to index.html regardless of the deploy path.
  experimental: {
    renderBuiltUrl() {
      return { relative: true };
    },
  },
  plugins: [react(), serviceWorkerBuild()],
  server: {
    port: 3000,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/env.ts', './src/test/setup.ts'],
    css: false,
  },
});
