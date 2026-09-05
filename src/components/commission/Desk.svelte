<script lang="ts">
  import { onMount } from 'svelte';
  import {
    EMPTY_ANSWERS,
    SHAPES,
    SUBSTANCES,
    TIMINGS,
    BANDS,
    buildBrief,
    isEmailish,
    type Answers,
    type Shape,
    type Substance,
    type Timing,
    type Band,
  } from './brief';

  import { SITE } from '../../lib/site';
  /**
   * Four steps, one question per screen.
   *
   * This is progressive enhancement over a form that works without JavaScript:
   * the no-JS version renders every fieldset at once and posts them together.
   * When the island hydrates it takes over and shows one step at a time.
   *
   * State lives in the URL so a half-finished commission survives a refresh
   * and can be resumed from a bookmark.
   */

  let step = $state(0);
  let a = $state<Answers>({ ...EMPTY_ANSWERS });
  let submitting = $state(false);
  let submitted = $state(false);
  let error = $state('');
  /** False when the server accepted the brief but could not email it. */
  let delivered = $state(true);
  let headingEl: HTMLHeadingElement | undefined = $state();

  const STEPS = ['Shape', 'Substance', 'Timing', 'Band'] as const;
  const LAST = STEPS.length;

  const canAdvance = $derived(
    (step === 0 && a.shape !== null) ||
      (step === 1 && a.substance.length > 0) ||
      step === 2 ||
      (step === 3 && a.band !== null),
  );

  const doc = $derived(buildBrief(a));

  function syncUrl() {
    const url = new URL(window.location.href);
    url.searchParams.set('step', String(step));
    if (a.shape) url.searchParams.set('shape', a.shape);
    if (a.substance.length) url.searchParams.set('does', a.substance.join(','));
    url.searchParams.set('when', a.timing);
    if (a.band) url.searchParams.set('band', a.band);
    window.history.replaceState(null, '', url);
  }

  onMount(() => {
    const p = new URLSearchParams(window.location.search);
    const shape = p.get('shape');
    if (shape && SHAPES.some((s) => s.id === shape)) a.shape = shape as Shape;
    const does = p.get('does');
    if (does) {
      a.substance = does
        .split(',')
        .filter((d): d is Substance => SUBSTANCES.some((s) => s.id === d));
    }
    const when = p.get('when');
    if (when && TIMINGS.some((t) => t.id === when)) a.timing = when as Timing;
    const band = p.get('band');
    if (band && BANDS.some((b) => b.id === band)) a.band = band as Band;
    const s = Number.parseInt(p.get('step') ?? '0', 10);
    if (!Number.isNaN(s)) step = Math.min(LAST, Math.max(0, s));
  });

  function go(next: number) {
    step = Math.min(LAST, Math.max(0, next));
    syncUrl();
    // Focus follows the step so a keyboard or screen-reader user is not left
    // behind on the previous question.
    queueMicrotask(() => headingEl?.focus());
  }

  function toggleSubstance(id: Substance) {
    a.substance = a.substance.includes(id)
      ? a.substance.filter((s) => s !== id)
      : [...a.substance, id];
  }

  async function submit(event: SubmitEvent) {
    event.preventDefault();
    if (!isEmailish(a.email)) {
      error = 'Enter an email address we can reply to.';
      return;
    }
    error = '';
    submitting = true;
    try {
      const res = await fetch('/api/commission', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(a),
      });
      const body = (await res.json().catch(() => ({}))) as {
        delivered?: boolean;
        error?: string;
      };
      if (!res.ok) {
        /**
         * A 404/405 here does not mean the form is broken — it means the
         * endpoint is not running. `astro preview` and any plain static host
         * serve files only, so /api/commission does not exist there. Saying
         * "Server returned 404" sent us looking for a bug in working code.
         */
        if (res.status === 404 || res.status === 405) {
          throw new Error(
            `The commission endpoint is not running on this host, so nothing was sent. ` +
              `Email ${SITE.email} and we will pick it up.`,
          );
        }
        throw new Error(body.error ?? `That did not send. Email ${SITE.email}.`);
      }
      /**
       * A 200 is not the same as a sent email. The endpoint accepts the brief
       * even when no mail provider is configured, and reporting that as success
       * is what made a form that delivered nothing look like it was working.
       */
      delivered = body.delivered !== false;
      submitted = true;
    } catch (e) {
      error =
        e instanceof Error && e.message
          ? e.message
          : `That did not send. Email ${SITE.email} and we will pick it up.`;
    } finally {
      submitting = false;
    }
  }
