import type { Metadata } from "next";
import { SlidersHorizontal } from "lucide-react";
import { ComingLater } from "@/components/app-shell/coming-later";

export const metadata: Metadata = { title: "Policy" };

/** Organization-Wide Policy Settings (blueprint 6.1) — built in a later block of this role. */
export default function Page() {
  return (
    <ComingLater
      icon={SlidersHorizontal}
      title="Policy"
      body="The deduction basis, the cap, the staff ID format and the reservation-expiry default that every cooperative at FMC Abeokuta inherits. The values are live in the database and already shape every eligibility figure in Clarix; the screen that edits them is the next part of this role."
    />
  );
}
