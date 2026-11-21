import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type ChipTone = "waiting" | "confirmed" | "over" | "draft" | "neutral";

const tones: Record<ChipTone, string> = {
  waiting: "bg-ochre-50 text-ochre-ink",
  confirmed: "bg-emerald-50 text-emerald-700",
  over: "bg-red-50 text-red-600",
  draft: "bg-indigo-100 text-indigo-600",
  neutral: "bg-white text-ink shadow-flat",
};

const base =
  "inline-flex items-center gap-1.5 rounded-pill px-3 py-1 text-[12.5px] leading-4 font-bold whitespace-nowrap";

export function chipClasses(tone: ChipTone): string {
  return cn(base, tones[tone]);
}

/** A status pill. The label is required: status is never conveyed by colour alone. */
export function Chip({
  tone,
  children,
  className,
}: {
  tone: ChipTone;
  children: ReactNode;
  className?: string;
}) {
  return <span className={cn(chipClasses(tone), className)}>{children}</span>;
}
