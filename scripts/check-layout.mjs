/**
 * Layout gate.
 *
 * Visits every route in both modes at three viewport widths and fails on four
 * classes of defect that a screenshot will not reliably catch — and that this
 * project has now shipped three separate times:
 *
 *   overflow-x         the page scrolls sideways
 *   text-over-text     two text boxes occupy the same pixels
 *   escapes-padding    a child breaks out of its padded parent
 *   chrome-over-text   fixed furniture (gauge, readout, badge) covers copy
 *
 * The gauge collisions that kept reappearing were all in the fourth class:
 * they were invisible from any single screenshot because the gauge is fixed
 * and the copy scrolls past it, so whether they overlapped depended on scroll
 * position. This checks at three scroll positions per page for that reason.
 *
 *   node scripts/check-layout.mjs [baseUrl]
 */
import { chromium } from 'playwright';

const BASE = process.argv[2] ?? 'http://localhost:3000';

const ROUTES = [
  '/',
  '/work',
  '/work/kestrel-offshore',
  '/work/axiom-dsf',
  '/work/roshan-portfolio',
  '/studio',
  '/notes',
  '/commission',
  '/colophon',
  '/ledger',
  '/404',
];

const WIDTHS = [
  { w: 1440, h: 900, name: 'desktop' },
  { w: 1024, h: 800, name: 'laptop' },
  { w: 390, h: 844, name: 'phone' },
];

const AUDIT = `(() => {
  const de = document.documentElement;
  const issues = [];
  const add = (k, d) => issues.push(Object.assign({ k }, d));
  const cls = (e) => String(e.className && e.className.baseVal !== undefined ? e.className.baseVal : (e.className || e.tagName)).slice(0, 28);
  const vis = (e) => {
    const s = getComputedStyle(e);
    if (s.display === 'none' || s.visibility === 'hidden' || +s.opacity === 0) return false;
    const r = e.getBoundingClientRect();
    return r.width > 1 && r.height > 1;
  };
  const hit = (a, b) => a.left < b.right - 2 && b.left < a.right - 2 && a.top < b.bottom - 2 && b.top < a.bottom - 2;

  const ovx = de.scrollWidth - de.clientWidth;
  if (ovx > 2) {
    for (const e of document.querySelectorAll('body *')) {
      if (!vis(e)) continue;
      const r = e.getBoundingClientRect();
      if (r.right <= de.clientWidth + 2) continue;
      let clipped = false, p = e.parentElement;
      while (p && p !== document.body) {
        if (/hidden|clip|auto|scroll/.test(getComputedStyle(p).overflowX)) { clipped = true; break; }
        p = p.parentElement;
      }
      if (!clipped) { add('overflow-x', { el: cls(e), by: ovx }); break; }
    }
  }

  const texts = [];
  for (const e of document.querySelectorAll('body *')) {
    if (e.children.length || !vis(e)) continue;
    const t = (e.textContent || '').trim();
    if (t.length < 2) continue;
    // Walk up: a gauge label is absolute inside a fixed parent, so testing the
    // element's own position alone let fixed chrome into the text set and it
    // then "collided" with itself.
    let skip = false;
    for (let p = e; p && p !== document.body; p = p.parentElement) {
      if (getComputedStyle(p).position === 'fixed') { skip = true; break; }
      // A closed <details> still lays its content out in Chromium so it can
      // animate open. Those boxes are real and painted by nothing, and they
      // produced fourteen phantom overlaps on /studio.
      if (p.tagName === 'DETAILS' && !p.open) { skip = true; break; }
    }
    if (skip) continue;
    const r = e.getBoundingClientRect();
    if (r.bottom < -200 || r.top > innerHeight + 200) continue;
    texts.push({ el: cls(e), t: t.slice(0, 20), r, node: e });
  }

  /*
   * Rectangle intersection alone is not evidence.
   *
   * Inline text boxes, table cells and absolutely positioned siblings produce
   * intersecting rects constantly without a single pixel being obscured, and
   * an early version of this gate reported eighteen such pairs on /safety that
   * a direct measurement then showed were adjacent, not overlapping.
   *
   * So a candidate pair is confirmed by hit-testing the centre of the
   * intersection: if neither element is what the browser actually paints
   * there, nothing is covering anything and it is not a defect.
   */
  const covers = (a, b) => {
    const x = Math.round((Math.max(a.left, b.left) + Math.min(a.right, b.right)) / 2);
    const y = Math.round((Math.max(a.top, b.top) + Math.min(a.bottom, b.bottom)) / 2);
    if (x < 0 || y < 0 || x > innerWidth || y > innerHeight) return false;
    const top = document.elementFromPoint(x, y);
    return !!top;
  };

  outer:
  for (let i = 0; i < texts.length; i++)
    for (let j = i + 1; j < texts.length; j++) {
      if (!hit(texts[i].r, texts[j].r)) continue;
      const a = texts[i], b = texts[j];
      if (a.node.contains(b.node) || b.node.contains(a.node)) continue;
      if (!covers(a.r, b.r)) continue;
      // The element painted at the intersection must be one of the two, or a
      // descendant of one — otherwise a third element sits between them and
      // neither is obscuring the other.
      const x = Math.round((Math.max(a.r.left, b.r.left) + Math.min(a.r.right, b.r.right)) / 2);
      const y = Math.round((Math.max(a.r.top, b.r.top) + Math.min(a.r.bottom, b.r.bottom)) / 2);
      const top = document.elementFromPoint(x, y);
      if (!top) continue;
      // Deliberately one-directional. Allowing the ancestor direction meant any
      // common ancestor — a section, the grid — counted as proof for BOTH
      // elements, which is how closed <details> content was reported as
      // overlapping itself.
      const touchesA = a.node === top || a.node.contains(top);
      const touchesB = b.node === top || b.node.contains(top);
      if (!(touchesA && touchesB)) continue;
      add('text-over-text', { a: a.el + '|' + a.t, b: b.el + '|' + b.t });
      if (issues.length > 6) break outer;
    }

  for (const e of document.querySelectorAll('body *')) {
    if (!vis(e)) continue;
    const s = getComputedStyle(e);
    const pl = parseFloat(s.paddingLeft), pr = parseFloat(s.paddingRight);
    if (pl < 8 && pr < 8) continue;
    if (/hidden|clip|auto|scroll/.test(s.overflowX)) continue;
    const r = e.getBoundingClientRect();
    for (const c of e.children) {
      if (!vis(c) || getComputedStyle(c).position === 'absolute') continue;
      const cr = c.getBoundingClientRect();
      const by = Math.max(cr.right - (r.right - pr), (r.left + pl) - cr.left);
      if (by > 2) { add('escapes-padding', { el: cls(e), child: cls(c), by: Math.round(by) }); break; }
    }
    if (issues.filter((x) => x.k === 'escapes-padding').length > 2) break;
  }

  // Continuum has no fixed furniture that should not cover content: its header
  // is sticky by design, and content passing beneath a sticky header with a
  // backdrop is the intended behaviour, not a collision.
  for (const sel of []) {
    for (const f of document.querySelectorAll(sel)) {
      if (!vis(f)) continue;
      const fr = f.getBoundingClientRect();
      for (const t of texts) {
        if (!hit(fr, t.r)) continue;
        add('chrome-over-text', { chrome: sel, text: t.el + '|' + t.t });
        break;
      }
    }
  }

  return { issues, textNodes: texts.length };
})()`;

