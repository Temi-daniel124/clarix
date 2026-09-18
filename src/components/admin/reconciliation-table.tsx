"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Landmark, TriangleAlert } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { formatNaira } from "@/lib/format";
import { recordReconciliationAction } from "@/app/admin/reconciliation-actions";
import type { ReconciliationPeriod, ReconciliationRow } from "@/lib/supabase/reconciliation-data";

/**
 * Monthly Reconciliation Entry (admin blueprint 7.5).
 *
 * Each row saves on its own as it is filled in, "rather than requiring the whole month to be
 * entered in one sitting before anything is recorded": a cooperative reconciling four hundred
 * members will not do it in one sitting, and a form that loses everything when they stop would
 * guarantee the screen goes unused.
 *
 * The shortfall is computed, never typed and never stored: expected minus actual, worked out
 * where it is displayed, so the flag can never disagree with the two figures beside it.
 */
export function ReconciliationTable({
  cooperativePeriod,
  periods,
}: {
  cooperativePeriod: ReconciliationPeriod;
  periods: { period: string; label: string }[];
}) {
  const router = useRouter();
  const [period, setPeriod] = useState(cooperativePeriod.period);

  const { rows, expectedTotal, receivedTotal, shortfallTotal, entered } = cooperativePeriod;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <label htmlFor="period" className="type-secondary font-medium text-text">
            Month
          </label>
          <select
            id="period"
            value={period}
            onChange={(event) => {
              setPeriod(event.target.value);
              router.push(`/admin/manage/reconciliation?period=${event.target.value}`);
            }}
            className="h-12 min-w-[200px] rounded-card border border-border bg-surface px-3 type-body text-text outline-none transition-[border-color] duration-150 focus-visible:border-indigo focus-visible:outline-2 focus-visible:outline-indigo focus-visible:outline-offset-1"
          >
            {periods.map((entry) => (
              <option key={entry.period} value={entry.period}>
                {entry.label}
              </option>
            ))}
          </select>
        </div>

        <p className="type-secondary text-text-secondary">
          {rows.length === 0
            ? "Nothing expected this month"
            : `${entered} of ${rows.length} entered`}
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="mt-6 rounded-feature border border-border bg-surface px-6 py-10 text-center">
          <span
            aria-hidden
            className="mx-auto flex size-12 items-center justify-center rounded-card border border-border text-text-muted"
          >
            <Landmark className="size-5" strokeWidth={1.75} />
          </span>
          <p className="type-body mt-5 text-text">Nothing to reconcile for {cooperativePeriod.label}</p>
          <p className="type-secondary mx-auto mt-2 max-w-[440px] text-text-secondary">
            Members appear here once they have an active loan, because that is what creates an
            expected deduction. Approve an application and this list fills itself.
          </p>
        </div>
      ) : (
        <>
          <dl className="mt-6 grid gap-3 sm:grid-cols-3">
            <Summary label="Expected" value={formatNaira(expectedTotal)} />
            <Summary label="Received so far" value={formatNaira(receivedTotal)} />
            <Summary
              label="Shortfall"
              value={formatNaira(shortfallTotal)}
              tone={shortfallTotal > 0 ? "warning" : "neutral"}
            />
          </dl>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[680px] border-collapse">
              <thead>
                <tr className="border-b border-border text-left">
                  <th scope="col" className="pb-3 pr-4 type-caption uppercase tracking-[0.08em] text-text-muted">
                    Member
                  </th>
                  <th scope="col" className="pb-3 pr-4 text-right type-caption uppercase tracking-[0.08em] text-text-muted">
                    Expected
                  </th>
                  <th scope="col" className="pb-3 pr-4 type-caption uppercase tracking-[0.08em] text-text-muted">
                    Actually received
                  </th>
                  <th scope="col" className="pb-3 type-caption uppercase tracking-[0.08em] text-text-muted">
                    Difference
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <Row key={row.membershipId} row={row} period={period} />
                ))}
              </tbody>
            </table>
          </div>

          <p className="type-caption mt-4 max-w-[600px] text-text-muted">
            Each row saves the moment you leave its field, so this can be filled in over days
            rather than in one sitting. What is recorded here appears on the member&apos;s own
            Deductions record too.
          </p>
        </>
      )}
    </div>
  );
}

function Summary({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "warning";
}) {
  return (
    <div className="rounded-card border border-border bg-surface p-4">
      <dt className="type-caption uppercase tracking-[0.06em] text-text-muted">{label}</dt>
      <dd
        className={cn(
          "type-card-title tabular mt-2",
          tone === "warning" ? "text-warning" : "text-text",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

function Row({ row, period }: { row: ReconciliationRow; period: string }) {
  const [value, setValue] = useState(row.actual === null ? "" : String(row.actual));
  const [saved, setSaved] = useState(row.actual !== null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const parsed = value.trim() === "" ? null : Number(value.replace(/[₦,\s]/g, ""));
  const difference = parsed === null ? null : parsed - row.expected;
  const short = difference !== null && difference < 0;

  const save = () => {
    if (parsed === null) return;
    if (!Number.isFinite(parsed) || parsed < 0) {
      setError("That is not an amount.");
      return;
    }
    if (row.actual !== null && parsed === row.actual) return;

    setError(null);
    startTransition(async () => {
      const result = await recordReconciliationAction(row.membershipId, period, row.expected, parsed);
      if (result.error) {
        setError(result.error);
        setSaved(false);
        return;
      }
      setSaved(true);
    });
  };

  return (
    <tr className={cn("border-b border-border last:border-b-0", short && "bg-warning/5")}>
      <td className="py-3 pr-4">
        <p className="type-body text-text">{row.memberName ?? "Member"}</p>
        {row.employeeId ? (
          <p className="type-caption tabular text-text-muted">{row.employeeId}</p>
        ) : null}
      </td>

      <td className="py-3 pr-4 text-right type-secondary tabular text-text-secondary">
        {formatNaira(row.expected)}
      </td>

      <td className="py-3 pr-4">
        <div className="flex items-center gap-2">
          <Input
            value={value}
            onChange={(event) => {
              setValue(event.target.value.replace(/[^0-9.,]/g, ""));
              setSaved(false);
            }}
            onBlur={save}
            inputMode="decimal"
            aria-label={`Amount received for ${row.memberName ?? "this member"}`}
            className="h-10 w-32 tabular"
            placeholder="0.00"
          />
          {pending ? (
            <span className="type-caption text-text-muted">Saving…</span>
          ) : saved && parsed !== null ? (
            <Check aria-label="Saved" className="size-4 text-emerald" strokeWidth={2.5} />
          ) : null}
        </div>
        {error ? (
          <p role="alert" className="type-caption mt-1 text-danger">
            {error}
          </p>
        ) : null}
      </td>

      <td className="py-3">
        {difference === null ? (
          <span className="type-secondary text-text-muted">Not entered</span>
        ) : difference === 0 ? (
          <span className="type-secondary text-emerald">Exact</span>
        ) : (
          <span
            className={cn(
              "flex items-center gap-2 type-secondary tabular",
              short ? "text-warning" : "text-text-secondary",
            )}
          >
            {short ? <TriangleAlert aria-hidden strokeWidth={2} className="size-3.5" /> : null}
            {short ? `${formatNaira(Math.abs(difference))} short` : `${formatNaira(difference)} over`}
          </span>
        )}
      </td>
    </tr>
  );
}
