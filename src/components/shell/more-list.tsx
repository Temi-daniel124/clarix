import Link from "next/link";
import { ArrowLeftRight, ChevronRight, LogOut, type LucideIcon } from "lucide-react";
import { signOutAction } from "@/app/shell-actions";

/**
 * "More" on phones (DESIGN_SYSTEM §5.5): what the desktop sidebar and its account menu hold,
 * as iOS-style grouped lists (§5.3). One component for every role so the four can never drift.
 */

export type MoreEntry = { href: string; label: string; icon: LucideIcon };
export type MoreGroup = { label?: string; entries: MoreEntry[] };

export function MoreScreen({
  groups,
  otherView,
}: {
  groups: MoreGroup[];
  otherView: { href: string; label: string } | null;
}) {
  return (
    <div className="mx-auto w-full max-w-[560px] px-5 py-8 md:px-6">
      <h1 className="type-title text-ink-900">More</h1>

      {groups.map((group, index) => (
        <section key={group.label ?? index} className="mt-8">
          {group.label ? <h2 className="type-small mb-2 px-4 text-ink-500">{group.label}</h2> : null}
          <ul className="overflow-hidden rounded-md border border-hairline bg-surface">
            {group.entries.map((entry) => (
              <li key={entry.href} className="group/row">
                <Row href={entry.href} label={entry.label} icon={entry.icon} />
              </li>
            ))}
          </ul>
        </section>
      ))}

      <ul className="mt-8 overflow-hidden rounded-md border border-hairline bg-surface">
        {otherView ? (
          <li className="group/row">
            <Row href={otherView.href} label={otherView.label} icon={ArrowLeftRight} />
          </li>
        ) : null}
        <li className="group/row">
          <form action={signOutAction}>
            <button type="submit" className="flex h-[52px] w-full items-center gap-4 pl-4 text-left transition-colors duration-[var(--duration-quick)] ease-[var(--ease-quick)] active:bg-surface-sunken">
              <LogOut aria-hidden className="size-5 shrink-0 text-ink-500" strokeWidth={1.75} />
              <span className="type-body flex h-full flex-1 items-center border-hairline pr-4 text-ink-900 group-[:not(:first-child)]/row:border-t">
                Sign out
              </span>
            </button>
          </form>
        </li>
      </ul>
    </div>
  );
}

/** A one-line row, 52px; the hairline between rows starts at the label, inset 16px (§5.3). */
function Row({ href, label, icon: Icon }: MoreEntry) {
  return (
    <Link
      href={href}
      className="flex h-[52px] items-center gap-4 pl-4 transition-colors duration-[var(--duration-quick)] ease-[var(--ease-quick)] hover:bg-surface-sunken active:bg-surface-sunken"
    >
      <Icon aria-hidden className="size-5 shrink-0 text-ink-500" strokeWidth={1.75} />
      <span className="flex h-full min-w-0 flex-1 items-center gap-4 border-hairline pr-4 group-[:not(:first-child)]/row:border-t">
        <span className="type-body flex-1 truncate text-ink-900">{label}</span>
        <ChevronRight aria-hidden className="size-4 shrink-0 text-ink-500" strokeWidth={1.75} />
      </span>
    </Link>
  );
}
