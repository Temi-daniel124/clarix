# BRAND.md, Clarix

The logo system and how it is used. Built in BUILD-PLAN step 2.1. Nothing new is invented: every
variation is made from the two parts Clarix already has, **the meter ring** and **the wordmark**.

## The parts

**The meter ring (the mark).** The signature motif curled into a circle: a full track plus an arc
covering exactly two-thirds of the circumference, starting at 12 o'clock and running clockwise, with
round caps. Two-thirds committed, one-third still available: the product's idea in one shape. In the
current `src/app/icon.svg` it is drawn at r = 132 on a 512 grid, stroke 44, dash `553.2 829.4`.

- Track: `ink-300` on light grounds, white at 16% on navy.
- Arc: `emerald-500` (`#0F9F74`).
- Stroke weight: 17% of the ring's outer diameter at normal sizes; **24% for the favicon** so it
  survives 16px.

**The wordmark.** "Clarix" set in Figtree 600, tracking −0.02em, redrawn as outlines (never live text in
the SVG masters). Sentence case, never all caps, never "CLARIX" in running copy. Colour `ink-900` on
light, white on navy.

## The variations

| Variation | Construction | Where it is used |
|---|---|---|
| **Primary (horizontal)** | Ring left, wordmark right. Ring height = wordmark cap height × 1.2; gap = 0.35 × ring diameter; optically centred on the x-height | Site header and footer, sign-in, PDF headers, invoices, pitch decks |
| **Secondary (stacked)** | Ring centred above the wordmark; gap = 0.25 × ring diameter | Splash screen, square social banners, email signature, business cards |
| **Submark** | The ring alone | App loading state, PDF watermark (with the cooperative name), social avatars, PWA install icon |
| **Favicon / app icon** | The ring at 24% stroke on a `navy-900` rounded square (radius 22% of the side); for maskable icons the ring sits inside the central 80% safe zone | Browser tab, bookmarks, iOS and Android home screen |
| **Mono navy** | Everything `navy-900`; the committed/available split shown by stroke weight (arc 100%, track 45%) | Single-colour print on light paper, embossing |
| **Mono white** | Everything white; track at 40% opacity | On navy bands and over the hero photo scrim |
| **Mono black** | Pure `#000`; split by weight as in mono navy | Fax, thermal receipts, newspaper |

Optional tagline under the primary on marketing material only: "Cooperative finance, clearly." in
`small`, `ink-500`. Never inside the app.

## Rules

- **Clear space** on every side = the ring's diameter (for the favicon: 12.5% of the tile).
- **Minimum size:** primary 96px wide (24mm in print); stacked 64px wide; submark 16px; favicon 16px.
- Never recolour the ring, swap the arc and track, change the two-thirds proportion, stretch, rotate,
  outline, add a shadow or glow, or place the full-colour version on a busy photo (use mono white on
  the scrim).
- Cooperative logos, where uploaded, always sit **beside** Clarix's (PDF header right side, app header
  avatar), never merged into it.

## As built (BUILD-PLAN 2.1)

The exact numbers, in Figtree font units (1000 per em, cap height 700, x-height 500), shared by the SVG
masters and the `Logo` component (`src/components/clarix/logo.tsx`, geometry in `logo-geometry.ts`):

- **Wordmark:** Figtree 600's own outlines for "Clarix", shaped with the font's kerning and tracked
  −20 units (−0.02em), one path, baseline at 0; ink box 39 to 2498 wide, 726 above the baseline to
  12 below.
- **Ring:** outer diameter 840 (cap 700 × 1.2), stroke 142.8 (17%), radius 348.6; the arc is
  two-thirds of the circumference from 12 o'clock, round caps.
- **Primary:** gap 294 (0.35 × ring); the ring's centre sits 250 above the baseline (the middle of
  the x-height). Box 3593 × 896, so 24px tall is the 96px minimum width.
- **Stacked:** gap 210 (0.25 × ring), box 2459 × 1788; 47px tall is the 64px minimum width.
- **Tones:** `default` (ink-900 word, ink-300 track, emerald-500 arc), `on-navy` (white word, white
  16% track, emerald-500 arc), `mono-white` (all white, track 40%), `mono-navy` and `mono-black` (one
  colour, track stroke 45% of the arc's).
- **Favicon / app icon:** a 512 tile, `navy-900`, radius 22% (112.6); ring outer diameter 75% of the
  tile (the 12.5% clear space each side), stroke 24% of it. **Apple:** the same ring on a square tile
  with no radius, because iOS masks its own corners. **Maskable:** square tile, ring 75% of the
  central 80% safe zone (60% of the tile).
- PNGs are rendered straight at their pixel size, not shrunk from a large one.

## Files (generated in BUILD-PLAN 2.1)

```
public/brand/
  clarix-{primary,stacked,submark}.svg                 (default, light grounds)
  clarix-{primary,stacked,submark}-on-navy.svg         (colour on navy)
  clarix-{primary,stacked,submark}-white.svg           (mono white)
  clarix-{primary,stacked,submark}-mono-navy.svg
  clarix-{primary,stacked,submark}-mono-black.svg
  clarix-favicon-mark.svg
  png/clarix-{primary,stacked,submark}-{512,1024}.png  (long side)
  png/clarix-favicon-mark-{16,32,180,192,512,1024}.png
public/icons/
  icon-192.png  icon-512.png  icon-maskable-192.png  icon-maskable-512.png  icon.svg  icon-maskable.svg
src/app/
  favicon.ico (16, 32, 48 inside)   icon.png (32)   apple-icon.png (180)   icon.svg (the favicon mark)
  opengraph-image.tsx   (BUILD-PLAN 2.2; 1200×630: navy-900 ground, primary white logo top-left, the landing
                         headline in display 600 white, a meter ring bottom-right at 6% white)
```

PNG exports at 16, 32, 180, 192, 512 and 1024. A `/dev/brand` page (Preview only) shows every variation
on canvas, white and navy at its minimum size; the owner approves the set from that page.

## Watermark (D044)

The submark at 40mm plus the cooperative's name in Figtree 600 14pt beside it, `navy-900` at **6%
opacity**, rotated **30°**, tiled diagonally with 60mm spacing on every page of a generated PDF.
