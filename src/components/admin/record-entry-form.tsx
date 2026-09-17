"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SectionFeedback } from "@/components/clarix/section-feedback";
import { cn } from "@/lib/utils";
import { formatNaira, NAIRA } from "@/lib/format";
import { recordSavingsAction, type MemberActionState } from "@/app/admin/member-actions";

const INITIAL: MemberActionState = {};

export type RepayableLoan = {
  id: string;
  label: string;
};

type EntryType = "contribution" | "withdrawal_record" | "loan_repayment";

const TYPE_LABELS: Record<EntryType, string> = {
  contribution: "Contribution",
  withdrawal_record: "Withdrawal",
  loan_repayment: "Loan repayment",
};

/**
 * Record Savings Contribution / Repayment (admin blueprint 5.4).
 *
 * "A ledger entry, never a live transaction, consistent with Clarix never moving money itself"
 * (DECISIONS.md D004). The wording on the screen says so plainly rather than leaving it implied,
 * because a form with an amount field and a Record button could otherwise be mistaken for one
 * that moves something.
 *
 * The member's name and current balance sit at the top, read-only, so the person recording can
 * see what they are about to change before they change it.
 */
export function RecordEntryForm({
  membershipId,
  memberName,
  currentBalance,
  defaultType,
  loans,
}: {
  membershipId: string;
  memberName: string;
  currentBalance: number;
  defaultType: EntryType;
  loans: RepayableLoan[];
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(recordSavingsAction, INITIAL);

  const [type, setType] = useState<EntryType>(
    defaultType === "loan_repayment" && loans.length === 0 ? "contribution" : defaultType,
  );
  const [amount, setAmount] = useState("");
  const [loanId, setLoanId] = useState(loans[0]?.id ?? "");

  const available: EntryType[] =
    loans.length > 0
      ? ["contribution", "withdrawal_record", "loan_repayment"]
      : ["contribution", "withdrawal_record"];

  if (state.saved) {
    return (
      <div>
        <h1 className="type-page-title text-text">Recorded</h1>
        <p className="type-body mt-3 max-w-[480px] text-text-secondary">
          {memberName}&apos;s record is updated, and they see it on their own statement straight
          away.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Button render={<Link href={`/admin/members/${membershipId}`} />}>
            Back to {memberName}
          </Button>
          <Button variant="outline" onClick={() => router.refresh()}>
            Record another
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Button
        variant="ghost"
        size="sm"
        className="-ml-2"
        render={<Link href={`/admin/members/${membershipId}`} />}
      >
        <ArrowLeft className="size-4" aria-hidden strokeWidth={2} />
        {memberName}
      </Button>

      <h1 className="type-page-title mt-6 text-text">Record an entry</h1>

      <div className="mt-6 rounded-card border border-border bg-surface px-5 py-4">
        <p className="type-secondary text-text-secondary">
          {memberName} · savings with you
        </p>
        <p className="type-card-title tabular mt-1 text-text">{formatNaira(currentBalance)}</p>
      </div>

      <form action={formAction} className="mt-8 flex flex-col gap-5">
        <input type="hidden" name="membershipId" value={membershipId} />
        <input type="hidden" name="type" value={type} />
        {type === "loan_repayment" ? <input type="hidden" name="loanId" value={loanId} /> : null}

        <fieldset className="flex flex-col gap-2">
          <legend className="type-secondary font-medium text-text">What is this?</legend>
          <div className="mt-1 flex flex-wrap gap-2">
            {available.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setType(option)}
                aria-pressed={type === option}
                className={cn(
                  "rounded-full border px-4 py-2 type-secondary font-medium transition-colors duration-150",
                  "focus-visible:outline-2 focus-visible:outline-indigo focus-visible:outline-offset-2",
                  type === option
                    ? "border-emerald bg-background text-text"
                    : "border-border text-text-secondary hover:text-text",
                )}
              >
                {TYPE_LABELS[option]}
              </button>
            ))}
          </div>
        </fieldset>

        {type === "loan_repayment" && loans.length > 1 ? (
          <div className="flex flex-col gap-2">
            <Label htmlFor="loan">Against which loan</Label>
            <select
              id="loan"
              value={loanId}
              onChange={(event) => setLoanId(event.target.value)}
              className="h-12 rounded-card border border-border bg-surface px-3 type-body text-text outline-none transition-[border-color] duration-150 focus-visible:border-indigo focus-visible:outline-2 focus-visible:outline-indigo focus-visible:outline-offset-1"
            >
              {loans.map((loan) => (
                <option key={loan.id} value={loan.id}>
                  {loan.label}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        <div className="flex flex-col gap-2">
          <Label htmlFor="amount">Amount</Label>
          <div className="relative">
            <span
              aria-hidden
              className="pointer-events-none absolute inset-y-0 left-4 flex items-center type-body text-text-muted"
            >
              {NAIRA}
            </span>
            <Input
              id="amount"
              name="amount"
              inputMode="decimal"
              value={amount}
              onChange={(event) => setAmount(event.target.value.replace(/[^0-9.,]/g, ""))}
              aria-invalid={Boolean(state.fieldErrors?.amount)}
              className="pl-9 tabular"
            />
          </div>
          <FieldError message={state.fieldErrors?.amount} />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="recordedAt">Date</Label>
          <Input
            id="recordedAt"
            name="recordedAt"
            type="date"
            defaultValue={new Date().toISOString().slice(0, 10)}
            aria-invalid={Boolean(state.fieldErrors?.recordedAt)}
          />
          <p className="type-caption text-text-muted">
            When payroll actually deducted it, which may not be today.
          </p>
          <FieldError message={state.fieldErrors?.recordedAt} />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="description">Note</Label>
          <Input
            id="description"
            name="description"
            placeholder="Optional, e.g. September deduction"
          />
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-4">
          <Button type="submit" disabled={pending || amount.trim() === ""}>
            {pending ? "Recording…" : "Record"}
          </Button>
          <SectionFeedback error={state.error} />
        </div>

        <p className="type-caption max-w-[520px] text-text-muted">
          This records money that has already moved through payroll. Clarix holds no funds and
          transfers nothing: the entry is the cooperative&apos;s own book, kept where the member
          can see it too.
        </p>
      </form>
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="type-caption text-danger">
      {message}
    </p>
  );
}
