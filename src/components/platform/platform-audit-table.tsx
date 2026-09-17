"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ScrollText, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  PLATFORM_ACTION_LABELS,
  describePlatformAction,
  fieldLabel,
  type PlatformEvent,
} from "@/lib/platform-audit";

/**
 * Platform Audit Log (super-admin blueprint 7.1).
 *
 * Reverse-chronological, with a date range and an action filter, and, for anything that changed
 * a value: the old figure beside the new one. A log that only names its events is a log you can
 * count; one that carries the values is a log you can review, which is the point when the value
 * in question is the percentage every member's borrowing limit is computed from.
 *
 * Read-only, and not by restraint: `audit_log` has no insert, update or delete policy, so there
 * is no write path for this screen to withhold. What it does not carry is any cooperative's own
 * entries, migration 023 admits a platform admin to rows with no cooperative and nothing else,
 * which is the same boundary that keeps this role away from member data everywhere.
 */
export function PlatformAuditTable({
  events,
  filters,
}: {
  events: PlatformEvent[];
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

    router.push(`/platform/audit${params.toString() ? `?${params}` : ""}`);
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
            placeholder="Search by operator, cooperative or value"
            aria-label="Search the platform audit log"
            className="pl-11"
          />
        </form>

        <div className="flex flex-col gap-2">
          <label htmlFor="platform-action" className="type-caption text-text-muted">
            Action
          </label>
          <select
            id="platform-action"
            value={filters.action ?? ""}
            onChange={(event) => apply({ action: event.target.value || undefined })}
            className="h-12 min-w-[200px] rounded-card border border-border bg-surface px-3 type-secondary text-text outline-none transition-[border-color] duration-150 focus-visible:border-indigo focus-visible:outline-2 focus-visible:outline-indigo focus-visible:outline-offset-1"
          >
            <option value="">Everything</option>
            {Object.entries(PLATFORM_ACTION_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="platform-from" className="type-caption text-text-muted">
            From
          </label>
          <Input
            id="platform-from"
            type="date"
            value={filters.from ?? ""}
            onChange={(event) => apply({ from: event.target.value || undefined })}
            className="w-[170px]"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="platform-to" className="type-caption text-text-muted">
            To
          </label>
          <Input
            id="platform-to"
            type="date"
            value={filters.to ?? ""}
            onChange={(event) => apply({ to: event.target.value || undefined })}
            className="w-[170px]"
          />
        </div>
      </div>

      {events.length === 0 ? (
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
          <p className="type-secondary mx-auto mt-2 max-w-[460px] text-text-secondary">
            Cooperatives created and deactivated, the deduction policy changed, platform admins
            added or removed. Nothing here can be edited or removed, including by you. A
            cooperative&rsquo;s own records are not in this log and are not readable from this
            account.
          </p>
        </div>
      ) : (
        <>
          <p className="type-secondary mt-6 text-text-secondary">
            {events.length} {events.length === 1 ? "event" : "events"}
            {events.length === 200 ? " (most recent 200)" : ""}
          </p>

          <ul className="mt-3 divide-y divide-border rounded-feature border border-border bg-surface">
            {events.map((event) => (
              <li key={event.id} className="px-5 py-4">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <p className="type-card-title text-text">{describePlatformAction(event.action)}</p>
                  <p className="type-caption whitespace-nowrap text-text-muted">
                    {formatWhen(event.createdAt)}
                  </p>
                </div>

                <p className="type-secondary mt-1 text-text-secondary">
                  {event.actorName ?? event.actorEmail ?? "A platform admin"}
                </p>

                {event.changes.length > 0 ? (
                  <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
                    {event.changes.map((change) => (
                      <div key={change.field} className="flex items-center gap-2">
                        <dt className="type-caption text-text-muted">{fieldLabel(change.field)}</dt>
                        <dd className="flex items-center gap-1.5 type-caption tabular text-text">
                          <span className="text-text-muted line-through">{change.from}</span>
                          <ArrowRight aria-hidden strokeWidth={2} className="size-3 text-text-muted" />
                          <span className="font-medium">{change.to}</span>
                        </dd>
                      </div>
                    ))}
                  </dl>
                ) : null}

                {event.context.length > 0 ? (
                  <dl className="mt-2 flex flex-wrap gap-x-6 gap-y-1">
                    {event.context.map((item) => (
                      <div key={item.field} className="flex items-center gap-2">
                        <dt className="type-caption text-text-muted">{fieldLabel(item.field)}</dt>
                        <dd className="type-caption tabular text-text-secondary">{item.value}</dd>
                      </div>
                    ))}
                  </dl>
                ) : null}

                {event.note ? (
                  <p className="mt-3 rounded-card border border-border bg-background px-4 py-3 type-secondary text-text">
                    {event.note}
                  </p>
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
  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}
