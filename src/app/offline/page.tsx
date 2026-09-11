import type { Metadata } from "next";
import { CloudOff } from "lucide-react";
import { Wordmark } from "@/components/clarix/wordmark";

export const metadata: Metadata = {
  title: "No connection",
  description: "Clarix needs a connection to show you current figures.",
};

/**
 * Offline fallback served by the service worker when a navigation cannot reach the network.
 *
 * It deliberately shows no figures at all. Clarix's whole promise is telling the truth about a
 * number; a cached balance from an unknown point in the past would undermine that more than an
 * honest blank screen does (see the note at the top of public/sw.js).
 */
export default function OfflinePage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-5 py-16 text-center">
      <Wordmark />

      <span
        aria-hidden
        className="mt-10 flex size-12 items-center justify-center rounded-card border border-border text-text-muted"
      >
        <CloudOff className="size-6" strokeWidth={1.75} />
      </span>

      <h1 className="type-page-title mt-6 text-text">You are offline</h1>

      <p className="type-body mt-3 max-w-[420px] text-text-secondary">
        Clarix will not show you a figure it cannot confirm is current. Reconnect and this page
        will load your real numbers straight away.
      </p>
    </main>
  );
}
