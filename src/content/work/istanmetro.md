---
title: IstanMetro
client: Continuum Studios
year: 2026
problem: A railway's most interesting fact is a shape — thirteen kilometres east, sixty metres down — and a page that scrolls downwards cannot show it.
disciplines: [art direction, front-end, cartography, information design, localisation]
fidelity: live
liveUrl: https://istanmetro.suryamuruganms40.workers.dev/
featured: true
order: 2
status: published
strata:
  - id: brief
    image: /work/istanmetro/01-hero-night.webp
    note: >-
      Marmaray runs east under the Bosphorus and the interesting thing about it is
      geometry: you go across, and on the way you go down. A conventional page throws
      that away in the first scroll. So the journey moves sideways and the vertical
      scrollbar drives it — the reader's ordinary gesture, doing the railway's motion.
  - id: structure
    image: /work/istanmetro/03-crossed.webp
    note: >-
      One scalar, and it is chainage: metres east of the western portal. Depth, gradient,
      overburden, which of eleven tube elements is overhead, which car of the train you
      are standing in, and the film's own playhead are every one of them a pure function
      of that number — so nothing can desync, any position on the line is a URL, and
      every derivation has a unit test.
  - id: motion
    image: /work/istanmetro/06-finds.webp
    note: >-
      Excavating Yenikapı uncovered the Theodosian Harbour and delayed the railway four
      years. That page is read twice — down through the strata, because there depth is
      time, and across through the finds, because a gallery is the shape of "what came
      out". Neither reading is the real one.
  - id: depth
    image: /work/istanmetro/05-map-geo.webp
    note: >-
      The network is drawn two ways from one set of stations: the real coastline it opens
      on, and Beck's diagram. They morph rather than crossfade, which is the only way to
      show what a transit diagram costs — you watch the compression happen station by
      station instead of being told about it.
  - id: data
    image: /work/istanmetro/04-map-world.webp
    note: >-
      Keep pulling back and İstanbul stops being the frame. Natural Earth's borders,
      lakes and seven thousand towns, projected with the map's own Web Mercator, so the
      planet is the same drawing from further away rather than a second map swapped in.
      A metro map answers "how do I get there" and almost never answers "where is this".
  - id: live
    image: /work/istanmetro/07-planner.webp
    note: >-
      The planner routes over the real graph with an interchange penalty, prices the
      journey for the passenger in front of it, and draws it on that same map — zoomable,
      pannable, every station still openable. Every amount is invented and sits next to
      an (i) that says so, because a fares table is the one page people act on with money
      in their hand.
gallery:
  - src: /work/istanmetro/09-travelling.webp
    caption: >-
      How to travel on the railway: the gate, the platform edge, the cab. The train
      diagram is drawn rather than photographed so its labels come from the same
      dictionary as the rest of the page and read correctly in Arabic.
  - src: /work/istanmetro/08-cab.webp
    caption: >-
      The cab. Traction and brake controller, train management screen, signalling
      display, dead man's device — named in the order a driver meets them rather than the
      order they were built.
  - src: /work/istanmetro/02-hero-day.webp
    caption: >-
      Day service. The same page, the same words, a different railway — every image and
      both films exist as a pair, and the switch is a service running rather than a
      preference toggle.
metrics:
  - label: Layout audits per run
    after: '448'
    source: scripts/check-layout.mjs — 18 routes × 2 services × 4 widths, against the built site
  - label: Contrast pairs checked
    after: '76'
    source: scripts/check-contrast.mjs — 5 depth bands × 2 services
  - label: Languages
    after: '4'
    source: English, Türkçe, العربية, Русский — 378 keys each
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

The film is one of those functions now. It does not play: the left edge of the track is
its first frame, the right edge is its last, and scroll position writes `currentTime`
directly, so the clip is seen once, end to end, and runs backwards when the reader scrolls
back. The received wisdom is that reverse seeking stutters, and it does — if you fire a
seek per scroll event and let them queue. One seek per animation frame, none while the
element is still `seeking`, and the pending target re-applied when the in-flight one
lands, because the request that gets skipped is always the last one and the reader stops
scrolling right after it.

The alignment is scaled off the published long-section rather than surveyed, so every
figure derived from it renders greyed and asterisked. A reader can tell at a glance which
numbers to trust, which is more than most real government sites manage.

## Making the map real, then making it a map of the world

The geographic register started as thirty-eight positions placed by eye and labelled
indicative. That made the morph a comparison between a diagram and a guess.

It is now OpenStreetMap's coastline — 298 directed ways stitched into two land polygons,
the Princes' Islands as rings, four reservoirs — with every station at its own platform's
coordinates. Distance is great-circle, scaled by a factor derived from the one length we
know exactly: Marmaray is 76.6 km, its chords come to 66, and the ratio corrects every
other leg on the network.

Under all of it, at every scale between the city and the planet, is Natural Earth:
1:50m country outlines and borders and lakes, 1:10m populated places, country names in all
four of the site's languages, projected with the map's own Web Mercator so zooming out is
one continuous movement rather than a mode change.

What gets a name is decided twice. A threshold in degrees of visible longitude — off
LABELRANK for countries, off population for towns — says what is eligible, so the map
fills in the way an atlas does as you lean closer. Then a greedy collision pass decides
what actually fits, working down from the most prominent name to the least. The threshold
alone is not enough, and the first cut proved it: ninety-four country names were eligible
at planet zoom and western Europe came out as one block with UNITED KINGDOM, BELGIUM,
GERMANY and FRANCE printed through each other. Natural Earth can say which names deserve
the room. It cannot know whether there is any.

That basemap is fetched, not bundled — it is data, not code, and a reader who never pulls
back never pays for it.

## What went wrong

Seven things worth publishing.

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

**Then it was invisible again, in the other direction, twice.** A 62% wash of the page's
ground over the footage keeps panel copy readable. Over near-black tunnel film on a
near-black night ground it left a plain dark rectangle. The same 62% over a bright
underwater shot on a near-white day ground left a train you had to look for — and that one
took months longer to find, because a pale rectangle looks like a design decision in a way
a black one does not.

**Journey times were wrong by a factor of two.** They were scaled off the schematic
diagram, which is fine while the diagram is the only geometry you have. Real coordinates
exposed it: Halkalı to Sabiha Gökçen was being quoted at 47 minutes for 70 kilometres, an
average of ninety km/h on a metro. It is 111.

**The contrast gate was checking one mode twice.** A string-marker parser sliced through
the `prefers-color-scheme` block and sampled night service both times, so day was never
tested. Rewriting it with balanced brace matching exposed secondary ink at 1.38:1 — a real
WCAG failure that had been passing a green gate.

**Station names were decluttered in the wrong coordinate space.** Every part of a station
is drawn at a constant size on screen — the dot, the hit target, the label — but the
collision solver measured its boxes in raw viewBox units, so it was only correct at zoom

1. The day the map learned to pull back to a regional view, thirty-two names printed
   through each other over the Bosphorus.

## Honest about being a concept

This is a design demonstration and not affiliated with Metro İstanbul, TCDD or İETT, and
it says so in a bar that sits in normal flow at the top of every page rather than in a
dismissible corner badge. The fares are invented and marked at every figure. The line
colours are ours from the İznik palette rather than the operator's signage, because
inventing plausible ones for a real network is the quiet kind of dishonesty this project
avoids. The imagery is generated; the record it illustrates is not.
