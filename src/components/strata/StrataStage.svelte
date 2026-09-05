<script lang="ts">
  import { onMount } from 'svelte';
  import StrataScrubber from './StrataScrubber.svelte';
  import {
    STRATA,
    progressToIndex,
    indexToProgress,
    indexFromSearch,
    syncSearch,
    type ProjectStratum,
  } from './strata';
  import { trackProgress } from '../../lib/scroll';

  interface Props {
    strata: ProjectStratum[];
    title: string;
    /** Reduced height and no pin — used for the index page miniature. */
    compact?: boolean;
  }

  let { strata, title, compact = false }: Props = $props();

  let index = $state(0);
  let scrubbing = $state(false);
  let sectionEl: HTMLElement;

  const count = $derived(strata.length);
  const current = $derived(strata[index]);
  const meta = $derived(current ? STRATA[current.id] : null);

  /**
   * Section height = (strata × 90vh) + 100vh, so each layer gets a comfortable
   * band of scroll and the stage stays pinned for the whole traverse.
   */
  const sectionHeight = $derived(compact ? 'auto' : `calc(${count * 90}vh + 100vh)`);

  let reduced = $state(false);
  let scrubTimer: number | undefined;

  function setIndex(next: number, fromScroll = false) {
    if (next === index) return;
    index = next;
    syncSearch(next);
    if (!fromScroll) {
      // Scrolling already implies motion; a click should still show the edge.
      scrubbing = true;
      window.clearTimeout(scrubTimer);
      scrubTimer = window.setTimeout(() => (scrubbing = false), 600);
    }
  }

  onMount(() => {
    reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const deepLink = indexFromSearch(window.location.search, count);
    if (deepLink !== null) index = deepLink;

    // Under reduced motion the pin and scrub are removed entirely and the
    // strata render as a static stack — so there is nothing to track.
    if (reduced || compact) return;

    // A deep link has to move the page, not just the state. Scroll position is
    // the source of truth once tracking starts, so setting `index` alone is
    // overwritten by the first progress read — which lands at 0 because the
    // page loads at the top. Jump to the scroll offset that produces the
    // requested layer, then start tracking from there.
    if (deepLink !== null && deepLink > 0) {
      const span = sectionEl.offsetHeight - window.innerHeight;
      if (span > 0) {
        window.scrollTo({
          top: sectionEl.offsetTop + span * indexToProgress(deepLink, count),
          behavior: 'instant',
        });
      }
    }

    const stop = trackProgress(sectionEl, {
      onProgress: (p) => {
        scrubbing = p > 0.001 && p < 0.999;
        setIndex(progressToIndex(p, count), true);
      },
    });
    return stop;
  });

  /** Clicking a scrubber stop moves the page, so scroll and state stay in sync. */
  function scrollToIndex(next: number) {
    setIndex(next);
    if (reduced || compact || !sectionEl) return;
    const span = sectionEl.offsetHeight - window.innerHeight;
    const target = sectionEl.offsetTop + span * indexToProgress(next, count);
    window.scrollTo({ top: target, behavior: reduced ? 'auto' : 'smooth' });
  }
</script>

<section
  class="stage-section"
  class:is-compact={compact}
  class:is-static={reduced}
  style="height: {sectionHeight}"
  bind:this={sectionEl}
