"use client";

import { useState, useTransition } from "react";
import { ExternalLink, FileText, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatNaira } from "@/lib/format";
import { payslipLinkAction } from "@/app/admin/payslip-actions";
import type { ReviewPayslip } from "@/lib/supabase/payslip-review";

/**
 * The salary evidence behind an application, DECISIONS.md D031.
 *
 * This panel exists because the figure every other number on this screen is derived from is
 * **self-reported**: the member uploaded a payslip, confirmed what it said, and that confirmation
 * became the deduction cap. Until now nobody could compare the two. The point of the panel is that
 * comparison, so it puts the confirmed figures next to the document rather than only linking it.
 *
 * The line about what happens after the decision is not a disclaimer. A reviewer should know that
 * this is a window rather than a standing capability, because that is what makes it defensible to
 * the member whose payslip it is.
 */
export function PayslipEvidence({
  payslip,
  salaryGross,
  salaryNet,
  confirmedAt,
}: {
  payslip: ReviewPayslip;
  salaryGross: number | null;
  salaryNet: number | null;
  confirmedAt: string | null;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const open = () => {
    setError(null);
    startTransition(async () => {
      const result = await payslipLinkAction(payslip.storagePath);
      if (result.error || !result.url) {
        setError(result.error ?? "That payslip could not be opened.");
        return;
      }
      window.open(result.url, "_blank", "noopener,noreferrer");
    });
  };

  return (
    <section className="rounded-feature border border-border bg-surface p-5 md:p-6">
      <div className="flex items-start gap-4">
        <span
          aria-hidden
          className="flex size-10 shrink-0 items-center justify-center rounded-card border border-border text-text-secondary"
        >
          <FileText className="size-[18px]" strokeWidth={1.75} />
        </span>

        <div className="min-w-0 flex-1">
          <h2 className="type-card-title text-text">The salary this rests on</h2>
          <p className="type-secondary mt-2 max-w-[520px] text-text-secondary">
            Every figure above is worked out from what this member confirmed their pay to be. This
            is the payslip they confirmed it from, so you can check the two agree before committing
            money against it.
          </p>
        </div>
      </div>

      <dl className="mt-5 flex flex-wrap gap-x-8 gap-y-3 border-t border-border pt-4">
        <Fact label="Confirmed gross" value={salaryGross === null ? "Not on file" : formatNaira(salaryGross)} />
        <Fact label="Confirmed net" value={salaryNet === null ? "Not on file" : formatNaira(salaryNet)} />
        <Fact label="Pay period" value={payslip.payPeriod ?? "Not stated"} />
        <Fact label="Confirmed on" value={confirmedAt ? formatDate(confirmedAt) : "Unknown"} />
      </dl>

      <div className="mt-5 flex flex-wrap items-center gap-4">
        <Button variant="outline" size="sm" type="button" onClick={open} disabled={pending}>
          <ExternalLink className="size-4" aria-hidden strokeWidth={2} />
          {pending ? "Opening…" : "Open the payslip"}
        </Button>

        <p className="type-caption text-text-muted">
          {payslip.originalFilename ?? "Uploaded document"}
          {payslip.byteSize ? ` · ${Math.round(payslip.byteSize / 1024)} KB` : ""}
          {` · uploaded ${formatDate(payslip.uploadedAt)}`}
        </p>
      </div>

      {error ? (
        <p role="alert" className="type-caption mt-3 text-danger">
          {error}
        </p>
      ) : null}

      <p className="type-caption mt-5 flex items-start gap-2 text-text-muted">
        <ShieldCheck aria-hidden className="mt-0.5 size-3.5 shrink-0" strokeWidth={1.75} />
        <span className="max-w-[520px]">
          This is open to you because you have an application to decide. Once you approve or reject
          it, or the hold lapses, the document goes back to being the member&rsquo;s alone.
        </span>
      </p>
    </section>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="type-caption text-text-muted">{label}</dt>
      <dd className="type-secondary mt-0.5 tabular text-text">{value}</dd>
    </div>
  );
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}
