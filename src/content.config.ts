import { defineCollection } from 'astro:content';
// Imported directly rather than re-exported from astro:content, which is
// deprecated in Astro 7.
import { z } from 'zod';
import { glob } from 'astro/loaders';

/**
 * Content collections.
 *
 * The `strata` array in a work entry is what drives the deconstruction — order,
 * content and annotations all come from here. Adding a project is writing this
 * file and exporting the planes; no code changes.
 */

const stratumId = z.enum([
  'brief',
  'structure',
  'grid',
  'type',
  'colour',
  'depth',
  'motion',
  'live',
  'states',
  'data',
  'load',
  'edge',
]);

const work = defineCollection({
  loader: glob({ base: './src/content/work', pattern: '**/*.md' }),
  schema: z.object({
    title: z.string(),
    client: z.string(),
    year: z.number().int().min(2000).max(2100),
    /** One sentence. The problem, not the solution. */
    problem: z.string(),
    disciplines: z.array(z.string()).min(1),
    /**
     * The fidelity ladder. Declared per project so the build knows whether to
     * load real DOM for the Live layer or a composited plane.
     */
    fidelity: z.enum(['live', 'composited', 'annotated']),
    strata: z
      .array(
        z.object({
          id: stratumId,
          note: z.string().min(20, 'An annotation must say something specific.'),
          image: z.string().optional(),
        }),
      )
      .min(4, 'A project needs at least four strata to be worth deconstructing.')
      .max(7, 'Beyond seven layers the scrub stops being readable.'),
    metrics: z
      .array(
        z.object({
          label: z.string(),
          before: z.string().optional(),
          after: z.string(),
          /** No claim without a source. */
          source: z.string(),
        }),
      )
      .optional(),
    /**
     * Supporting screenshots that are not one of the strata. The strata carry
     * the argument; these are the rest of the product, shown once so a reader
     * can see it is a real thing and not six cropped hero shots.
     */
    gallery: z
      .array(z.object({ src: z.string(), caption: z.string().min(10) }))
      .optional(),
    featured: z.boolean().default(false),
    order: z.number().default(99),
    /**
     * Whether the project is finished.
     *
     * A studio with three slots and two finished projects has a choice: pad
     * the third, or say it is not done. Saying so is both honest and a better
     * signal — an empty slot with a date reads as a studio that ships, a
     * padded one reads as a studio that does not.
     */
    status: z.enum(['published', 'in-progress']).default('published'),
  }),
});

const notes = defineCollection({
  loader: glob({ base: './src/content/notes', pattern: '**/*.md' }),
  schema: z.object({
    title: z.string(),
    description: z.string().max(160, 'Meta descriptions are truncated past 160 characters.'),
    published: z.coerce.date(),
    updated: z.coerce.date().optional(),
    topic: z.string(),
    /** Drives the generated header image's hue. */
    stratum: stratumId.default('grid'),
    draft: z.boolean().default(false),
  }),
});

const ledger = defineCollection({
  loader: glob({ base: './src/content/ledger', pattern: '**/*.md' }),
  schema: z.object({
    date: z.coerce.date(),
    project: z.string(),
    shipped: z.string(),
    /**
     * The honest note. A ledger with no failures is marketing and a reader can
     * tell instantly, so this field exists to be used.
     */
    note: z.string(),
    outcome: z.enum(['shipped', 'learned', 'failed']).default('shipped'),
  }),
});

export const collections = { work, notes, ledger };
