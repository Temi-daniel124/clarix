import type { Metadata } from "next";
import { KeyRound } from "lucide-react";
import { ComingLater } from "@/components/app-shell/coming-later";

export const metadata: Metadata = { title: "Access requests" };

/**
 * Access Requests (blueprint 7.2) — the one deliberate exception to this role having no standing
 * access to member financial data, and deliberately not built yet.
 *
 * The `access_grants` table it needs is specified in docs/DATA-MODEL.md and does not exist in the
 * database. That is the right order: the mechanism is security-sensitive enough that it deserves
 * its own session rather than being assembled at the end of another one.
 */
export default function Page() {
  return (
    <ComingLater
      icon={KeyRound}
      title="Access requests"
      body="The only way this account can ever see a member's savings or loans: a named cooperative, a written reason, that cooperative's own admin told the moment it is submitted, read-only access that expires on its own, and every record viewed under it logged. None of it is built, and until it is, there is no path from here to anybody's money."
    />
  );
}
