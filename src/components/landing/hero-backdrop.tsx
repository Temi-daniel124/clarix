/**
 * The hero's background.
 *
 * hero-32 ships a full-bleed photograph of sunflowers. A stock photo is explicitly on
 * DESIGN_SYSTEM.md's avoid list, and so is the obvious replacement — an overlapping-blob
 * gradient. This is built instead from the two things the product already owns: the navy ground,
 * and the meter arc that is its signature motif.
 *
 * Three layers, all static, none of them decoration for its own sake:
 *   1. A ruled grid, the density of a ledger, at very low contrast. It reads as accounting
 *      paper rather than as a "tech" grid because the lines are horizontal-dominant.
 *   2. One oversized capacity arc bleeding off the right edge — the same two-thirds-committed
 *      geometry as the wordmark and the app icon, drawn large enough to be texture rather than
 *      illustration.
 *   3. A single soft emerald wash behind the arc, kept under 10% so it lifts the corner without
 *      becoming a glow effect.
 *
 * Rendered as inline SVG rather than an image file so it costs no request, scales at any
 * viewport, and stays on the exact token colours.
 */
export function HeroBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Emerald wash, top-right. */}
      <div
        className="absolute -top-[20%] -right-[10%] h-[70%] w-[60%] rounded-full opacity-[0.09] blur-3xl"
        style={{ backgroundColor: "#16A57A" }}
      />

      {/* Ledger rules. */}
      <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
        <defs>
          <pattern id="clarix-rules" width="100%" height="56" patternUnits="userSpaceOnUse">
            <line x1="0" y1="55.5" x2="100%" y2="55.5" stroke="#FFFFFF" strokeOpacity="0.035" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#clarix-rules)" />
      </svg>

      {/* The capacity arc, oversized and bleeding off the right edge. */}
      <svg
        className="absolute top-1/2 -right-[14%] h-[150%] -translate-y-1/2 opacity-[0.07] md:-right-[6%]"
        viewBox="0 0 400 400"
        fill="none"
      >
        <circle cx="200" cy="200" r="170" stroke="#FFFFFF" strokeOpacity="0.5" strokeWidth="26" />
        <circle
          cx="200"
          cy="200"
          r="170"
          stroke="#16A57A"
          strokeWidth="26"
          strokeLinecap="round"
          strokeDasharray={`${2 * Math.PI * 170 * 0.667} ${2 * Math.PI * 170}`}
          transform="rotate(-90 200 200)"
        />
      </svg>

      {/* Fade the whole backdrop out towards the bottom so the sections below start clean. */}
      <div
        className="absolute inset-x-0 bottom-0 h-32"
        style={{ background: "linear-gradient(to bottom, transparent, #0B1220)" }}
      />
    </div>
  );
}
