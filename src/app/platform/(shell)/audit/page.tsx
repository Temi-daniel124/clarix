import type { Metadata } from "next";
import { PlatformAuditTable } from "@/components/platform/platform-audit-table";
import { loadPlatformAuditLog } from "@/lib/supabase/platform-admin-data";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Audit log" };

/**
 * Platform Audit Log (super-admin blueprint 7.1).
 *
 * Buildable ahead of the rest of Part 7 because it depends on nothing Part 7 introduces:
 * `audit_log.cooperative_id` has been nullable since migration 014, so a platform event was
 * always storable. What was missing was a policy that could read one and a function that could
 * write one, both added in migration 023.
 *
 * Access requests will write into this same log once they exist. Until then the log carries the
 * events that do happen rather than pretending to watch for ones that cannot.
 */
export default async function PlatformAuditPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string; from?: string; to?: string; query?: string }>;
}) {
  const filters = await searchParams;
  const events = await loadPlatformAuditLog(filters);

  return (
    <div className="mx-auto w-full max-w-[900px] px-5 py-8 md:px-8 md:py-10">
      <h1 className="type-page-title text-text">Audit log</h1>
      <p className="type-body mt-3 max-w-[560px] text-text-secondary">
        What has been done to the platform, and by whom. A cooperative&rsquo;s own record of what
        its staff did to its members is separate, belongs to that cooperative&rsquo;s admin, and
        is not readable from here.
      </p>

      <div className="mt-8">
        <PlatformAuditTable events={events} filters={filters} />
      </div>
    </div>
  );
}
