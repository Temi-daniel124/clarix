import { MeterBar } from "@/components/clarix/meter-bar";
import { ADMIN_SETUP_STEPS, adminStepIndex, type AdminSetupSlug } from "@/lib/admin-setup";

/**
 * Progress through the admin setup sequence.
 *
 * The same component shape the employee onboarding uses, for the same reason: it reuses MeterBar
 * rather than introducing a second way of drawing a value against a total. The track is neutral
 * because the unfilled part is work still to do, not capacity still available.
 */
export function SetupStepIndicator({ current }: { current: AdminSetupSlug }) {
  const index = adminStepIndex(current);
  const total = ADMIN_SETUP_STEPS.length;

  return (
    <div>
      <div className="flex items-baseline justify-between gap-4">
        <p className="type-caption uppercase tracking-[0.08em] text-text-muted">
          Step {index + 1} of {total}
        </p>
        <p className="type-caption text-text-secondary">{ADMIN_SETUP_STEPS[index]?.label}</p>
      </div>

      <MeterBar
        className="mt-2"
        size="compact"
        track="neutral"
        usedRatio={(index + 1) / total}
        label={`Setup progress: step ${index + 1} of ${total}`}
      />
    </div>
  );
}
