import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { StepIndicator } from "@/components/clarix/step-indicator";
import { loadOnboardingContext } from "@/lib/supabase/onboarding-state";
import { EmployeeIdForm } from "./employee-id-form";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Your staff ID" };

export default async function EmployeeIdPage() {
  const context = await loadOnboardingContext();
  if (!context) redirect("/login");

  const { organization } = context;

  return (
    <>
      <StepIndicator current="employee-id" />
      <EmployeeIdForm
        label={organization.employeeIdLabel}
        pattern={organization.employeeIdPattern}
        hint={`You will find your ${organization.employeeIdLabel} near the top of your payslip, beside your name.`}
      />
    </>
  );
}
