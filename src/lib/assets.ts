import { existsSync } from 'node:fs';
import type { ProjectStratum } from '../components/strata/strata';

/**
 * Strip stratum images whose file has not been supplied yet.
 *
 * The case study names a screenshot for every layer, but the screenshots are
 * captured by hand from a running build and land in `public/work/axiom/` after
 * the copy is written. Without this the page would render a broken <img> for
 * each missing file — visibly worse than the drawn placeholder it replaced.
 *
 * Runs at build time only: `existsSync` is evaluated while the page is being
 * rendered to static HTML, so nothing here reaches the browser. Drop a file
 * into place and the next build picks it up with no code change.
 */
export function resolveShots(strata: ProjectStratum[]): ProjectStratum[] {
  return strata.map((s) => {
    if (!s.image) return s;
    // Public assets are served from the site root, so the on-disk path is the
    // URL with `public` in front of it.
    if (existsSync(`public${s.image}`)) return s;
    const { image: _dropped, ...rest } = s;
    return rest as ProjectStratum;
  });
}

/** True when every stratum that names a screenshot actually has one. */
export function shotsComplete(strata: ProjectStratum[]): boolean {
  return strata.every((s) => !s.image || existsSync(`public${s.image}`));
}

/** A public-path image, or undefined when the file has not been supplied. */
export function optionalAsset(path: string | undefined): string | undefined {
  if (!path) return undefined;
  return existsSync(`public${path}`) ? path : undefined;
}

/**
 * Strata with every screenshot removed.
 *
 * The index hero demonstrates the studio's method, not a particular client's
 * product. Project screenshots belong on /work, where the reader has chosen to
 * look at that project — opening the site on someone else's console says
 * nothing about who we are.
 */
export function withoutShots(strata: ProjectStratum[]): ProjectStratum[] {
  return strata.map(({ image: _drop, ...rest }) => rest as ProjectStratum);
}
