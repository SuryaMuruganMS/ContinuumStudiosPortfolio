---
date: 2026-09-10
project: IstanMetro
shipped: The crossing's film scrubs on scroll, and the map zooms out to a real world basemap.
outcome: shipped
note: >-
  Two things we had written down as settled turned out to be settled the wrong
  way. The film had a comment in it explaining why scroll-scrubbing could not be
  smooth; it can, and the reasoning in the comment was the bug. And the layout
  gate had been pointed at the dev server since the day it was written, which is
  how a build with every scroll-driven animation dead in it passed 448 audits.
---

The film no longer plays. The left edge of the track is its first frame, the
right edge is its last, and scroll position writes `currentTime` directly, so
the clip is seen once, end to end, forwards going east and backwards coming
back. Reverse seeking does stutter if you fire one seek per scroll event — the
fix is one seek per animation frame, none while the element is still `seeking`,
and the pending target re-applied on `seeked`, because the request that gets
skipped is always the last one and the reader stops scrolling right after it.

The map now sits on Natural Earth: borders, lakes, country names in four
languages and seven thousand towns, projected into the map's own coordinates and
fetched rather than bundled. Two decisions, not one, decide what gets a name — a
scale threshold for eligibility and a collision pass for what actually fits.
Skipping the second put UNITED KINGDOM, BELGIUM, GERMANY and FRANCE through each
other at planet zoom.

The gate now refuses a dev server outright. That is the entry worth keeping: a
green gate pointed at the wrong artefact is worse than no gate, because it is
believed.
