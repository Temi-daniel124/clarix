"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Ellipsis } from "lucide-react";
import { cn } from "@/lib/utils";
import { Wordmark } from "@/components/clarix/wordmark";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import {
  DESTINATIONS,
  PRIMARY_DESTINATIONS,
  SECONDARY_DESTINATIONS,
  isActive,
} from "./destinations";

/**
 * The persistent navigation — blueprint Part 3.
 *
 * Sidebar on desktop, bottom tab bar on mobile, both generated from the same destination list so
 * the two can never drift into separate information architectures.
 *
 * The active entry is distinguished by a filled treatment and full-strength label; the rest are
 * outlined and muted, as the blueprint specifies. Icon fill is expressed as a tinted rounded
 * plate rather than by swapping to a different icon set, since lucide is the only icon source
 * (DECISIONS.md D013) and it has no filled variants.
 */

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-[248px] shrink-0 flex-col border-r border-border bg-surface md:flex">
      <div className="px-6 py-6">
        <Link href="/dashboard" aria-label="Clarix home">
          <Wordmark />
        </Link>
      </div>

      <nav aria-label="Main" className="flex-1 px-3">
        <ul className="flex flex-col gap-1">
          {DESTINATIONS.map((destination) => {
            const active = isActive(pathname, destination);
            const Icon = destination.icon;

            return (
              <li key={destination.href}>
                <Link
                  href={destination.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-card px-3 py-2.5 type-body transition-colors duration-150",
                    "focus-visible:outline-2 focus-visible:outline-indigo focus-visible:outline-offset-2",
                    active
                      ? "bg-background font-medium text-text"
                      : "text-text-secondary hover:bg-background hover:text-text",
                  )}
                >
                  <span
                    aria-hidden
                    className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded-card transition-colors duration-150",
                      active ? "text-emerald" : "text-text-muted",
                    )}
                    style={
                      active
                        ? {
                            backgroundColor:
                              "color-mix(in srgb, var(--clarix-brand-accent) 12%, transparent)",
                          }
                        : undefined
                    }
                  >
                    <Icon className="size-[18px]" strokeWidth={active ? 2.25 : 1.75} />
                  </span>
                  {destination.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-4">
        <span className="type-caption text-text-muted">Appearance</span>
        <ThemeToggle />
      </div>
    </aside>
  );
}

export function AppBottomTabs() {
  const pathname = usePathname();
  const moreActive = SECONDARY_DESTINATIONS.some((entry) => pathname.startsWith(entry.href));

  return (
    <nav
      aria-label="Main"
      /* pb-[env(safe-area-inset-bottom)] keeps the bar clear of the home indicator on iOS,
         which DESIGN_SYSTEM.md § PWA app-shell behavior requires of every fixed element. */
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 backdrop-blur-lg md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="flex items-stretch">
        {PRIMARY_DESTINATIONS.map((destination) => {
          const active = isActive(pathname, destination);
          const Icon = destination.icon;

          return (
            <li key={destination.href} className="flex-1">
              <Link
                href={destination.href}
                aria-current={active ? "page" : undefined}
                className="flex flex-col items-center gap-1 px-1 py-2.5 focus-visible:outline-2 focus-visible:outline-indigo"
              >
                <span
                  aria-hidden
                  className={cn(
                    "flex h-7 w-12 items-center justify-center rounded-full transition-colors duration-150",
                    active ? "text-emerald" : "text-text-muted",
                  )}
                  style={
                    active
                      ? {
                          backgroundColor:
                            "color-mix(in srgb, var(--clarix-brand-accent) 14%, transparent)",
                        }
                      : undefined
                  }
                >
                  <Icon className="size-[18px]" strokeWidth={active ? 2.25 : 1.75} />
                </span>
                <span
                  className={cn(
                    "type-caption",
                    active ? "font-medium text-text" : "text-text-muted",
                  )}
                >
                  {destination.label}
                </span>
              </Link>
            </li>
          );
        })}

        <li className="flex-1">
          <Link
            href="/more"
            aria-current={moreActive || pathname === "/more" ? "page" : undefined}
            className="flex flex-col items-center gap-1 px-1 py-2.5 focus-visible:outline-2 focus-visible:outline-indigo"
          >
            <span
              aria-hidden
              className={cn(
                "flex h-7 w-12 items-center justify-center rounded-full transition-colors duration-150",
                moreActive || pathname === "/more" ? "text-emerald" : "text-text-muted",
              )}
              style={
                moreActive || pathname === "/more"
                  ? {
                      backgroundColor:
                        "color-mix(in srgb, var(--clarix-brand-accent) 14%, transparent)",
                    }
                  : undefined
              }
            >
              <Ellipsis className="size-[18px]" strokeWidth={2} />
            </span>
            <span
              className={cn(
                "type-caption",
                moreActive || pathname === "/more"
                  ? "font-medium text-text"
                  : "text-text-muted",
              )}
            >
              More
            </span>
          </Link>
        </li>
      </ul>
    </nav>
  );
}

/** Mobile-only top bar. Desktop puts the wordmark in the sidebar instead. */
export function AppTopBar() {
  return (
    <header className="flex items-center justify-between border-b border-border bg-surface px-5 py-4 md:hidden">
      <Link href="/dashboard" aria-label="Clarix home">
        <Wordmark />
      </Link>
      <ThemeToggle />
    </header>
  );
}
