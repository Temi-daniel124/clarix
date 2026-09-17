import { cn } from "@/lib/utils";

/**
 * The Clarix wordmark: the signature capacity meter, curled into a ring, sitting beside the
 * name. Deliberately the same idea as the meter on every screen: the mark is the motif, not
 * a separate piece of branding (DESIGN_SYSTEM.md § The signature motif).
 */
export function Wordmark({
  className,
  tone = "default",
}: {
  className?: string;
  /** "onDark" for the navy header and the auth panel. */
  tone?: "default" | "onDark";
}) {
  const nameColor = tone === "onDark" ? "text-white" : "text-text";
  const trackColor = tone === "onDark" ? "rgba(255,255,255,0.22)" : "var(--clarix-border)";

  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <MeterRing trackColor={trackColor} />
      <span
        className={cn(
          "text-[19px] font-semibold tracking-[-0.02em] leading-none",
          nameColor,
        )}
      >
        Clarix
      </span>
    </span>
  );
}

function MeterRing({ trackColor }: { trackColor: string }) {
  const radius = 9;
  const circumference = 2 * Math.PI * radius;
  // Two-thirds committed, one-third still available: the same relationship the app measures.
  const filled = circumference * 0.667;

  return (
    <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden focusable="false">
      <circle cx="11" cy="11" r={radius} fill="none" stroke={trackColor} strokeWidth="3" />
      <circle
        cx="11"
        cy="11"
        r={radius}
        fill="none"
        stroke="var(--clarix-brand-accent)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray={`${filled} ${circumference}`}
        transform="rotate(-90 11 11)"
      />
    </svg>
  );
}
