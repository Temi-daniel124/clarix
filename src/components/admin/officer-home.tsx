"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, ClipboardList, Search, TriangleAlert, UserRound } from "lucide-react";
import { Input } from "@/components/ui/input";
import { RollingNumber } from "@/components/clarix/rolling-number";
import { cn } from "@/lib/utils";
import { formatNaira } from "@/lib/format";
import { filterMembers } from "@/lib/members";
import type { MemberRow } from "@/lib/supabase/admin-members";
import type { OfficerTask } from "@/lib/supabase/officer-home";

/**
 * Officer Home — officer blueprint 4.1.
 *
 * Not a smaller cooperative dashboard. The blueprint builds this screen around "the two things
 * their job actually consists of: finding a member fast, and seeing what's currently waiting on
 * them", which is why the search field sits above everything — "higher up than on the Admin's
 * dashboard, since this is genuinely the Officer's most common single action" — and why there is
 * no KPI row: total savings held and total membership are cooperative-wide figures, and those
 * belong to the person who runs the cooperative rather than the person who works in it.
 *
 * The task list adapts to what this officer can actually act on. Somebody who cannot decide loans
 * is not shown a queue of decisions; they are told plainly what would appear there instead. The
 * alternative — showing every officer the same list and letting the refusal happen on the next
 * screen — would be the interface making a promise the database then breaks.
 */
