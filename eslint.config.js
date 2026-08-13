import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      // React 19's compiler-oriented rule: assumes the React Compiler is
      // in play. This hand-written hooks codebase is not — the rule flags
      // legitimate circular closures (e.g. judgeAnswerRow ↔ sendEvent)
      // that are safe by JS semantics and have no code-level fix short of
      // a full compiler-style rewrite. Keep lint meaningful; drop this rule.
      'react-hooks/immutability': 'off',
    },
  },
])
