import type { Metadata } from "next";
import { Settings2 } from "lucide-react";
import { ComingLater } from "@/components/app-shell/coming-later";

export const metadata: Metadata = { title: "Profile" };

/**
 * Profile and settings (blueprint 8.2) — built in a later block of the cooperative admin blueprint.
 *
 * It says what will be here and does not imitate it, which is the same standard the employee
 * shell held itself to while its own later parts were outstanding.
 */
export default function Page() {
  return (
    <ComingLater
      icon={Settings2}
      title="Profile"
      body="Your own name, contact details and password, separate from anything about the cooperative itself."
    />
  );
}
