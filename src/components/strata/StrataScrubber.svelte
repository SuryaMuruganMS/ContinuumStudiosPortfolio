<script lang="ts">
  import { STRATA, type ProjectStratum } from './strata';

  interface Props {
    strata: ProjectStratum[];
    index: number;
    onchange: (index: number) => void;
  }

  let { strata, index, onchange }: Props = $props();

  const count = $derived(strata.length);
  const current = $derived(strata[index]);

  /**
   * A real input[type=range], visually restyled.
   *
   * This is deliberate rather than a div with pointer handlers: it brings
   * keyboard support, correct arrow-key semantics, screen-reader role and
   * value announcement for free, and every one of those would otherwise have
   * to be rebuilt and would be rebuilt worse.
   */
  function onInput(event: Event) {
    const target = event.currentTarget as HTMLInputElement;
    onchange(Number(target.value));
  }

  /**
   * Number keys jump to a layer; Escape leaves the control.
   *
   * These live on the range input rather than on the stage, because the range
   * is the genuinely interactive element. Putting a tabindex and a keydown on
   * the stage div would add a focus stop that announces nothing and would fail
   * the a11y_no_noninteractive_tabindex rule for good reason. Arrow keys,
   * Home and End are already native here and need no code.
   */
  function onKeydown(event: KeyboardEvent) {
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    const n = Number.parseInt(event.key, 10);
    if (!Number.isNaN(n) && n >= 1 && n <= count) {
      event.preventDefault();
      onchange(n - 1);
      return;
    }
    if (event.key === 'Escape') {
      (event.currentTarget as HTMLInputElement).blur();
    }
  }
</script>

<div class="scrubber" role="group" aria-label="Deconstruction layers">
  <ol class="scrubber__list">
    {#each strata as stratum, i (stratum.id)}
      {@const meta = STRATA[stratum.id]}
      <li>
        <button
          type="button"
          class="scrubber__stop"
          class:is-active={i === index}
          class:is-passed={i < index}
          style="--stratum: var({meta.token})"
          aria-current={i === index ? 'step' : undefined}
          onclick={() => onchange(i)}
        >
          <span class="scrubber__dot" aria-hidden="true"></span>
          <span class="scrubber__no mono">{String(i).padStart(2, '0')}</span>
          <span class="scrubber__name">{meta.name}</span>
        </button>
      </li>
    {/each}
  </ol>

  <label class="scrubber__range">
    <span class="visually-hidden">
      Layer {index + 1} of {count}: {current ? STRATA[current.id].name : ''}
    </span>
    <input
      type="range"
      min="0"
      max={count - 1}
      step="1"
      value={index}
      oninput={onInput}
      onkeydown={onKeydown}
      aria-valuetext={current ? STRATA[current.id].name : ''}
      style="--stratum: var({current ? STRATA[current.id].token : '--accent'})"
    />
  </label>
</div>

<style>
  .scrubber {
    display: flex;
    flex-direction: column;
    gap: var(--sp-base);
  }

  .scrubber__list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 1px;
  }

  .scrubber__stop {
    display: grid;
    grid-template-columns: 14px 22px 1fr;
    align-items: center;
    gap: var(--sp-tight);
    width: 100%;
    padding: var(--sp-tight) var(--sp-tight) var(--sp-tight) 0;
    text-align: left;
    color: var(--ink-4);
    transition:
      color var(--d-hover) var(--ease-out),
      transform var(--d-press) var(--ease-out);
  }

  @media (hover: hover) and (pointer: fine) {
    .scrubber__stop:hover {
      color: var(--ink-2);
    }
  }

  .scrubber__stop:active {
    transform: scale(0.96);
  }

  .scrubber__stop.is-passed {
    color: var(--ink-3);
  }

  .scrubber__stop.is-active {
    color: var(--ink);
  }

  .scrubber__dot {
    width: 9px;
    height: 9px;
    border: 1px solid currentColor;
    transition:
      background-color var(--d-ui) var(--ease-out),
      border-color var(--d-ui) var(--ease-out);
  }

  .scrubber__stop.is-passed .scrubber__dot,
  .scrubber__stop.is-active .scrubber__dot {
    background: var(--stratum);
    border-color: var(--stratum);
  }

  .scrubber__no {
    font-size: 10px;
    color: var(--ink-4);
  }

  .scrubber__name {
    font-family: var(--f-mono);
    font-size: 11px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  /* The range is the real control; the list above is a shortcut. On desktop
     it sits beneath as a continuous scrub. */
  .scrubber__range {
    display: block;
  }

  input[type='range'] {
    width: 100%;
    height: 2px;
    appearance: none;
    background: var(--rule);
    cursor: ew-resize;
  }

  input[type='range']::-webkit-slider-thumb {
    appearance: none;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: var(--stratum, var(--accent));
    /* The one sanctioned shadow on the site — this reads as a physical
       control and nothing else does. */
    box-shadow: var(--shadow-handle);
    cursor: grab;
  }

  input[type='range']::-moz-range-thumb {
    width: 14px;
    height: 14px;
    border: 0;
    border-radius: 50%;
    background: var(--stratum, var(--accent));
    box-shadow: var(--shadow-handle);
    cursor: grab;
  }

  input[type='range']:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 4px;
  }

  /* Below 768px the scrubber becomes a horizontal stepper pinned to the
     bottom edge, thumb-reachable. Same mechanic, different input. */
  @media (max-width: 767px) {
    .scrubber__list {
      flex-direction: row;
      overflow-x: auto;
      gap: var(--sp-hair);
      padding-bottom: var(--sp-tight);
      scrollbar-width: none;
      /* It scrolls when a project has more layers than fit, so stops should
         land squarely rather than halfway off the edge. */
      scroll-snap-type: x proximity;
      scroll-padding-inline: var(--sp-hair);
    }
    .scrubber__list::-webkit-scrollbar {
      display: none;
    }
    .scrubber__stop {
      grid-template-columns: auto;
      gap: 2px;
      justify-items: center;
      /* 62px put six stops a few pixels over a 375px viewport, so the last
         label sat clipped at the edge and read as a broken layout rather than
         as a scroller. At 52px the common four-to-six-layer case fits outright. */
      min-width: 52px;
      flex: 0 0 auto;
      padding: var(--sp-tight) var(--sp-hair);
      text-align: center;
      scroll-snap-align: start;
    }
    .scrubber__name {
      font-size: 9.5px;
      letter-spacing: 0.04em;
    }
    .scrubber__no {
      display: none;
    }
  }
</style>
