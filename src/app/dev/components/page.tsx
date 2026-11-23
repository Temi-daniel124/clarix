import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { sharesLiveDataOutsideProduction } from "@/lib/environment";
import { ComponentGallery } from "./component-gallery";

export const metadata: Metadata = {
  title: "Components",
  robots: { index: false, follow: false },
};

/**
 * Every house control in every state, for design review (BUILD-PLAN 1.2). Preview and local only:
 * on Production this route does not exist.
 */
export default function ComponentsPage() {
  if (!sharesLiveDataOutsideProduction()) notFound();
  return <ComponentGallery />;
}
