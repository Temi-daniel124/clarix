"use client";

import { RouteError } from "@/components/clarix/route-error";

/** A public page that failed to render (BUILD-PLAN 1.5). Signed-in shells have their own. */
export default function Error(props: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <main className="flex min-h-app flex-1 flex-col bg-canvas">
      <RouteError {...props} />
    </main>
  );
}
