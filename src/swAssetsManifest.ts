// Vite plugin: writes dist/sw-assets.js — a JSON array of every hashed bundle
// asset (paths like "assets/index-BD7oTfdv.css", relative so any deploy base
// works). public/sw.js fetches this at install time to precache the exact
// build output. Emitted via emitFile in generateBundle, so it always reflects
// the final hashed file list.

import type { Plugin } from 'vite';

export function swAssetsManifest(): Plugin {
  return {
    name: 'kaatoo-sw-assets-manifest',
    apply: 'build',
    generateBundle(_options, bundle) {
      const assets = Object.keys(bundle).filter((f) => f.startsWith('assets/'));
      this.emitFile({ type: 'asset', fileName: 'sw-assets.js', source: JSON.stringify(assets) });
    },
  };
}
