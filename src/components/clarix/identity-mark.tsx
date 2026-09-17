import { UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The person's mark on the dashboard: their initial on a tinted plate, or a neutral icon when
 * Clarix does not know their name yet.
 *
 * Not a photo, and deliberately not a stock avatar. DESIGN_SYSTEM.md's anti-generic checklist
 * rules out stock imagery outright and that is a locked decision (DECISIONS.md D017), so this is
 * built from something the product actually knows about the person instead.
 *
 * The tint is chosen deterministically from the name, so the same person always gets the same
 * colour and it never looks randomly assigned between visits. It picks only from the Clarix
 * palette, emerald, indigo, navy, because no other hue enters the product, not even here.
 */

const TINTS = [
  "var(--clarix-brand-accent)",
  "var(--clarix-brand-secondary)",
  "var(--clarix-brand-primary)",
] as const;

export function IdentityMark({ name, className }: { name: string | null; className?: string }) {
  const initial = name?.trim().charAt(0).toUpperCase() ?? "";
  const tint = TINTS[hashToIndex(name ?? "", TINTS.length)];

  return (
    <span
      aria-hidden
      className={cn(
        "flex size-12 items-center justify-center rounded-feature border",
        className,
      )}
      style={{
        backgroundColor: `color-mix(in srgb, ${tint} 14%, transparent)`,
        borderColor: `color-mix(in srgb, ${tint} 28%, transparent)`,
        color: tint,
      }}
    >
      {initial ? (
        <span className="type-section font-semibold leading-none">{initial}</span>
      ) : (
        <UserRound className="size-5" strokeWidth={1.75} />
      )}
    </span>
  );
}

/** Small stable hash, so a given name always lands on the same tint. */
function hashToIndex(value: string, buckets: number): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) % 1_000_003;
  }
  return hash % buckets;
}
