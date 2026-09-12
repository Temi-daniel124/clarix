import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { ADMIN_ACCOUNT, ADMIN_MANAGE } from "@/components/admin-shell/destinations";

export const metadata: Metadata = { title: "More" };

/**
 * "More" — admin blueprint Part 3, mobile only.
 *
 * A space-saving device rather than a fifth area: it holds exactly what the desktop sidebar
 * shows directly, in the same order, so the two densities never become two different products.
 */
export default function AdminMorePage() {
  return (
    <div className="mx-auto w-full max-w-[560px] px-5 py-8 md:px-8 md:py-10">
      <h1 className="type-page-title text-text">More</h1>

      <h2 className="type-caption mt-8 uppercase tracking-[0.08em] text-text-muted">
        Manage cooperative
      </h2>
      <Rows entries={ADMIN_MANAGE} />

      <h2 className="type-caption mt-8 uppercase tracking-[0.08em] text-text-muted">Account</h2>
      <Rows entries={ADMIN_ACCOUNT} />
    </div>
  );
}

function Rows({ entries }: { entries: typeof ADMIN_MANAGE }) {
  return (
    <ul className="mt-2 divide-y divide-border rounded-feature border border-border bg-surface">
      {entries.map((entry) => {
        const Icon = entry.icon;

        return (
          <li key={entry.href}>
            <Link
              href={entry.href}
              className="flex items-center gap-4 px-5 py-4 transition-colors duration-150 hover:bg-background focus-visible:outline-2 focus-visible:outline-indigo focus-visible:-outline-offset-2"
            >
              <span aria-hidden className="text-text-muted">
                <Icon className="size-5" strokeWidth={1.75} />
              </span>
              <span className="flex-1 type-body text-text">{entry.label}</span>
              <ChevronRight aria-hidden strokeWidth={2} className="size-4 text-text-muted" />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
