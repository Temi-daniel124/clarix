import type { MemberRow } from "@/lib/supabase/admin-members";

/**
 * What counts as a match when staff look for a member.
 *
 * Shared rather than written twice: the Member Search/List screen (5.1) and the search field on
 * Officer Home (4.1) are described in the blueprint as the same search, "typing in the search
 * field opens fast-filtering results beneath it, exactly as on the Admin's Member Search screen".
 * Two copies of this rule would eventually disagree, and a member who is findable from one screen
 * and not the other is the kind of small dishonesty that costs trust in the whole list.
 *
 * Name and staff ID only. Matching on a savings figure would let somebody stumble onto a member
 * by guessing an amount, which is a search nobody asked for.
 */
export function filterMembers(members: MemberRow[], query: string): MemberRow[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return members;

  return members.filter(
    (member) =>
      (member.name ?? "").toLowerCase().includes(needle) ||
      (member.employeeId ?? "").toLowerCase().includes(needle),
  );
}
