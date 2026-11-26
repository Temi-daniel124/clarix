import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The designed not-found, error and loading-failure page (BUILD-PLAN 1.5, DESIGN_SYSTEM §7).
 *
 * One line that says what happened, one primary action, and the small line drawing from §7: the
 * meter ring with a lucide stroke inside it. Never a stack trace, an error code or a digest on
 * screen; those stay in the logs. Plain markup with no hooks, so the server's not-found pages and
 * the client error boundaries all draw the same thing. The tab title comes from each page: metadata
 * on the not-found pages, a React <title> in the error boundaries (which cannot export metadata).
 */
export function StatusPage({
  icon: Icon,
  title,
  action,
  className,
}: {
  icon: LucideIcon;
  /** The one line. A full sentence, sentence case. */
  title: string;
  /** The one primary action: a Button, usually rendering a Link or calling retry(). */
  action: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "mx-auto flex w-full max-w-[560px] flex-1 flex-col items-center justify-center px-5 py-20 text-center md:px-6",
        className,
      )}
    >
      <RingDrawing icon={Icon} />
      <h1 className="type-title mt-6 text-balance text-ink-900">{title}</h1>
      <div className="mt-8">{action}</div>
    </section>
  );
}

/**
 * §7's empty-state drawing: the brand's meter ring, drawn as lines only (a `hairline-strong`
 * track with an `ink-300` arc), and a lucide icon at its centre in `ink-500`.
 */
function RingDrawing({ icon: Icon }: { icon: LucideIcon }) {
  const size = 64;
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  return (
    <span aria-hidden className="relative flex size-16 items-center justify-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="absolute inset-0" focusable="false">
        <circle cx="32" cy="32" r={radius} fill="none" stroke="var(--clarix-hairline-strong)" strokeWidth="2" />
        <circle
          cx="32"
          cy="32"
          r={radius}
          fill="none"
          stroke="var(--clarix-ink-300)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray={`${circumference * 0.667} ${circumference}`}
          transform="rotate(-90 32 32)"
        />
      </svg>
      <Icon className="relative size-6 text-ink-500" strokeWidth={1.75} />
    </span>
  );
}
