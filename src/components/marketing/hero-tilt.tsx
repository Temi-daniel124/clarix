"use client";

import type { ReactNode } from "react";
import {
  motion,
  useScroll,
  useSpring,
  useTransform,
  type SpringOptions,
} from "motion/react";
import { springStandard } from "@/lib/motion";
import { usePrefersReducedMotion } from "./use-hydrated-preferences";

/** The one standard spring, as the options useSpring takes, so the plane settles like the rest. */
const settle = springStandard as SpringOptions;

/**
 * The hero composition's 3D plane (spec §7, landing scroll): it starts leaning back at 14° and
 * 94% scale and settles flat and full size as the page scrolls, on the one standard spring.
 *
 * The range is the first {@link TILT_RANGE_PX} pixels of page scroll rather than the frame's own
 * scroll progress. The hero is in view at load on desktop, so any element-relative range either
 * started past its end (already flat before anyone scrolled) or, anchored to the frame reaching
 * the top, left the frame tilted the whole time a phone visitor was looking at it. Tied to the
 * page, it flattens over the same first scroll everywhere: on desktop as the hero moves up, on
 * a phone as the frame comes up from under the copy.
 *
 * Transform only, so the tilt never shifts layout. Under reduced motion it renders flat and
 * still: the motion values are not attached, and a CSS guard covers the server-rendered frame
 * before hydration knows the preference.
 */
export const TILT_RANGE_PX = 400;

export function HeroTilt({ children }: { children: ReactNode }) {
  const reducedMotion = usePrefersReducedMotion();
  const { scrollY } = useScroll();
  const rotateX = useSpring(
    useTransform(scrollY, [0, TILT_RANGE_PX], [14, 0]),
    settle,
  );
  const scale = useSpring(
    useTransform(scrollY, [0, TILT_RANGE_PX], [0.94, 1]),
    settle,
  );

  // The same tree either way, so the preference resolving after hydration never remounts it.
  return (
    <div className="relative [perspective:1400px]">
      <motion.div
        style={reducedMotion ? undefined : { rotateX, scale }}
        // Pivot on the top edge on a phone, so the photo's top stays where the layout put it
        // and shows above the fold; on desktop, the bottom edge, so the top leans back.
        className="origin-top motion-reduce:transform-none! lg:origin-bottom"
      >
        {children}
      </motion.div>
    </div>
  );
}
