"use client";

import Link from "next/link";
import { FileText, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RevealCopy } from "@/components/clarix/reveal-copy";
import { formatFullDate, formatNaira } from "@/lib/format";

/**
 * Salary information (blueprint 6.2), second section.
 *
 * The two figures every deduction limit in the product is worked out from, masked until asked
 * for (the Reveal & Copy pattern from docs/planning/clarix-design-system.md § 4) because a
 * payslip figure is not something to leave sitting on a screen someone else can see.
 *
 * The line naming the payslip these came from is deliberate and permanent, the same wording as
 * the onboarding review screen: Clarix has no payroll connection and must never look as though
 * it does (DECISIONS.md D005).
 */
export function SalaryPanel({
  gross,
  net,
  verifiedAt,
  sourceFilename,
}: {
  gross: number | null;
  net: number | null;
  verifiedAt: string | null;
  sourceFilename: string | null;
}) {
  if (gross === null && net === null) {
    return (
      <div>
        <p className="type-body text-text-secondary">
          No salary has been confirmed on this account yet, so Clarix cannot work out a deduction
          limit for you. Uploading a payslip is the one step that fixes that.
        </p>
        <Button className="mt-5" render={<Link href="/profile/payslip" />}>
          <Upload className="size-4" aria-hidden strokeWidth={2} />
          Upload a payslip
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="divide-y divide-border rounded-card border border-border bg-background">
        <RevealCopy
          label="Gross salary"
          value={gross === null ? "Not set" : String(gross)}
          formatted={gross === null ? "Not set" : formatNaira(gross)}
        />
        <RevealCopy
          label="Net salary"
          value={net === null ? "Not set" : String(net)}
          formatted={net === null ? "Not set" : formatNaira(net)}
        />
      </div>

      <p className="mt-3 flex items-start gap-2 type-caption text-text-muted">
        <FileText aria-hidden strokeWidth={1.75} className="mt-px size-3.5 shrink-0" />
        <span>
          Extracted from your payslip{sourceFilename ? ` (${sourceFilename})` : ""}
          {verifiedAt ? `, confirmed ${formatDate(verifiedAt)}` : ""}. Clarix is not connected to
          payroll. These figures come only from the document you uploaded.
        </span>
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-4">
        <Button variant="secondary" render={<Link href="/profile/payslip" />}>
          <Upload className="size-4" aria-hidden strokeWidth={2} />
          Re-upload payslip
        </Button>
        <p className="type-caption text-text-secondary">
          Do this whenever your pay changes, every limit in Clarix is worked out from it.
        </p>
      </div>
    </div>
  );
}

function formatDate(iso: string): string {
  return formatFullDate(iso);
}
