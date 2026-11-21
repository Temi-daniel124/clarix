import { BRAND_COLORS, BRAND_TAGLINE, RING, ringArc } from "@/lib/brand";
import { cn } from "@/lib/utils";

/**
 * The Clarix logo family, from the round-1 Adire brand sheet: the signature capacity meter
 * curled into a ring (two-thirds committed, one-third still available) beside the name. The
 * mark is the motif, not a separate piece of branding (DESIGN_SYSTEM.md § The signature motif).
 *
 * - primary: ring, name and tagline (website header, proposals, the AGM deck).
 * - horizontal: ring and name, the everyday lockup (navigation, headers).
 * - stacked: ring above the name (narrow sidebars, cards, email signatures).
 * - mark: the ring alone.
 * - stamp: the dye-stamp submark (avatars, stickers, the document watermark).
 *
 * Tones: `color` draws a #DCE0F2 track under an indigo-600 arc with an indigo-night name;
 * `black` and `white` are one-colour versions that drop the track and draw only the arc.
 * The stamp is always the indigo-600 square with an emerald arc, whatever the tone.
 *
 * `size` is the ring's diameter in pixels (the whole square for the stamp); the name and the
 * tagline scale from it in the brand sheet's proportions.
 */
export type LogoVariant = "primary" | "horizontal" | "stacked" | "mark" | "stamp";
export type LogoTone = "color" | "black" | "white";

const DEFAULT_SIZE: Record<LogoVariant, number> = {
  primary: 62,
  horizontal: 22,
  stacked: 54,
  mark: 22,
  stamp: 40,
};

const NAME_CLASS: Record<LogoTone, string> = {
  color: "text-indigo-night",
  black: "text-ink",
  white: "text-white",
};

const TAGLINE_CLASS: Record<LogoTone, string> = {
  color: "text-ink-2",
  black: "text-ink",
  white: "text-white",
};

const ARC_COLOR: Record<LogoTone, string> = {
  color: BRAND_COLORS.indigo600,
  black: BRAND_COLORS.ink,
  white: BRAND_COLORS.white,
};

export function Logo({
  variant = "horizontal",
  tone = "color",
  size,
  className,
}: {
  variant?: LogoVariant;
  tone?: LogoTone;
  size?: number;
  className?: string;
}) {
  const px = size ?? DEFAULT_SIZE[variant];

  if (variant === "stamp") return <Stamp size={px} className={className} />;
  if (variant === "mark") {
    return <Ring size={px} tone={tone} className={className} label="Clarix" />;
  }

  // The brand sheet's proportions, expressed against the ring's diameter.
  const layout = {
    primary: { name: 0.94, gap: 0.29, direction: "row" },
    horizontal: { name: 0.88, gap: 0.3, direction: "row" },
    stacked: { name: 0.6, gap: 0.185, direction: "column" },
  }[variant];

  const name = (
    <span
      className={cn(
        "font-display font-extrabold tracking-[-0.035em] whitespace-nowrap",
        NAME_CLASS[tone],
      )}
      style={{ fontSize: px * layout.name, lineHeight: variant === "primary" ? 0.95 : 1 }}
    >
      Clarix
    </span>
  );

  return (
    <span
      role="img"
      aria-label={variant === "primary" ? `Clarix, ${BRAND_TAGLINE}` : "Clarix"}
      className={cn(
        "inline-flex shrink-0 items-center",
        layout.direction === "column" && "flex-col",
        className,
      )}
      style={{ gap: px * layout.gap }}
    >
      <Ring size={px} tone={tone} />
      {variant === "primary" ? (
        <span className="flex flex-col">
          {name}
          <span
            className={cn("font-sans font-medium whitespace-nowrap", TAGLINE_CLASS[tone])}
            style={{ fontSize: px * 0.226, lineHeight: 1.3, marginTop: px * 0.097 }}
          >
            {BRAND_TAGLINE}
          </span>
        </span>
      ) : (
        name
      )}
    </span>
  );
}

function Ring({
  size,
  tone,
  className,
  label,
}: {
  size: number;
  tone: LogoTone;
  className?: string;
  /** Present only when the ring stands alone and so must name itself. */
  label?: string;
}) {
  const c = RING.box / 2;
  const { dash, gap } = ringArc(RING.radius);
  const a11y = label
    ? ({ role: "img", "aria-label": label } as const)
    : ({ "aria-hidden": true, focusable: "false" } as const);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${RING.box} ${RING.box}`}
      className={cn("shrink-0", className)}
      {...a11y}
    >
      {tone === "color" ? (
        <circle
          cx={c}
          cy={c}
          r={RING.radius}
          fill="none"
          stroke={BRAND_COLORS.track}
          strokeWidth={RING.stroke}
        />
      ) : null}
      <circle
        cx={c}
        cy={c}
        r={RING.radius}
        fill="none"
        stroke={ARC_COLOR[tone]}
        strokeWidth={RING.stroke}
        strokeLinecap="round"
        strokeDasharray={`${dash} ${gap}`}
        transform={`rotate(-90 ${c} ${c})`}
      />
    </svg>
  );
}

/** The dye-stamp submark, drawn on the brand sheet's 148-unit grid. */
function Stamp({ size, className }: { size: number; className?: string }) {
  const { dash, gap } = ringArc(28);
  const faint = "rgba(255,255,255,0.22)";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 148 148"
      role="img"
      aria-label="Clarix"
      className={cn("shrink-0", className)}
    >
      <rect x="4" y="4" width="140" height="140" rx="34" fill={BRAND_COLORS.indigo600} />
      <g fill="none" strokeWidth="2" stroke={faint}>
        <circle cx="30" cy="30" r="9" />
        <circle cx="118" cy="30" r="9" />
        <circle cx="30" cy="118" r="9" />
        <circle cx="118" cy="118" r="9" />
        <circle cx="74" cy="74" r="50" />
      </g>
      <circle cx="74" cy="74" r="28" fill="none" strokeWidth="10" stroke={faint} />
      <circle
        cx="74"
        cy="74"
        r="28"
        fill="none"
        stroke={BRAND_COLORS.emerald500}
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={`${dash} ${gap}`}
        transform="rotate(-90 74 74)"
      />
    </svg>
  );
}
