---
date: 2026-09-04
project: AxiomDSF
shipped: A console card that hands its height to the widget inside it.
outcome: shipped
note: >-
  Reported as "the card margins are wrong". The padding was fine and identical on
  all eleven cards — the actual fault was that the card was a block, so the height
  the grid stretched it to went to nobody. Short widgets clumped at the top over a
  band of dead space and one still managed to overflow its own padding.
---

Fixed by making the card a flex column: the header keeps its intrinsic height, the
widget gets the rest. Widgets with a genuinely fixed size centre their remainder
instead of pinning it to the bottom.

A reported symptom and its cause are rarely the same thing.
