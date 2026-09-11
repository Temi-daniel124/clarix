import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { loadDiscoveryCards } from "@/lib/supabase/cooperative-discovery";
import { DiscoveryGrid } from "./discovery-grid";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Discover cooperatives" };

/**
 * Discovery — blueprint 4.3. The browsing layer for cooperatives not yet joined.
 */
export default async function DiscoverPage() {
  const cards = await loadDiscoveryCards();
  if (!cards) redirect("/login");

  return <DiscoveryGrid cards={cards} />;
}
