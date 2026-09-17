import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { MemberProfileView } from "@/components/admin/member-profile";
import { ElevatedAccessBanner } from "@/components/platform/elevated-access-banner";
import { loadLiveGrant } from "@/lib/supabase/access-grants-data";
import { loadMemberProfile } from "@/lib/supabase/admin-members";
import { logElevatedViewAction } from "@/app/platform/access-actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Temporary access" };

/**
 * Elevated Access View — super-admin blueprint 7.3.
 *
 * Three things make this screen what the blueprint asks for, and each is worth naming.
 *
 * **It is the real Member Profile, not a copy.** `MemberProfileView` is the same component an
 * admin and an officer see, over `loadMemberProfile()`, the same loader. That is deliberate: the
 * blueprint asks for "real, correctly-rendered data", and a second read-only rendering of a member
 * would drift from the real one and quietly start showing something subtly different from what the
 * cooperative sees. `canRecord` is false, which removes the two write actions — but that is the
 * cosmetic half. The database has no insert or update policy for a grant holder anywhere, so the
 * writes are refused whether or not a button was ever rendered.
 *
 * **It stops the moment the grant lapses.** `loadLiveGrant()` returns null for anything that is
 * not active at this instant — pending, expired or revoked are indistinguishable from never having
 * existed — and this page redirects. That check runs on every request, and the banner's countdown
 * navigates away on its own when it reaches zero, so neither a stale tab nor a paused clock leaves
 * member data on screen.
 *
 * **Opening it is recorded.** The view logs itself as it renders, into the audit log of the
 * cooperative whose data this is, where that cooperative's admin reads it. Blueprint 7.3 asks for
 * "every screen view and specific record opened" to be logged individually "precisely because this
 * is the one place financial detail crosses this role's boundary".
 */
export default async function ElevatedAccessPage({
  params,
}: {
  params: Promise<{ grantId: string; membershipId: string }>;
}) {
  const { grantId, membershipId } = await params;

  const grant = await loadLiveGrant(grantId);
  if (!grant) redirect("/platform/access-requests");

  const profile = await loadMemberProfile(membershipId);

  // RLS returns nothing for a membership this grant does not cover, so this catches both "no such
  // member" and "not what you were granted" without the screen having to tell them apart.
  if (!profile) redirect("/platform/access-requests");

  await logElevatedViewAction(
    grant.id,
    "cooperative_memberships",
    membershipId,
    `Opened ${profile.name ?? "a member"}'s profile`,
  );

  return (
    <>
      <ElevatedAccessBanner grant={grant} />

      <div className="mx-auto w-full max-w-[860px] px-5 py-8 md:px-8 md:py-10">
        <MemberProfileView profile={profile} canRecord={false} />
      </div>
    </>
  );
}
