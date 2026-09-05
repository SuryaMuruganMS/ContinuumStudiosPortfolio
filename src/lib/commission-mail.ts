import { buildBrief, isEmailish, type Answers } from '../components/commission/brief.ts';
import { SITE } from './site.ts';

/**
 * Delivery logic for the Commission Desk, kept separate from any one runtime.
 *
 * It is imported by two callers that cannot share a runtime:
 *   - `functions/api/commission.ts` — the Cloudflare Pages Function (production)
 *   - `scripts/serve-local.mjs`     — a plain Node server (local verification)
 *
 * Pages Functions do not run under `astro dev` or `astro preview`, and on this
 * machine `wrangler pages dev` cannot start workerd at all. Without a shared
 * module the local server would have had to re-implement the brief rendering
 * and the send, which is exactly the kind of duplicate that drifts and then
 * lies about what production does.
 *
 * Nothing here touches Node or Workers built-ins — only `fetch` — so it runs
 * unchanged on both.
 *
 * Imports carry explicit `.ts` extensions because Node's native type stripping
 * does no extension resolution; Astro and Cloudflare both accept them.
 */

export interface MailEnv {
  RESEND_API_KEY?: string;
  /** Must be a domain verified in Resend, or the send is rejected. */
  COMMISSION_FROM?: string;
  /** Where enquiries land. Defaults to the studio address. */
  COMMISSION_TO?: string;
}

export interface Outcome {
  status: number;
  body: Record<string, unknown>;
}

export function renderText(a: Answers): string {
  const doc = buildBrief(a);
  const lines = [
    'PROJECT BRIEF',
    '',
    `FROM  ${a.email}`,
    '',
    'OBJECTIVE',
    doc.objective,
    '',
    'INCLUDED',
    ...doc.inclusions.map((x) => `  - ${x}`),
    '',
    'NOT INCLUDED',
    ...doc.exclusions.map((x) => `  - ${x}`),
    '',
    'ASSUMPTIONS',
    ...doc.assumptions.map((x) => `  - ${x}`),
    '',
    'LARGEST RISKS',
    ...doc.risks.map((x) => `  - ${x}`),
    '',
    'PHASES',
    ...doc.phases.map((p, i) => `  ${i + 1}. ${p.name} - ${p.detail}`),
    '',
    'RANGE',
    doc.range,
    a.note ? `\nTHEIR NOTE\n${a.note}` : '',
  ];
  return lines.filter((l) => l !== '').join('\n');
}

/**
 * Validate, then send. Returns the status and JSON body the caller should
 * reply with; it never throws for an expected failure.
 */
export async function deliverCommission(answers: Answers, env: MailEnv): Promise<Outcome> {
  if (!isEmailish(answers.email)) {
    return {
      status: 422,
      body: { error: 'Enter an email address we can reply to.', field: 'email' },
    };
  }

  const key = env.RESEND_API_KEY;

  /**
   * `onboarding@resend.dev` is Resend's own always-verified sender, so the form
   * works the moment a key exists rather than failing with a 403 on an
   * unverified domain — which looks like a code bug. Point COMMISSION_FROM at
   * the studio domain once it is verified.
   */
  const from = env.COMMISSION_FROM ?? `${SITE.name} <onboarding@resend.dev>`;
  const studio = env.COMMISSION_TO ?? SITE.email;

  // Without a key the endpoint still validates and accepts, but it must say so.
  // Reporting `delivered: true` here is what let a broken form look healthy.
  if (!key) {
    console.warn('[commission] RESEND_API_KEY not set - accepted but NOT delivered');
    return { status: 200, body: { ok: true, delivered: false, reason: 'not-configured' } };
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        from,
        /**
         * The studio is the recipient — this is an enquiry. The visitor is
         * copied so they keep the brief, and reply_to means hitting reply
         * reaches them rather than us.
         */
        to: [studio],
        cc: [answers.email],
        reply_to: [answers.email],
        subject: `Commission brief - ${answers.email}`,
        text: renderText(answers),
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      console.error(`[commission] Resend returned ${res.status}: ${detail}`);
      return {
        status: 502,
        body: {
          error: `That did not send. Email ${SITE.email} and we will pick it up.`,
          delivered: false,
        },
      };
    }
    return { status: 200, body: { ok: true, delivered: true } };
  } catch (error) {
    console.error('[commission] delivery failed', error);
    return {
      status: 502,
      body: {
        error: `That did not send. Email ${SITE.email} and we will pick it up.`,
        delivered: false,
      },
    };
  }
}

/** Accepts JSON from the island and form-encoded from the no-JS path. */
export async function readAnswers(request: Request): Promise<Answers> {
  const type = request.headers.get('content-type') ?? '';
  if (type.includes('application/json')) {
    return (await request.json()) as Answers;
  }
  const form = await request.formData();
  return {
    shape: (form.get('shape') as Answers['shape']) ?? null,
    substance: form.getAll('substance') as Answers['substance'],
    timing: (form.get('timing') as Answers['timing']) ?? 'quarter',
    band: (form.get('band') as Answers['band']) ?? null,
    email: String(form.get('email') ?? ''),
    note: String(form.get('note') ?? ''),
  };
}
