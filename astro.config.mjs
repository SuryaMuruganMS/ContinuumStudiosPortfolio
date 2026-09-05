// @ts-check
import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';

/**
 * Continuum Studios build configuration.
 *
 * Fully static. Every page is prerendered HTML, which is what makes the
 * specification's performance budgets reachable — a site that renders per
 * request cannot hold a sub-1.2s LCP on a cold edge cache.
 *
 * The one dynamic surface, the Commission Desk's form endpoint, is a native
 * Cloudflare Pages Function in `functions/api/commission.ts` rather than an
 * Astro on-demand route. That keeps the whole Astro build static and removes
 * the adapter entirely: an adapter exists to run server routes, and there are
 * none. Pages Functions are the native Cloudflare Pages mechanism for this,
 * so deployment is unchanged.
 */
export default defineConfig({
  site: 'https://continuumstudios.co',
  output: 'static',
  integrations: [svelte()],
  prefetch: {
    // Prefetch on hover only. Viewport prefetching would pull every project
    // page from the index and blow the transfer budget the site publishes.
    prefetchAll: false,
    defaultStrategy: 'hover',
  },
  build: {
    inlineStylesheets: 'auto',
  },
  vite: {
    build: {
      // Surfaces budget problems during the build rather than at audit time.
      chunkSizeWarningLimit: 90,
      cssCodeSplit: true,
    },
  },
});
