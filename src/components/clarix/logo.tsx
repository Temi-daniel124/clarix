import { cn } from "@/lib/utils";
import { PRIMARY, RING, STACKED, WORDMARK_PATH } from "./logo-geometry";

/**
 * The Clarix logo (docs/BRAND.md, BUILD-PLAN 2.1): the meter ring and the outlined wordmark, the
 * same two parts as the SVG masters in `public/brand/`. It replaces the old `Wordmark`.
 *
 * - `variant`: `primary` (ring left of the name), `stacked` (ring above it) or `submark` (the ring).
 * - `tone`: `default` on light grounds, `on-navy` for navy bands, and the three single-colour
 *   versions. The single-colour ones split committed from available by stroke weight (navy, black)
 *   or opacity (white), never by a second colour.
 * - `height` in px. The defaults are the brand's minimum sizes: primary 96px wide, stacked 64px
 *   wide, submark 16px is the floor (24 by default).
 */

type Variant = "primary" | "stacked" | "submark";
type Tone = "default" | "on-navy" | "mono-navy" | "mono-white" | "mono-black";

type Paint = { word: string; track: string; trackOpacity: number; trackWeight: number; arc: string };

const TONES: Record<Tone, Paint> = {
  default: {
    word: "var(--clarix-ink-900)",
    track: "var(--clarix-ink-300)",
    trackOpacity: 1,
    trackWeight: 1,
    arc: "var(--clarix-emerald-500)",
  },
  "on-navy": { word: "#FFFFFF", track: "#FFFFFF", trackOpacity: 0.16, trackWeight: 1, arc: "var(--clarix-emerald-500)" },
  "mono-white": { word: "#FFFFFF", track: "#FFFFFF", trackOpacity: 0.4, trackWeight: 1, arc: "#FFFFFF" },
  "mono-navy": {
    word: "var(--clarix-navy-900)",
    track: "var(--clarix-navy-900)",
    trackOpacity: 1,
    trackWeight: 0.45,
    arc: "var(--clarix-navy-900)",
  },
  "mono-black": { word: "#000000", track: "#000000", trackOpacity: 1, trackWeight: 0.45, arc: "#000000" },
};

/** Primary at 24px tall is 96px wide, the brand minimum. */
const DEFAULT_HEIGHT: Record<Variant, number> = { primary: 24, stacked: 48, submark: 24 };

const CIRCUMFERENCE = 2 * Math.PI * RING.radius;

export function Logo({
  variant = "primary",
  tone = "default",
  height,
  className,
  label = "Clarix",
}: {
  variant?: Variant;
  tone?: Tone;
  height?: number;
  className?: string;
  /** Read by screen readers. Pass `""` when the logo sits inside a link that is already labelled. */
  label?: string;
}) {
  const paint = TONES[tone];
  const box =
    variant === "primary"
      ? PRIMARY
      : variant === "stacked"
        ? STACKED
        : { width: RING.diameter, height: RING.diameter, ringCx: RING.diameter / 2, ringCy: RING.diameter / 2 };
  const h = height ?? DEFAULT_HEIGHT[variant];
  const w = (h * box.width) / box.height;

  return (
    <svg
      viewBox={`0 0 ${box.width} ${box.height}`}
      width={round(w)}
      height={h}
      className={cn("block shrink-0", className)}
      {...(label ? { role: "img", "aria-label": label } : { "aria-hidden": true })}
      focusable="false"
    >
      <circle
        cx={box.ringCx}
        cy={box.ringCy}
        r={RING.radius}
        fill="none"
        stroke={paint.track}
        strokeOpacity={paint.trackOpacity}
        strokeWidth={RING.stroke * paint.trackWeight}
      />
      {/* Two-thirds committed, one-third still available: from 12 o'clock, clockwise. */}
      <circle
        cx={box.ringCx}
        cy={box.ringCy}
        r={RING.radius}
        fill="none"
        stroke={paint.arc}
        strokeWidth={RING.stroke}
        strokeLinecap="round"
        strokeDasharray={`${(CIRCUMFERENCE * 2) / 3} ${CIRCUMFERENCE}`}
        transform={`rotate(-90 ${box.ringCx} ${box.ringCy})`}
      />
      {"wordX" in box ? (
        <path transform={`translate(${box.wordX} ${box.wordY})`} fill={paint.word} d={WORDMARK_PATH} />
      ) : null}
    </svg>
  );
}

function round(value: number) {
  return Math.round(value * 100) / 100;
}
