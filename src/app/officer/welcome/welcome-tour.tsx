"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion, type PanInfo } from "motion/react";
import { ArrowRight, KeyRound, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { springStandard } from "@/lib/motion";

/**
 * Welcome to Cooperative Officer — officer blueprint 2.1.
 *
 * The same full-screen, swipeable, dot-indicator pattern every role's first run uses, with two
 * slides instead of three and no "skip setup" affordance, "since there's no setup to skip".
 *
 * Slide one says what this person can do here and admits out loud that it can change. Slide two
 * repeats, in one sentence, the promise the whole product rests on: the cross-cooperative figure
 * is a total, never somebody else's records, and it is available whenever they want it rather
 * than only while a loan is being decided.
 */
export function OfficerWelcomeTour({
  cooperativeName,
  granted,
}: {
  cooperativeName: string;
  /** Plain-language phrases for what this officer has actually been granted, in panel order. */
  granted: string[];
}) {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [index, setIndex] = useState(0);

  const slides = [
    {
      icon: KeyRound,
      title: `What you can do at ${cooperativeName}`,
      body:
        granted.length > 0
          ? `You can ${listOf(granted)}, as set up by your cooperative's admin. This can change, and you will always see exactly what you are able to do — nothing hidden, nothing shown greyed out.`
          : `Your admin has not switched anything on for you yet, so there is nothing here you can act on. Ask them to grant what you need; it takes effect immediately, and you will always see exactly what you are able to do — nothing hidden, nothing shown greyed out.`,
    },
    {
      icon: ShieldCheck,
      title: "You will see what you need, and no more",
      body:
        "A member's profile shows what they already owe in total across every cooperative they belong to — never which cooperative, never their records elsewhere. That figure is there whenever you open their profile, not only while a loan is being decided.",
    },
  ];

  const isLast = index === slides.length - 1;

  const advance = useCallback(() => {
    if (isLast) {
      router.push("/admin");
      return;
    }
    setIndex((current) => current + 1);
  }, [isLast, router]);

  const onDragEnd = useCallback(
    (_event: unknown, info: PanInfo) => {
      if (info.offset.x < -60 && index < slides.length - 1) setIndex(index + 1);
      if (info.offset.x > 60 && index > 0) setIndex(index - 1);
    },
    [index, slides.length],
  );

  const slide = slides[index];
  const Icon = slide.icon;

  return (
    <div className="flex min-h-[70vh] flex-col justify-between pt-8">
      <motion.div
        key={index}
        drag={reduceMotion ? false : "x"}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.16}
        onDragEnd={onDragEnd}
        initial={reduceMotion ? false : { opacity: 0, x: 24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={reduceMotion ? { duration: 0 } : springStandard}
        className="flex flex-1 cursor-grab flex-col items-start active:cursor-grabbing"
      >
        <span
          aria-hidden
          className="flex size-12 items-center justify-center rounded-card"
          style={{
            backgroundColor: "color-mix(in srgb, var(--clarix-brand-accent) 12%, transparent)",
            color: "var(--clarix-brand-accent)",
          }}
        >
          <Icon className="size-6" strokeWidth={1.75} />
        </span>

        <h1 className="type-page-title mt-8 max-w-[520px] text-text">{slide.title}</h1>
        <p className="type-body mt-4 max-w-[520px] text-text-secondary">{slide.body}</p>
      </motion.div>

      <div className="mt-12">
        <div className="flex items-center gap-2" role="tablist" aria-label="Tour progress">
          {slides.map((entry, position) => (
            <button
              key={entry.title}
              type="button"
              role="tab"
              aria-selected={position === index}
              aria-label={`Slide ${position + 1}`}
              onClick={() => setIndex(position)}
              className={cn(
                "h-1.5 rounded-full transition-all duration-200",
                "focus-visible:outline-2 focus-visible:outline-indigo focus-visible:outline-offset-4",
                position === index ? "w-8 bg-emerald" : "w-1.5 bg-border hover:bg-text-muted",
              )}
            />
          ))}
        </div>

        <div className="mt-6">
          <Button onClick={advance}>
            {isLast ? "Get started" : "Next"}
            <ArrowRight className="size-4" aria-hidden strokeWidth={2.5} />
          </Button>
        </div>
      </div>
    </div>
  );
}

/** "a, b and c" — the way a person says a list out loud. */
function listOf(items: string[]): string {
  if (items.length === 1) return items[0];
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}
