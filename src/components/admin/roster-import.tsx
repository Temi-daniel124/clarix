"use client";

import { useCallback, useMemo, useRef, useState, useTransition } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  Check,
  Download,
  FileSpreadsheet,
  Loader2,
  TriangleAlert,
  Upload,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { springStandard } from "@/lib/motion";
import { parseSpreadsheet, type ParsedSheet } from "@/lib/roster/parse";
import {
  ROSTER_FIELDS,
  ROSTER_FIELD_ORDER,
  countByStatus,
  duplicateMappings,
  guessMapping,
  parseAmount,
  prepareRows,
  type PreparedRow,
  type RosterField,
} from "@/lib/roster/mapping";
import { importRosterAction, type ImportResult } from "@/app/admin/actions";

/**
 * Member Roster Import (admin blueprint 2.4), and later 7.4.
 *
 * The blueprint is explicit that this is a sequence rather than an upload: read the file, map the
 * columns, look at every row, then commit exactly what was confirmed. Each of those stages is
 * visible here, in that order, and nothing is written until the last button.
 *
 * The file never leaves the admin's machine. Reading, mapping and validation all happen in the
 * browser, and only the rows they confirmed are sent, which keeps a spreadsheet full of IPPIS
 * numbers and savings balances out of every log, bucket and network hop that an upload would
 * have touched.
 */

type Stage = { label: string; done: boolean };

