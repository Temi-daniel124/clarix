"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { describeRemaining, millisRemaining, type AccessGrant } from "@/lib/access-grants";

/**
 * The temporary-access banner (super-admin blueprint 7.3).
 *
 * "A persistent, non-dismissible banner across the top of the screen for the entire duration of
 * the grant, amber/warning-toned, stating plainly 'Temporary access active, [reason], expires
 * in [time remaining]'."
 *
 * **Why it looks like this.** This is the only amber surface in Clarix and the only banner that
 * cannot be dismissed, and both are deliberate. DESIGN_SYSTEM.md's rule is that nothing is
 * decoration for its own sake, so the weight here is doing work: it has to be impossible to
 * mistake this screen for the ordinary member profile it otherwise is. It is sticky rather than
 * scrolled away, it carries the reason the operator themselves wrote, and it counts down. A
 * banner that said only "temporary access" would fade into furniture within a minute of reading
 * it, while one that visibly loses a minute every minute does not.
 *
 * There is no close button. Dismissing it would leave real member data on screen with nothing
 * saying why it is there.
 *
 * **It also ends the session.** When the countdown reaches zero this navigates back to Access
 * Requests rather than waiting for the next click, which is what the blueprint means by the view
 * stopping "the moment the grant expires". The server checks the same thing on every request, so
 * this is the courteous half of a rule the database enforces regardless.
 */
export function ElevatedAccessBanner({ grant }: { grant: AccessGrant }) {
  const router = useRouter();
  const [remaining, setRemaining] = useState(() => millisRemaining(grant));

  useEffect(() => {
    const tick = setInterval(() => {
      const left = millisRemaining(grant);
      setRemaining(left);

      if (left <= 0) {
        clearInterval(tick);
        router.replace("/platform/access-requests");
      }
    }, 1000);

    return () => clearInterval(tick);
  }, [grant, router]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="sticky top-0 z-50 border-b border-warning/45"
      style={{ backgroundColor: "color-mix(in srgb, var(--clarix-warning) 14%, var(--clarix-surface))" }}
    >
      <div className="mx-auto flex w-full max-w-[860px] items-start gap-3 px-5 py-3.5 md:px-8">
        <span aria-hidden className="mt-0.5 shrink-0 text-warning">
          <ShieldAlert className="size-5" strokeWidth={2} />
        </span>

        <div className="min-w-0 flex-1">
          <p className="type-card-title text-text">
            Temporary access active &mdash; expires in {describeRemaining(remaining)}
          </p>
          <p className="type-secondary mt-1 max-w-[640px] text-text-secondary">
            {grant.reason}
          </p>
          <p className="type-caption mt-1.5 text-text-muted">
            Read-only. Everything you open here is recorded in{" "}
            {grant.cooperativeName}&rsquo;s own audit log.
          </p>
        </div>
      </div>
    </div>
  );
}
