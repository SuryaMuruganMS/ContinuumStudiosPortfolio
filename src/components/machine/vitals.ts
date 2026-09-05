/**
 * Live Core Web Vitals from the current session.
 *
 * The Machine Room publishes the page's real measurements, not a screenshot of
 * a good Lighthouse run. This also enforces discipline internally: you cannot
 * ship a bloated hero when the byte count is printed on the page.
 */

export type VitalName = 'LCP' | 'CLS' | 'INP' | 'TTFB';

export interface Vital {
  name: VitalName;
  value: number | null;
  unit: 'ms' | '';
  /** Good / needs improvement / poor thresholds, per web.dev. */
  budget: [good: number, poor: number];
}

export const INITIAL_VITALS: Record<VitalName, Vital> = {
  LCP: { name: 'LCP', value: null, unit: 'ms', budget: [2500, 4000] },
  CLS: { name: 'CLS', value: null, unit: '', budget: [0.1, 0.25] },
  INP: { name: 'INP', value: null, unit: 'ms', budget: [200, 500] },
  TTFB: { name: 'TTFB', value: null, unit: 'ms', budget: [800, 1800] },
};

export function rate(v: Vital): 'good' | 'ok' | 'poor' | 'pending' {
  if (v.value === null) return 'pending';
  if (v.value <= v.budget[0]) return 'good';
  if (v.value <= v.budget[1]) return 'ok';
  return 'poor';
}

export function format(v: Vital): string {
  if (v.value === null) return 'measuring';
  return v.unit === 'ms' ? `${Math.round(v.value)} ms` : v.value.toFixed(3);
}

type Update = (name: VitalName, value: number) => void;

/**
 * Observe what this browser supports and report it. Every entry type is
 * wrapped, because PerformanceObserver throws on an unsupported type rather
 * than returning empty — one unsupported type must not take the others down.
 */
export function observeVitals(update: Update): () => void {
  if (typeof PerformanceObserver === 'undefined') return () => {};
  const observers: PerformanceObserver[] = [];

  const watch = (type: string, handler: (list: PerformanceObserverEntryList) => void) => {
    try {
      const po = new PerformanceObserver(handler);
      po.observe({ type, buffered: true } as PerformanceObserverInit);
      observers.push(po);
    } catch {
      /* unsupported in this browser — the readout shows "unsupported" */
    }
  };

  watch('largest-contentful-paint', (list) => {
    const entries = list.getEntries();
    const last = entries[entries.length - 1];
    if (last) update('LCP', last.startTime);
  });

  let cls = 0;
  watch('layout-shift', (list) => {
    for (const entry of list.getEntries() as (PerformanceEntry & {
      value: number;
      hadRecentInput: boolean;
    })[]) {
      if (!entry.hadRecentInput) cls += entry.value;
    }
    update('CLS', cls);
  });

  let worstInp = 0;
  watch('event', (list) => {
    for (const entry of list.getEntries() as (PerformanceEntry & { duration: number })[]) {
      if (entry.duration > worstInp) {
        worstInp = entry.duration;
        update('INP', worstInp);
      }
    }
  });

  const nav = performance.getEntriesByType('navigation')[0] as
    PerformanceNavigationTiming | undefined;
  if (nav) update('TTFB', nav.responseStart);

  return () => observers.forEach((o) => o.disconnect());
}

/** Total bytes transferred so far, from the Resource Timing buffer. */
export function transferredBytes(): number {
  if (typeof performance === 'undefined' || !performance.getEntriesByType) return 0;
  const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
  const nav = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
  const sum = (acc: number, r: { transferSize?: number }) => acc + (r.transferSize ?? 0);
  return resources.reduce(sum, 0) + nav.reduce(sum, 0);
}
