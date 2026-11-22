"use client";

import { useSyncExternalStore } from "react";

/**
 * Client-only facts read without a hydration mismatch.
 *
 * motion's useReducedMotion answers from matchMedia on the very first client render, so a
 * component that renders differently under reduced motion disagrees with the server's HTML.
 * Both hooks here hydrate with the server's answer (false) and switch on the next render. The
 * markup therefore matches, and the `motion-reduce:` CSS covers the first paint.
 */

const REDUCE_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeReduced(onChange: () => void) {
  const query = window.matchMedia(REDUCE_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeReduced,
    () => window.matchMedia(REDUCE_QUERY).matches,
    () => false,
  );
}

const noopSubscribe = () => () => {};

/** False in the server render and during hydration, true from the first client re-render. */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}
