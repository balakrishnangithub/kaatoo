// Vite plugin: stamps the built service worker (dist/sw.js) with a fingerprint
// of the build and the list of files to precache.
//
// public/sw.js is copied to dist/ as-is, like everything in public/. Left that
// way, its bytes would never change between deploys — and a browser only
// installs a new worker when they do. So existing installs kept the first
// precache they ever made: old bundles piled up, and a changed font, icon or
// manifest never reached them. Once the whole build is on disk, this plugin
// lists and hashes every file in it and writes both into the worker.

import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import type { Plugin } from 'vite';

const WORKER = 'sw.js';
/** the line of public/sw.js that this plugin replaces */
const PLACEHOLDER = "const BUILD = { version: 'dev', files: [] };";

export function serviceWorkerBuild(): Plugin {
  let outDir = '';
  return {
    name: 'kaatoo-service-worker',
    apply: 'build',
    configResolved(config) {
      outDir = path.resolve(config.root, config.build.outDir);
    },
    writeBundle() {
      const workerPath = path.join(outDir, WORKER);
      const template = readFileSync(workerPath, 'utf8');
      if (!template.includes(PLACEHOLDER)) {
        // fail the build rather than ship a worker that never updates
        this.error(`${WORKER}: build placeholder not found — expected the line\n  ${PLACEHOLDER}`);
      }

      const files = readdirSync(outDir, { recursive: true, encoding: 'utf8' })
        .map((file) => file.split(path.sep).join('/'))
        .filter((file) => file !== WORKER && statSync(path.join(outDir, file)).isFile())
        .sort();

      const hash = createHash('sha256').update(template);
      for (const file of files) hash.update(file).update(readFileSync(path.join(outDir, file)));
      const build = { version: hash.digest('hex').slice(0, 12), files };

      writeFileSync(
        workerPath,
        template.replace(PLACEHOLDER, `const BUILD = ${JSON.stringify(build)};`),
      );
    },
  };
}
