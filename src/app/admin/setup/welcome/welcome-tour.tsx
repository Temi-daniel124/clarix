"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion, type PanInfo } from "motion/react";
import { ArrowRight, ClipboardList, ShieldCheck, UserCog } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { springStandard } from "@/lib/motion";

/**
 * Welcome to Cooperative Admin — admin blueprint 2.1.
 *
 * Same pattern as the employee tour (three slides, dots, swipe, skip on every one) and
 * deliberately different content, because the things an admin needs to know before the next four
 * screens are different things. Slide two is the one that matters most: it sets the expectation
 * about what Clarix will and will not show them of a member's obligations elsewhere, before they
 * ever see it on a loan review.
 */

const SLIDES = [
  {
    icon: ClipboardList,
    title: "A few steps, and your cooperative is running",
    body: "Your public profile, your loan rules, and your member list. Each one saves on its own, and none of them has to be finished today.",
  },
  {
    icon: ShieldCheck,
    title: "You will see what you need, and no more",
    body: "When you review a loan, Clarix tells you what that member already owes in total across every cooperative — never which cooperative, never their records elsewhere. The same boundary protects your cooperative's records from everyone else.",
  },
  {
    icon: UserCog,
    title: "You do not have to run it alone",
    body: "Officers can be added at any time, with or without the power to approve loans. Nothing here commits you to doing the work yourself.",
  },
];

export function AdminWelcomeTour() {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [index, setIndex] = useState(0);

  const isLast = index === SLIDES.length - 1;

  const advance = useCallback(() => {
    if (isLast) {
      router.push("/admin/setup/profile");
      return;
    }
    setIndex((current) => current + 1);
  }, [isLast, router]);

  const onDragEnd = useCallback(
    (_event: unknown, info: PanInfo) => {
      if (info.offset.x < -60 && index < SLIDES.length - 1) setIndex(index + 1);
      if (info.offset.x > 60 && index > 0) setIndex(index - 1);
    },
    [index],
  );

  const slide = SLIDES[index];
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
          {SLIDES.map((entry, position) => (
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

        <div className="mt-6 flex flex-wrap items-center gap-4">
          <Button onClick={advance}>
            {isLast ? "Set up my cooperative" : "Next"}
            <ArrowRight className="size-4" aria-hidden strokeWidth={2.5} />
          </Button>

          <Button variant="ghost" size="sm" render={<Link href="/admin" />}>
            Skip setup for now
          </Button>
        </div>

        <p className="type-caption mt-4 max-w-[520px] text-text-muted">
          Skipping is fine. The cooperative exists either way, and the dashboard keeps whatever is
          left in front of you until it is done.
        </p>
      </div>
    </div>
  );
}
