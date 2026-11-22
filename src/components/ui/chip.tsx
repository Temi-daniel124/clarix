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

export type ChipSize = "sm" | "lg";

const base = "inline-flex items-center gap-1.5 rounded-pill whitespace-nowrap";

/* sm is the status pill. lg is the larger marketing chip ("Made for"), one body step up. */
const sizes: Record<ChipSize, string> = {
  sm: "px-3 py-1 text-[12.5px] leading-4 font-bold",
  lg: "px-[18px] py-[11px] type-body leading-5 font-semibold",
};

export function chipClasses(tone: ChipTone, size: ChipSize = "sm"): string {
  return cn(base, sizes[size], tones[tone]);
}

/** A status pill. The label is required: status is never conveyed by colour alone. */
export function Chip({
  tone,
  size = "sm",
  children,
  className,
}: {
  tone: ChipTone;
  size?: ChipSize;
  children: ReactNode;
  className?: string;
}) {
  return <span className={cn(chipClasses(tone, size), className)}>{children}</span>;
}
