import { Logo } from "@/components/brand/logo";

/**
 * The everyday Clarix lockup: `Logo variant="horizontal"` (src/components/brand/logo.tsx).
 * Kept so every existing `Wordmark` import keeps working. `tone="onDark"` is for the indigo
 * panels that remain until later plans restyle them light (D033); it draws the one-colour
 * white logo.
 */
export function Wordmark({
  className,
  tone = "default",
}: {
  className?: string;
  tone?: "default" | "onDark";
}) {
  return (
    <Logo variant="horizontal" tone={tone === "onDark" ? "white" : "color"} className={className} />
  );
}

export { Logo };
