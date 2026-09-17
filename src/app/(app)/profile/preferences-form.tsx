"use client";

import { useState, useTransition } from "react";
import { Switch } from "@/components/ui/switch";
import { SectionFeedback } from "@/components/clarix/section-feedback";
import {
  NOTIFICATION_CATEGORIES,
  NOTIFICATION_CATEGORY_ORDER,
  type NotificationCategory,
} from "@/lib/notifications";
import { setNotificationPreferenceAction } from "./actions";

/**
 * Notification preferences (blueprint 6.2), fourth section.
 *
 * Four toggles, each saving on its own the moment it moves. There is no Save button here
 * because there is nothing to review before committing: a toggle IS the decision, and pairing
 * it with a button would make the switch look like a draft of itself.
 *
 * The switch moves immediately and the row reverts only if the write fails, so the control
 * never sits waiting on a round trip. A toggle that lags feels broken even when it is working.
 *
 * What these govern is delivery, not the record (DECISIONS.md D025): a muted category still
 * appears in the notifications list. The caption on screen says so, because a toggle labelled
 * only "New packages" would reasonably be read as hiding them entirely.
 */
export function PreferencesForm({
  preferences,
}: {
  preferences: Record<NotificationCategory, boolean>;
}) {
  const [state, setState] = useState(preferences);
  const [feedback, setFeedback] = useState<{ saved?: string; error?: string }>({});
  const [, startTransition] = useTransition();

  const toggle = (category: NotificationCategory, enabled: boolean) => {
    const previous = state[category];
    setState((current) => ({ ...current, [category]: enabled }));
    setFeedback({});

    startTransition(async () => {
      const formData = new FormData();
      formData.set("category", category);
      formData.set("enabled", String(enabled));

      const result = await setNotificationPreferenceAction({}, formData);

      if (result.error) {
        setState((current) => ({ ...current, [category]: previous }));
        setFeedback({ error: result.error });
        return;
      }

      setFeedback({
        saved: `${NOTIFICATION_CATEGORIES[category].label} ${enabled ? "turned on" : "turned off"}.`,
      });
    });
  };

  return (
    <div className="flex flex-col gap-1">
      {NOTIFICATION_CATEGORY_ORDER.map((category) => {
        const descriptor = NOTIFICATION_CATEGORIES[category];
        const Icon = descriptor.icon;

        return (
          <div
            key={category}
            className="flex items-start justify-between gap-5 border-b border-border py-4 last:border-b-0"
          >
            <div className="flex min-w-0 gap-3">
              <span aria-hidden className="mt-0.5 text-text-muted">
                <Icon className="size-[18px]" strokeWidth={1.75} />
              </span>
              <div className="min-w-0">
                <p className="type-card-title text-text">{descriptor.label}</p>
                <p className="type-secondary mt-1 text-text-secondary">{descriptor.description}</p>
              </div>
            </div>

            <Switch
              checked={state[category]}
              onCheckedChange={(checked) => toggle(category, checked)}
              aria-label={descriptor.label}
              className="mt-1 shrink-0"
            />
          </div>
        );
      })}

      <div className="mt-4 flex flex-col gap-2">
        <SectionFeedback saved={feedback.saved} error={feedback.error} />
        <p className="type-caption text-text-muted">
          Turning one off stops Clarix emailing you about it. It still appears in your
          notifications, so nothing about your money goes unrecorded.
        </p>
      </div>
    </div>
  );
}
