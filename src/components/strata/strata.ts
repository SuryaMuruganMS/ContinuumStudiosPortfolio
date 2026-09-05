/**
 * The stratum vocabulary, and the mapping between scroll progress and layer.
 *
 * A project selects four to seven of these. The first three and the last are
 * near-universal; the middle is chosen to expose that project's hardest
 * problem, which is what stops the mechanic being a trick you see once.
 */

export type StratumId =
  | 'brief'
  | 'structure'
  | 'grid'
  | 'type'
  | 'colour'
  | 'depth'
  | 'motion'
  | 'live'
  // Engineering strata, for projects whose difficulty was not visual.
  | 'states'
  | 'data'
  | 'load'
  | 'edge';

export interface StratumMeta {
  id: StratumId;
  /** Displayed name. */
  name: string;
  /** The CSS custom property carrying this layer's index hue. */
  token: string;
  /** What this layer shows, for the alt text and the screen-reader label. */
  shows: string;
}

export const STRATA: Record<StratumId, StratumMeta> = {
  brief: {
    id: 'brief',
    name: 'Brief',
    token: '--s-brief',
    shows: "The client's problem in their words, with the constraint that made it hard",
  },
  structure: {
    id: 'structure',
    name: 'Structure',
    token: '--s-structure',
    shows: 'Content skeleton: labelled blocks in reading order, no styling',
  },
  grid: {
    id: 'grid',
    name: 'Grid',
    token: '--s-grid',
    shows: 'Column system, baseline and safe areas drawn as an overlay',
  },
  type: {
    id: 'type',
    name: 'Type',
    token: '--s-type',
    shows: 'Typography only — scale, weight, measure and rhythm, no colour',
  },
  colour: {
    id: 'colour',
    name: 'Colour',
    token: '--s-colour',
    shows: 'Palette applied flat, with the contrast matrix annotated',
  },
  depth: {
    id: 'depth',
    name: 'Depth',
    token: '--s-depth',
    shows: 'Material, elevation and lighting across the surfaces',
  },
  motion: {
    id: 'motion',
    name: 'Motion',
    token: '--s-motion',
    shows: 'Choreography drawn as motion paths, timing curves and a sequence bar',
  },
  live: {
    id: 'live',
    name: 'Live',
    token: '--s-live',
    shows: 'The finished, interactive result',
  },
  states: {
    id: 'states',
    name: 'States',
    token: '--s-states',
    shows: 'Empty, loading, error, partial and populated, side by side',
  },
  data: {
    id: 'data',
    name: 'Data',
    token: '--s-data',
    shows: 'The shape moving through the system, annotated',
  },
  load: {
    id: 'load',
    name: 'Load',
    token: '--s-load',
    shows: 'Network waterfall — what arrives when, and what the user sees meanwhile',
  },
  edge: {
    id: 'edge',
    name: 'Edge',
    token: '--s-edge',
    shows: 'What breaks, and how it is caught',
  },
};

/** One layer of a specific project, as authored in the content frontmatter. */
export interface ProjectStratum {
  id: StratumId;
  /**
   * One specific, non-obvious sentence: a named constraint, a measured
   * problem, a decision, and its consequence. If this cannot be written for a
   * layer, the layer is dropped.
   */
  note: string;
  /** Plane image, when the tier is composited or annotated. */
  image?: string;
}

export const isStratumId = (v: string): v is StratumId =>
  Object.prototype.hasOwnProperty.call(STRATA, v);

/**
 * Map 0..1 scroll progress onto a layer index.
 *
 * Rounded rather than floored so a layer is "current" across the middle of its
 * band. Flooring makes the last layer reachable only at exactly 1.0, which a
 * trackpad often never produces.
 */
export function progressToIndex(progress: number, count: number): number {
  if (count <= 1) return 0;
  const raw = Math.round(progress * (count - 1));
  return Math.min(count - 1, Math.max(0, raw));
}

/** Inverse, for driving the scrubber from a keyboard or a deep link. */
export function indexToProgress(index: number, count: number): number {
  if (count <= 1) return 0;
  return Math.min(1, Math.max(0, index / (count - 1)));
}

/**
 * Read the requested stratum from `?s=n`.
 *
 * Every meaningful state is in the URL (Specification, Phase 4) so a visitor
 * can send someone a link to layer 4 of a specific project.
 */
export function indexFromSearch(search: string, count: number): number | null {
  const raw = new URLSearchParams(search).get('s');
  if (raw === null) return null;
  const n = Number.parseInt(raw, 10);
  if (Number.isNaN(n)) return null;
  return Math.min(count - 1, Math.max(0, n));
}

/**
 * Reflect the active stratum without adding history entries — a scrub across
 * seven layers must not require seven presses of the back button.
 */
export function syncSearch(index: number): void {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  url.searchParams.set('s', String(index));
  window.history.replaceState(null, '', url);
}
