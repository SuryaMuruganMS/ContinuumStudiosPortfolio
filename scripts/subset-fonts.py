#!/usr/bin/env python3
"""
Subset the three typefaces to the glyphs this site actually renders.

The specification budgets fonts at 110 KB total and 40 KB per file. Fontsource's
variable packages ship every subset in one CSS import — Latin, Latin-ext,
Cyrillic, Greek, Vietnamese — which came to 448 KB. Even taking only the Latin
files leaves ~140 KB, because a variable serif carrying a full weight axis is
inherently large.

Real subsetting closes the gap. This keeps the Latin character set plus the
punctuation the design actually uses (proper quotes, em and en dashes, the
multiplication sign in "8 / 5", arrows) and drops everything else, including
the layout features the site never invokes.

Run once after `npm install`, or whenever a font dependency changes:

    npm run fonts

Output lands in `public/fonts/` and is referenced by `src/styles/fonts.css`.
"""

from __future__ import annotations

import shutil
import sys
from pathlib import Path

try:
    from fontTools import subset
except ImportError:  # pragma: no cover
    sys.exit("fonttools is required: python -m pip install fonttools brotli")

ROOT = Path(__file__).resolve().parent.parent
MODULES = ROOT / "node_modules"
OUT = ROOT / "public" / "fonts"

# Latin basic + Latin-1 punctuation, plus the specific marks this design uses.
# Deliberately explicit rather than a named range: every glyph here is one the
# site renders, and anything absent is a glyph we do not set.
UNICODES = ",".join(
    [
        "U+0000-00FF",  # Basic Latin + Latin-1 Supplement
        "U+0131",  # dotless i
        "U+0152-0153",  # OE ligatures
        "U+02BB-02BC",  # modifier apostrophes
        "U+02C6,U+02DA,U+02DC",  # circumflex, ring, tilde
        "U+2000-206F",  # general punctuation: – — ' ' " " … •
        "U+2070,U+2074-2079",  # superscripts used in notes
        "U+20A0-20BF",  # currency, for the £ in the brief ranges
        "U+2122",  # trademark
        "U+2190-2193",  # arrows ← ↑ → ↓
        "U+2212",  # minus
        "U+2215",  # division slash
        "U+FEFF,U+FFFD",  # BOM, replacement
    ]
)

# Only the OpenType features the site relies on. `tnum` matters — every metric
# and table uses tabular figures.
LAYOUT_FEATURES = "kern,liga,clig,calt,tnum,ccmp,mark,mkmk"

SOURCES: list[tuple[str, Path]] = [
    (
        "bricolage-grotesque-var",
        MODULES / "@fontsource-variable/bricolage-grotesque/files/bricolage-grotesque-latin-wght-normal.woff2",
    ),
    (
        "newsreader-var",
        MODULES / "@fontsource-variable/newsreader/files/newsreader-latin-wght-normal.woff2",
    ),
    (
        "ibm-plex-mono-400",
        MODULES / "@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-400-normal.woff2",
    ),
    (
        "ibm-plex-mono-600",
        MODULES / "@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-600-normal.woff2",
    ),
]


def kb(n: int) -> str:
    return f"{n / 1024:.1f} KB"


def main() -> int:
    if not MODULES.exists():
        sys.exit("node_modules not found — run `npm install` first.")

    OUT.mkdir(parents=True, exist_ok=True)
    before_total = 0
    after_total = 0
    missing: list[str] = []

    print("\nSubsetting fonts to the rendered character set\n")

    for name, src in SOURCES:
        if not src.exists():
            missing.append(str(src.relative_to(ROOT)))
            continue

        dest = OUT / f"{name}.woff2"
        before = src.stat().st_size
        before_total += before

        args = [
            str(src),
            f"--unicodes={UNICODES}",
            f"--layout-features={LAYOUT_FEATURES}",
            "--flavor=woff2",
            "--with-zopfli",
            # Variable axes are kept: the weight axis is the reason these files
            # are chosen over three static cuts.
            "--drop-tables+=DSIG",
            "--no-hinting",
            "--desubroutinize",
            f"--output-file={dest}",
        ]
        subset.main(args)

        after = dest.stat().st_size
        after_total += after
        pct = (1 - after / before) * 100
        print(f"  {name:<28} {kb(before):>9} -> {kb(after):>9}  (-{pct:.0f}%)")

    if missing:
        print("\nMissing source files:")
        for m in missing:
            print(f"  - {m}")
        print("Run `npm install` and check the Fontsource package versions.")
        return 1

    saved = (1 - after_total / before_total) * 100 if before_total else 0
    print(f"\n  {'TOTAL':<28} {kb(before_total):>9} -> {kb(after_total):>9}  (-{saved:.0f}%)")
    print(f"\nWritten to {OUT.relative_to(ROOT)}\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
