"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, ScrollText, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { AUDIT_ACTION_LABELS, describeAction, type AuditEntry } from "@/lib/audit";
import { formatShortDateTime } from "@/lib/format";

/**
 * Cooperative Audit Log (admin blueprint 8.3).
 *
 * Reverse-chronological, with the filters the blueprint asks for and, for anything that changed a
 * value, the old figure beside the new one rather than a line saying a change occurred. A log
 * that only names its events is a log you can count; one that carries the values is a log you can
 * review, which is the whole purpose.
 *
 * Read-only, and not by restraint: `audit_log` has no insert, update or delete policy, so there
 * is no write path for this screen to withhold.
 */
export function AuditLogTable({
  entries,
  filters,
}: {
  entries: AuditEntry[];
  filters: { action?: string; from?: string; to?: string; query?: string };
}) {
  const router = useRouter();
  const [query, setQuery] = useState(filters.query ?? "");

  const apply = (next: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    const merged = { ...filters, ...next };

    for (const [key, value] of Object.entries(merged)) {
      if (value) params.set(key, value);
    }

    router.push(`/admin/audit${params.toString() ? `?${params}` : ""}`);
  };

  return (
    <div>
      <div className="flex flex-wrap items-end gap-4">
        <form
          className="relative min-w-[240px] flex-1"
          onSubmit={(event) => {
            event.preventDefault();
            apply({ query: query.trim() || undefined });
          }}
        >
          <Search
            aria-hidden
            strokeWidth={2}
            className="pointer-events-none absolute inset-y-0 left-4 my-auto size-4 text-text-muted"
          />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search member, staff or reason"
            aria-label="Search the audit log"
            className="pl-12"
          />
        </form>

        <div className="flex flex-col gap-2">
          <label htmlFor="audit-action" className="type-caption text-text-muted">
            Action
          </label>
          <select
            id="audit-action"
            value={filters.action ?? ""}
            onChange={(event) => apply({ action: event.target.value || undefined })}
            className="h-12 min-w-[180px] rounded-card border border-border bg-surface px-3 type-secondary text-text outline-none transition-[border-color] duration-150 focus-visible:border-indigo focus-visible:outline-2 focus-visible:outline-indigo focus-visible:outline-offset-1"
          >
            <option value="">Everything</option>
            {Object.entries(AUDIT_ACTION_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="audit-from" className="type-caption text-text-muted">
            From
          </label>
          <Input
            id="audit-from"
            type="date"
            value={filters.from ?? ""}
            onChange={(event) => apply({ from: event.target.value || undefined })}
            className="w-[170px]"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="audit-to" className="type-caption text-text-muted">
            To
          </label>
          <Input
            id="audit-to"
            type="date"
            value={filters.to ?? ""}
            onChange={(event) => apply({ to: event.target.value || undefined })}
            className="w-[170px]"
          />
        </div>
      </div>

      {entries.length === 0 ? (
        <div className="mt-8 rounded-feature border border-border bg-surface px-6 py-10 text-center">
          <span
            aria-hidden
            className="mx-auto flex size-12 items-center justify-center rounded-card border border-border text-text-muted"
          >
            <ScrollText className="size-5" strokeWidth={1.75} />
          </span>
          <p className="type-body mt-5 text-text">
            {filters.action || filters.from || filters.to || filters.query
              ? "Nothing matches those filters"
              : "Nothing recorded yet"}
          </p>
          <p className="type-secondary mx-auto mt-2 max-w-[440px] text-text-secondary">
            Loan decisions are recorded here as they are made, with the reason attached whenever
            one was required. Nothing in this log can be edited or removed, including by you.
          </p>
        </div>
      ) : (
        <>
          <p className="type-secondary mt-6 text-text-secondary">
            {entries.length} {entries.length === 1 ? "entry" : "entries"}
            {entries.length === 200 ? " (most recent 200)" : ""}
          </p>

          <ul className="mt-3 divide-y divide-border rounded-feature border border-border bg-surface">
            {entries.map((entry) => (
              <li key={entry.id} className="px-5 py-4">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <p className="type-card-title text-text">{describeAction(entry.action)}</p>
                  <p className="type-caption whitespace-nowrap text-text-muted">
                    {formatWhen(entry.createdAt)}
                  </p>
                </div>

                <p className="type-secondary mt-1 text-text-secondary">
                  {entry.actorName ?? entry.actorEmail ?? "A staff member"}
                  {entry.subjectName ? ` · ${entry.subjectName}` : ""}
                </p>

                {entry.changes.length > 0 ? (
                  <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
                    {entry.changes.map((change) => (
                      <div key={change.field} className="flex items-center gap-2">
                        <dt className="type-caption text-text-muted">{change.field}</dt>
                        <dd className="flex items-center gap-2 type-caption tabular text-text">
                          <span className="text-text-muted line-through">{change.from}</span>
                          <ArrowRight aria-hidden strokeWidth={2} className="size-3 text-text-muted" />
                          <span className="font-medium">{change.to}</span>
                        </dd>
                      </div>
                    ))}
                  </dl>
                ) : null}

                {entry.context.length > 0 ? (
                  <dl className="mt-2 flex flex-wrap gap-x-6 gap-y-1">
                    {entry.context.map((item) => (
                      <div key={item.field} className="flex items-center gap-2">
                        <dt className="type-caption text-text-muted">{item.field}</dt>
                        <dd className="type-caption tabular text-text-secondary">{item.value}</dd>
                      </div>
                    ))}
                  </dl>
                ) : null}

                {entry.note ? (
                  <p className="mt-3 rounded-card border border-border bg-background px-4 py-3 type-secondary text-text">
                    <span className="text-text-muted">Reason given: </span>
                    {entry.note}
                  </p>
                ) : null}

                {entry.subjectMembershipId ? (
                  <Link
                    href={`/admin/members/${entry.subjectMembershipId}`}
                    className="mt-3 inline-flex items-center gap-2 type-caption font-medium text-indigo underline-offset-4 transition-colors duration-150 hover:underline focus-visible:outline-2 focus-visible:outline-indigo focus-visible:outline-offset-2"
                  >
                    Open this member
                    <ArrowRight aria-hidden strokeWidth={2} className="size-3" />
                  </Link>
                ) : null}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

function formatWhen(iso: string): string {
  return formatShortDateTime(iso);
}
