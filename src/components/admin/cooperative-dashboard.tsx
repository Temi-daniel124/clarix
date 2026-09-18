"use client";

import Link from "next/link";
import { ArrowRight, Landmark, PiggyBank, Receipt, TriangleAlert, Users } from "lucide-react";
import { KpiCardGrid, type KpiCard } from "@/components/clarix/kpi-card-grid";
import { cn } from "@/lib/utils";
import { formatDayMonthTime, formatNaira } from "@/lib/format";
import type { AttentionItem, CooperativeSummary } from "@/lib/supabase/admin-members";

/**
 * The Cooperative Dashboard (admin blueprint 4.1).
 *
 * Same tap-to-expand KPI row as the employee dashboard, through the same component, over the
 * four figures that matter to a cooperative rather than to a person. Then the section the
 * blueprint calls this screen's defining feature, and which the employee side has no equivalent
 * of: what is actually waiting on this admin right now.
 */
export function CooperativeDashboard({
  cooperativeName,
  summary,
  firstName,
}: {
  cooperativeName: string;
  summary: CooperativeSummary;
  firstName: string | null;
}) {
  const cards: KpiCard[] = [
    {
      key: "members",
      label: "Members",
      icon: (props) => <Users {...props} />,
      value: summary.memberCount,
      format: "count",
      accent: "var(--clarix-brand-secondary)",
      detail:
        summary.rosterWaiting > 0
          ? `${summary.rosterWaiting} more ${summary.rosterWaiting === 1 ? "person is" : "people are"} on your roster but have not joined Clarix yet. They appear here the day they do.`
          : "Everyone on your roster holds a Clarix account.",
    },
    {
      key: "savings",
      label: "Savings held",
      icon: (props) => <PiggyBank {...props} />,
      value: summary.savingsHeld,
      accent: "var(--clarix-brand-accent)",
      detail:
        summary.savingsHeld > 0
          ? "The total your members hold with this cooperative, added up from the entries your staff have recorded."
          : "Nothing recorded yet. Record a contribution against a member and this figure follows.",
    },
    {
      key: "loans",
      label: "Active loans",
      icon: (props) => <Receipt {...props} />,
      value: summary.activeLoans,
      format: "count",
      accent: "var(--clarix-brand-primary)",
      detail:
        summary.monthlyDeductions > 0
          ? `${formatNaira(summary.monthlyDeductions)} a month is being deducted across them.`
          : "No loan here is being repaid at the moment.",
    },
    {
      key: "pending",
      label: "Waiting on you",
      icon: (props) => <TriangleAlert {...props} />,
      value: summary.pendingApplications,
      format: "count",
      accent:
        summary.pendingApplications > 0
          ? "var(--clarix-warning)"
          : "var(--clarix-text-muted)",
      detail:
        summary.pendingApplications > 0
          ? "Applications holding a member's capacity while they wait for a decision from you."
          : "No application is waiting on a decision.",
    },
  ];

  return (
    <div className="mx-auto w-full max-w-[1100px] px-5 py-8 md:px-8 md:py-10">
      <header className="mt-2">
        <h1 className="type-page-title text-text">
          {greeting()}
          {firstName ? `, ${firstName}` : ""}, here is {cooperativeName} today.
        </h1>
      </header>

      <section
        className="mt-8 rounded-feature border border-border bg-background p-4 md:p-5"
        aria-labelledby="cooperative-figures"
      >
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-1 pb-4">
          <h2
            id="cooperative-figures"
            className="type-caption uppercase tracking-[0.08em] text-text-muted"
          >
            This cooperative
          </h2>
          <p className="type-caption text-text-muted">
            {summary.lastRecordedAt
              ? `Last entry recorded ${formatDate(summary.lastRecordedAt)}`
              : "No entries recorded yet"}
          </p>
        </div>

        <KpiCardGrid cards={cards} />
      </section>

      <AttentionRequired items={summary.attention} />

      <section className="mt-10">
        <h2 className="type-caption uppercase tracking-[0.08em] text-text-muted">This month</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          {summary.thisMonth.map((card) => (
            <div key={card.label} className="rounded-card border border-border bg-surface p-5">
              <p className="type-caption uppercase tracking-[0.06em] text-text-muted">
                {card.label}
              </p>
              <p className="type-body mt-2 text-text">{card.body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

/**
 * "Attention required": the blueprint's words for what makes this screen worth returning to.
 *
 * When it is empty it says so rather than disappearing, because an admin needs to know the
 * difference between "nothing is waiting" and "this section did not load". Nothing is ever
 * invented to fill it: at a cooperative where no application has been submitted, an empty list
 * is the true answer.
 */
function AttentionRequired({ items }: { items: AttentionItem[] }) {
  return (
    <section className="mt-10">
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <h2 className="type-section text-text">Attention required</h2>
        {items.length > 0 ? (
          <p className="type-secondary text-text-secondary">
            {items.length} {items.length === 1 ? "item" : "items"}
          </p>
        ) : null}
      </div>

      {items.length === 0 ? (
        <div className="mt-4 rounded-feature border border-border bg-surface px-6 py-8">
          <p className="type-body text-text">Nothing is waiting on you.</p>
          <p className="type-secondary mt-2 max-w-[520px] text-text-secondary">
            Loan applications your members submit, anyone imported without a name, and officers
            who have not taken up an invitation all appear here. None of those is outstanding
            today.
          </p>
        </div>
      ) : (
        <ul className="mt-4 divide-y divide-border rounded-feature border border-border bg-surface">
          {items.map((item) => (
            <li key={item.id}>
              <AttentionRow item={item} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function AttentionRow({ item }: { item: AttentionItem }) {
  const body = (
    <>
      <span
        aria-hidden
        className={cn(
          "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-card border",
          item.urgent ? "border-warning/40 text-warning" : "border-border text-text-muted",
        )}
        style={
          item.urgent
            ? { backgroundColor: "color-mix(in srgb, var(--clarix-warning) 12%, transparent)" }
            : undefined
        }
      >
        {item.kind === "application" ? (
          <Receipt className="size-4" strokeWidth={1.75} />
        ) : item.kind === "roster" ? (
          <Users className="size-4" strokeWidth={1.75} />
        ) : (
          <Landmark className="size-4" strokeWidth={1.75} />
        )}
      </span>

      <span className="min-w-0 flex-1">
        <span className="block type-body font-medium text-text">{item.title}</span>
        <span className="mt-1 block type-secondary text-text-secondary">{item.detail}</span>
        {item.waitingDays !== null && item.kind === "application" ? (
          <span className="mt-1 block type-caption text-text-muted">
            Waiting {item.waitingDays === 0 ? "since today" : `${item.waitingDays} ${item.waitingDays === 1 ? "day" : "days"}`}
          </span>
        ) : null}
      </span>

      {item.href ? (
        <ArrowRight aria-hidden strokeWidth={2} className="mt-1 size-4 shrink-0 text-text-muted" />
      ) : null}
    </>
  );

  if (!item.href) {
    return <div className="flex items-start gap-4 px-5 py-4">{body}</div>;
  }

  return (
    <Link
      href={item.href}
      className="flex items-start gap-4 px-5 py-4 transition-colors duration-150 hover:bg-background focus-visible:outline-2 focus-visible:outline-indigo focus-visible:-outline-offset-2"
    >
      {body}
    </Link>
  );
}

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function formatDate(iso: string): string {
  return formatDayMonthTime(iso);
}
