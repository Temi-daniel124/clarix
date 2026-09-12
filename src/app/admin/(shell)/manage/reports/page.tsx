import type { Metadata } from "next";
import { FileSpreadsheet } from "lucide-react";
import { ComingLater } from "@/components/app-shell/coming-later";

export const metadata: Metadata = { title: "Reports" };

/**
 * Reports (blueprint 7.6) — built in a later block of the cooperative admin blueprint.
 *
 * It says what will be here and does not imitate it, which is the same standard the employee
 * shell held itself to while its own later parts were outstanding.
 */
export default function Page() {
  return (
    <ComingLater
      icon={FileSpreadsheet}
      title="Reports"
      body="Savings, loans and deductions for a period you choose, in a form you can hand to your committee or your auditor."
    />
  );
}
