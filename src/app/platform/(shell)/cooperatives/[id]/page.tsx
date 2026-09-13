import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CooperativeDetail } from "@/components/platform/cooperative-detail";
import { loadCooperativeDirectory } from "@/lib/supabase/platform-data";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Cooperative" };

/**
 * Cooperative Detail — super-admin blueprint 5.2.
 *
 * Reads the same directory function the list does and picks one row, rather than adding a second
 * elevated function for a single record. The function is already scoped to platform admins and
 * already returns exactly what both screens are allowed to show, so a by-id variant would be a
 * second place for that boundary to be defined.
 */
export default async function CooperativePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const entries = await loadCooperativeDirectory();
  const entry = entries.find((candidate) => candidate.id === id);

  if (!entry) redirect("/platform/cooperatives");

  return (
    <div className="mx-auto w-full max-w-[760px] px-5 py-8 md:px-8 md:py-10">
      <CooperativeDetail entry={entry} />
    </div>
  );
}
