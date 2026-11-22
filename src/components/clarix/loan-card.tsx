import Link from "next/link";
import { ChevronRight, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatFullDate, formatNaira } from "@/lib/format";
import { MeterBar } from "./meter-bar";
import type { LoanSummary } from "@/lib/supabase/loans-data";

const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  reserved: "Awaiting a decision",
  active: "Active",
  rejected: "Not approved",
  completed: "Repaid in full",
  expired: "Reservation lapsed",
};

/** One loan, as it appears in a list. Used by the Loans overview (5.4) and Cooperative Detail. */
export function LoanCard({ loan, showCooperative = true }: { loan: LoanSummary; showCooperative?: boolean }) {
  const settled = loan.status === "completed";

  return (
    <Link
      href={`/loans/${loan.id}`}
      className="flex items-center gap-4 rounded-card border border-border bg-surface p-5 transition-colors duration-150 hover:border-text-muted/50 focus-visible:outline-2 focus-visible:outline-indigo focus-visible:outline-offset-2"
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          {showCooperative ? (
            <h3 className="type-card-title text-text">{loan.cooperativeName}</h3>
          ) : (
            <h3 className="type-card-title text-text">{formatNaira(loan.requestedAmount)} loan</h3>
          )}
          <StatusPill status={loan.status} />
        </div>

        <p className="type-secondary mt-1 tabular text-text-secondary">
          {settled
            ? `${formatNaira(loan.requestedAmount)} repaid in full`
            : `${formatNaira(loan.remaining)} left of ${formatNaira(loan.requestedAmount)}`}
        </p>

        {loan.status === "active" ? (
          <>
            {/* Repayment progress uses the same meter as the capacity figure: the blueprint
                notes both are "progress against a total" and should look related. */}
            <MeterBar
              className="mt-3"
              size="compact"
              track="neutral"
              usedRatio={loan.progress}
              label={`${Math.round(loan.progress * 100)}% of this loan repaid`}
            />
            <p className="type-caption mt-2 text-text-muted">
              {Math.round(loan.progress * 100)}% repaid
              {loan.nextRepaymentOn
                ? ` · next deduction expected ${formatDate(loan.nextRepaymentOn)}`
                : ""}
            </p>
          </>
        ) : null}

        {loan.status === "reserved" && loan.reservationExpiresAt ? (
          <p className="type-caption mt-2 flex items-center gap-2 text-warning">
            <Clock aria-hidden strokeWidth={2} className="size-3.5" />
            Held until {formatDate(loan.reservationExpiresAt)}
          </p>
        ) : null}
      </div>

      <ChevronRight aria-hidden strokeWidth={2} className="size-4 shrink-0 text-text-muted" />
    </Link>
  );
}

export function StatusPill({ status }: { status: string }) {
  const tone =
    status === "active"
      ? "border-emerald/30 text-emerald-700"
      : status === "reserved"
        ? "border-warning/30 text-warning"
        : status === "rejected" || status === "expired"
          ? "border-danger/30 text-danger"
          : "border-border text-text-muted";

  return (
    <span className={cn("inline-flex rounded-full border px-3 py-1 type-caption", tone)}>
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

export function formatDate(iso: string): string {
  return formatFullDate(iso);
}
