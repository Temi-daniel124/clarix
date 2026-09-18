import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatNaira } from "@/lib/format";

export type TrendPoint = { at: string; value: number };

/**
 * A movement-over-time indicator for a KPI card: a sparkline plus the change since the first
 * point.
 *
 * This is NOT a second way of drawing a number against a limit. That stays the meter, and only
 * the meter. A sparkline answers a different question: which way has this been going. Nothing
 * here compares a value to a ceiling.
 *
 * The empty state matters more than the chart right now. `savings_transactions` does not exist
 * yet, so no KPI has any history to plot, and the honest thing is to say so. A flat line, a 0%
 * badge or an invented upward trend would each be a small lie on the one screen whose entire job
 * is telling the truth about money.
 */
export function TrendIndicator({
  points,
  emptyLabel,
  className,
}: {
  points: TrendPoint[];
  /** What to say when there is no history. Should explain why, not just state "no data". */
  emptyLabel: string;
  className?: string;
}) {
  if (points.length < 2) {
    return (
      <p className={cn("type-caption text-text-muted", className)}>
        <Minus aria-hidden strokeWidth={2} className="mr-1 inline size-3 align-[-1px]" />
        {emptyLabel}
      </p>
    );
  }

  const values = points.map((point) => point.value);
  const first = values[0];
  const last = values[values.length - 1];
  const delta = last - first;
  const direction = delta > 0 ? "up" : delta < 0 ? "down" : "flat";

  const Arrow = direction === "up" ? ArrowUpRight : direction === "down" ? ArrowDownRight : Minus;
  const tone =
    direction === "up" ? "text-emerald" : direction === "down" ? "text-danger" : "text-text-muted";

  return (
    // Wraps rather than overflowing: in the two-column mobile grid a six-figure delta ran out of
    // its card by 15px. On a wide card the two sit side by side exactly as before.
    <div className={cn("flex flex-wrap items-center gap-x-2 gap-y-1", className)}>
      <Sparkline values={values} direction={direction} />
      <span className={cn("type-caption inline-flex items-center gap-0.5 tabular", tone)}>
        <Arrow aria-hidden strokeWidth={2.5} className="size-3" />
        {formatNaira(Math.abs(delta))}
      </span>
    </div>
  );
}

function Sparkline({ values, direction }: { values: number[]; direction: string }) {
  const width = 52;
  const height = 16;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;

  const points = values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * width;
      // SVG y grows downward, so the highest value sits closest to zero.
      const y = height - ((value - min) / span) * height;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  const stroke =
    direction === "up"
      ? "var(--clarix-brand-accent)"
      : direction === "down"
        ? "var(--clarix-danger)"
        : "var(--clarix-text-muted)";

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      aria-hidden
      className="shrink-0 overflow-visible"
    >
      <polyline
        points={points}
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
