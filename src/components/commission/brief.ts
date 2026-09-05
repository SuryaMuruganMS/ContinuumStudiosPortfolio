/**
 * The Commission Desk's document model.
 *
 * The visitor must receive something of independent value whether or not they
 * contact you — a real one-page brief they could take to any studio, including
 * a competitor. Giving that away is what makes it credible; the reciprocity is
 * worth more than the leakage.
 */

export type Shape = 'marketing' | 'application' | 'system' | 'brand-and-site' | 'other';
export type Substance = 'sell' | 'explain' | 'onboard' | 'integrate' | 'publish' | 'transact';
export type Timing = 'exploring' | 'quarter' | 'soon' | 'urgent';
export type Band = 'under-10' | '10-25' | '25-60' | '60-plus' | 'unsure';

export interface Answers {
  shape: Shape | null;
  substance: Substance[];
  timing: Timing;
  band: Band | null;
  email: string;
  note: string;
}

export const EMPTY_ANSWERS: Answers = {
  shape: null,
  substance: [],
  timing: 'quarter',
  band: null,
  email: '',
  note: '',
};

export const SHAPES: { id: Shape; name: string; blurb: string }[] = [
  { id: 'marketing', name: 'Marketing site', blurb: 'A site that has to persuade someone.' },
  { id: 'application', name: 'Web application', blurb: 'Something people log into and use.' },
  { id: 'system', name: 'Design system', blurb: 'A shared language for a team that ships.' },
  { id: 'brand-and-site', name: 'Brand and site', blurb: 'Identity and the site it lives on.' },
  { id: 'other', name: 'Something else', blurb: 'Tell us — the interesting ones usually are.' },
];

export const SUBSTANCES: { id: Substance; name: string }[] = [
  { id: 'sell', name: 'Sell a product or service' },
  { id: 'explain', name: 'Explain something complicated' },
  { id: 'onboard', name: 'Get people started' },
  { id: 'integrate', name: 'Talk to other systems' },
  { id: 'publish', name: 'Publish on a schedule' },
  { id: 'transact', name: 'Take money' },
];

export const TIMINGS: { id: Timing; name: string; cost: string }[] = [
  { id: 'exploring', name: 'Exploring', cost: 'No premium. We can plan properly.' },
  { id: 'quarter', name: 'This quarter', cost: 'Normal rate. The comfortable case.' },
  { id: 'soon', name: 'Within six weeks', cost: 'Scope gets cut before rate goes up.' },
  { id: 'urgent', name: 'Urgent', cost: 'Costs more and buys less. Usually the wrong trade.' },
];

export const BANDS: { id: Band; name: string; buys: string }[] = [
  {
    id: 'under-10',
    name: 'Under £10k',
    buys: 'A focused single-page site, or one phase of something larger.',
  },
  {
    id: '10-25',
    name: '£10k – £25k',
    buys: 'A complete marketing site, designed and built, with a content model.',
  },
  {
    id: '25-60',
    name: '£25k – £60k',
    buys: 'An application, or a site with a design system behind it.',
  },
  {
    id: '60-plus',
    name: '£60k+',
    buys: 'Multi-phase work with research, systems and ongoing iteration.',
  },
  {
    id: 'unsure',
    name: 'Not sure yet',
    buys: "Fine. We'll suggest a band from the rest of your answers.",
  },
];

export interface BriefDoc {
  objective: string;
  inclusions: string[];
  exclusions: string[];
  assumptions: string[];
  risks: string[];
  phases: { name: string; detail: string }[];
  range: string;
}

const SHAPE_SCOPE: Record<Shape, { inclusions: string[]; phases: string[] }> = {
  marketing: {
    inclusions: [
      'Information architecture',
      'Design system',
      'Responsive build',
      'Content model',
    ],
    phases: ['Discovery and IA', 'Design', 'Build and content', 'Launch'],
  },
  application: {
    inclusions: ['Flows and states', 'Component library', 'Front-end build', 'API integration'],
    phases: ['Discovery', 'Flows and states', 'System and build', 'Hardening'],
  },
  system: {
    inclusions: [
      'Token architecture',
      'Component specifications',
      'Documentation site',
      'Adoption plan',
    ],
    phases: ['Audit', 'Tokens and primitives', 'Components', 'Documentation and handover'],
  },
  'brand-and-site': {
    inclusions: ['Identity', 'Applications and guidelines', 'Site design', 'Site build'],
    phases: ['Positioning', 'Identity', 'Site design', 'Build and launch'],
  },
  other: {
    inclusions: ['Scoping workshop', 'Design', 'Build'],
    phases: ['Scoping', 'Design', 'Build'],
  },
};

const BAND_RANGE: Record<Band, string> = {
  'under-10': '£6,000 – £10,000',
  '10-25': '£10,000 – £25,000',
  '25-60': '£25,000 – £60,000',
  '60-plus': '£60,000+',
  unsure: 'To be confirmed after a scoping call',
};

/**
 * Turn answers into a document. Pure, so it can be unit-tested and so the
 * server can regenerate the same brief from the same submission.
 */
export function buildBrief(a: Answers): BriefDoc {
  const shape = a.shape ?? 'other';
  const scope = SHAPE_SCOPE[shape];
  const shapeName = SHAPES.find((s) => s.id === shape)?.name ?? 'Project';
  const doing = a.substance.length
    ? SUBSTANCES.filter((s) => a.substance.includes(s.id))
        .map((s) => s.name.toLowerCase())
        .join(', ')
    : 'a job still to be defined';

  const risks: string[] = [];
  if (a.timing === 'urgent') {
    risks.push(
      'The timeline is the dominant risk. Urgent work buys less scope, not more speed.',
    );
  }
  if (a.substance.includes('integrate')) {
    risks.push(
      'Third-party integrations are the usual source of slippage. Confirm API access before the build phase starts.',
    );
  }
  if (a.substance.includes('transact')) {
    risks.push(
      'Taking money adds compliance, error states and testing that are routinely under-scoped.',
    );
  }
  if (a.substance.length > 3) {
    risks.push(
      'Six jobs in one project is usually two projects. Expect a phasing conversation.',
    );
  }
  if (!risks.length) {
    risks.push(
      'No unusual risk identified from these answers. The scoping call will surface the rest.',
    );
  }

  return {
    objective: `A ${shapeName.toLowerCase()} whose job is to ${doing}.`,
    inclusions: scope.inclusions,
    exclusions: [
      'Ongoing content production',
      'Third-party licence and subscription costs',
      'Hosting beyond initial configuration',
      'Anything not named in the inclusions above',
    ],
    assumptions: [
      'One decision-maker is available for review at each phase boundary.',
      'Content is supplied, or its production is scoped separately.',
      'Existing brand assets are available in editable form where relevant.',
    ],
    risks: risks.slice(0, 2),
    phases: scope.phases.map((name, i) => ({
      name,
      detail:
        i === 0
          ? 'Fixed price. Ends with a written scope.'
          : 'Priced at the end of the previous phase.',
    })),
    range: BAND_RANGE[a.band ?? 'unsure'],
  };
}

/** Enough of a check to catch a typo; real validation happens server-side. */
export function isEmailish(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
}
