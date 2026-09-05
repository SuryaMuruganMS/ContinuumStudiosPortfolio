/**
 * Generated note header images.
 *
 * Deterministic: same slug, same image, forever. Free, on-brand, infinitely
 * scalable, and impossible to mistake for stock — which is why the
 * specification calls for generating these in code rather than sourcing them.
 *
 * This module produces the parameters; the rendering route consumes them.
 */

import type { StratumId } from '../components/strata/strata';

export interface OgParams {
  title: string;
  eyebrow: string;
  /** 0..1, drives the procedural field. Derived from the slug. */
  seed: number;
  stratum: StratumId;
}

/** FNV-1a. Small, fast, and stable across runs — which Math.random is not. */
export function hashSlug(slug: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < slug.length; i++) {
    h ^= slug.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0) / 0xffffffff;
}

export function ogParams(
  slug: string,
  title: string,
  stratum: StratumId,
  eyebrow = 'Note',
): OgParams {
  return { title, eyebrow, seed: hashSlug(slug), stratum };
}

export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;
