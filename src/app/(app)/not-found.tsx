import type { Metadata } from "next";
import { NotFoundPage } from "@/components/clarix/not-found-page";

export const metadata: Metadata = { title: "Page not found", robots: { index: false } };

/** A member screen that does not exist, such as a loan that is not theirs (BUILD-PLAN 1.5). */
export default function NotFound() {
  return <NotFoundPage home="/dashboard" />;
}
