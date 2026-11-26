"use client";

import { RouteError } from "@/components/clarix/route-error";

/**
 * A screen in this shell, or the data behind it, failed to load (BUILD-PLAN 1.5). It renders inside
 * the shell's layout, so the sidebar and tab bar stay and the person keeps their place.
 */
export default function Error(props: { error: Error & { digest?: string }; retry: () => void }) {
  return <RouteError {...props} />;
}
