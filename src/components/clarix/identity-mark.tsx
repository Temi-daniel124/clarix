import { UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The person's avatar (not the logo): their initials on `emerald-100` in `emerald-700`, the same
 * avatar the app shell draws (DESIGN_SYSTEM.md §5.5), or a neutral person icon when Clarix does not
 * know their name yet. Never a photo or a stock avatar (D017), and one colour for everyone.
 */
export function IdentityMark({ name, className }: { name: string | null; className?: string }) {
  const initials = initialsFor(name);

  return (
    <span
      aria-hidden
      className={cn(
        "flex size-12 items-center justify-center rounded-pill bg-emerald-100 text-emerald-700",
        className,
      )}
    >
      {initials ? (
        <span className="type-heading leading-none">{initials}</span>
      ) : (
        <UserRound className="size-5" strokeWidth={1.75} />
      )}
    </span>
  );
}

/** "Funmilayo Adeyemi" → "FA"; a first name alone → its first letter. */
function initialsFor(name: string | null): string {
  const parts = name?.trim().split(/\s+/).filter(Boolean) ?? [];
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return parts[0]?.[0]?.toUpperCase() ?? "";
}
