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
 * The one dynamic surface, the Commission Desk's form endpoint, is handled by
 * `worker.ts` — a Cloudflare Worker that fronts this build and answers the one
 * route that cannot be a file. That keeps the whole Astro build static and
 * removes the adapter entirely: an adapter exists to run server routes, and
 * there are none.
 */
export default defineConfig({
  site: 'https://continuumstudios.co',
  output: 'static',

  /*
     /work was the index; /projects is. The case studies stay where they are —
     `/work/<slug>` is linked from the IstanMetro repo's own documentation and
     from the index page, and breaking a URL to tidy a route name is a bad
     trade. Only the listing moved.
  */
  redirects: {
    '/work': '/projects',
  },
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
