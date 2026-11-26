import type { Metadata } from "next";
import { NotFoundPage } from "@/components/clarix/not-found-page";

export const metadata: Metadata = { title: "Page not found", robots: { index: false } };

/** A cooperative screen that does not exist, inside the staff shell (BUILD-PLAN 1.5). */
export default function NotFound() {
  return <NotFoundPage home="/admin" />;
}
