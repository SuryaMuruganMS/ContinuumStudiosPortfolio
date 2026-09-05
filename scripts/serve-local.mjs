/**
 * Serve `dist/` AND answer /api/commission locally.
 *
 * Why this exists: the commission endpoint is a Cloudflare Pages Function, and
 * Pages Functions do not run under `astro dev` or `astro preview` — both serve
 * static files only, so posting the form locally returns 404 and the desk looks
 * broken when it is not. The usual answer is `wrangler pages dev`, but workerd
 * crashes on this machine with an access violation before it binds a port.
 *
 * So: plain Node, no runtime to install, importing the very same
 * `src/lib/commission-mail.ts` the deployed Function calls. If it sends here it
 * sends in production, because it is the same code path.
 *
 * Node strips the TypeScript natively (v22.6+), which is why the import below
 * carries an explicit `.ts` extension — Node does no extension resolution.
 *
 *   node scripts/serve-local.mjs            # reads RESEND_API_KEY from .env
 *   PORT=4321 node scripts/serve-local.mjs
 */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { deliverCommission } from '../src/lib/commission-mail.ts';

const ROOT = new URL('../dist/', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const PORT = Number(process.env.PORT ?? 4321);

/** Minimal .env reader — no dependency for `KEY=value` lines. */
function loadEnv() {
  const file = new URL('../.env', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (!m) continue;
    const value = m[2].replace(/^['"]|['"]$/g, '');
    if (!process.env[m[1]]) process.env[m[1]] = value;
  }
}
loadEnv();

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
};

const send = (res, status, body, type = 'application/json; charset=utf-8') => {
  res.writeHead(status, { 'content-type': type });
  res.end(body);
};

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  // ------------------------------------------------------------- the endpoint
  if (url.pathname === '/api/commission') {
    if (req.method !== 'POST') {
      return send(res, 405, JSON.stringify({ error: 'POST a commission payload here.' }));
    }
    const chunks = [];
    for await (const c of req) chunks.push(c);
    const raw = Buffer.concat(chunks).toString('utf8');

    let answers;
    try {
      answers = (req.headers['content-type'] ?? '').includes('application/json')
        ? JSON.parse(raw)
        : Object.fromEntries(new URLSearchParams(raw));
    } catch {
      return send(res, 400, JSON.stringify({ error: 'Could not read that submission.' }));
    }
    // The form-encoded path sends `substance` repeatedly; normalise to an array.
    if (answers.substance && !Array.isArray(answers.substance)) {
      answers.substance = [answers.substance];
    }
    answers.substance ??= [];

    const { status, body } = await deliverCommission(answers, process.env);
    return send(res, status, JSON.stringify(body));
  }

  // ------------------------------------------------------------ static files
  let p = decodeURIComponent(url.pathname);
  if (p.endsWith('/')) p += 'index.html';
  let file = normalize(join(ROOT, p));
  if (!file.startsWith(normalize(ROOT))) return send(res, 403, 'Forbidden', 'text/plain');

  try {
    if ((await stat(file)).isDirectory()) file = join(file, 'index.html');
  } catch {
    // Astro emits pretty URLs as directories; try /path/index.html then 404.
    const alt = join(ROOT, p, 'index.html');
    if (existsSync(alt)) file = alt;
    else {
      const notFound = join(ROOT, '404.html');
      if (existsSync(notFound)) {
        return send(res, 404, await readFile(notFound), TYPES['.html']);
      }
      return send(res, 404, 'Not found', 'text/plain');
    }
  }

  try {
    const body = await readFile(file);
    send(res, 200, body, TYPES[extname(file)] ?? 'application/octet-stream');
  } catch {
    send(res, 404, 'Not found', 'text/plain');
  }
});

server.listen(PORT, () => {
  const configured = Boolean(process.env.RESEND_API_KEY);
  console.log(`\n  Continuum Studios — local server with the commission endpoint`);
  console.log(`  http://localhost:${PORT}\n`);
  console.log(
    configured
      ? '  RESEND_API_KEY found: the desk will send for real.'
      : '  RESEND_API_KEY not set: the desk will accept but report "not delivered".\n' +
          '  Put RESEND_API_KEY=re_... in .env to send for real.',
  );
  console.log('');
});
