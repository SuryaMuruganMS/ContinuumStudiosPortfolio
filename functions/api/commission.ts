import {
  deliverCommission,
  readAnswers,
  type MailEnv,
} from '../../src/lib/commission-mail.ts';

/**
 * The Commission Desk endpoint — a native Cloudflare Pages Function.
 *
 * Served at /api/commission alongside the static build, with no Astro adapter
 * involved. Cloudflare bundles this file and its TypeScript imports itself.
 *
 * All of the actual work lives in `src/lib/commission-mail.ts`, shared with the
 * local Node server so the two cannot drift apart.
 *
 * LOCAL DEVELOPMENT
 * Pages Functions do not run under `astro dev` or `astro preview` — those serve
 * static files only, so a POST here 404s and the form looks broken. Use
 * `npm run serve` (scripts/serve-local.mjs), which serves `dist/` and answers
 * this same route with the same module.
 */

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });

export const onRequestPost = async (context: {
  request: Request;
  env: MailEnv;
}): Promise<Response> => {
  let answers;
  try {
    answers = await readAnswers(context.request);
  } catch {
    return json({ error: 'Could not read that submission.' }, 400);
  }

  const { status, body } = await deliverCommission(answers, context.env);
  return json(body, status);
};

/** A bare GET should not 404 silently during deployment checks. */
export const onRequestGet = async (): Promise<Response> =>
  json({ error: 'POST a commission payload to this endpoint.' }, 405);