</script>

<div class="desk">
  <ol class="desk__progress" aria-label="Progress">
    {#each STEPS as name, i (name)}
      <li>
        <button
          type="button"
          class="desk__tick"
          class:is-done={i < step}
          class:is-here={i === step}
          aria-current={i === step ? 'step' : undefined}
          onclick={() => go(i)}
        >
          <span class="mono">{String(i + 1).padStart(2, '0')}</span>
          <span>{name}</span>
        </button>
      </li>
    {/each}
  </ol>

  {#if submitted}
    <div class="desk__done">
      <h2 tabindex="-1" bind:this={headingEl}>{delivered ? 'Brief sent' : 'Brief ready'}</h2>
      {#if delivered}
        <p class="t-lede">
          A copy is on its way to {a.email}. We reply to everything within two working days.
        </p>
      {:else}
        <!-- The brief was built, but email is not configured on this deployment.
             Saying "sent" here would be a lie the visitor only discovers by
             waiting two days for a reply that is never coming. -->
        <p class="t-lede">
          Your brief is ready to read below — but this deployment could not email it. Send it to
          us directly and we will pick it up.
        </p>
        <p class="desk__fallback">
          <a class="link-quiet" href={`mailto:${SITE.email}`}>{SITE.email}</a>
        </p>
      {/if}
      <a class="btn" href="/commission/brief">Read the brief again</a>
    </div>
  {:else}
    <form onsubmit={submit} method="post" action="/api/commission">
      <!-- ---------------------------------------------------- step 1 : shape -->
      <fieldset class="desk__step" hidden={step !== 0}>
        <legend class="visually-hidden">What are you making?</legend>
        <h2 class="desk__q" tabindex="-1" bind:this={headingEl}>What are you making?</h2>
        <div class="desk__cards">
          {#each SHAPES as s (s.id)}
            <label class="card" class:is-on={a.shape === s.id}>
              <input type="radio" name="shape" value={s.id} bind:group={a.shape} />
              <span class="card__name">{s.name}</span>
              <span class="card__blurb">{s.blurb}</span>
            </label>
          {/each}
        </div>
      </fieldset>

      <!-- ------------------------------------------------ step 2 : substance -->
      <fieldset class="desk__step" hidden={step !== 1}>
        <legend class="visually-hidden">What does it need to do?</legend>
        <h2 class="desk__q">What does it need to do?</h2>
        <p class="desk__hint">Choose everything that applies.</p>
        <div class="desk__cards">
          {#each SUBSTANCES as s (s.id)}
            <label class="card" class:is-on={a.substance.includes(s.id)}>
              <input
                type="checkbox"
                name="substance"
                value={s.id}
                checked={a.substance.includes(s.id)}
                onchange={() => toggleSubstance(s.id)}
              />
              <span class="card__name">{s.name}</span>
            </label>
          {/each}
        </div>
      </fieldset>

      <!-- --------------------------------------------------- step 3 : timing -->
      <fieldset class="desk__step" hidden={step !== 2}>
        <legend class="visually-hidden">When do you need it?</legend>
        <h2 class="desk__q">When do you need it?</h2>
        <div class="desk__rows">
          {#each TIMINGS as t (t.id)}
            <label class="row-card" class:is-on={a.timing === t.id}>
              <input type="radio" name="timing" value={t.id} bind:group={a.timing} />
              <span class="card__name">{t.name}</span>
              <span class="card__blurb">{t.cost}</span>
            </label>
          {/each}
        </div>
      </fieldset>

      <!-- ----------------------------------------------------- step 4 : band -->
      <fieldset class="desk__step" hidden={step !== 3}>
        <legend class="visually-hidden">What is the budget?</legend>
        <h2 class="desk__q">What is the budget?</h2>
        <p class="desk__hint">
          Naming a range filters out mismatches before a call, which is the entire point of
          asking.
        </p>
        <div class="desk__rows">
          {#each BANDS as b (b.id)}
            <label class="row-card" class:is-on={a.band === b.id}>
              <input type="radio" name="band" value={b.id} bind:group={a.band} />
              <span class="card__name">{b.name}</span>
              <span class="card__blurb">{b.buys}</span>
            </label>
          {/each}
        </div>
      </fieldset>

      <!-- ------------------------------------------------------- the output -->
      <fieldset class="desk__step" hidden={step !== LAST}>
        <legend class="visually-hidden">Your brief</legend>
        <h2 class="desk__q">Your brief</h2>
        <p class="desk__hint">
          Yours to keep and use with anyone, including a studio that is not us.
        </p>

        <article class="brief">
          <h3>Objective</h3>
          <p>{doc.objective}</p>

          <h3>Included</h3>
          <ul>
            {#each doc.inclusions as x (x)}<li>{x}</li>{/each}
          </ul>

          <h3>Not included</h3>
          <ul>
            {#each doc.exclusions as x (x)}<li>{x}</li>{/each}
          </ul>

          <h3>Assumptions</h3>
          <ul>
            {#each doc.assumptions as x (x)}<li>{x}</li>{/each}
          </ul>

          <h3>Largest risks</h3>
          <ul>
            {#each doc.risks as x (x)}<li>{x}</li>{/each}
          </ul>

          <h3>Phases</h3>
          <ol>
            {#each doc.phases as p (p.name)}<li><b>{p.name}</b> — {p.detail}</li>{/each}
          </ol>

          <h3>Range</h3>
          <p class="brief__range mono">{doc.range}</p>
        </article>

        <div class="desk__send">
          <label class="field-label" for="desk-email">Where should we send it?</label>
          <input
            id="desk-email"
            class="field"
            type="email"
            name="email"
            autocomplete="email"
            bind:value={a.email}
            aria-invalid={error ? 'true' : undefined}
            aria-describedby={error ? 'desk-error' : undefined}
            placeholder="you@company.com"
          />
          {#if error}
            <p class="field-error" id="desk-error" role="alert">{error}</p>
          {/if}
          <button class="btn btn--primary" type="submit" disabled={submitting}>
            {submitting ? 'Sending…' : 'Send it'}
          </button>
          <button class="btn" type="button" onclick={() => window.print()}
            >Print / save PDF</button
          >
        </div>
      </fieldset>

      <!-- Navigation. Hidden without JS, where every step is visible anyway. -->
      <div class="desk__nav">
        <button
          class="btn btn--ghost"
          type="button"
          onclick={() => go(step - 1)}
          hidden={step === 0}
        >
          Back
        </button>
        {#if step < LAST}
          <button
            class="btn btn--primary"
            type="button"
            onclick={() => go(step + 1)}
            disabled={!canAdvance}
          >
            {step === LAST - 1 ? 'See the brief' : 'Next'}
          </button>
        {/if}
      </div>
    </form>
  {/if}
</div>

<style>
  .desk {
    max-width: 780px;
  }

  .desk__progress {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-hair);
    list-style: none;
    margin: 0 0 var(--sp-loose);
    padding: 0;
  }
  .desk__tick {
    display: flex;
    align-items: baseline;
    gap: var(--sp-tight);
    padding: var(--sp-tight) var(--sp-snug);
    border-bottom: 2px solid var(--rule);
    font-family: var(--f-mono);
    font-size: 11px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--ink-4);
    transition:
      color var(--d-hover) var(--ease-out),
      border-color var(--d-hover) var(--ease-out);
  }
  .desk__tick.is-done {
    color: var(--ink-3);
    border-bottom-color: var(--rule-live);
  }
  .desk__tick.is-here {
    color: var(--ink);
    border-bottom-color: var(--accent);
  }

  .desk__step {
    border: 0;
    padding: 0;
    margin: 0;
  }
  .desk__q {
    font-family: var(--f-display);
    font-size: var(--t-h2);
    letter-spacing: var(--tr-display);
    margin-bottom: var(--sp-snug);
  }
  .desk__q:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 4px;
  }
  .desk__hint {
    color: var(--ink-3);
    font-size: var(--t-small);
    margin-bottom: var(--sp-roomy);
    max-width: 56ch;
  }

  .desk__cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: var(--sp-snug);
  }
  .desk__rows {
    display: grid;
    gap: var(--sp-tight);
  }

  .card,
  .row-card {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: var(--sp-hair);
    padding: var(--sp-base);
    min-height: 44px;
    border: 1px solid var(--rule);
    background: var(--ground-2);
    cursor: pointer;
    transition:
      border-color var(--d-hover) var(--ease-out),
      background-color var(--d-hover) var(--ease-out);
  }
  @media (hover: hover) and (pointer: fine) {
    .card:hover,
    .row-card:hover {
      border-color: var(--rule-live);
    }
  }
  .card.is-on,
  .row-card.is-on {
    border-color: var(--accent);
    background: var(--accent-soft);
  }
  /* The input stays in the DOM and focusable — hiding it with display:none
     would remove it from the tab order and break keyboard selection. */
  .card input,
  .row-card input {
    position: absolute;
    opacity: 0;
    width: 1px;
    height: 1px;
  }
  .card:has(input:focus-visible),
  .row-card:has(input:focus-visible) {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }
  .card__name {
    font-family: var(--f-display);
    font-weight: 600;
    font-size: 15px;
  }
  .card__blurb {
    font-size: var(--t-small);
    color: var(--ink-3);
    line-height: 1.5;
  }

  .brief {
    border: var(--border-hair);
    border-left: 2px solid var(--accent);
    padding: var(--sp-roomy);
    background: var(--ground-2);
  }
  .brief h3 {
    font-family: var(--f-mono);
    font-size: 10.5px;
    font-weight: 600;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--ink-3);
    margin-top: var(--sp-roomy);
    margin-bottom: var(--sp-tight);
  }
  .brief h3:first-child {
    margin-top: 0;
  }
  .brief p,
  .brief li {
    font-size: var(--t-small);
    line-height: 1.6;
    color: var(--ink-2);
  }
  .brief ul,
  .brief ol {
    padding-left: 1.1rem;
    margin: 0;
  }
  .brief__range {
    font-size: 1.1rem;
    color: var(--ink);
  }

  .desk__send {
    display: flex;
    flex-direction: column;
    gap: var(--sp-snug);
    align-items: flex-start;
    margin-top: var(--sp-roomy);
  }

  .desk__nav {
    display: flex;
    gap: var(--sp-snug);
    margin-top: var(--sp-loose);
  }

  .desk__done {
    display: flex;
    flex-direction: column;
    gap: var(--sp-base);
    align-items: flex-start;
  }
  .desk__done h2:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 4px;
  }

  /* Without JavaScript every step is visible and the form posts once. */
  :global(html.no-js) .desk__step[hidden] {
    display: block !important;
  }
  :global(html.no-js) .desk__nav,
  :global(html.no-js) .desk__progress {
    display: none;
  }

  @media print {
    .desk__progress,
    .desk__nav,
    .desk__send {
      display: none;
    }
    .brief {
      border: 0;
      padding: 0;
    }
  }

  .desk__fallback {
    font-family: var(--f-mono);
    font-size: var(--t-small);
  }
</style>
