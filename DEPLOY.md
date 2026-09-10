# Deploying Continuum Studios to Cloudflare

The site is a static Astro build with one Worker route in front of it.
`worker.ts` exists solely to answer `POST /api/commission`, which cannot be a
file; everything else is matched as a static asset before the script runs at
all.

## From this machine

```bash
npx wrangler login     # once, opens a browser
npm run deploy         # builds, then uploads dist/ and worker.ts
```

`npm run deploy` runs `astro build` first on purpose. Deploying a stale `dist/`
is the easiest mistake to make here and the hardest to notice, because the
deploy succeeds.

To check what would be uploaded without uploading it:

```bash
npm run deploy:dry
```

To run the Worker locally, with the commission endpoint live:

```bash
npm run build
npm run preview:worker
```

## From the Cloudflare dashboard (Git-connected)

Workers → Create → Import a repository → `SuryaMuruganMS/ContinuumStudiosPortfolio`, then:

| Setting        | Value                     |
| -------------- | ------------------------- |
| Build command  | `npm run build`           |
| Deploy command | `npx wrangler deploy`     |
| Root directory | `/`                       |
| Node version   | `22` (read from `.nvmrc`) |

No build output directory — `wrangler.jsonc` already points at `./dist`, and a
second, disagreeing answer in the dashboard is how a deploy ends up serving an
empty site.

## Secrets

One, and the commission form is the only thing that needs it:

```bash
npx wrangler secret put RESEND_API_KEY
```

Without it the endpoint still answers, logs a warning and does not send. That
is deliberate — a form that 500s is worse than a form that accepts and tells
you it could not deliver — but it means a missing secret is silent unless you
look. `observability` is on in `wrangler.jsonc` so the warning reaches the
dashboard logs rather than being discarded.

## What is in wrangler.jsonc, and why

- **`name: "continuumstudios"`** — decides the address. The Worker already
  exists at `https://continuumstudios.suryamuruganms40.workers.dev`.
- **`main: "./worker.ts"`** — the commission endpoint. This is the only one of
  the studio's sites that needs a script.
- **`assets.binding: "ASSETS"`** — gives `worker.ts` `env.ASSETS.fetch()` so
  anything that is not `/api/commission` is handed straight back to the asset
  server, which applies `_headers` and the 404 page.
- **`not_found_handling: "404-page"`** — serves `dist/404.html`.

## A note on Pages

This used to be a Pages project with `functions/api/commission.ts`. Cloudflare
has retired the Pages creation flow; new projects deploy as Workers with Static
Assets, and `functions/` is a Pages-only convention a Worker never reads. Left
alone, the form would have deployed looking fine and 404'd on submit. The
delivery logic did not move — it is still `src/lib/commission-mail.ts`, shared
with `scripts/serve-local.mjs`. Only the runtime wrapper changed, which is why
that module was kept runtime-agnostic in the first place.

## Before deploying

```bash
npm run verify
```

Format, lint, types, svelte-check, build, budgets.
