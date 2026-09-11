import type { Metadata } from "next";
import { User } from "lucide-react";
import { ComingLater } from "@/components/app-shell/coming-later";

export const metadata: Metadata = { title: "Profile" };

export default function ProfilePage() {
  return (
    <ComingLater
      icon={User}
      title="Profile"
      body="Your staff ID, your confirmed salary and the payslip it came from, and your account settings."
    />
  );
}
