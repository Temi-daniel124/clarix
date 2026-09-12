import type { Metadata } from "next";
import { Users } from "lucide-react";
import { ComingLater } from "@/components/app-shell/coming-later";

export const metadata: Metadata = { title: "Members" };

/**
 * Members (blueprint Part 5) — built in a later block of the cooperative admin blueprint.
 *
 * It says what will be here and does not imitate it, which is the same standard the employee
 * shell held itself to while its own later parts were outstanding.
 */
export default function Page() {
  return (
    <ComingLater
      icon={Users}
      title="Members"
      body="Search your roster, open a member's record, record a contribution or a repayment, and add somebody who is not in the import yet."
    />
  );
}
