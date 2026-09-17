import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PlatformAdmins } from "@/components/platform/platform-admins";
import { loadPlatformAdmins } from "@/lib/supabase/platform-admin-data";
import { loadStaffContext } from "@/lib/supabase/staff-context";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Platform admins" };

/**
 * Manage Platform Admins (super-admin blueprint 8.1).
 *
 * `platform_admins` held one policy, read your own row, and no insert, update or delete, which
 * was correct while the first account was seeded by hand and is what this screen needed a way
 * around. Migration 023 adds three narrow functions rather than a general write policy, so the
 * only things that can happen to this table are the two things this screen does.
 */
export default async function PlatformAdminsPage() {
  const [staff, admins] = await Promise.all([loadStaffContext(), loadPlatformAdmins()]);
  if (!staff) redirect("/login");

  return (
    <div className="mx-auto w-full max-w-[760px] px-5 py-8 md:px-8 md:py-10">
      <h1 className="type-page-title text-text">Platform admins</h1>
      <p className="type-body mt-3 max-w-[560px] text-text-secondary">
        Everyone who can operate Clarix itself. This is not a cooperative role: it belongs to no
        cooperative, and it carries no sight of anybody&rsquo;s savings or loans.
      </p>

      <div className="mt-10">
        <PlatformAdmins admins={admins} currentUserId={staff.userId} />
      </div>
    </div>
  );
}
