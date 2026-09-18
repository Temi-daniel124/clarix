"use client";

import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

/**
 * The app's loading state: the signature meter, curled into a ring, filling.
 *
 * DESIGN_SYSTEM.md names this directly under the signature motif, alongside the dashboard meter
 * and the rolling figures: "The app's own splash/loading state, as a small ring filling." So this
 * is not a new pattern being introduced for the loading boundaries, it is the one the design
 * system already specified and the product had not yet built. The geometry is deliberately the
 * same as the wordmark's ring, because they are the same mark at different sizes.
 *
 * It fills rather than spins. A spinner says "something is happening"; a meter filling says the
 * same thing in this product's own vocabulary, which is the whole reason the motif exists.
 *
 * Under `prefers-reduced-motion` the ring is drawn at rest, two thirds filled, exactly as the
 * wordmark draws it. DESIGN_SYSTEM.md requires every motion in the product to have that fallback.
 */
export function LoadingRing({
  size = 44,
  className,
  label = "Loading",
}: {
  size?: number;
  className?: string;
  /** Announced to assistive technology. The ring itself is decorative. */
  label?: string;
}) {
  const reduceMotion = useReducedMotion();

  // The wordmark's proportions: a radius of 9 inside a 22 box, stroke 3. Scaling the viewBox
  // rather than the numbers keeps the ring identical in shape at any size.
  const radius = 9;
  const circumference = 2 * Math.PI * radius;
  const restingFill = circumference * 0.667;

  return (
    <span role="status" aria-live="polite" className={cn("inline-flex", className)}>
      <span className="sr-only">{label}</span>

      <svg
        width={size}
        height={size}
        viewBox="0 0 22 22"
        aria-hidden
        focusable="false"
      >
        <circle
          cx="11"
          cy="11"
          r={radius}
          fill="none"
          stroke="var(--clarix-border)"
          strokeWidth="3"
        />

        <motion.circle
          cx="11"
          cy="11"
          r={radius}
          fill="none"
          stroke="var(--clarix-brand-accent)"
          strokeWidth="3"
          strokeLinecap="round"
          transform="rotate(-90 11 11)"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: reduceMotion ? circumference - restingFill : circumference }}
          animate={
            reduceMotion
              ? { strokeDashoffset: circumference - restingFill }
              : {
                  strokeDashoffset: [
                    circumference,
                    circumference * 0.25,
                    circumference * 0.25,
                    circumference,
                  ],
                }
          }
          transition={
            reduceMotion
              ? { duration: 0 }
              : { duration: 1.6, times: [0, 0.45, 0.65, 1], repeat: Infinity, ease: "easeInOut" }
          }
        />
      </svg>
    </span>
  );
}

/**
 * The shape every `loading.tsx` renders: the ring, centred in the content area the finished
 * screen will occupy.
 *
 * Deliberately not a skeleton. A skeleton guesses at the shape of what is coming and is wrong
 * the moment a screen changes; this says "working" honestly and gets out of the way. It also
 * means nothing about a loaded screen is described in two places.
 */
export function LoadingScreen({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex min-h-[60vh] w-full items-center justify-center px-5 py-16">
      <LoadingRing label={label} />
    </div>
  );
}
