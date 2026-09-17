import type { Metadata } from "next";
import { AccessRequests } from "@/components/platform/access-requests";
import {
  loadAccessGrants,
  loadCooperativeChoices,
} from "@/lib/supabase/access-grants-data";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Access requests" };

/**
 * Access Requests (super-admin blueprint 7.2).
 *
 * The one deliberate exception to this role having no sight of member data, and the screen is
 * built to make the exception itself the visible thing: every request ever made stays listed,
 * including the ones that lapsed and the ones ended early, with the reason that was given still
 * attached. A record of exceptions you can prune is not a record.
 */
export default async function AccessRequestsPage() {
  const [grants, cooperatives] = await Promise.all([
    loadAccessGrants(),
    loadCooperativeChoices(),
  ]);

  return (
    <div className="mx-auto w-full max-w-[860px] px-5 py-8 md:px-8 md:py-10">
      <h1 className="type-page-title text-text">Access requests</h1>
      <p className="type-body mt-3 max-w-[600px] text-text-secondary">
        This account cannot see any member&rsquo;s savings, loans or salary. When a support case
        genuinely needs it, this is the only way in: a written reason, the cooperative told before
        it starts, a day at most, read-only, and every record opened written into that
        cooperative&rsquo;s own audit log.
      </p>

      <div className="mt-10">
        <AccessRequests grants={grants} cooperatives={cooperatives} />
      </div>
    </div>
  );
}
