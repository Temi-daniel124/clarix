import type { Metadata } from "next";
import { ScrollText } from "lucide-react";
import { ComingLater } from "@/components/app-shell/coming-later";

export const metadata: Metadata = { title: "Audit log" };

/** Platform Audit Log (blueprint 7.1) — built in a later block of this role. */
export default function Page() {
  return (
    <ComingLater
      icon={ScrollText}
      title="Audit log"
      body="Platform-level events: cooperatives created and deactivated, policy changed, access requested and granted. Nothing writes a platform event yet, so this would be an empty table rather than a record — the home screen's activity strip shows what the platform does know about itself in the meantime."
    />
  );
}
