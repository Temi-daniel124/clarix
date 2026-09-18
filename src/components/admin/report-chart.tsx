"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";
import { formatNaira } from "@/lib/format";

export type ChartPoint = { label: string; value: number };

/**
 * The chart half of a report's chart-plus-table page (admin blueprint 7.6).
 *
 * Hand-drawn SVG rather than a charting library, for the reason TOOLING-POLICY.md gives: a new
 * dependency has to earn its place, and three read-only line charts do not justify one. It also
 * keeps the palette honest, since every colour here is a design token rather than a library's
 * default.
 *
 * This is deliberately NOT the used-against-a-limit motif. DESIGN_SYSTEM.md reserves the meter
 * and the rolling number for a value measured against a ceiling, and nothing on this page has a
 * ceiling: these answer "which way has this gone", which the sparkline on the dashboard already
 * answers in miniature. No second way of drawing a number against a limit is introduced.
 *
 * The table beneath it carries the exact figures, so the chart never has to be read precisely.
 * That is what lets it stay this plain.
 */
export function ReportChart({
  points,
  format,
  className,
  tone = "emerald",
}: {
  points: ChartPoint[];
  /**
   * How to read the values aloud in the accessible label. A plain string rather than a formatter
   * function, because these pages are server components and a function cannot cross that boundary.
   */
  format: "naira" | "members";
  className?: string;
  tone?: "emerald" | "indigo";
}) {
  const gradientId = useId();
  const describe = (value: number) =>
    format === "naira" ? formatNaira(value) : `${value} members`;

  if (points.length === 0) return null;

  const width = 720;
  const height = 220;
  const padding = { top: 16, right: 8, bottom: 28, left: 8 };

  const values = points.map((point) => point.value);
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const span = max - min || 1;

  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  const x = (index: number) =>
    points.length === 1
      ? padding.left + plotWidth / 2
      : padding.left + (index / (points.length - 1)) * plotWidth;

  const y = (value: number) => padding.top + plotHeight - ((value - min) / span) * plotHeight;

  const line = points.map((point, index) => `${x(index)},${y(point.value)}`).join(" ");
  const area = `${padding.left},${padding.top + plotHeight} ${line} ${
    padding.left + plotWidth
  },${padding.top + plotHeight}`;

  const stroke = tone === "emerald" ? "var(--clarix-brand-accent)" : "var(--clarix-brand-secondary)";

  // At most six labels along the axis, so a two-year series does not turn the baseline into a
  // grey smear at mobile widths.
  const labelStep = Math.max(1, Math.ceil(points.length / 6));

  return (
    <figure className={cn("m-0", className)}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-auto w-full"
        role="img"
        aria-label={`${points[0].label} to ${points[points.length - 1].label}, from ${describe(
          points[0].value,
        )} to ${describe(points[points.length - 1].value)}`}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={stroke} stopOpacity="0.18" />
            <stop offset="100%" stopColor={stroke} stopOpacity="0" />
          </linearGradient>
        </defs>

        <line
          x1={padding.left}
          y1={padding.top + plotHeight}
          x2={padding.left + plotWidth}
          y2={padding.top + plotHeight}
          stroke="var(--clarix-border)"
          strokeWidth="1"
        />

        <polygon points={area} fill={`url(#${gradientId})`} />

        <polyline
          points={line}
          fill="none"
          stroke={stroke}
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {points.map((point, index) =>
          index === points.length - 1 ? (
            <circle
              key={point.label}
              cx={x(index)}
              cy={y(point.value)}
              r="4"
              fill={stroke}
            />
          ) : null,
        )}

        {points.map((point, index) =>
          index % labelStep === 0 || index === points.length - 1 ? (
            <text
              key={`label-${point.label}`}
              x={x(index)}
              y={height - 8}
              textAnchor={index === 0 ? "start" : index === points.length - 1 ? "end" : "middle"}
              fill="var(--clarix-text-muted)"
              fontSize="11"
            >
              {point.label}
            </text>
          ) : null,
        )}
      </svg>
    </figure>
  );
}
