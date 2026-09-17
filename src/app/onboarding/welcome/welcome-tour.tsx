"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion, type PanInfo } from "motion/react";
import { ArrowRight, Layers, ShieldCheck, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { springStandard } from "@/lib/motion";

/**
 * Welcome Tour (blueprint 2.1).
 *
 * Three slides, a dot indicator, swipeable on mobile and advanced by a button on both platforms,
 * with Skip available on every slide. Mostly whitespace: a short headline, one supporting
 * sentence, one small icon. No large photo. This is the one place in the employee journey where
 * a light illustrative touch is appropriate, and it stays light.
 *
 * Its job is to make the next three screens feel reasonable rather than intrusive. An employee
 * is about to be asked for their staff ID and a payslip, and nobody should have to guess why.
 */

const SLIDES = [
  {
    icon: Layers,
    title: "Every cooperative, in one place",
    body: "Whether you belong to one cooperative or four, Clarix shows your savings, your loans and what is being deducted from your salary, added up correctly across all of them.",
  },
  {
    icon: Scale,
    title: "Know before you borrow",
    body: "Before a cooperative approves a loan, Clarix checks whether the repayment actually fits what is left of your salary once every other deduction is counted.",
  },
  {
    icon: ShieldCheck,
    title: "Each cooperative sees only its own records",
    body: "No cooperative can see another's records. Only the combined monthly total the limit calculation needs ever crosses between them. That is by design, not a setting.",
  },
];

export function WelcomeTour() {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [index, setIndex] = useState(0);

  const isLast = index === SLIDES.length - 1;

  const advance = useCallback(() => {
    if (isLast) {
      router.push("/onboarding/employee-id");
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

        <h1 className="type-page-title mt-8 max-w-[420px] text-text">{slide.title}</h1>
        <p className="type-body mt-4 max-w-[460px] text-text-secondary">{slide.body}</p>
      </motion.div>

      <div className="mt-12">
        <div className="flex items-center gap-2" role="tablist" aria-label="Tour progress">
          {SLIDES.map((entry, dotIndex) => (
            <button
              key={entry.title}
              type="button"
              role="tab"
              aria-selected={dotIndex === index}
              aria-label={`Slide ${dotIndex + 1} of ${SLIDES.length}`}
              onClick={() => setIndex(dotIndex)}
              className={cn(
                "h-1.5 rounded-full transition-all duration-200",
                "focus-visible:outline-2 focus-visible:outline-indigo focus-visible:outline-offset-4",
                dotIndex === index ? "w-6 bg-emerald" : "w-1.5 bg-border hover:bg-text-muted",
              )}
            />
          ))}
        </div>

        <div className="mt-6 flex items-center gap-4">
          <Button onClick={advance} className="flex-1 sm:flex-none">
            {isLast ? "Get started" : "Next"}
            <ArrowRight className="size-4" aria-hidden strokeWidth={2.5} />
          </Button>

          <Button variant="ghost" onClick={() => router.push("/onboarding/employee-id")}>
            Skip
          </Button>
        </div>
      </div>
    </div>
  );
}
