#!/usr/bin/env python3
"""
Writes the standalone logo files in public/brand/ with the name and tagline converted to
outlines, so they render identically without Mona Sans or Figtree installed (a printer, a slide
deck, an email signature).

The layout repeats src/components/brand/logo.tsx exactly: the same ring geometry (src/lib/
brand.ts), the same proportions against the ring's diameter, Mona Sans at wdth 118 / wght 800
with -0.035em tracking for the name, and Figtree 500 for the tagline. Re-run it after changing
either file.

Needs: pip install fonttools brotli uharfbuzz, and a production build (npm run build) so the
Mona Sans and Figtree variable woff2 files that next/font downloads exist in .next/static/media.

Run: python3 scripts/brand/build-logo-svgs.py
"""
import glob
import io
import math
import os

import uharfbuzz as hb
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, "public", "brand")

INDIGO_NIGHT = "#0B1033"
INDIGO_600 = "#2F3DA6"
EMERALD_500 = "#2BD19A"
TRACK = "#DCE0F2"
INK = "#0E1230"
INK_2 = "#4A5078"
WHITE = "#FFFFFF"
TAGLINE = "Cooperative records, made clear"

# The brand sheet ring: a 22-unit box, radius 8.5, stroke 3.2, two-thirds committed.
RING_BOX, RING_R, RING_STROKE = 22.0, 8.5, 3.2


def find_font(family, text):
    for path in sorted(glob.glob(os.path.join(ROOT, ".next", "static", "media", "*.woff2"))):
        font = TTFont(path)
        cmap = font.getBestCmap()
        if font["name"].getDebugName(1).startswith(family) and all(ord(c) in cmap for c in text):
            buf = io.BytesIO()
            font.flavor = None
            font.save(buf)
            return buf.getvalue(), font
    raise SystemExit(f"No {family} woff2 covering {text!r} in .next/static/media; run npm run build")


class Face:
    def __init__(self, family, text, variations):
        data, self.tt = find_font(family, text)
        self.upem = self.tt["head"].unitsPerEm
        self.ascent = self.tt["hhea"].ascent
        self.descent = -self.tt["hhea"].descent
        self.font = hb.Font(hb.Face(data))
        self.font.set_variations(variations)

    def shape(self, text):
        buf = hb.Buffer()
        buf.add_str(text)
        buf.guess_segment_properties()
        hb.shape(self.font, buf, {"kern": True, "liga": True})
        return list(zip(buf.glyph_infos, buf.glyph_positions))

    def advance(self, text, size, tracking_em=0.0):
        """CSS box width: glyph advances plus letter-spacing after every glyph."""
        scale = size / self.upem
        return sum(p.x_advance * scale + tracking_em * size for _, p in self.shape(text))

    def baseline_in_line_box(self, line_height):
        """Distance from the top of a CSS line box (line-height as a multiple) to the baseline."""
        half_leading = (line_height * self.upem - (self.ascent + self.descent)) / 2
        return (half_leading + self.ascent) / self.upem

    def path(self, text, size, x, baseline, tracking_em=0.0):
        """SVG path data for `text` with its origin at (x, baseline), y pointing down."""
        scale = size / self.upem
        pen = SVGPathPen(None, ntos=lambda v: f"{v:.2f}".rstrip("0").rstrip("."))
        bounds = BoundsPen(None)
        cursor = x
        for info, pos in self.shape(text):
            gx = cursor + pos.x_offset * scale
            gy = baseline - pos.y_offset * scale
            t = (scale, 0, 0, -scale, gx, gy)
            self.font.draw_glyph_with_pen(info.codepoint, TransformPen(pen, t))
            self.font.draw_glyph_with_pen(info.codepoint, TransformPen(bounds, t))
            cursor += pos.x_advance * scale + tracking_em * size
        return pen.getCommands(), bounds.bounds


def ring(x, y, size, arc, track):
    s = size / RING_BOX
    c = RING_BOX / 2
    circ = 2 * math.pi * RING_R
    parts = [f'<g transform="translate({x:g} {y:g}) scale({s:g})">']
    if track:
        parts.append(
            f'<circle cx="{c:g}" cy="{c:g}" r="{RING_R}" fill="none" stroke="{track}" '
            f'stroke-width="{RING_STROKE}"/>'
        )
    parts.append(
        f'<circle cx="{c:g}" cy="{c:g}" r="{RING_R}" fill="none" stroke="{arc}" '
        f'stroke-width="{RING_STROKE}" stroke-linecap="round" '
        f'stroke-dasharray="{circ * 2 / 3:.2f} {circ:.2f}" transform="rotate(-90 {c:g} {c:g})"/>'
    )
    parts.append("</g>")
    return "".join(parts)


