/**
 * Scroll progress, without a scroll library.
 *
 * The specification forbids Lenis, Locomotive and any scroll hijacking. Native
 * scroll is read, never taken over. This is the whole of what the site needs,
 * in place of ~60 KB of GSAP ScrollTrigger.
 *
 * Deliberately synchronous. The obvious shape is a rAF-throttled handler with a
 * `ticking` flag, but that flag is only cleared inside the rAF callback — and
 * rAF is suspended in a background tab or a prerender, so the flag latches and
 * scroll progress freezes permanently. This does one rect read and one callback
 * per event, which is cheap enough that the throttle was never worth that
 * failure mode.
 */

export type ProgressHandler = (progress: number) => void;

const clamp01 = (n: number): number => (n < 0 ? 0 : n > 1 ? 1 : n);

export interface ScrollProgressOptions {
  /** Fires with 0..1 as the element travels through its pinned range. */
  onProgress: ProgressHandler;
  /** Called once when observation starts, with the initial value. */
  immediate?: boolean;
}

/**
 * Track an element's progress through its own scroll range.
 *
 * For a `position: sticky` stage inside a tall section, progress 0 is the
 * moment the section's top reaches the viewport top, and 1 is the moment its
 * bottom does. That is exactly `-rect.top / (height - viewportHeight)`.
 */
export function trackProgress(
  el: HTMLElement,
  { onProgress, immediate = true }: ScrollProgressOptions,
): () => void {
  const read = (): void => {
    const rect = el.getBoundingClientRect();
    const span = el.offsetHeight - window.innerHeight;
    const p = span > 8 ? -rect.top / span : rect.top <= 0 ? 1 : 0;
    onProgress(clamp01(p));
  };

  window.addEventListener('scroll', read, { passive: true });
  window.addEventListener('resize', read, { passive: true });
  if (immediate) read();

  return () => {
    window.removeEventListener('scroll', read);
    window.removeEventListener('resize', read);
  };
}

/**
 * Add `is-seen` to `.reveal` descendants as they enter view.
 *
 * The hidden state lives behind `[data-reveal-root]` in motion.css and this
 * function is what stamps that attribute — so content is only ever hidden once
 * something is definitely going to reveal it. If IntersectionObserver is
 * missing, the attribute is never set and everything renders plainly.
 *
 * The liveness guard exists because an observer can be armed and still never
 * fire (a prerender, a tab that was never painted). Leaving the page at
 * opacity 0 in that case would hide the content permanently.
 */
export function armReveal(root: HTMLElement = document.body): () => void {
  const targets = root.querySelectorAll<HTMLElement>('.reveal');
  if (!targets.length || typeof IntersectionObserver === 'undefined') return () => {};

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) return () => {};

  root.setAttribute('data-reveal-root', '');

  let fired = false;
  const io = new IntersectionObserver(
    (entries) => {
      fired = true;
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-seen');
          io.unobserve(entry.target);
        }
      }
    },
    { rootMargin: '0px 0px -10% 0px', threshold: 0.06 },
  );

  targets.forEach((t) => io.observe(t));

  const guard = window.setTimeout(() => {
    if (fired) return;
    io.disconnect();
    root.removeAttribute('data-reveal-root');
  }, 1200);

  return () => {
    window.clearTimeout(guard);
    io.disconnect();
  };
}
