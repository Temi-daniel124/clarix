import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReviewForm } from "@/app/onboarding/review/review-form";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Check your salary" };

type ExtractedFields = { gross?: number; net?: number; payPeriod?: string };

/**
 * The review half of the scoped re-upload pair (blueprint 6.2), reusing 2.4.
 *
 * Identical to the onboarding review screen in everything that matters, because the human
 * checkpoint DECISIONS.md D006 requires is the same checkpoint whichever direction an employee
 * arrived from: nothing reaches `users.salary_gross` without someone reading it on screen.
 * What differs is only where it returns to, and the button's wording. This is a replacement,
 * not a first entry.
 */
export default async function ProfilePayslipReviewPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("employee_id, organizations(employee_id_label)")
    .eq("id", user.id)
    .maybeSingle();

  const organization = Array.isArray(profile?.organizations)
    ? profile?.organizations[0]
    : profile?.organizations;

  // The newest upload is the one being reviewed. RLS means this can only ever return this
  // employee's own documents.
  const { data: document } = await supabase
    .from("documents")
    .select("id, original_filename, extracted_fields, pay_period")
    .eq("user_id", user.id)
    .eq("type", "payslip")
    .order("uploaded_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!document) redirect("/profile/payslip");

  const extracted = (document.extracted_fields ?? {}) as ExtractedFields;

  return (
    <div className="mx-auto w-full max-w-[640px] px-5 pb-10 md:px-8">
      <div className="pt-8 md:pt-10">
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2"
          render={<Link href="/profile/payslip" />}
        >
          <ArrowLeft className="size-4" aria-hidden strokeWidth={2} />
          Upload a different file
        </Button>
      </div>

      <ReviewForm
        documentId={document.id}
        employeeIdLabel={organization?.employee_id_label ?? "Staff ID"}
        employeeId={profile?.employee_id ?? null}
        filename={document.original_filename}
        extracted={{
          gross: typeof extracted.gross === "number" ? extracted.gross : null,
          net: typeof extracted.net === "number" ? extracted.net : null,
          payPeriod: document.pay_period ?? extracted.payPeriod ?? null,
        }}
        destination="profile"
        submitLabel="Save these figures"
      />
    </div>
  );
}