def svg(width, height, label, body):
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width:.2f} {height:.2f}" '
        f'width="{width:.0f}" height="{height:.0f}" role="img" aria-label="{label}">\n'
        f"  <title>{label}</title>\n  {body}\n</svg>\n"
    )


TRACKING = -0.035
mona = Face("Mona Sans", "Clarix", {"wdth": 118, "wght": 800})
figtree = Face("Figtree", TAGLINE, {"wght": 500})


def horizontal(S, arc, track, name_fill):
    fs, gap = S * 0.88, S * 0.3
    # items-center: the 1.0 line box is centred on the ring.
    baseline = (S - fs) / 2 + mona.baseline_in_line_box(1.0) * fs
    d, (_, _, xmax, _) = mona.path("Clarix", fs, S + gap, baseline, TRACKING)
    body = ring(0, 0, S, arc, track) + f'\n  <path fill="{name_fill}" d="{d}"/>'
    return svg(xmax + 1, S, "Clarix", body)


def stacked(S):
    fs, gap = S * 0.6, S * 0.185
    box_w = mona.advance("Clarix", fs, TRACKING)
    width = max(S, box_w)
    x_text = (width - box_w) / 2
    baseline = S + gap + mona.baseline_in_line_box(1.0) * fs
    d, (xmin, _, xmax, _) = mona.path("Clarix", fs, x_text, baseline, TRACKING)
    height = S + gap + fs
    # Crop to the ink horizontally, keeping the ring centred over the name's box as in CSS.
    left, right = min(xmin, (width - S) / 2), max(xmax, (width + S) / 2)
    body = (
        f'<g transform="translate({-left + 1:.2f} 0)">'
        + ring((width - S) / 2, 0, S, INDIGO_600, TRACK)
        + f'<path fill="{INDIGO_NIGHT}" d="{d}"/></g>'
    )
    return svg(right - left + 2, height, "Clarix", body)


def primary(S):
    fs_n, fs_t, gap, mt = S * 0.94, S * 0.226, S * 0.29, S * 0.097
    col_h = 0.95 * fs_n + mt + 1.3 * fs_t
    height = max(S, col_h)
    col_top = (height - col_h) / 2
    x = S + gap
    base_n = col_top + mona.baseline_in_line_box(0.95) * fs_n
    base_t = col_top + 0.95 * fs_n + mt + figtree.baseline_in_line_box(1.3) * fs_t
    d_n, (_, _, xn, _) = mona.path("Clarix", fs_n, x, base_n, TRACKING)
    d_t, (_, _, xt, _) = figtree.path(TAGLINE, fs_t, x, base_t)
    body = (
        ring(0, (height - S) / 2, S, INDIGO_600, TRACK)
        + f'\n  <path fill="{INDIGO_NIGHT}" d="{d_n}"/>'
        + f'\n  <path fill="{INK_2}" d="{d_t}"/>'
    )
    return svg(max(xn, xt) + 1, height, "Clarix, " + TAGLINE, body)


STAMP = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 148 148" width="148" height="148" role="img" aria-label="Clarix">
  <title>Clarix</title>
  <rect x="4" y="4" width="140" height="140" rx="34" fill="#2F3DA6"/>
  <g fill="none" stroke="rgba(255,255,255,0.22)" stroke-width="2">
    <circle cx="30" cy="30" r="9"/><circle cx="118" cy="30" r="9"/><circle cx="30" cy="118" r="9"/><circle cx="118" cy="118" r="9"/>
    <circle cx="74" cy="74" r="50"/>
  </g>
  <circle cx="74" cy="74" r="28" fill="none" stroke="rgba(255,255,255,0.22)" stroke-width="10"/>
  <circle cx="74" cy="74" r="28" fill="none" stroke="#2BD19A" stroke-width="10" stroke-linecap="round" stroke-dasharray="117.29 175.93" transform="rotate(-90 74 74)"/>
</svg>
"""

FILES = {
    "clarix-primary.svg": primary(62),
    "clarix-horizontal.svg": horizontal(48, INDIGO_600, TRACK, INDIGO_NIGHT),
    "clarix-stacked.svg": stacked(54),
    "clarix-submark.svg": STAMP,
    "clarix-black.svg": horizontal(48, INK, None, INK),
    "clarix-white.svg": horizontal(48, WHITE, None, WHITE),
}

os.makedirs(OUT, exist_ok=True)
for name, content in FILES.items():
    with open(os.path.join(OUT, name), "w") as fh:
        fh.write(content)
    print("wrote", os.path.join("public", "brand", name))
