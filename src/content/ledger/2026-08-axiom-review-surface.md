---
date: 2026-08-14
project: AxiomDSF
shipped: A rebuilt review surface — agent output rendered as a document, not a preview pane.
outcome: learned
note: >-
  The first version was unusable and we did not notice, because we tested it with
  short outputs. Real agent output is a long Markdown document with tables, and at
  that length the preview pane was too cramped to approve anything from. Two causes:
  component styles never reached content injected as HTML, and a CSS grid track with
  the default minimum refused to shrink. Both are beginner mistakes. Both survived
  review because nobody looked at a realistic payload.
---

The lesson we are keeping: test the layout with the largest real content, not the
smallest convenient one.
