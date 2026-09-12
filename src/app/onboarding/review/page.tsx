import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { StepIndicator } from "@/components/clarix/step-indicator";
import { createClient } from "@/lib/supabase/server";
import { loadOnboardingContext } from "@/lib/supabase/onboarding-state";
import { ReviewForm } from "./review-form";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Check your salary" };

type ExtractedFields = { gross?: number; net?: number; payPeriod?: string };

export default async function ReviewPage() {
  const context = await loadOnboardingContext();
  if (!context) redirect("/login");
  if (!context.state.employeeId) redirect("/onboarding/employee-id");

  const supabase = await createClient();

  // The most recent upload is the one being reviewed. RLS means this can only ever return the
  // signed-in employee's own documents.
  const { data: document } = await supabase
    .from("documents")
    .select("id, original_filename, extracted_fields, pay_period")
    .eq("user_id", context.userId)
    .eq("type", "payslip")
    .order("uploaded_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!document) redirect("/onboarding/payslip");

  const extracted = (document.extracted_fields ?? {}) as ExtractedFields;

  return (
    <>
      <StepIndicator current="review" />
      <ReviewForm
        documentId={document.id}
        employeeIdLabel={context.organization.employeeIdLabel}
        employeeId={context.state.employeeId}
        filename={document.original_filename}
        extracted={{
          gross: typeof extracted.gross === "number" ? extracted.gross : null,
          net: typeof extracted.net === "number" ? extracted.net : null,
          payPeriod: document.pay_period ?? extracted.payPeriod ?? null,
        }}
      />
    </>
  );
}
