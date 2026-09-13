"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * A short-lived link to the payslip behind an application under review — DECISIONS.md D031.
 *
 * `createSignedUrl` runs on the caller's own session, so the storage policy added in migration 027
 * decides whether a URL comes back at all. There is no permission check here, because a check here
 * would be the second definition of a boundary that already has one, and the two would eventually
 * disagree.
 *
 * The link lasts sixty seconds. That is not security theatre over an already-authorised read: it
 * means a URL pasted into a chat, left in a browser history, or captured in a screen share stops
 * working almost immediately, which matters for a document carrying somebody's salary and IPPIS
 * number.
 */

const LINK_SECONDS = 60;

export type PayslipLink = { url?: string; error?: string };

export async function payslipLinkAction(storagePath: string): Promise<PayslipLink> {
  const supabase = await createClient();

  const { data, error } = await supabase.storage
    .from("payslips")
    .createSignedUrl(storagePath, LINK_SECONDS);

  if (error || !data?.signedUrl) {
    return {
      error:
        "That payslip is not open to you. A decision on this application may already have been made.",
    };
  }

  return { url: data.signedUrl };
}
