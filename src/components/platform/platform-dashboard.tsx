"use client";

import Link from "next/link";
import { ArrowRight, Building2, CircleCheck, Mail, ScrollText, Users } from "lucide-react";
import { KpiCardGrid, type KpiCard } from "@/components/clarix/kpi-card-grid";
import { cn } from "@/lib/utils";
import type { PlatformOverview } from "@/lib/platform";

/**
 * Platform Dashboard (super-admin blueprint 4.1).
 *
 * The same tap-to-expand KPI row every other dashboard uses, over four figures that are counts
 * rather than money. That is the constraint the whole role is built around: "without ever
 * surfacing a single member's financial detail, since none of that belongs at the platform
 * level". Total Employees in particular is a headcount and can only ever be one: the function
 * behind it returns a single integer, so there is no version of this screen that becomes a
 * directory of people.
 *
 * Nothing here is decorated beyond what it needs. This is the one part of Clarix the design
 * system asks to read as calm infrastructure rather than a consumer app.
 */

export type AttentionItem = {
  id: string;
  title: string;
  detail: string;
  href: string;
};

export type ActivityItem = {
  id: string;
  text: string;
  when: string;
};

export function PlatformDashboard({
  overview,
  attention,
  activity,
}: {
  overview: PlatformOverview;
  attention: AttentionItem[];
  activity: ActivityItem[];
}) {
  const cards: KpiCard[] = [
    {
      key: "total",
      label: "Cooperatives",
      icon: (props) => <Building2 {...props} />,
      value: overview.totalCooperatives,
      format: "count",
      accent: "var(--clarix-brand-secondary)",
      detail:
        overview.totalCooperatives === 0
          ? "No cooperative has been created yet. Creating one is the first step of its own onboarding."
          : "Every cooperative on the platform, active or not.",
    },
    {
      key: "active",
      label: "Active",
      icon: (props) => <CircleCheck {...props} />,
      value: overview.activeCooperatives,
      format: "count",
      accent: "var(--clarix-brand-accent)",
      detail:
        "Cooperatives currently operating. A deactivated one keeps its records and stops being reachable by its members.",
    },
    {
      key: "employees",
      label: "Employees",
      icon: (props) => <Users {...props} />,
      value: overview.employeeHeadcount,
      format: "count",
      accent: "var(--clarix-brand-primary)",
      detail:
        "Everyone across FMC Abeokuta with a Clarix account and a staff ID on file. A count, and only ever a count. This screen holds no list of people.",
    },
    {
      key: "invites",
      label: "Invites pending",
      icon: (props) => <Mail {...props} />,
      value: overview.pendingInvites,
      format: "count",
      accent: "var(--clarix-warning)",
      detail:
        overview.pendingInvites === 0
          ? "Every cooperative admin invitation has been taken up."
          : "Admin invitations sent but not yet accepted. Clarix cannot send the email itself until a sending domain is verified.",
    },
  ];

  return (
    <div className="mx-auto w-full max-w-[1000px] px-5 py-8 md:px-8 md:py-10">
      <h1 className="type-page-title text-text">Here&rsquo;s how Clarix looks today</h1>

      <div className="mt-8">
        <KpiCardGrid cards={cards} />
      </div>

      <section className="mt-12">
        <h2 className="type-section text-text">Attention required</h2>

        {attention.length === 0 ? (
          <div className="mt-4 rounded-feature border border-border bg-surface px-6 py-8">
            <p className="type-body text-text">Nothing needs you</p>
            <p className="type-secondary mt-2 max-w-[520px] text-text-secondary">
              Invitations nobody has taken up, and access requests still to activate, appear
              here.
            </p>
          </div>
        ) : (
          <ul className="mt-4 divide-y divide-border rounded-feature border border-border bg-surface">
            {attention.map((item) => (
              <li key={item.id}>
                <Link
                  href={item.href}
                  className="flex items-start gap-4 px-5 py-4 transition-colors duration-150 hover:bg-background focus-visible:outline-2 focus-visible:outline-indigo focus-visible:-outline-offset-2"
                >
                  <span
                    aria-hidden
                    className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-card border border-border text-text-muted"
                  >
                    <Mail className="size-[18px]" strokeWidth={1.75} />
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block type-card-title text-text">{item.title}</span>
                    <span className="mt-0.5 block type-secondary text-text-secondary">
                      {item.detail}
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
        )}
      </section>

      <section className="mt-12">
        <h2 className="type-caption uppercase tracking-[0.08em] text-text-muted">
          Recent platform activity
        </h2>

        {activity.length === 0 ? (
          <p className="type-secondary mt-3 max-w-[520px] text-text-secondary">
            Nothing has happened on the platform yet.
          </p>
        ) : (
          <ul className="mt-3 flex flex-col gap-3">
            {activity.map((item) => (
              <li key={item.id} className="flex items-baseline justify-between gap-4">
                <span className="type-secondary text-text">{item.text}</span>
                <span className="type-caption whitespace-nowrap text-text-muted">{item.when}</span>
              </li>
            ))}
          </ul>
        )}

        <p
          className={cn(
            "type-caption mt-5 max-w-[520px] text-text-muted",
            activity.length === 0 && "mt-3",
          )}
        >
          <ScrollText aria-hidden className="mr-1.5 inline size-3.5" strokeWidth={1.75} />
          Read from what the platform records about itself: cooperatives created, admins taking
          up their invitations, policy changes, and access requests. The full log is under Audit
          log.
        </p>
      </section>
    </div>
  );
}
