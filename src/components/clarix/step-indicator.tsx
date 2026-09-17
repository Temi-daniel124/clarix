import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { MeterBar } from "./meter-bar";
import { ONBOARDING_STEPS, stepIndex, type OnboardingStepSlug } from "@/lib/onboarding";

/**
 * The persistent onboarding progress indicator (blueprint 2.2: "a thin progress bar or
 * 'Step 2 of 4'", visible on every step so the employee always knows how much is left).
 *
 * It reuses MeterBar rather than introducing a second progress visual: the product has one way
 * of drawing a value against a total and this is it. The track is neutral rather than emerald
 * because the unfilled part here is work still to do, not capacity still available.
 *
 * On desktop the named sequence is shown as well, because there is room for it and knowing the
 * next step is called "Payslip" is more reassuring than knowing it is step three.
 */
export function StepIndicator({ current }: { current: OnboardingStepSlug }) {
  const currentIndex = stepIndex(current);
  const total = ONBOARDING_STEPS.length - 1; // "Account created" is already behind them.
  const completed = currentIndex;

  return (
    <div>
      <div className="flex items-baseline justify-between gap-4">
        <p className="type-caption uppercase tracking-[0.08em] text-text-muted">
          Step {currentIndex} of {total}
        </p>
        <p className="type-caption text-text-secondary">
          {ONBOARDING_STEPS[currentIndex]?.label}
        </p>
      </div>

      <MeterBar
        className="mt-2"
        size="compact"
        track="neutral"
        usedRatio={0}
        proposedRatio={completed / total}
        label={`Onboarding progress: step ${currentIndex} of ${total}`}
      />

      <ol className="mt-4 hidden items-center gap-2 md:flex">
        {ONBOARDING_STEPS.map((step, index) => {
          const done = index < currentIndex;
          const active = index === currentIndex;

          return (
            <li key={step.slug} className="flex items-center gap-2">
              {/* "Account created" is index 0 and is always behind them, so it shows a check
                  and carries no number. Numbering therefore starts at 1 on "Staff ID", which is
                  what keeps these chips agreeing with the "Step N of 4" line above, they
                  disagreed at first, with the caption saying step 1 while the chip said 2. */}
              <span
                className={cn(
                  "flex size-5 shrink-0 items-center justify-center rounded-full border type-caption",
                  done && "border-emerald bg-emerald text-white",
                  active && "border-emerald text-emerald",
                  !done && !active && "border-border text-text-muted",
                )}
              >
                {done ? (
                  <Check className="size-3" strokeWidth={3} aria-hidden />
                ) : (
                  <span className="text-[10px] leading-none">{index}</span>
                )}
              </span>

              <span
                className={cn(
                  "type-caption whitespace-nowrap",
                  active ? "text-text" : "text-text-muted",
                )}
              >
                {step.label}
              </span>

              {index < ONBOARDING_STEPS.length - 1 ? (
                <span aria-hidden className="mx-1 h-px w-6 bg-border" />
              ) : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
