---
title: The Crossing
client: Continuum Studios
year: 2026
problem: A railway's most interesting fact is a shape — thirteen kilometres east, sixty metres down — and a page that scrolls downwards cannot show it.
disciplines: [art direction, front-end, cartography, information design, localisation]
fidelity: live
liveUrl: https://maramaymetro.suryamuruganms40.workers.dev/
featured: true
order: 2
status: published
strata:
  - id: brief
    image: /work/marmaray/01-brief-band.webp
    note: >-
      Marmaray runs east under the Bosphorus and the interesting thing about it is
      geometry: you go across, and on the way you go down. A conventional page throws
      that away in the first scroll. So the journey moves sideways and the vertical
      scrollbar drives it — the reader's ordinary gesture, doing the railway's motion.
  - id: structure
    image: /work/marmaray/02-structure-divide.webp
    note: >-
      One scalar again, and this time it is chainage: metres east of the western portal.
      Depth, gradient, overburden, which of eleven tube elements is overhead, which car
      of the train you are standing in — every one is a pure function of that number, so
      any position on the line is a URL and every derivation has a unit test.
  - id: depth
    image: /work/marmaray/03-depth-section.webp
    note: >-
      The network is drawn two ways from one set of stations: the real coastline it opens
      on, and Beck's diagram. They morph rather than crossfade, which is the only way to
      show what a transit diagram costs — you can watch the compression happen, station by
      station, instead of being told about it.
  - id: data
    image: /work/marmaray/04-data-map.webp
    note: >-
      The geographic register is a real map. OpenStreetMap's coastline stitched into land
      polygons, every station at its own platform's coordinates, Web Mercator. Journey
      times follow from real distance and real average speeds; the previous version scaled
      them off the drawing and quoted ninety km/h on a metro.
  - id: motion
    image: /work/marmaray/05-motion-finds.webp
    note: >-
      Excavating Yenikapı uncovered the Theodosian Harbour and delayed the railway four
      years. That page is read twice — down through the strata, because there depth is
      time, and across through the finds, because a gallery is the shape of "what came
      out". Neither reading is the real one.
  - id: live
    image: /work/marmaray/06-live-fare.webp
    note: >-
      The planner routes over the real graph with an interchange penalty, then prices the
      journey for the passenger in front of it — flat off Marmaray, by distance on it,
      cheaper with each change, free for three kinds of pass. Every amount is invented and
      sits next to an (i) that says so, because a fares table is the one page people act
      on with money in their hand.
gallery:
  - src: /work/marmaray/07-travel.webp
    caption: >-
      How to travel on the railway: the gate, the platform edge, the cab. The train diagram
      is drawn rather than photographed so its labels come from the same dictionary as the
      rest of the page and read correctly in Arabic.
  - src: /work/marmaray/08-fares.webp
    caption: >-
      Every station priced from wherever you are, in either order — alphabetical to find
      one, by distance to watch the tariff climb and see that it is a formula rather than
      a list somebody wrote.
  - src: /work/marmaray/09-dig.webp
    caption: >-
      The Yenikapı section. Band heights are the real excavated depths, so the Byzantine
      harbour is genuinely that thick — and each band carries the three notes a section
      drawing always has, beside a drawing of the whole 22 m column with the current layer
      lit.
  - src: /work/marmaray/10-arabic.webp
    caption: >-
      Arabic. The prose flips; the crossing does not. A compass bearing is not a text
      direction, so the track, the map and the section stay pinned left-to-right while
      everything around them reverses.
  - src: /work/marmaray/11-world.webp
    caption: >-
      Keep zooming out and İstanbul stops being the frame. Natural Earth's land in the same
      Mercator as the city window, three copies at ±360° so the pan wraps — because a metro
      map answers "how do I get there" and almost never answers "where is this".
  - src: /work/marmaray/12-planner.webp
    caption: >-
      The planner draws the whole network with the journey lit through it. A route printed
      as a column of station names is a route to somebody who already knows the city and a
      list of words to everybody else.
metrics:
  - label: Layout audits per run
    after: '448'
    source: scripts/check-layout.mjs — 18 routes × 2 services × 4 widths
  - label: Contrast pairs checked
    after: '76'
    source: scripts/check-contrast.mjs — 5 depth bands × 2 services
  - label: Languages
    after: '4'
    source: English, Türkçe, العربية, Русский — 377 keys each
  - label: JavaScript on the wire
    before: '150 KB budget'
    after: '78 KB'
    source: scripts/check-budgets.mjs, gzipped, whole site
