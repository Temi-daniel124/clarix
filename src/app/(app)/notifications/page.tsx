import type { Metadata } from "next";
import { Bell } from "lucide-react";
import { ComingLater } from "@/components/app-shell/coming-later";

export const metadata: Metadata = { title: "Notifications" };

export default function NotificationsPage() {
  return (
    <ComingLater
      icon={Bell}
      title="Notifications"
      body="Decisions on your applications, and anything that changes what is deducted from your salary, will appear here."
    />
  );
}
