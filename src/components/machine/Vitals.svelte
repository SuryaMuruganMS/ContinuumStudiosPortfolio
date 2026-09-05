<script lang="ts">
  import { onMount } from 'svelte';
  import {
    INITIAL_VITALS,
    observeVitals,
    transferredBytes,
    rate,
    format,
    type VitalName,
    type Vital,
  } from './vitals';

  let vitals = $state<Record<VitalName, Vital>>(structuredClone(INITIAL_VITALS));
  let bytes = $state(0);
  let supported = $state(true);

  onMount(() => {
    supported = typeof PerformanceObserver !== 'undefined';
    const stop = observeVitals((name, value) => {
      vitals = { ...vitals, [name]: { ...vitals[name], value } };
    });

    // Bytes settle after load; read once the network has quietened.
    const t = window.setTimeout(() => (bytes = transferredBytes()), 1200);

    return () => {
      stop();
      window.clearTimeout(t);
    };
  });

  const kb = $derived(bytes ? `${(bytes / 1024).toFixed(0)} KB` : 'measuring');
</script>

<div class="vitals">
  <div class="vitals__head">
    <span class="label">This page, measured in your browser</span>
  </div>

  {#if !supported}
    <p class="vitals__note">
      Your browser does not expose the Performance Observer API, so these cannot be measured
      here. The numbers are real where it does.
    </p>
  {/if}

  <dl class="vitals__grid">
    {#each Object.values(vitals) as v (v.name)}
      <div class="vital" data-rate={rate(v)}>
        <dt class="mono">{v.name}</dt>
        <dd class="mono">{format(v)}</dd>
      </div>
    {/each}
    <div class="vital" data-rate="neutral">
      <dt class="mono">Transferred</dt>
      <dd class="mono">{kb}</dd>
    </div>
  </dl>
</div>

<style>
  .vitals {
    border: var(--border-hair);
    padding: var(--sp-base);
  }
  .vitals__head {
    margin-bottom: var(--sp-snug);
  }
  .vitals__note {
    font-size: var(--t-small);
    color: var(--ink-3);
    margin-bottom: var(--sp-snug);
    max-width: 52ch;
  }
  .vitals__grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(112px, 1fr));
    gap: 1px;
    margin: 0;
    background: var(--rule);
    border: var(--border-hair);
  }
  .vital {
    background: var(--ground);
    padding: var(--sp-snug);
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  dt {
    font-size: 10px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--ink-4);
  }
  dd {
    margin: 0;
    font-size: 15px;
    font-weight: 500;
    color: var(--ink);
  }
  /* State is encoded in form as well as colour — a left rule, not a tint
     alone, so it survives a colour-blind reading. */
  .vital[data-rate='good'] {
    box-shadow: inset 2px 0 0 var(--ok);
  }
  .vital[data-rate='ok'] {
    box-shadow: inset 2px 0 0 var(--warn);
  }
  .vital[data-rate='poor'] {
    box-shadow: inset 2px 0 0 var(--bad);
  }
  .vital[data-rate='pending'] dd {
    color: var(--ink-4);
  }
</style>
