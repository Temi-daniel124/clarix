import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { StepIndicator } from "@/components/clarix/step-indicator";
import { loadOnboardingContext } from "@/lib/supabase/onboarding-state";
import { PayslipUpload } from "./payslip-upload";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Upload your payslip" };

export default async function PayslipPage() {
  const context = await loadOnboardingContext();
  if (!context) redirect("/login");

  // The staff ID comes first: without it there is nothing to attach the payslip's figures to.
  if (!context.state.employeeId) redirect("/onboarding/employee-id");

  return (
    <>
      <StepIndicator current="payslip" />
      <PayslipUpload userId={context.userId} />
    </>
  );
}
