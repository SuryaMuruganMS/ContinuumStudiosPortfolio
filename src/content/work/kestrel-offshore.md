---
title: Kestrel Offshore
client: Continuum Studios
year: 2026
problem: A contractor's best work is the part nobody photographs, so the website has to take the reader to it rather than describe it.
disciplines: [art direction, front-end, motion, information design]
sector: Private
fidelity: live
liveUrl: https://kestreloffshore.suryamuruganms40.workers.dev/
featured: true
order: 1
status: published
strata:
  - id: brief
    image: /work/kestrel/01-brief-apex.webp
    note: >-
      Offshore wind is the only industry whose work spans 245 vertical metres in one
      structure. The turbine gets photographed; the 62 metres below it never do. That
      is not a metaphor we imposed on the brief — it is the asset's real geometry, which
      is why organising the whole site on the depth axis feels inevitable rather than clever.
  - id: structure
    image: /work/kestrel/02-structure-engine.webp
    note: >-
      One scalar runs the site. Depth, +180 m to −65 m, and everything else is a pure
      function of it — colour, fog, light absorption, particle direction, audio filter,
      type weight. No second source of truth means nothing can desync, the whole page is
      deep-linkable, and every derivation is testable by feeding a number in.
  - id: colour
    image: /work/kestrel/03-colour-waterline.webp
    note: >-
      The palette is a path through OKLCH, not a set of swatches, so two visitors at
      different scroll positions see genuinely different schemes. Ink does not blend
      across the waterline — interpolating it would pass through mid-grey exactly where
      the ground is also mid-grey, and contrast would collapse at the one moment the
      design invites you to stop and look.
  - id: motion
    image: /work/kestrel/04-motion-crossing.webp
    note: >-
      The camera crosses the sea surface in a single unbroken shot, scrubbed by scroll and
      reversible at any speed. The two films cross at different frames, so each is resampled
      around its own crossing to land on the site's waterline — otherwise switching mode
      mid-descent would jump, and the palette would invert at the wrong moment.
  - id: states
    image: /work/kestrel/05-states-sonar.webp
    note: >-
      Two modes, and neither is a tint of the other. Daylight is a working dive; sonar is
      the same descent at night read off instruments, where colour comes from returns rather
      than from the sun. Calling the second one "dark mode" would undersell what changes.
  - id: live
    image: /work/kestrel/06-live-seabed.webp
    note: >-
      The seabed, 62 metres down, where the enquiry form sits. Someone who has travelled the
      full descent has spent real attention, so the call to action arrives at the point of
      peak engagement rather than at the top where it interrupts.
gallery:
  - src: /work/kestrel/07-installation.webp
    caption: >-
      Installation. Each capability page opens on the constraint rather than the service —
      a lift is a bet on a forecast, and the page says so before it says anything else.
  - src: /work/kestrel/08-survey.webp
    caption: >-
      Survey and consent. The one discipline whose output is a number somebody else
      then builds against, which is why its page is the most heavily sourced.
  - src: /work/kestrel/09-cabling.webp
    caption: >-
      Cabling. Two thousand eight hundred kilometres laid, and the failure mode that
      matters is not the lay — it is the termination nobody photographs.
  - src: /work/kestrel/10-maintenance.webp
    caption: >-
      Operations and maintenance, at the depth it happens. Below sixteen metres the
      palette has inverted and the type has thickened to hold contrast.
  - src: /work/kestrel/11-fleet.webp
    caption: >-
      The fleet. Four vessels with real specification tables, because a contractor is
      its plant and a brochure photograph is not a capability statement.
  - src: /work/kestrel/12-safety.webp
    caption: >-
      Safety. A falling injury rate beside a rising near-miss rate — the shape that
      shows reporting is working, published with the incident that produced it.
metrics:
  - label: Vertical metres the site covers
    after: '245'
    source: Blade tip at +180 m to cable burial at −65 m
  - label: Depth samples the contrast gate checks
    after: '201'
    source: scripts/check-contrast.mjs, both modes
  - label: Layout audits per run
    after: '252'
    source: 14 routes x 2 modes x 3 widths x 3 scroll positions
  - label: JavaScript for 3D
    before: 232 kB
    after: 0 kB
    source: Replaced by scroll-scrubbed film
---

## The part nobody photographs

Every offshore wind site opens on the same photograph: a turbine against an orange
sky. It is a good photograph and it says nothing, because the thing the client
actually sells happens below the waterline where no marketing photographer goes.

So the site goes there. It is one continuous descent from the blade tip to the
seabed, and the reader arrives at the enquiry form having travelled 245 metres.

## One number runs everything

There is exactly one piece of global state:

```
depth: number   // +180 m at the top, −65 m at the seabed
```

Colour, fog density, per-channel light absorption, particle direction, audio filter
cutoff, variable-font weight and cursor drag are all pure functions of it. The
architecture matters more than it sounds: scroll-driven sites normally accumulate
dozens of independent triggers that fight each other, desync on resize and break on
deep links. One scalar with pure derivations cannot desync, because there is nothing
to reconcile.

It also made the physics testable. The light absorption follows Jerlov Type II
coastal water — red effectively gone by 15 m, blue surviving past 60 — and there is a
unit test asserting exactly that. An early version had the coefficients scaled per
normalised unit rather than per metre, which left red at 35% transmission at 15 m.
The test caught it.

## The waterline

The single most important 800 ms on the site is the moment the camera passes through
the sea surface. It had to be scroll-linked rather than triggered, because a visitor
who stops halfway through must see a correct half-submerged frame — that pause is the
best moment on the site, not an edge case to tolerate.

Everything happens at once: the palette inverts, the mark rotates 90°, the type
thickens to stay legible as the ground darkens, and the filmed crossing lands on
exactly the same frame in both modes.

## What went wrong

Three things worth publishing.

**The contrast gate did not exist.** The plan called for one and it was never built,
so secondary ink shipped at 3.99:1 against its own ground near the waterline — a real
WCAG failure, invisible because it only occurred between two named colour stops.
Writing the gate found it in one run; it now samples 201 depths in both modes and
fails the build.

**A CSS transition froze a colour.** `transition: background-color` on a `color-mix()`
of custom properties pins the painted value to whatever it held when the transition
began. The variables updated, the page did not. It looked like a state bug and was a
rendering one.

**Fixed furniture collided with copy at some scroll positions and not others.** The
depth gauge is fixed and full height, so whether its labels overlapped depended on
where you had scrolled — which is why three rounds of screenshots kept missing it.
The fix was a layout gate that checks every route at three scroll positions in both
modes, 252 audits per run.
