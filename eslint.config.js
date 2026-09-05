import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import astro from 'eslint-plugin-astro';
import svelte from 'eslint-plugin-svelte';
import svelteParser from 'svelte-eslint-parser';
import globals from './eslint.globals.js';

/**
 * Deliberately small. `astro check` and `svelte-check` do the type work; this
 * catches the correctness mistakes a type checker cannot see.
 *
 * Three parsers are needed because three syntaxes are in play: TypeScript in
 * `.ts`, TypeScript inside Astro frontmatter, and TypeScript inside Svelte
 * `<script lang="ts">`. Without them ESLint reads `interface` as a reserved
 * word and reports a parse error on every file.
 */
export default tseslint.config(
  { ignores: ['dist/**', '.astro/**', 'node_modules/**', '.wrangler/**'] },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  // -------------------------------------------------------------- .ts / .mjs
  {
    files: ['**/*.{ts,mts,js,mjs}'],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      globals,
    },
  },

  // ------------------------------------------------------------------ .astro
  ...astro.configs.recommended,
  {
    files: ['**/*.astro'],
    languageOptions: {
      globals,
    },
    rules: {
      // Astro components legitimately reference component names in markup that
      // the plugin cannot always see as usage.
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^(_|Astro)' },
      ],
    },
  },

  // ----------------------------------------------------------------- .svelte
  ...svelte.configs.recommended,
  {
    files: ['**/*.svelte'],
    languageOptions: {
      parser: svelteParser,
      parserOptions: {
        parser: tseslint.parser,
        extraFileExtensions: ['.svelte'],
      },
      globals,
    },
    rules: {
      // Svelte 5's compiler contract requires `let` for `$props()` and
      // `$state()` declarations even when the binding itself is only mutated,
      // so prefer-const does not apply inside a rune component. Disabled here
      // rather than worked around with per-line comments in every island.
      'prefer-const': 'off',
      'svelte/prefer-const': 'off',
    },
  },

  // ------------------------------------------------------------ house rules
  {
    // .svelte is deliberately absent: its rules are set in the block above,
    // and a later block would override them.
    files: ['**/*.{ts,mts,js,mjs,astro}'],
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      'no-unused-vars': 'off',
      // TypeScript already resolves identifiers, and no-undef cannot see type
      // positions — it reports every DOM type as undefined. typescript-eslint
      // recommends disabling it for exactly this reason.
      'no-undef': 'off',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      eqeqeq: ['error', 'always'],
      'prefer-const': 'error',
      // The specification bans `transition: all`; this is the JS-side analogue —
      // no silent any leaking through the type boundary.
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },

  // The budget guard is a Node script and legitimately logs.
  {
    files: ['scripts/**/*.mjs'],
    rules: { 'no-console': 'off' },
  },
);
