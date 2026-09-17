import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PayslipUpload } from "@/app/onboarding/payslip/payslip-upload";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Re-upload payslip" };

/**
 * Re-upload payslip (blueprint 6.2), "a variant of the Payslip Upload/Review pair (2.3–2.4)
 * scoped to updating rather than onboarding".
 *
 * Scoped means three things and nothing else: it lives inside the app shell rather than the
 * onboarding layout, there is no step indicator because this is not a sequence, and it returns
 * to Profile when the figures are confirmed. The upload component itself is the same one
 * onboarding uses, told where to go next: a second dropzone with its own storage-path rule
 * would be a second place for the payslip privacy boundary to go wrong.
 */
export default async function ProfilePayslipPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="mx-auto w-full max-w-[640px] px-5 pb-10 md:px-8">
      <div className="pt-8 md:pt-10">
        <Button variant="ghost" size="sm" className="-ml-2" render={<Link href="/profile" />}>
          <ArrowLeft className="size-4" aria-hidden strokeWidth={2} />
          Profile
        </Button>
      </div>

      <PayslipUpload
        userId={user.id}
        nextHref="/profile/payslip/review"
        heading="Upload a newer payslip"
        intro="Use this whenever your pay changes. The figures you confirm on the next screen replace the ones Clarix holds, and every deduction limit is worked out again from them."
      />
    </div>
  );
}