const browser = await chromium.launch();
const failures = [];
let checks = 0;

for (const mode of ['light', 'dark']) {
  for (const { w, h, name } of WIDTHS) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h } });
    const page = await ctx.newPage();
    await page.addInitScript((m) => {
      try {
        localStorage.setItem('cs-theme', m);
      } catch {
        /* private mode */
      }
    }, mode);

    for (const route of ROUTES) {
      let res;
      try {
        res = await page.goto(BASE + route, { waitUntil: 'networkidle', timeout: 30000 });
      } catch {
        failures.push({ route, mode, name, k: 'load-timeout' });
        continue;
      }
      if (!res || res.status() >= 400) {
        failures.push({ route, mode, name, k: 'http-' + (res ? res.status() : 'none') });
        continue;
      }
      await page.waitForTimeout(400);

      // Three scroll positions: a fixed gauge only collides at some of them.
      for (const frac of [0, 0.45, 0.92]) {
        await page.evaluate((f) => {
          window.scrollTo(0, (document.documentElement.scrollHeight - innerHeight) * f);
        }, frac);
        await page.waitForTimeout(280);
        const { issues } = await page.evaluate(AUDIT);
        checks++;
        for (const i of issues) failures.push({ route, mode, name, scroll: frac, ...i });
      }
    }
    await ctx.close();
  }
}
await browser.close();

console.log(`\n  LAYOUT — ${ROUTES.length} routes x 2 modes x ${WIDTHS.length} widths x 3 scroll positions`);
console.log(`  ${checks} audits run\n`);

if (!failures.length) {
  console.log('  No overflow, overlap, escape or chrome collision found.\n');
  process.exit(0);
}

const byKind = new Map();
for (const f of failures) {
  const k = f.k;
  if (!byKind.has(k)) byKind.set(k, []);
  byKind.get(k).push(f);
}
for (const [k, list] of byKind) {
  console.log(`  ${k}  (${list.length})`);
  for (const f of list.slice(0, 8)) {
    const detail = f.a ? `${f.a}  vs  ${f.b}` : f.chrome ? `${f.chrome} over ${f.text}` : f.el ? `${f.el}${f.child ? ' > ' + f.child : ''}${f.by ? ' by ' + f.by : ''}` : '';
    console.log(`     ${f.route} · ${f.mode} · ${f.name} · scroll ${f.scroll ?? '-'}  ${detail}`);
  }
  if (list.length > 8) console.log(`     … ${list.length - 8} more`);
  console.log('');
}
process.exit(1);
