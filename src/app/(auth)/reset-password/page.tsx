import type { Metadata } from "next";
import { ResetRequestForm } from "./reset-request-form";

export const metadata: Metadata = { title: "Forgot your password", robots: { index: false, follow: false } };

/**
 * Forgot password, first half. Shares the two-panel auth shell with sign-in and sign-up, because
 * it is the same moment in the same journey rather than a separate place.
 */
export default function ResetPasswordPage() {
  return <ResetRequestForm />;
}