>
  <div class="stage-pin" class:is-scrubbing={scrubbing}>
    <div class="stage-grid">
      <!-- The annotation rail is the actual product: the layers are the
           vehicle, the decisions written beside them are what gets you hired. -->
      <div class="stage-rail">
        {#if meta && current}
          <div class="annotation" style="--stratum: var({meta.token})">
            <div class="annotation__eyebrow">
              {String(index).padStart(2, '0')} · {meta.name}
            </div>
            <p class="annotation__body" aria-live="polite">{current.note}</p>
          </div>
        {/if}
      </div>

      <!-- A labelled group, not a focus stop. The scrubber below owns every
           keyboard interaction, so this needs no tabindex and no listeners. -->
      <div
        class="stage-plate"
        role="group"
        aria-roledescription="Deconstruction stage"
        aria-label="{title}: layer {index + 1} of {count}"
      >
        {#each strata as stratum, i (stratum.id)}
          {@const m = STRATA[stratum.id]}
          <div
            class="stratum-plane"
            class:is-current={i === index}
            class:is-previous={i === index - 1}
            style="--stratum: var({m.token})"
            aria-hidden={i !== index}
          >
            {#if stratum.image}
              <!-- A real screenshot of the layer. The face becomes a caption
                   over it rather than a stand-in for it. -->
              <img
                class="plane-shot"
                src={stratum.image}
                alt="{m.name} layer: {m.shows}."
                width="1600"
                height="1000"
                loading={i < 2 ? 'eager' : 'lazy'}
                decoding="async"
              />
            {:else}
              <!-- No screenshot: draw the idea instead of leaving a grey box.
                   Six sheets, the current one lit — the studio's method rather
                   than any one client's product. -->
              <div class="plane-art" aria-hidden="true">
                <div class="plane-art__stack">
                  {#each [...strata.keys()] as k (k)}
                    <span class="plane-art__sheet" class:is-lit={k === i} style="--k: {k}"></span>
                  {/each}
                </div>
              </div>
            {/if}
            <div
              class="plane-face"
              class:has-shot={!!stratum.image}
              style="--stratum: var({m.token})"
            >
              <span class="plane-label mono">{m.name}</span>
              <span class="plane-shows">{m.shows}</span>
            </div>
          </div>
        {/each}
        <div
          class="stratum-edge"
          style="--stratum: var({meta ? meta.token : '--accent'})"
        ></div>
      </div>

      <div class="stage-scrub">
        <StrataScrubber {strata} {index} onchange={scrollToIndex} />
      </div>
    </div>
  </div>
</section>

<style>
  .stage-section {
    position: relative;
  }

  .stage-pin {
    position: sticky;
    top: 0;
    height: 100dvh;
    display: flex;
    align-items: center;
    overflow: hidden;
  }

  .is-compact .stage-pin,
  .is-static .stage-pin {
    position: static;
    height: auto;
    padding-block: var(--sp-loose);
  }

  .stage-grid {
    width: 100%;
    max-width: var(--max);
    margin-inline: auto;
    padding-inline: var(--margin);
    display: grid;
    /* 3 / 7 / 2 of twelve — the asymmetry from the specification. */
    grid-template-columns: 3fr 7fr 2fr;
    gap: var(--gutter);
    align-items: center;
  }
  .stage-grid > * {
    min-width: 0;
  }

  .stage-plate {
    position: relative;
    aspect-ratio: 8 / 5;
    background: var(--surface);
    border: var(--border-hair);
    overflow: hidden;
    /* The AxiomDSF screenshots are themselves near-black. On the neon dark
       ground that left the plate reading as an empty hole rather than as an
       image. Resolves to `none` in light, where the contrast already exists. */
    box-shadow: var(--plate-glow);
  }

  .plane-face {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: flex-end;
    gap: var(--sp-tight);
    padding: var(--sp-roomy);
    /* Gradient only — no opaque base. The face is a caption layer sitting over
       whatever fills the plate (the drawn stack, or a screenshot); painting
       --ground-2 here hid the artwork underneath it entirely. */
    background: linear-gradient(
      0deg,
      color-mix(in oklab, var(--stratum) 26%, transparent),
      transparent 62%
    );
    border-top: 2px solid var(--stratum);
  }

  .plane-shot {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    /*
     * cover, anchored left.
     *
     * contain removed the cropping but replaced it with pale letterbox bands
     * above and below every shot, because the plate is 8:5 and the console
     * captures are about 1.72:1. Cover anchored to the left edge loses roughly
     * 7% off the right — empty panel margin — while keeping the sidebar and
     * stage rail that make the screenshot legible as a real product.
     */
    object-fit: cover;
    object-position: left center;
    background: var(--ground);
  }

  /* Over a screenshot the face is a caption, so it only needs to darken the
     bottom strip enough for the text — not paint the whole plate. */
  /*
   * No scrim over the image.
   *
   * This used to fade the bottom 46% of every plate to --ground-2 so a caption
   * could sit on it. In the light theme that ground is near-white, so every
   * screenshot ended in a pale wash across its lower half — it read as the
   * image itself being faded out, which is exactly what it looked like.
   *
   * The caption is one short label. It gets its own small backing chip
   * instead, which covers about two percent of the plate rather than half of
   * it, and the screenshot is shown whole.
   */
  .plane-face.has-shot {
    background: none;
    padding: var(--sp-snug);
  }
  .plane-face.has-shot .plane-label {
    display: inline-block;
    padding: 3px 8px;
    background: color-mix(in oklab, var(--ground-2) 88%, transparent);
    border-left: 2px solid var(--stratum);
    backdrop-filter: blur(3px);
  }

  /* The "what this layer shows" sentence is generic copy about the layer type.
     Without an image it is the only thing on the plate and has to carry it;
     with an image it restates the annotation sitting directly underneath while
     covering the screenshot the visitor came to look at. Label only. */
  .plane-face.has-shot .plane-shows {
    display: none;
  }

  /* ---- drawn plate (no screenshot) ---------------------------------------
     A ruled sheet with a stack of strata on it. The lit sheet tracks the
     scrub, so the abstraction animates with the same interaction the real
     deconstruction uses. */
  .plane-art {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    background:
      repeating-linear-gradient(
        0deg,
        transparent 0 23px,
        color-mix(in oklab, var(--rule) 60%, transparent) 23px 24px
      ),
      repeating-linear-gradient(
        90deg,
        transparent 0 23px,
        color-mix(in oklab, var(--rule) 60%, transparent) 23px 24px
      ),
      var(--ground-2);
  }
  .plane-art__stack {
    position: relative;
    width: 58%;
    aspect-ratio: 3 / 2;
  }
  .plane-art__sheet {
    position: absolute;
    left: 0;
    right: 0;
    top: calc(var(--k) * 16%);
    height: 12%;
    border: 1px solid var(--rule-live);
    background: var(--surface);
    transform: skewX(-26deg);
    transition:
      background var(--d-strat) var(--ease-out),
      border-color var(--d-strat) var(--ease-out),
      box-shadow var(--d-strat) var(--ease-out);
  }
  .plane-art__sheet.is-lit {
    border-color: var(--stratum);
    background: color-mix(in oklab, var(--stratum) 26%, var(--surface));
    box-shadow: 0 0 24px -8px var(--stratum);
  }
  @media (prefers-reduced-motion: reduce) {
    .plane-art__sheet {
      transition: none;
    }
  }

  .plane-label {
    font-size: 11px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--stratum);
  }

  .plane-shows {
    font-size: var(--t-small);
    line-height: 1.5;
    color: var(--ink-2);
    max-width: 44ch;
  }

  /* Under reduced motion the layers become a readable vertical stack rather
     than a scrub — fully usable, arguably clearer. */
  .is-static .stage-plate {
    aspect-ratio: auto;
    min-height: 240px;
  }
  .is-static .stratum-plane {
    position: relative;
    opacity: 1;
    clip-path: none;
  }
  .is-static .stratum-plane[aria-hidden='true'] {
    display: none;
  }

  /* The compact stage sits in roughly a third of the width the full stage gets,
     where 3fr / 7fr / 2fr collapses the annotation rail to a ~30px ribbon that
     wraps one character per line. Compact stacks instead: the plate first,
     because it is the persuasive part, then the reasoning, then the scrub. */
  .is-compact .stage-grid {
    grid-template-columns: 1fr;
    gap: var(--sp-base);
    align-items: stretch;
    /* The full-bleed stage supplies the page margin itself because it spans
       the viewport. The compact stage does not: it is already inside a
       .shell, so keeping these applied a second page margin inside a column
       that was only ~520px wide to begin with. */
    padding-inline: 0;
    max-width: none;
  }
  .is-compact .stage-plate {
    order: 1;
  }
  .is-compact .stage-rail {
    order: 2;
    /* Reserve the tallest annotation's height so stepping through the layers
       does not shift everything below it. */
    min-height: 5.5em;
  }
  .is-compact .stage-scrub {
    order: 3;
  }
  .is-compact .plane-face {
    padding: var(--sp-base);
  }

  @media (max-width: 1023px) {
    .stage-grid {
      grid-template-columns: 1fr;
      gap: var(--sp-base);
    }
    .stage-rail {
      order: 3;
    }
    .stage-scrub {
      order: 2;
    }
  }
</style>
