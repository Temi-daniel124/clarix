import type { Metadata } from "next";
import { Receipt } from "lucide-react";
import { ComingLater } from "@/components/app-shell/coming-later";

export const metadata: Metadata = { title: "Loans" };

/**
 * Loans (blueprint Part 6) — built in a later block of the cooperative admin blueprint.
 *
 * It says what will be here and does not imitate it, which is the same standard the employee
 * shell held itself to while its own later parts were outstanding.
 */
export default function Page() {
  return (
    <ComingLater
      icon={Receipt}
      title="Loans"
      body="Applications waiting on a decision, each with the same eligibility picture the member saw when they applied, and every loan already running."
    />
  );
}
