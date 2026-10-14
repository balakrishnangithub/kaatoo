import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // A handful of effects set state on purpose, in step with something
      // outside React: the session clock running out, the voice starting a new
      // line, the guiding hand's target going away. Each is a one-shot sync
      // that cannot cascade — so this React Compiler strictness rule would only
      // force awkward workarounds here. (Rounds are NOT dealt in effects: that
      // is useRounds' job, in the same update as the round change.)
      'react-hooks/set-state-in-effect': 'off',
    },
  },
  {
    // context modules co-locate provider + hook on purpose — the hook is the
    // module's public API, and fast refresh still works through consumers.
    files: ['src/lib/store.tsx'],
    rules: { 'react-refresh/only-export-components': 'off' },
  },
]);