export function OfficerHome({
  cooperativeName,
  firstName,
  members,
  tasks,
  canApproveLoans,
  recordedToday,
  applicationsToday,
}: {
  cooperativeName: string;
  firstName: string | null;
  members: MemberRow[];
  tasks: OfficerTask[];
  canApproveLoans: boolean;
  recordedToday: number;
  applicationsToday: number;
}) {
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const needle = query.trim();
    if (!needle) return [];
    return filterMembers(members, needle).slice(0, 6);
  }, [members, query]);

  return (
    <div className="mx-auto w-full max-w-[880px] px-5 py-8 md:px-8 md:py-10">
      <h1 className="type-page-title text-text">
        {greeting()}
        {firstName ? `, ${firstName}` : ""} — here&rsquo;s what&rsquo;s waiting at{" "}
        {cooperativeName}
      </h1>

      <div className="relative mt-6">
        <Search
          aria-hidden
          strokeWidth={2}
          className="pointer-events-none absolute inset-y-0 left-4 my-auto size-4 text-text-muted"
        />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Find a member by name or staff ID"
          aria-label="Find a member"
          className="h-14 pl-11 type-body"
        />
      </div>

      {query.trim() ? (
        <div className="mt-2 overflow-hidden rounded-feature border border-border bg-surface">
          {results.length === 0 ? (
            <p className="px-5 py-4 type-secondary text-text-secondary">
              Nobody at {cooperativeName} matches that. Staff IDs are matched exactly as they were
              imported.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {results.map((member) => (
                <li key={member.membershipId ?? member.rosterId}>
                  <MemberResult member={member} />
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}

      <section className="mt-10">
        <h2 className="type-section text-text">Your pending tasks</h2>

        {canApproveLoans ? (
          tasks.length > 0 ? (
            <ul className="mt-4 divide-y divide-border rounded-feature border border-border bg-surface">
              {tasks.map((task) => (
                <li key={task.id}>
                  <Link
                    href={task.href}
                    className="flex items-start gap-4 px-5 py-4 transition-colors duration-150 hover:bg-background focus-visible:outline-2 focus-visible:outline-indigo focus-visible:-outline-offset-2"
                  >
                    <span
                      aria-hidden
                      className={cn(
                        "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-card border",
                        task.urgent
                          ? "border-warning/40 text-warning"
                          : "border-border text-text-muted",
                      )}
                      style={
                        task.urgent
                          ? {
                              backgroundColor:
                                "color-mix(in srgb, var(--clarix-warning) 12%, transparent)",
                            }
                          : undefined
                      }
                    >
                      {task.urgent ? (
                        <TriangleAlert className="size-[18px]" strokeWidth={1.75} />
                      ) : (
                        <ClipboardList className="size-[18px]" strokeWidth={1.75} />
                      )}
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block type-card-title text-text">{task.title}</span>
                      <span className="mt-0.5 block type-secondary text-text-secondary">
                        {task.detail}
                      </span>
                    </span>

                    <ArrowRight
                      aria-hidden
                      strokeWidth={2}
                      className="mt-2 size-4 shrink-0 text-text-muted"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyTasks
              title="Nothing is waiting on you"
              body={`No application at ${cooperativeName} is sitting unanswered. When one arrives it appears here, with the ones whose capacity hold is about to lapse first.`}
            />
          )
        ) : (
          <EmptyTasks
            title="Nothing is waiting on you"
            body="This list holds the applications you started on a member's behalf, until somebody with approval permission decides them. Starting an application for a member is not built yet, so there is nothing here — members apply for themselves in the meantime."
          />
        )}
      </section>

      <section className="mt-10">
        <h2 className="type-caption uppercase tracking-[0.08em] text-text-muted">Today</h2>

        <div className="mt-2 grid gap-px overflow-hidden rounded-feature border border-border bg-border sm:grid-cols-2">
          <TodayFigure
            value={recordedToday}
            label={recordedToday === 1 ? "member recorded against" : "members recorded against"}
            note="Contributions and repayments you entered today."
          />
          <TodayFigure
            value={applicationsToday}
            label={applicationsToday === 1 ? "application received" : "applications received"}
            note={`Started today at ${cooperativeName}, by anyone.`}
          />
        </div>
      </section>
    </div>
  );
}

function MemberResult({ member }: { member: MemberRow }) {
  const body = (
    <>
      <span
        aria-hidden
        className="flex size-9 shrink-0 items-center justify-center rounded-card border border-border text-text-muted"
      >
        <UserRound className="size-[18px]" strokeWidth={1.75} />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate type-body text-text">
          {member.name ?? member.employeeId ?? "Unnamed member"}
        </span>
        <span className="mt-0.5 block type-caption text-text-muted">
          {member.employeeId ? `Staff ID ${member.employeeId}` : "No staff ID on file"}
          {member.status === "not_on_clarix" ? " · not on Clarix yet" : ""}
        </span>
      </span>

      <span className="shrink-0 type-secondary tabular text-text-secondary">
        {formatNaira(member.savingsBalance)}
      </span>
    </>
  );

  // A roster entry has no profile to open — that person has not signed up yet, and inventing a
  // link to a screen that would 404 is worse than showing them as findable but not openable.
  if (!member.membershipId) {
    return <span className="flex items-center gap-4 px-5 py-3.5">{body}</span>;
  }

  return (
    <Link
      href={`/admin/members/${member.membershipId}`}
      className="flex items-center gap-4 px-5 py-3.5 transition-colors duration-150 hover:bg-background focus-visible:outline-2 focus-visible:outline-indigo focus-visible:-outline-offset-2"
    >
      {body}
    </Link>
  );
}

function EmptyTasks({ title, body }: { title: string; body: string }) {
  return (
    <div className="mt-4 rounded-feature border border-border bg-surface px-6 py-8">
      <p className="type-body text-text">{title}</p>
      <p className="type-secondary mt-2 max-w-[520px] text-text-secondary">{body}</p>
    </div>
  );
}

function TodayFigure({
  value,
  label,
  note,
}: {
  value: number;
  label: string;
  note: string;
}) {
  return (
    <div className="bg-surface px-5 py-5">
      <p className="flex items-baseline gap-2">
        <RollingNumber
          value={value}
          prefix=""
          className="type-kpi text-text"
          ariaLabel={`${value} ${label}`}
        />
        <span className="type-secondary text-text-secondary">{label}</span>
      </p>
      <p className="type-caption mt-1 text-text-muted">{note}</p>
    </div>
  );
}

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}
