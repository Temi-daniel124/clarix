import type { Metadata } from "next";
import Link from "next/link";
import { MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Confirm your email",
  description: "Confirm your email address to finish creating your Clarix account.",
  robots: { index: false, follow: false },
};

/**
 * Verify Contact: the step Sign Up (blueprint 1.3) leads to.
 *
 * Included in this slice because Sign Up has to land somewhere honest; the onboarding
 * sequence it precedes (Welcome Tour 2.1 onwards) is built in the next slice.
 */
export default function VerifyPage() {
  return (
    <div>
      <span
        aria-hidden
        className="flex size-12 items-center justify-center rounded-card"
        style={{
          backgroundColor: "color-mix(in srgb, var(--clarix-brand-accent) 12%, transparent)",
          color: "var(--clarix-brand-accent)",
        }}
      >
        <MailCheck className="size-6" strokeWidth={1.75} />
      </span>

      <h1 className="type-page-title mt-6 text-text">Confirm your email address</h1>

      <p className="type-body mt-3 text-text-secondary">
        We have sent you a confirmation link. Open it on this device and Clarix will pick up
        where you left off. Your staff ID, then your payslip, then the cooperatives you belong
        to.
      </p>

      <p className="type-secondary mt-6 text-text-muted">
        Nothing arrived? It can take a minute, and it is worth checking your spam folder before
        trying again.
      </p>

      <Button variant="outline" className="mt-8 w-full" render={<Link href="/login" />}>
        Back to sign in
      </Button>
    </div>
  );
}