export function RosterImport({
  employeeIdPattern,
  cooperativeName,
}: {
  employeeIdPattern: string;
  cooperativeName: string;
}) {
  const reduceMotion = useReducedMotion();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();

  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stages, setStages] = useState<Stage[] | null>(null);
  const [sheet, setSheet] = useState<ParsedSheet | null>(null);
  const [mapping, setMapping] = useState<Record<RosterField, number | null> | null>(null);
  const [edits, setEdits] = useState<Record<number, Partial<PreparedRow>>>({});
  const [result, setResult] = useState<ImportResult | null>(null);

  const read = useCallback(
    async (candidate: File) => {
      setError(null);
      setFile(candidate);
      setStages([
        { label: "Reading file", done: false },
        { label: "Matching columns", done: false },
        { label: "Checking for duplicates", done: false },
      ]);

      try {
        const parsed = await parseSpreadsheet(candidate);

        if (parsed.headers.length === 0 || parsed.rows.length === 0) {
          throw new Error("empty");
        }

        setStages([
          { label: "Reading file", done: true },
          { label: "Matching columns", done: false },
          { label: "Checking for duplicates", done: false },
        ]);

        const guessed = guessMapping(parsed.headers);

        setStages([
          { label: "Reading file", done: true },
          { label: "Matching columns", done: true },
          { label: "Checking for duplicates", done: true },
        ]);

        setSheet(parsed);
        setMapping(guessed);
        setStages(null);
      } catch {
        setStages(null);
        setFile(null);
        setError(
          "We could not read that file. Clarix reads CSV and XLSX, if this came from another " +
            "program, save it as CSV and try again.",
        );
      }
    },
    [],
  );

  const rows = useMemo(() => {
    if (!sheet || !mapping) return [];
    const prepared = prepareRows(sheet.rows, mapping, { employeeIdPattern });

    return prepared.map((row) => {
      const edit = edits[row.index];
      if (!edit) return row;

      const merged = { ...row, ...edit };
      // A corrected row is re-validated rather than trusted: correcting one field must not let a
      // different problem through unnoticed.
      const revalidated = prepareRows(
        [[merged.employeeId, merged.name ?? "", String(merged.savingsBalance)]],
        { employeeId: 0, name: 1, savingsBalance: 2 },
        { employeeIdPattern },
      )[0];

      return { ...revalidated, index: row.index };
    });
  }, [sheet, mapping, edits, employeeIdPattern]);

  const counts = useMemo(() => countByStatus(rows), [rows]);
  const duplicates = mapping ? duplicateMappings(mapping) : [];
  const ready = rows.filter((row) => row.status !== "invalid");

  if (result?.imported) {
    return <ImportSummary result={result} cooperativeName={cooperativeName} />;
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="type-section text-text">Import members</h2>
        <Button type="button" variant="ghost" size="sm" onClick={downloadTemplate}>
          <Download className="size-4" aria-hidden strokeWidth={2} />
          Download a blank template
        </Button>
      </div>

      {error ? (
        <p
          role="alert"
          className="mt-5 flex items-start gap-3 rounded-card border border-danger/30 px-4 py-3 type-secondary text-danger"
          style={{ backgroundColor: "color-mix(in srgb, var(--clarix-danger) 8%, transparent)" }}
        >
          <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden strokeWidth={2} />
          {error}
        </p>
      ) : null}

      <AnimatePresence mode="wait" initial={false}>
        {stages ? (
          <motion.ul
            key="stages"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-6 flex flex-col gap-3 rounded-card border border-border bg-surface p-5"
          >
            {stages.map((stage) => (
              <li key={stage.label} className="flex items-center gap-3 type-body text-text">
                <span
                  aria-hidden
                  className={cn(
                    "flex size-6 shrink-0 items-center justify-center",
                    stage.done ? "text-emerald" : "text-text-muted",
                  )}
                >
                  {stage.done ? (
                    <Check className="size-4" strokeWidth={3} />
                  ) : (
                    <Loader2 className="size-4 animate-spin" strokeWidth={2.5} />
                  )}
                </span>
                {stage.label}
              </li>
            ))}
          </motion.ul>
        ) : sheet && mapping ? (
          <motion.div
            key="review"
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={reduceMotion ? { duration: 0 } : springStandard}
          >
            <div className="mt-6 flex items-center gap-4 rounded-card border border-border bg-surface p-4">
              <span
                aria-hidden
                className="flex size-11 shrink-0 items-center justify-center rounded-card text-emerald"
                style={{
                  backgroundColor:
                    "color-mix(in srgb, var(--clarix-brand-accent) 12%, transparent)",
                }}
              >
                <FileSpreadsheet className="size-5" strokeWidth={1.75} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="type-card-title truncate text-text">{file?.name}</p>
                <p className="type-caption text-text-muted">
                  {rows.length} {rows.length === 1 ? "row" : "rows"}, {sheet.headers.length} columns
                </p>
              </div>
              <Button
                size="icon"
                variant="ghost"
                aria-label="Choose a different file"
                onClick={() => {
                  setSheet(null);
                  setMapping(null);
                  setEdits({});
                  setFile(null);
                }}
              >
                <X className="size-4" strokeWidth={2} />
              </Button>
            </div>

            <ColumnMapping
              headers={sheet.headers}
              mapping={mapping}
              duplicates={duplicates}
              onChange={(field, index) => setMapping({ ...mapping, [field]: index })}
            />

            <RowReview
              rows={rows}
              counts={counts}
              onEdit={(index, patch) =>
                setEdits((current) => ({ ...current, [index]: { ...current[index], ...patch } }))
              }
            />

            {result?.error ? (
              <p role="alert" className="mt-5 type-secondary text-danger">
                {result.error}
              </p>
            ) : null}

            <div className="mt-8 border-t border-border pt-6">
              <Button
                type="button"
                disabled={pending || counts.ready + counts.needs_review === 0}
                onClick={() =>
                  startTransition(async () => {
                    const outcome = await importRosterAction(
                      ready.map((row) => ({
                        employeeId: row.employeeId,
                        name: row.name,
                        savingsBalance: row.savingsBalance,
                      })),
                    );
                    setResult(outcome);
                  })
                }
              >
                {pending
                  ? "Importing…"
                  : `Import ${ready.length} ${ready.length === 1 ? "member" : "members"}`}
              </Button>

              {counts.invalid > 0 ? (
                <p className="type-caption mt-3 text-text-secondary">
                  {counts.invalid} invalid {counts.invalid === 1 ? "row is" : "rows are"} left out.
                  Nothing about them is imported, and the rest are unaffected.
                </p>
              ) : null}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="dropzone"
            initial={false}
            className={cn(
              "mt-6 rounded-feature border-2 border-dashed p-10 text-center transition-colors duration-150 md:p-16",
              dragging ? "border-emerald bg-emerald/5" : "border-border bg-surface",
            )}
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDragging(false);
              const dropped = event.dataTransfer.files?.[0];
              if (dropped) void read(dropped);
            }}
          >
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex w-full flex-col items-center focus-visible:outline-2 focus-visible:outline-indigo focus-visible:outline-offset-4"
            >
              <span
                aria-hidden
                className="flex size-12 items-center justify-center rounded-card border border-border text-text-secondary"
              >
                <Upload className="size-5" strokeWidth={1.75} />
              </span>
              <span className="type-card-title mt-5 text-text">
                Choose your member list, or drag it here
              </span>
              <span className="type-caption mt-2 text-text-muted">
                CSV or XLSX. Nothing is uploaded. Clarix reads it here and only imports what you
                confirm.
              </span>
            </button>

            <input
              ref={inputRef}
              type="file"
              accept=".csv,text/csv,.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              className="hidden"
              onChange={(event) => {
                const chosen = event.target.files?.[0];
                if (chosen) void read(chosen);
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ColumnMapping({
  headers,
  mapping,
  duplicates,
  onChange,
}: {
  headers: string[];
  mapping: Record<RosterField, number | null>;
  duplicates: RosterField[];
  onChange: (field: RosterField, index: number | null) => void;
}) {
  return (
    <section className="mt-8">
      <h3 className="type-caption uppercase tracking-[0.08em] text-text-muted">
        Which column is which
      </h3>

      <div className="mt-3 divide-y divide-border rounded-feature border border-border bg-surface">
        {ROSTER_FIELD_ORDER.map((field) => {
          const index = mapping[field];
          const duplicated = duplicates.includes(field);

          return (
            <div key={field} className="flex flex-wrap items-center gap-4 px-5 py-4">
              <div className="min-w-0 flex-1">
                <p className="type-card-title text-text">{ROSTER_FIELDS[field].label}</p>
                <p className="type-caption text-text-muted">
                  {ROSTER_FIELDS[field].required ? "Required" : "Optional"}
                </p>
              </div>

              <select
                aria-label={`Source column for ${ROSTER_FIELDS[field].label}`}
                value={index === null ? "" : String(index)}
                onChange={(event) =>
                  onChange(field, event.target.value === "" ? null : Number(event.target.value))
                }
                className={cn(
                  "h-11 min-w-[190px] rounded-card border bg-surface px-3 type-secondary text-text",
                  "outline-none transition-[border-color] duration-150",
                  "focus-visible:border-indigo focus-visible:outline-2 focus-visible:outline-indigo focus-visible:outline-offset-1",
                  duplicated ? "border-warning" : "border-border",
                )}
              >
                <option value="">Not in this file</option>
                {headers.map((header, position) => (
                  <option key={`${header}-${position}`} value={position}>
                    {header || `Column ${position + 1}`}
                  </option>
                ))}
              </select>
            </div>
          );
        })}
      </div>

      {duplicates.length > 0 ? (
        <p
          role="status"
          className="mt-3 flex items-start gap-2 type-caption text-text-secondary"
        >
          <TriangleAlert aria-hidden strokeWidth={2} className="mt-px size-3.5 text-warning" />
          Two fields are reading the same column. Point one of them somewhere else before
          importing, or the same value lands in both.
        </p>
      ) : null}
    </section>
  );
}

function RowReview({
  rows,
  counts,
  onEdit,
}: {
  rows: PreparedRow[];
  counts: Record<PreparedRow["status"], number>;
  onEdit: (index: number, patch: Partial<PreparedRow>) => void;
}) {
  const [showing, setShowing] = useState<"all" | "attention">("attention");
  const attention = rows.filter((row) => row.status !== "ready");
  const visible = showing === "all" ? rows : attention;

  return (
    <section className="mt-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h3 className="type-caption uppercase tracking-[0.08em] text-text-muted">
          Every row, before anything is written
        </h3>

        {attention.length > 0 ? (
          <button
            type="button"
            onClick={() => setShowing(showing === "all" ? "attention" : "all")}
            className="type-secondary font-medium text-indigo underline-offset-4 transition-colors duration-150 hover:underline focus-visible:outline-2 focus-visible:outline-indigo focus-visible:outline-offset-2"
          >
            {showing === "all" ? "Show only rows needing attention" : `Show all ${rows.length} rows`}
          </button>
        ) : null}
      </div>

      <p className="type-body mt-3 tabular text-text">
        <span className="font-semibold text-emerald-700">{counts.ready} ready</span>
        {", "}
        <span className="font-semibold text-warning">{counts.needs_review} need review</span>
        {", "}
        <span className="font-semibold text-danger">{counts.invalid} invalid</span>
      </p>

      {visible.length === 0 ? (
        <p className="type-secondary mt-4 text-text-secondary">
          Nothing needs attention. Every row is ready to import.
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse">
            <thead>
              <tr className="border-b border-border text-left">
                <th scope="col" className="pb-3 pr-4 type-caption uppercase tracking-[0.08em] text-text-muted">
                  Row
                </th>
                <th scope="col" className="pb-3 type-caption uppercase tracking-[0.08em] text-text-muted">
                  Staff ID
                </th>
                <th scope="col" className="pb-3 type-caption uppercase tracking-[0.08em] text-text-muted">
                  Name
                </th>
                <th scope="col" className="pb-3 type-caption uppercase tracking-[0.08em] text-text-muted">
                  Savings
                </th>
                <th scope="col" className="pb-3 type-caption uppercase tracking-[0.08em] text-text-muted">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {visible.slice(0, 200).map((row) => (
                <tr key={row.index} className="border-b border-border last:border-b-0 align-top">
                  <td className="py-3 pr-4 type-secondary tabular text-text-muted">{row.index + 1}</td>
                  <td className="py-3 pr-3">
                    <Input
                      aria-label={`Staff ID, row ${row.index + 1}`}
                      value={row.employeeId}
                      onChange={(event) => onEdit(row.index, { employeeId: event.target.value })}
                      className="h-10 w-32 tabular"
                    />
                  </td>
                  <td className="py-3 pr-3">
                    <Input
                      aria-label={`Name, row ${row.index + 1}`}
                      value={row.name ?? ""}
                      onChange={(event) => onEdit(row.index, { name: event.target.value })}
                      className="h-10 w-44"
                    />
                  </td>
                  <td className="py-3 pr-3">
                    <Input
                      aria-label={`Savings, row ${row.index + 1}`}
                      value={String(row.savingsBalance)}
                      onChange={(event) =>
                        onEdit(row.index, {
                          savingsBalance: parseAmount(event.target.value) ?? 0,
                        })
                      }
                      className="h-10 w-32 tabular"
                    />
                  </td>
                  <td className="py-3">
                    <StatusBadge status={row.status} />
                    {row.issues.length > 0 ? (
                      <p className="type-caption mt-1 max-w-[240px] text-text-muted">
                        {row.issues[0]}
                      </p>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {visible.length > 200 ? (
            <p className="type-caption mt-3 text-text-muted">
              Showing the first 200 of {visible.length}. The count above covers all of them, and
              importing covers all of them.
            </p>
          ) : null}
        </div>
      )}
    </section>
  );
}

function StatusBadge({ status }: { status: PreparedRow["status"] }) {
  const tone =
    status === "ready"
      ? { label: "Ready", color: "var(--clarix-brand-accent)" }
      : status === "needs_review"
        ? { label: "Needs review", color: "var(--clarix-warning)" }
        : { label: "Invalid", color: "var(--clarix-danger)" };

  return (
    <span
      className="inline-flex items-center rounded-full px-3 py-1 type-caption font-medium"
      style={{
        backgroundColor: `color-mix(in srgb, ${tone.color} 14%, transparent)`,
        color: tone.color,
      }}
    >
      {tone.label}
    </span>
  );
}

function ImportSummary({
  result,
  cooperativeName,
}: {
  result: ImportResult;
  cooperativeName: string;
}) {
  return (
    <div className="rounded-feature border border-border bg-surface p-6 md:p-8">
      <span
        aria-hidden
        className="flex size-12 items-center justify-center rounded-card text-emerald"
        style={{ backgroundColor: "color-mix(in srgb, var(--clarix-brand-accent) 12%, transparent)" }}
      >
        <Check className="size-6" strokeWidth={2.5} />
      </span>

      <h2 className="type-page-title mt-5 text-text">
        {result.imported} {result.imported === 1 ? "member" : "members"} imported
      </h2>

      <p className="type-body mt-3 max-w-[540px] text-text-secondary">
        {cooperativeName} now holds all {result.imported} of them on its roster.{" "}
        {result.linked ? (
          <>
            {result.linked} already had a Clarix account and {result.linked === 1 ? "is" : "are"}{" "}
            a member from today, savings balance included.{" "}
          </>
        ) : null}
        {result.waiting ? (
          <>
            The other {result.waiting} are waiting: the moment each of them signs up and enters
            their staff ID, their membership and the balance you imported appear on their side
            automatically.
          </>
        ) : null}
      </p>
    </div>
  );
}

/** A blank CSV with the canonical headings, for a cooperative whose own sheet is too irregular. */
function downloadTemplate() {
  const csv = "Employee ID,Name,Savings Balance\n204817,Adaeze Obi,120000\n";
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "clarix-member-template.csv";
  link.click();
  URL.revokeObjectURL(url);
}
