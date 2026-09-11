"use client";

import { useActionState, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, Pencil, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { formatAmount, NAIRA } from "@/lib/format";
import { springStandard } from "@/lib/motion";
import { confirmSalaryAction, type StepState } from "../actions";

const INITIAL: StepState = {};

/**
 * Review Extracted Salary — blueprint 2.4.
 *
 * Reads like a receipt being confirmed rather than a form being filled in: labelled rows with
 * the figure on the right in the financial-figure type, and a pencil that turns a row editable
 * in place without leaving the screen.
 *
 * "Extracted from your payslip" is a permanent caption, not a one-time disclaimer, so nobody is
 * ever left thinking Clarix has a live payroll connection (DECISIONS.md D005).
 *
 * Automatic extraction is P1 and not built, so every account currently arrives here on the
 * degradation path the blueprint already specifies for a failed read: fields blank and editable,
 * with a plain explanation. When extraction lands, the only change is that `extracted` arrives
 * populated.
 */
export function ReviewForm({
  documentId,
  employeeIdLabel,
  employeeId,
  filename,
  extracted,
}: {
  documentId: string;
  employeeIdLabel: string;
  employeeId: string | null;
  filename: string | null;
  extracted: { gross: number | null; net: number | null; payPeriod: string | null };
}) {
  const reduceMotion = useReducedMotion();
  const [state, formAction, pending] = useActionState(confirmSalaryAction, INITIAL);

  const nothingExtracted = extracted.gross === null && extracted.net === null;

  const [gross, setGross] = useState(extracted.gross ? String(extracted.gross) : "");
  const [net, setNet] = useState(extracted.net ? String(extracted.net) : "");
  const [payPeriod, setPayPeriod] = useState(extracted.payPeriod ?? "");
  const [editing, setEditing] = useState<string | null>(nothingExtracted ? "grossSalary" : null);

  return (
    <div className="pt-10">
      <h1 className="type-page-title text-text">
        {nothingExtracted ? "Enter your salary figures" : "Are these details correct?"}
      </h1>

      <p className="type-body mt-3 text-text-secondary">
        {nothingExtracted
          ? "We could not read this payslip automatically, so please enter the two figures yourself. You will find both near the bottom of the payslip."
          : "Check these against your payslip before we save them. You can correct anything that is wrong."}
      </p>

      {state.error ? (
        <p
          role="alert"
          className="mt-6 flex items-start gap-3 rounded-card border border-danger/30 px-4 py-3 type-secondary text-danger"
          style={{ backgroundColor: "color-mix(in srgb, var(--clarix-danger) 8%, transparent)" }}
        >
          <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden strokeWidth={2} />
          {state.error}
        </p>
      ) : null}

      <form action={formAction} className="mt-8">
        <input type="hidden" name="documentId" value={documentId} />

        <div className="divide-y divide-border rounded-feature border border-border bg-surface">
          <StaticRow label={employeeIdLabel} value={employeeId ?? "—"} />

          <AmountRow
            name="grossSalary"
            label="Gross salary"
            value={gross}
            onChange={setGross}
            editing={editing === "grossSalary"}
            onEdit={() => setEditing("grossSalary")}
            error={state.fieldErrors?.grossSalary}
            reduceMotion={Boolean(reduceMotion)}
          />

          <AmountRow
            name="netSalary"
            label="Net salary"
            value={net}
            onChange={setNet}
            editing={editing === "netSalary"}
            onEdit={() => setEditing("netSalary")}
            error={state.fieldErrors?.netSalary}
            reduceMotion={Boolean(reduceMotion)}
          />

          <TextRow
            name="payPeriod"
            label="Pay period"
            placeholder="e.g. August 2026"
            value={payPeriod}
            onChange={setPayPeriod}
            editing={editing === "payPeriod"}
            onEdit={() => setEditing("payPeriod")}
          />
        </div>

        <p className="mt-3 type-caption text-text-muted">
          Extracted from your payslip{filename ? ` (${filename})` : ""}. Clarix is not connected
          to payroll — these figures come only from the document you uploaded.
        </p>

        <Button type="submit" disabled={pending} className="mt-10 w-full">
          {pending ? "Saving…" : "Confirm and continue"}
          {pending ? null : <ArrowRight className="size-4" aria-hidden strokeWidth={2.5} />}
        </Button>
      </form>
    </div>
  );
}

function StaticRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-4">
      <span className="type-secondary text-text-secondary">{label}</span>
      <span className="type-card-title tabular text-text">{value}</span>
    </div>
  );
}

function AmountRow({
  name,
  label,
  value,
  onChange,
  editing,
  onEdit,
  error,
  reduceMotion,
}: {
  name: string;
  label: string;
  value: string;
  onChange: (next: string) => void;
  editing: boolean;
  onEdit: () => void;
  error?: string;
  reduceMotion: boolean;
}) {
  return (
    <div className="px-5 py-4">
      <div className="flex items-center justify-between gap-4">
        <label htmlFor={name} className="type-secondary text-text-secondary">
          {label}
        </label>

        {editing ? (
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={reduceMotion ? { duration: 0 } : springStandard}
            className="relative w-[190px]"
          >
            <span
              aria-hidden
              className="pointer-events-none absolute inset-y-0 left-3 flex items-center type-body text-text-muted"
            >
              {NAIRA}
            </span>
            <Input
              id={name}
              name={name}
              inputMode="decimal"
              autoFocus
              value={value}
              onChange={(event) => onChange(event.target.value.replace(/[^0-9.]/g, ""))}
              aria-invalid={Boolean(error)}
              className="h-11 pl-7 text-right type-card-title tabular"
            />
          </motion.div>
        ) : (
          <button
            type="button"
            onClick={onEdit}
            className="group flex items-center gap-2 rounded-card px-1 focus-visible:outline-2 focus-visible:outline-indigo focus-visible:outline-offset-2"
            aria-label={`Edit ${label}`}
          >
            <span className={cn("type-kpi tabular", value ? "text-text" : "text-text-muted")}>
              {value ? `${NAIRA}${formatAmount(Number(value))}` : "—"}
            </span>
            <Pencil
              aria-hidden
              strokeWidth={2}
              className="size-3.5 text-text-muted transition-colors duration-150 group-hover:text-text-secondary"
            />
          </button>
        )}
      </div>

      {/* Kept in the form even while the row is read-only, so the value always submits. */}
      {editing ? null : <input type="hidden" name={name} value={value} />}

      {error ? (
        <p role="alert" className="mt-2 type-caption text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function TextRow({
  name,
  label,
  placeholder,
  value,
  onChange,
  editing,
  onEdit,
}: {
  name: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (next: string) => void;
  editing: boolean;
  onEdit: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-4">
      <label htmlFor={name} className="type-secondary text-text-secondary">
        {label}
      </label>

      {editing ? (
        <Input
          id={name}
          name={name}
          autoFocus
          placeholder={placeholder}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-11 w-[190px] text-right"
        />
      ) : (
        <>
          <button
            type="button"
            onClick={onEdit}
            className="group flex items-center gap-2 rounded-card px-1 focus-visible:outline-2 focus-visible:outline-indigo focus-visible:outline-offset-2"
            aria-label={`Edit ${label}`}
          >
            <span className={cn("type-card-title", value ? "text-text" : "text-text-muted")}>
              {value || "Not set"}
            </span>
            <Pencil
              aria-hidden
              strokeWidth={2}
              className="size-3.5 text-text-muted transition-colors duration-150 group-hover:text-text-secondary"
            />
          </button>
          <input type="hidden" name={name} value={value} />
        </>
      )}
    </div>
  );
}
