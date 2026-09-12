import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/components/clarix/loan-card";
import { formatNaira } from "@/lib/format";
import { loadLedger } from "@/lib/supabase/loans-data";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Savings statement" };

/**
 * Savings Statement — blueprint 5.2.
 *
 * "A focused, printable-feeling record": date, description, amount, running balance, and nothing
 * else competing for attention. Read-only, because an employee never edits their own ledger.
 *
 * The running balance is computed forward from the oldest entry and then displayed newest-first,
 * so each row shows the balance as it stood immediately after that entry — which is what a
 * statement means, and what makes the column reconcilable against a cooperative's own books.
 */
export default async function SavingsStatementPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: membership } = await supabase
    .from("cooperative_memberships")
    .select("id, savings_balance, cooperatives(name)")
    .eq("user_id", user.id)
    .eq("cooperative_id", id)
    .maybeSingle();

  if (!membership) redirect("/cooperatives");

  const cooperative = Array.isArray(membership.cooperatives)
    ? membership.cooperatives[0]
    : membership.cooperatives;

  const ledger = await loadLedger(membership.id);
  // Savings only: a loan repayment leaves the salary, it does not move the savings balance.
  const savings = ledger.filter(
    (entry) => entry.type === "contribution" || entry.type === "withdrawal_record",
  );

  // Oldest first to accumulate the running balance, then newest-first for display. Written as a
  // reduce rather than a mutating map so the accumulator stays local to the fold.
  const oldestFirst = [...savings].sort((a, b) => a.recordedAt.localeCompare(b.recordedAt));
  const withBalances = oldestFirst.reduce<Array<(typeof savings)[number] & { balance: number }>>(
    (accumulated, entry) => {
      const previous = accumulated.at(-1)?.balance ?? 0;
      const balance = previous + (entry.type === "contribution" ? entry.amount : -entry.amount);
      return [...accumulated, { ...entry, balance }];
    },
    [],
  );
  const rows = withBalances.toReversed();

  return (
    <div className="mx-auto w-full max-w-[760px] px-5 py-8 md:px-8 md:py-10">
      <Button variant="ghost" size="sm" className="-ml-2" render={<Link href={`/cooperatives/${id}`} />}>
        <ArrowLeft className="size-4" aria-hidden strokeWidth={2} />
        {cooperative?.name ?? "Cooperative"}
      </Button>

      <h1 className="type-page-title mt-6 text-text">Savings statement</h1>
      <p className="type-body mt-2 text-text-secondary">
        Every contribution {cooperative?.name ?? "this cooperative"} has recorded against your
        membership, most recent first.
      </p>

      <p className="type-secondary mt-6 tabular text-text">
        Current balance: <span className="font-semibold">{formatNaira(Number(membership.savings_balance ?? 0))}</span>
      </p>

      {rows.length === 0 ? (
        <p className="type-body mt-8 text-text-secondary">
          Nothing recorded yet. Contributions appear here as they are entered.
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse">
            <thead>
              <tr className="border-b border-border text-left">
                <th scope="col" className="pb-3 type-caption uppercase tracking-[0.08em] text-text-muted">
                  Date
                </th>
                <th scope="col" className="pb-3 type-caption uppercase tracking-[0.08em] text-text-muted">
                  Description
                </th>
                <th scope="col" className="pb-3 text-right type-caption uppercase tracking-[0.08em] text-text-muted">
                  Amount
                </th>
                <th scope="col" className="pb-3 text-right type-caption uppercase tracking-[0.08em] text-text-muted">
                  Balance
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-border last:border-b-0">
                  <td className="py-4 type-secondary whitespace-nowrap text-text-secondary">
                    {formatDate(row.recordedAt)}
                  </td>
                  <td className="py-4 type-secondary text-text">
                    {row.description ??
                      (row.type === "contribution" ? "Contribution" : "Withdrawal recorded")}
                  </td>
                  <td className="py-4 text-right type-secondary tabular text-text">
                    {row.type === "contribution" ? "+" : "−"}
                    {formatNaira(row.amount)}
                  </td>
                  <td className="py-4 text-right type-secondary tabular font-medium text-text">
                    {formatNaira(row.balance)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
