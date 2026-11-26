"use client";

import "./globals.css";
import { figtree } from "./fonts";
import { RouteError } from "@/components/clarix/route-error";

/**
 * The last resort (BUILD-PLAN 1.5): the root layout itself failed. Next renders this in place of
 * the whole document, without the global styles or the font, so it brings both and draws the same
 * page as every other error, light theme only (D037).
 */
export default function GlobalError(props: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <html lang="en">
      <body className={`${figtree.variable} flex min-h-dvh flex-col bg-canvas font-sans text-ink-900`}>
        <RouteError {...props} />
      </body>
    </html>
  );
}
