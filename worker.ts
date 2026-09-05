import { deliverCommission, readAnswers, type MailEnv } from './src/lib/commission-mail.ts';

/**
 * Continuum Studios — the Cloudflare Worker that fronts the static build.
 *
 * WHY THIS REPLACED A PAGES FUNCTION
 * The Commission Desk endpoint used to be `functions/api/commission.ts`, a
 * native Pages Function. Cloudflare has since retired the Pages creation flow;
 * new projects deploy as Workers with Static Assets, and the `functions/`
 * directory is a Pages-only convention that a Worker never reads. Left as it
 * was, the form would have deployed looking fine and 404'd on submit.
 *
 * The delivery logic did not move — it still lives in `src/lib/commission-mail.ts`,
 * shared with `scripts/serve-local.mjs`. Only the runtime wrapper changed, which
 * is the whole reason that module was kept runtime-agnostic in the first place.
 *
 * HOW REQUESTS ARE ROUTED
 * Static assets are matched first by the platform, so every real page, image and
 * font is served from the edge without this script running at all. Only a request
 * that matches no file reaches `fetch` below — /api/commission, or a genuine
 * miss, which is handed back to the asset server for the 404 page.
 */

/** The static-asset server, bound as ASSETS in wrangler.jsonc. */
interface AssetFetcher {
  fetch(request: Request): Promise<Response>;
}

interface Env extends MailEnv {
  ASSETS: AssetFetcher;
}

const json = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });

const commission = async (request: Request, env: Env): Promise<Response> => {
  /** A bare GET should not 404 silently during deployment checks. */
  if (request.method !== 'POST') {
    return json({ error: 'POST a commission payload to this endpoint.' }, 405);
  }

  let answers;
  try {
    answers = await readAnswers(request);
  } catch {
    return json({ error: 'Could not read that submission.' }, 400);
  }

  const { status, body } = await deliverCommission(answers, env);
  return json(body, status);
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(request.url);

    if (pathname === '/api/commission') {
      return commission(request, env);
    }

    // Not an API route and not a file: let the asset server answer, which
    // applies _headers, _redirects and the 404 page.
    return env.ASSETS.fetch(request);
  },
};
