import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { SECONDARY_DESTINATIONS } from "@/components/app-shell/destinations";

export const metadata: Metadata = { title: "More" };

/**
 * "More", blueprint Part 3.
 *
 * A mobile-only space-saving device, not a fifth functional area: it holds the entries that
 * appear as their own sidebar rows on desktop, where there is width to spare. Anyone reaching
 * this URL on a wide screen sees the same list, which is harmless, because the sidebar beside it
 * already offers the same destinations directly.
 */
export default function MorePage() {
  return (
    <div className="mx-auto w-full max-w-[560px] px-5 py-8 md:px-8 md:py-10">
      <h1 className="type-page-title text-text">More</h1>

      <ul className="mt-8 divide-y divide-border rounded-feature border border-border bg-surface">
        {SECONDARY_DESTINATIONS.map((destination) => {
          const Icon = destination.icon;

          return (
            <li key={destination.href}>
              <Link
                href={destination.href}
                className="flex items-center gap-4 px-5 py-4 transition-colors duration-150 hover:bg-background focus-visible:outline-2 focus-visible:outline-indigo focus-visible:-outline-offset-2"
              >
                <span aria-hidden className="text-text-muted">
                  <Icon className="size-5" strokeWidth={1.75} />
                </span>
                <span className="flex-1 type-body text-text">{destination.label}</span>
                <ChevronRight aria-hidden strokeWidth={2} className="size-4 text-text-muted" />
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
