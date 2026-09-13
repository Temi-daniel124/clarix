import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";
import { ComingLater } from "@/components/app-shell/coming-later";

export const metadata: Metadata = { title: "Platform admins" };

/** Manage Platform Admins (blueprint 8.1) — built in a later block of this role. */
export default function Page() {
  return (
    <ComingLater
      icon={ShieldCheck}
      title="Platform admins"
      body="Who else can operate the platform. The first account is seeded once during deployment rather than invited; adding a second one from inside the product is this screen's job, and `platform_admins` carries no insert policy yet, so the database refuses it too."
    />
  );
}
