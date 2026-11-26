import type { Metadata } from "next";
import { NotFoundPage } from "@/components/clarix/not-found-page";

export const metadata: Metadata = { title: "Page not found", robots: { index: false } };

/**
 * Any URL Clarix does not have (BUILD-PLAN 1.5), in place of Next's default black 404, which ignored
 * the light theme (D037). Inside the admin and platform consoles a page of their own keeps the
 * shell; everywhere else this one, with the way back to the start.
 */
export default function NotFound() {
  return (
    <main className="flex min-h-app flex-1 flex-col bg-canvas">
      <NotFoundPage home="/" homeLabel="Go to Clarix" />
    </main>
  );
}
