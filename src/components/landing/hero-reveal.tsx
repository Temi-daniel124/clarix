import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * The staggered hero entrance — the one piece of choreography kept from the marketing hero
 * component this page adapts (docs/planning/clarix-design-system.md § 4: keep the
 * choreography, replace the content entirely).
 *
 * Deliberately CSS rather than Motion, and deliberately not a client component. When this was
 * a Motion component the headline was server-rendered at opacity 0 and only became visible once
 * React hydrated — on the deployed build that left the landing page blank below the nav for
 * several seconds, and it made the page's entire message depend on JavaScript running. A CSS
 * animation plays without hydration, and the element's resting state is visible, so if
 * animations never run at all the content is simply there.
 *
 * DESIGN_SYSTEM.md § Motion asks for a 180–240ms fade plus a small shift here, explicitly with
 * no spring, so nothing is lost by not using the animation library for it.
 *
 * The blueprint is clear that the landing page has no scroll-triggered animation beyond the
 * looping preview, so nothing further down the page moves on its own.
 */
export function HeroReveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  /** Seconds, to match the Motion transition vocabulary used elsewhere. */
  delay?: number;
  className?: string;
}) {
  return (
    <div
      className={cn("hero-reveal", className)}
      style={delay ? { animationDelay: `${delay}s` } : undefined}
    >
      {children}
    </div>
  );
}
