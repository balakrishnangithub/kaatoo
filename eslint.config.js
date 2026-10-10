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
      // Games reset a whole round's state inside `useEffect(() => { … }, [round])`.
      // That is the app's deliberate round architecture: each reset is idempotent,
      // keyed off the round counter, and cannot cascade — so this React Compiler
      // strictness rule would only force awkward workarounds here.
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
