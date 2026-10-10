/// <reference types="vitest/config" />
import path from 'path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { swAssetsManifest } from './src/swAssetsManifest';

// https://vite.dev/config/
export default defineConfig({
  base: './', // relative paths — the app can be hosted from any sub-folder
  // With base './', Vite's runtime asset-URL join uses document.baseURI, which
  // breaks in some contexts (blob/module workers, unusual mount points).
  // Emitting explicitly relative URLs is deterministic everywhere, so hashed
  // assets always resolve next to index.html regardless of the deploy path.
  experimental: {
    renderBuiltUrl() {
      return { relative: true };
    },
  },
  plugins: [react(), swAssetsManifest()],
  server: {
    port: 3000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/env.ts', './src/test/setup.ts'],
    css: false,
  },
});
