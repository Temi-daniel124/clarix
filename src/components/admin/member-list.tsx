"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Search, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Input } from "@/components/ui/input";
import { formatNaira } from "@/lib/format";
import { filterMembers } from "@/lib/members";
import { memberCountLabel, memberCounts } from "@/lib/home-figures";
import { SegmentedControl } from "@/components/ui/segmented-control";
import type { MemberRow } from "@/lib/supabase/admin-members";

/**
 * Member Search / List (admin blueprint 5.1).
 *
 * "The screen an Officer or Admin uses most, day to day", so the search field is always visible
 * rather than behind a shortcut, and the full list is there before anybody types. Somebody who
 * does not know how a name is spelled should still be able to find it.
 *
 * Filtering happens here rather than in the database. The whole roster is already on the screen,
 * a cooperative has hundreds of members rather than millions, and a round trip per keystroke
 * would make the one screen used dozens of times a day the slowest one in the product.
 */
export function MemberList({
  members,
  canAddMember,
}: {
  members: MemberRow[];
  /**
   * Officer blueprint 5.1: the Add member action "only appears if this Officer has been granted
   * the add/import permission; without it, this screen is purely a lookup tool, and that's a
   * complete, honest state for it to be in rather than a lesser version of the Admin's screen".
   */
  canAddMember: boolean;
}) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"name" | "recent">("name");

  const filtered = useMemo(() => {
    const matched = filterMembers(members, query);

    if (sort === "recent") {
      return [...matched].sort((a, b) => (b.joinedAt ?? "").localeCompare(a.joinedAt ?? ""));
    }
    return matched;
  }, [members, query, sort]);

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
            placeholder="Search by name or staff ID"
            aria-label="Search members"
            className="pl-12"
          />
        </div>

        {canAddMember ? (
          <Button render={<Link href="/admin/members/new" />}>
            <Plus className="size-4" aria-hidden strokeWidth={2.5} />
            Add member
          </Button>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap items-baseline justify-between gap-4">
        <p className="type-secondary text-text-secondary">
          {filtered.length === members.length
            ? listSummary(members)
            : `${filtered.length} of ${members.length} shown`}
        </p>

        <SegmentedControl
          label="Sort members"
          segments={[
            { value: "name", label: "By name" },
            { value: "recent", label: "Recently joined" },
          ]}
          value={sort}
          onChange={setSort}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="mt-4 rounded-feature border border-border bg-surface px-6 py-10 text-center">
          <span
            aria-hidden
            className="mx-auto flex size-12 items-center justify-center rounded-card border border-border text-text-muted"
          >
            <UserPlus className="size-5" strokeWidth={1.75} />
          </span>
          <p className="type-body mt-5 text-text">
            {members.length === 0 ? "No members yet" : "Nobody matches that"}
          </p>
          <p className="type-secondary mx-auto mt-2 max-w-[420px] text-text-secondary">
            {members.length !== 0
              ? "Try part of a name, or the staff ID as it appears on a payslip."
              : canAddMember
                ? "Import your existing list or add somebody by hand, and they appear here."
                : "Nobody has been imported into this cooperative yet. Your admin adds members, and they appear here as soon as they do."}
          </p>
        </div>
      ) : (
        <>
          {/* Desktop: a table, because comparing figures down a column is the point. */}
          <div className="mt-4 hidden overflow-x-auto md:block">
            <table className="w-full min-w-[640px] border-collapse">
              <thead>
                <tr className="border-b border-border text-left">
                  <th scope="col" className="pb-3 pr-4 type-caption uppercase tracking-[0.08em] text-text-muted">
                    Name
                  </th>
                  <th scope="col" className="pb-3 pr-4 type-caption uppercase tracking-[0.08em] text-text-muted">
                    Staff ID
                  </th>
                  <th scope="col" className="pb-3 pr-4 text-right type-caption uppercase tracking-[0.08em] text-text-muted">
                    Savings
                  </th>
                  <th scope="col" className="pb-3 type-caption uppercase tracking-[0.08em] text-text-muted">
                    Loans
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((member) => (
                  <tr
                    key={member.membershipId ?? member.rosterId}
                    className="border-b border-border last:border-b-0"
                  >
                    <td className="py-3 pr-4">
                      <MemberName member={member} />
                    </td>
                    <td className="py-3 pr-4 type-secondary tabular text-text-secondary">
                      {member.employeeId ?? "Not on file"}
                    </td>
                    <td className="py-3 pr-4 text-right type-secondary tabular text-text">
                      {formatNaira(member.savingsBalance)}
                    </td>
                    <td className="py-3 type-secondary text-text-secondary">
                      {member.activeLoans > 0
                        ? `${member.activeLoans} active`
                        : member.status === "not_on_clarix"
                          ? "Not on Clarix"
                          : "None"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile: stacked cards, since a four-column table at 390px is unreadable. */}
          <ul className="mt-4 flex flex-col gap-3 md:hidden">
            {filtered.map((member) => (
              <li
                key={member.membershipId ?? member.rosterId}
                className="rounded-card border border-border bg-surface p-4"
              >
                <MemberName member={member} />
                <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1">
                  <div className="flex gap-2">
                    <dt className="type-caption text-text-muted">Staff ID</dt>
                    <dd className="type-caption tabular text-text-secondary">
                      {member.employeeId ?? "Not on file"}
                    </dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="type-caption text-text-muted">Savings</dt>
                    <dd className="type-caption tabular text-text">
                      {formatNaira(member.savingsBalance)}
                    </dd>
                  </div>
                  {member.activeLoans > 0 ? (
                    <div className="flex gap-2">
                      <dt className="type-caption text-text-muted">Loans</dt>
                      <dd className="type-caption text-text">{member.activeLoans} active</dd>
                    </div>
                  ) : null}
                </dl>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

/**
 * A member with an account is a link to their profile. A roster line is not: there is no profile
 * to open yet, and dressing it as tappable would promise a screen that cannot exist.
 */
function MemberName({ member }: { member: MemberRow }) {
  if (!member.membershipId) {
    return (
      <span className="flex flex-wrap items-center gap-2">
        <span className="type-body text-text-secondary">{member.name ?? "Unnamed"}</span>
        <Chip>Not on Clarix yet</Chip>
      </span>
    );
  }

  return (
    <Link
      href={`/admin/members/${member.membershipId}`}
      className="type-body font-medium text-text underline-offset-4 transition-colors duration-150 hover:text-emerald hover:underline focus-visible:outline-2 focus-visible:outline-indigo focus-visible:outline-offset-2"
    >
      {member.name ?? member.employeeId ?? "Member"}
      {member.status === "pending" ? (
        <span className="ml-2 type-caption font-normal text-text-muted">Applied, not approved</span>
      ) : null}
    </Link>
  );
}

/**
 * The header of the list, from the one member-count rule (BUILD-PLAN 0.5): "15 members, 8 on
 * Clarix". Rows that are not members yet (a pending application) or not active (suspended) are
 * still listed, so they are named beside the count rather than silently making the list longer
 * than its header.
 */
function listSummary(members: MemberRow[]): string {
  const counts = memberCounts({
    membershipStatuses: members.filter((member) => member.membershipId).map((member) => member.status),
    rosterNotOnClarix: members.filter((member) => member.status === "not_on_clarix").length,
  });

  const extras = [
    counts.pending > 0 ? `${counts.pending} asking to join` : null,
    counts.suspended > 0 ? `${counts.suspended} suspended` : null,
  ].filter(Boolean);

  return [memberCountLabel(counts), ...extras].join(" · ");
}
