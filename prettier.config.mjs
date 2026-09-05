/** @type {import("prettier").Config} */
export default {
  printWidth: 96,
  singleQuote: true,
  semi: true,
  trailingComma: 'all',
  plugins: ['prettier-plugin-astro', 'prettier-plugin-svelte'],
  overrides: [
    { files: '*.astro', options: { parser: 'astro' } },
    { files: '*.svelte', options: { parser: 'svelte' } },
  ],
};
