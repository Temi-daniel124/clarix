"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Building2, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { invitePending, type DirectoryEntry } from "@/lib/platform";

/**
 * Cooperative Directory — super-admin blueprint 5.1.
 *
 * A table on desktop, a stacked list on mobile, and a search field and status filter above both.
 * Four columns, exactly the four the blueprint names: name, status, member count, and who runs
 * it. There is no column here that could carry a member's name or a figure of anybody's money —
 * the member column is a count, and the person named is the cooperative's staff Admin.
 *
 * Plain on purpose. This is the one part of Clarix the design system asks to read as calm
 * infrastructure, so a status is a small badge rather than a coloured card, and nothing animates
 * that did not need to.
 */
export function CooperativeDirectory({ entries }: { entries: DirectoryEntry[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return entries.filter((entry) => {
      if (filter !== "all" && entry.status !== filter) return false;
      if (!needle) return true;
      return (
        entry.name.toLowerCase().includes(needle) ||
        (entry.adminName ?? "").toLowerCase().includes(needle) ||
        (entry.adminEmail ?? "").toLowerCase().includes(needle)
      );
    });
  }, [entries, query, filter]);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[240px] flex-1">
          <Search
            aria-hidden
            strokeWidth={2}
            className="pointer-events-none absolute inset-y-0 left-4 my-auto size-4 text-text-muted"
          />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by cooperative or admin"
            aria-label="Search cooperatives"
            className="pl-11"
          />
        </div>

        <Button size="default" render={<Link href="/platform/cooperatives/new" />}>
          <Plus className="size-4" aria-hidden strokeWidth={2.5} />
          Create cooperative
        </Button>
      </div>

      <div className="mt-4 flex flex-wrap items-baseline justify-between gap-4">
        <p className="type-secondary text-text-secondary">
          {filtered.length === entries.length
            ? `${entries.length} ${entries.length === 1 ? "cooperative" : "cooperatives"}`
            : `${filtered.length} of ${entries.length}`}
        </p>

        <div className="flex items-center gap-1" role="group" aria-label="Filter by status">
          {(["all", "active", "inactive"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setFilter(option)}
              aria-pressed={filter === option}
              className={cn(
                "rounded-full px-3 py-1.5 type-caption transition-colors duration-150",
                "focus-visible:outline-2 focus-visible:outline-indigo focus-visible:outline-offset-2",
                filter === option
                  ? "bg-text/8 font-medium text-text"
                  : "text-text-muted hover:text-text",
              )}
            >
              {option === "all" ? "All" : option === "active" ? "Active" : "Inactive"}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="mt-4 rounded-feature border border-border bg-surface px-6 py-10 text-center">
          <span
            aria-hidden
            className="mx-auto flex size-12 items-center justify-center rounded-card border border-border text-text-muted"
          >
            <Building2 className="size-5" strokeWidth={1.75} />
          </span>
          <p className="type-body mt-5 text-text">
            {entries.length === 0 ? "No cooperatives yet" : "Nothing matches that"}
          </p>
          <p className="type-secondary mx-auto mt-2 max-w-[420px] text-text-secondary">
            {entries.length === 0
              ? "Creating one is the first step of its own onboarding: it gets a record here, and its admin gets an invitation."
              : "Try part of the cooperative's name, or the admin's name or address."}
          </p>
        </div>
      ) : (
        <>
          <div className="mt-4 hidden overflow-x-auto md:block">
            <table className="w-full min-w-[680px] border-collapse">
              <thead>
                <tr className="border-b border-border text-left">
                  {["Cooperative", "Status", "Members", "Admin"].map((heading) => (
                    <th
                      key={heading}
                      scope="col"
                      className="pb-3 pr-4 type-caption uppercase tracking-[0.08em] text-text-muted"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((entry) => (
                  <tr key={entry.id} className="border-b border-border last:border-b-0">
                    <td className="py-3.5 pr-4">
                      <Link
                        href={`/platform/cooperatives/${entry.id}`}
                        className="type-body text-text underline-offset-4 transition-colors duration-150 hover:text-emerald hover:underline focus-visible:outline-2 focus-visible:outline-indigo focus-visible:outline-offset-2"
                      >
                        {entry.name}
                      </Link>
                    </td>
                    <td className="py-3.5 pr-4">
                      <StatusBadge entry={entry} />
                    </td>
                    <td className="py-3.5 pr-4 type-secondary tabular text-text-secondary">
                      {entry.memberCount}
                    </td>
                    <td className="py-3.5 type-secondary text-text-secondary">
                      {entry.adminName ?? entry.adminEmail ?? "Nobody named yet"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="mt-4 divide-y divide-border rounded-feature border border-border bg-surface md:hidden">
            {filtered.map((entry) => (
              <li key={entry.id}>
                <Link
                  href={`/platform/cooperatives/${entry.id}`}
                  className="block px-5 py-4 transition-colors duration-150 hover:bg-background focus-visible:outline-2 focus-visible:outline-indigo focus-visible:-outline-offset-2"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <span className="type-card-title text-text">{entry.name}</span>
                    <StatusBadge entry={entry} />
                  </div>
                  <p className="type-secondary mt-1 text-text-secondary">
                    {entry.memberCount} {entry.memberCount === 1 ? "member" : "members"}
                    {" · "}
                    {entry.adminName ?? entry.adminEmail ?? "no admin named yet"}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

export function StatusBadge({ entry }: { entry: DirectoryEntry }) {
  const pending = invitePending(entry);
  const label = pending ? "Invite pending" : entry.status === "active" ? "Active" : "Inactive";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 type-caption font-medium",
        pending
          ? "border-warning/40 text-warning"
          : entry.status === "active"
            ? "border-emerald/40 text-emerald"
            : "border-border text-text-muted",
      )}
      style={
        pending
          ? { backgroundColor: "color-mix(in srgb, var(--clarix-warning) 10%, transparent)" }
          : entry.status === "active"
            ? { backgroundColor: "color-mix(in srgb, var(--clarix-brand-accent) 10%, transparent)" }
            : undefined
      }
    >
      {label}
    </span>
  );
}
