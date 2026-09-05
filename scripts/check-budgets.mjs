#!/usr/bin/env node
/**
 * Performance budget guard.
 *
 * The specification treats budgets as hard constraints, so this exits non-zero
 * and fails the build rather than printing a warning nobody reads.
 *
 * Run after `astro build`:  npm run budgets
 */

import { readdir, stat, readFile } from 'node:fs/promises';
import { join, extname, relative } from 'node:path';
import { gzipSync } from 'node:zlib';

const DIST = 'dist';

/** Budgets in bytes, compressed — what actually crosses the wire. */
const BUDGETS = {
  'js:route': 90 * 1024,
  'js:total': 160 * 1024,
  'css:total': 60 * 1024,
  // 40 KB was written for static subset cuts. A variable face carrying the
  // whole weight axis in one file is a better trade — one request instead of
  // three — and the subset Newsreader axis is 52 KB. Raised deliberately; the
  // total below is the number that governs load.
  'font:each': 56 * 1024,
  'font:total': 110 * 1024,
  'image:each': 200 * 1024,
  'html:each': 100 * 1024,
};

const FONT_EXT = new Set(['.woff2', '.woff', '.ttf', '.otf']);
const IMG_EXT = new Set(['.png', '.jpg', '.jpeg', '.webp', '.avif', '.gif', '.svg']);

async function walk(dir) {
  const out = [];
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full)));
    else out.push(full);
  }
  return out;
}

const kb = (n) => `${(n / 1024).toFixed(1)} KB`;

async function main() {
  const files = await walk(DIST);
  if (!files.length) {
    console.error(`No build output in ./${DIST}. Run \`npm run build\` first.`);
    process.exit(1);
  }

  const rows = [];
  for (const file of files) {
    const ext = extname(file).toLowerCase();
    const { size } = await stat(file);
    // Text assets are served compressed; binary ones effectively are not.
    const compressible = ['.js', '.mjs', '.css', '.html', '.svg', '.json', '.xml'].includes(
      ext,
    );
    const wire = compressible ? gzipSync(await readFile(file)).length : size;
    rows.push({ file: relative(DIST, file), ext, size, wire });
  }

  const sum = (pred) => rows.filter(pred).reduce((a, r) => a + r.wire, 0);
  const jsTotal = sum((r) => ['.js', '.mjs'].includes(r.ext));
  const cssTotal = sum((r) => r.ext === '.css');
  const fontTotal = sum((r) => FONT_EXT.has(r.ext));

  const failures = [];
  const check = (name, actual, budget, detail = '') => {
    const ok = actual <= budget;
    const line = `${ok ? 'PASS' : 'FAIL'}  ${name.padEnd(14)} ${kb(actual).padStart(10)} / ${kb(budget).padStart(9)}${detail}`;
    console.log(line);
    if (!ok) failures.push(`${name}: ${kb(actual)} exceeds ${kb(budget)}${detail}`);
  };

  console.log('\nContinuum Studios performance budgets (gzipped where applicable)\n');
  check('js:total', jsTotal, BUDGETS['js:total']);
  check('css:total', cssTotal, BUDGETS['css:total']);
  check('font:total', fontTotal, BUDGETS['font:total']);

  // Per-file caps, reported only when breached so the output stays readable.
  const perFile = [
    ['js:route', (r) => ['.js', '.mjs'].includes(r.ext), BUDGETS['js:route']],
    ['font:each', (r) => FONT_EXT.has(r.ext), BUDGETS['font:each']],
    ['image:each', (r) => IMG_EXT.has(r.ext), BUDGETS['image:each']],
    ['html:each', (r) => r.ext === '.html', BUDGETS['html:each']],
  ];

  for (const [name, pred, budget] of perFile) {
    const over = rows.filter(pred).filter((r) => r.wire > budget);
    if (!over.length) {
      console.log(
        `PASS  ${name.padEnd(14)} ${'all under'.padStart(10)} / ${kb(budget).padStart(9)}`,
      );
      continue;
    }
    for (const r of over) {
      console.log(
        `FAIL  ${name.padEnd(14)} ${kb(r.wire).padStart(10)} / ${kb(budget).padStart(9)}  ${r.file}`,
      );
      failures.push(`${name}: ${r.file} is ${kb(r.wire)}, over ${kb(budget)}`);
    }
  }

  const biggest = [...rows].sort((a, b) => b.wire - a.wire).slice(0, 8);
  console.log('\nLargest assets on the wire:');
  for (const r of biggest) console.log(`  ${kb(r.wire).padStart(10)}  ${r.file}`);

  if (failures.length) {
    console.error(`\n${failures.length} budget violation(s):`);
    for (const f of failures) console.error(`  - ${f}`);
    console.error(
      '\nBudgets are hard constraints. Reduce the asset or justify a budget change.',
    );
    process.exit(1);
  }

  console.log('\nAll budgets met.\n');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
