"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Archive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { expireLapsedReservationsAction } from "@/app/admin/loan-actions";

/**
 * Tidying reservations whose hold has run out (admin blueprint 6.1).
 *
 * Worth being exact about what this does and does not do, because the wording on the button could
 * easily imply more than is true. It frees no capacity: a hold stops counting against the
 * member's limit the moment it lapses, because expiry is arithmetic against the clock rather than
 * a stored flag (D024). Every figure in Clarix has already been correct.
 *
 * What it fixes is this queue. A request sitting in "waiting on a decision" that nobody can decide
 * any more is a worklist lying to the person reading it, and the longer the pilot runs the more of
 * them there will be.
 *
 * Since BUILD-PLAN 0.5 it is shown inside the queue's own Lapsed segment, with that segment's
 * count, instead of as a banner above a list that said "Nothing is waiting".
 *
 * It is an action rather than something that happens on its own because there is no scheduler in
 * this project, and a screen that quietly rewrote rows while being looked at would be a worse
 * answer than a button somebody presses and the audit log remembers.
 */
export function LapsedNotice({
  cooperativeId,
  count,
  onTidied,
}: {
  cooperativeId: string;
  count: number;
  /** Called with how many were moved; the queue then shows them under Recently decided. */
  onTidied: (moved: number) => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (count === 0) return null;

  // One line and one action (DESIGN_SYSTEM.md §2 rule 4). It lives inside the Lapsed segment
  // (BUILD-PLAN 0.5), so it never sits above a list that says nothing is waiting.
  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <p className="type-secondary text-text-secondary">
          {count === 1
            ? "This hold ran out before anyone decided. It no longer counts against the member’s limit."
            : "These holds ran out before anyone decided. They no longer count against anyone’s limit."}
        </p>

        <Button
          variant="secondary"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              setError(null);
              const result = await expireLapsedReservationsAction(cooperativeId);
              if (result.error) {
                setError(result.error);
                return;
              }
              onTidied(result.expired ?? 0);
              router.refresh();
            })
          }
        >
          <Archive className="size-4" aria-hidden strokeWidth={2} />
          {pending ? "Moving…" : "Move them out"}
        </Button>
      </div>

      {error ? (
        <p role="alert" className="type-secondary mt-2 text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