---

## The shape is the argument

Every fact about this railway is a shape. Thirteen and a half kilometres from Kazlıçeşme
to Söğütlüçeşme; sixty metres down at the middle; eleven precast concrete elements sunk
into a dredged trench, which is why it is the deepest immersed tube tunnel ever built.
None of that survives a page that scrolls downwards past it.

So the crossing moves sideways and the vertical scrollbar drives it. Both scrollbars are
real and both work — the section rail along the bottom can be dragged, and the page's own
scrollbar moves the train east. Nothing listens to the wheel.

## One number

Chainage — metres east of the western portal — is the only state the journey has.
Elevation, gradient, overburden, depth band, which tube element is overhead and which car
of a five-car set you are standing in are all pure functions of it. There is no second
source of truth, so nothing can desync, every position is deep-linkable, and each
derivation is testable by feeding a number in.

The alignment is scaled off the published long-section rather than surveyed, so every
figure derived from it renders greyed and asterisked. A reader can tell at a glance which
numbers to trust, which is more than most real government sites manage.

## Making the map real

The geographic register started as thirty-eight positions placed by eye and labelled
indicative. That made the morph a comparison between a diagram and a guess.

It is now OpenStreetMap's coastline — 298 directed ways stitched into two land polygons,
the Princes' Islands as rings, four reservoirs — with every station at its own platform's
coordinates. Distance is great-circle, scaled by a factor derived from the one length we
know exactly: Marmaray is 76.6 km, its chords come to 66, and the ratio corrects every
other leg on the network.

Labels are placed the way a cartographer places them. Each station offers four positions
and takes the first that collides with nothing already placed, crossing stations first. A
name that fits nowhere is not drawn, because at that scale it genuinely does not fit.

## What went wrong

Six things worth publishing.

**Every scroll-driven animation was dead in the shipped build.** Lightning CSS composes
`animation-name`, `animation-timing-function` and `animation-fill-mode` back into the
`animation` shorthand — and quietly folds `animation-timeline` in with them, where the
shorthand resets it to `auto`. So every `animation-timeline: view()` on the site became a
time-based animation that had already finished. The dev server does not minify, which is
why nobody saw it, and a frozen horizontal rail looks exactly like a rail at scroll
position zero, which is why nobody noticed. The fix is one line — `cssMinify: 'esbuild'`.

**The layout gate had been auditing the dev server all along.** Same root: the thing that
ships is `dist`, and the gate was pointed at `astro dev`. It refuses a dev server outright
now, which also cleared four phantom reflow failures that were dev's own injected
furniture rather than the page's.

**The film band had never been visible.** Not once. The crossing's track panels carry the
class `panel`, and so did a bordered-card utility in the base stylesheet — so every panel
painted an opaque surface over the video running behind it. The video was loading,
decoding and playing perfectly, underneath a lid. Two different things cannot share a
class name in a global sheet.

**Journey times were wrong by a factor of two.** They were scaled off the schematic
diagram, which is fine while the diagram is the only geometry you have. Real coordinates
exposed it: Halkalı to Sabiha Gökçen was being quoted at 47 minutes for 70 kilometres, an
average of ninety km/h on a metro. It is 111.

**The contrast gate was checking one mode twice.** A string-marker parser sliced through
the `prefers-color-scheme` block and sampled night service both times, so day was never
tested. Rewriting it with balanced brace matching exposed secondary ink at 1.38:1 — a real
WCAG failure that had been passing a green gate.

**A fixed readout sat on top of the headings, but only in the middle.** The dig's depth
axis hides itself at the very top and bottom of the page, which is exactly where the
layout gate was sampling. Auditing that page at seven scroll positions instead of two
found it immediately, at two widths, in both services.

## Honest about being a concept

This is a design demonstration and not affiliated with Metro İstanbul, TCDD or İETT, and
it says so in a bar that sits in normal flow at the top of every page rather than in a
dismissible corner badge. The fares are invented and marked at every figure. The line
colours are ours from the İznik palette rather than the operator's signage, because
inventing plausible ones for a real network is the quiet kind of dishonesty this project
avoids. The imagery is generated; the record it illustrates is not.
