import type { Metadata } from "next";
import { Bell } from "lucide-react";
import { ComingLater } from "@/components/app-shell/coming-later";

export const metadata: Metadata = { title: "Notifications" };

/**
 * Notifications (blueprint 8.1) — built in a later block of the cooperative admin blueprint.
 *
 * It says what will be here and does not imitate it, which is the same standard the employee
 * shell held itself to while its own later parts were outstanding.
 */
export default function Page() {
  return (
    <ComingLater
      icon={Bell}
      title="Notifications"
      body="New applications, decisions recorded by your officers, and anything a member changed that affects what you are owed."
    />
  );
}
