/**
 * Studio constants.
 *
 * The brand appeared as a bare string in the header, the footer, the RSS
 * channel and three page titles, which is three places too many to keep in
 * step by hand. Everything that names the studio now reads from here.
 */

export const SITE = {
  name: 'Continuum Studios',
  /** Used where the full name would wrap badly — the header mark, mostly. */
  short: 'Continuum',
  tagline: 'Every decision, visible.',
  description:
    'Continuum Studios builds software people have to trust. Each project here comes apart into the layers that reveal its hardest problem.',
  email: 'continuumstudios.co@gmail.com',
  /** Set to the real domain at launch; used for canonical URLs and the feed. */
  url: 'https://continuumstudios.co',
} as const;

export interface Founder {
  name: string;
  role: string;
  /** What this person actually owns on a project, not a job title. */
  owns: string;
}

export const FOUNDERS: Founder[] = [
  {
    name: 'Surya Murugan M S',
    role: 'Engineering',
    owns: 'Architecture, the build, and everything that has to still be true at 3am.',
  },
  {
    name: 'Roshan Mohammed R',
    role: 'Design & front-end',
    owns: 'Interface, interaction and the part a client actually touches.',
  },
];
