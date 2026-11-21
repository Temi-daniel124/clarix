/**
 * Brand geometry shared by the React logo, the static SVG files and the icon renderer, so the
 * ring is drawn from one set of numbers everywhere (docs/superpowers/specs/2026-11-21-clarix-
 * adire-design-system-design.md, the round-1 Adire brand sheet).
 */

/** The meter ring as drawn on the brand sheet: a 22-unit box, radius 8.5, stroke 3.2. */
export const RING = { box: 22, radius: 8.5, stroke: 3.2 } as const;

/** The logo's fixed colours, the spec's tokens (light theme only, D033). */
export const BRAND_COLORS = {
  indigoNight: "#0B1033",
  indigo600: "#2F3DA6",
  emerald500: "#2BD19A",
  track: "#DCE0F2",
  ink: "#0E1230",
  ink2: "#4A5078",
  white: "#FFFFFF",
} as const;

export const BRAND_TAGLINE = "Cooperative records, made clear";

/**
 * The stroke-dasharray for the meter ring: the committed arc (circumference times `fraction`),
 * then the full circumference as the gap so the dash never repeats. Two-thirds committed and
 * one-third still available is the relationship the product measures.
 */
export function ringArc(radius: number, fraction = 2 / 3): { dash: number; gap: number } {
  const circumference = 2 * Math.PI * radius;
  return { dash: circumference * fraction, gap: circumference };
}
