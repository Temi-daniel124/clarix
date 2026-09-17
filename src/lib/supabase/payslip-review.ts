import { createClient } from "@/lib/supabase/server";

/**
 * The payslip behind an application under review, DECISIONS.md D031.
 *
 * There is no cooperative filter, no membership filter and no permission check in this file, and
 * that is deliberate: `documents_select_loan_review` decides whether the row comes back, keyed on
 * `payslip_under_review()`. If the caller is not entitled to it (no application waiting, no
 * permission to decide one, or the document is not the salary evidence) the query returns nothing
 * and this returns null, which is the same answer as "there is no payslip".
 */

export type ReviewPayslip = {
  id: string;
  originalFilename: string | null;
  mimeType: string | null;
  byteSize: number | null;
  payPeriod: string | null;
  uploadedAt: string;
  reviewStatus: "pending_review" | "confirmed" | "corrected";
  storagePath: string;
};

export async function loadPayslipForReview(memberUserId: string): Promise<ReviewPayslip | null> {
  const supabase = await createClient();

  const { data: member } = await supabase
    .from("users")
    .select("salary_source_doc_id")
    .eq("id", memberUserId)
    .maybeSingle();

  if (!member?.salary_source_doc_id) return null;

  const { data } = await supabase
    .from("documents")
    .select(
      "id, original_filename, mime_type, byte_size, pay_period, uploaded_at, review_status, storage_path",
    )
    .eq("id", member.salary_source_doc_id)
    .maybeSingle();

  if (!data) return null;

  return {
    id: data.id,
    originalFilename: data.original_filename,
    mimeType: data.mime_type,
    byteSize: data.byte_size,
    payPeriod: data.pay_period,
    uploadedAt: data.uploaded_at,
    reviewStatus: data.review_status,
    storagePath: data.storage_path,
  };
}

/** Who the application belongs to, so the loader above has somebody to ask about. */
export async function memberUserIdForMembership(membershipId: string): Promise<string | null> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("cooperative_memberships")
    .select("user_id")
    .eq("id", membershipId)
    .maybeSingle();

  return data?.user_id ?? null;
}
