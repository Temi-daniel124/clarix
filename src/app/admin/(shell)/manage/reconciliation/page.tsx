import type { Metadata } from "next";
import { Landmark } from "lucide-react";
import { ComingLater } from "@/components/app-shell/coming-later";

export const metadata: Metadata = { title: "Reconciliation" };

/**
 * Monthly Reconciliation (blueprint 7.5) — built in a later block of the cooperative admin blueprint.
 *
 * It says what will be here and does not imitate it, which is the same standard the employee
 * shell held itself to while its own later parts were outstanding.
 */
export default function Page() {
  return (
    <ComingLater
      icon={Landmark}
      title="Reconciliation"
      body="Enter what payroll actually deducted this month against what Clarix expected, so a shortfall is visible the month it happens rather than a year later."
    />
  );
}
