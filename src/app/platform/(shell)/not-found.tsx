import type { Metadata } from "next";
import { NotFoundPage } from "@/components/clarix/not-found-page";

export const metadata: Metadata = { title: "Page not found", robots: { index: false } };

/** A platform screen that does not exist, inside the platform shell (BUILD-PLAN 1.5). */
export default function NotFound() {
  return <NotFoundPage home="/platform" />;
}
