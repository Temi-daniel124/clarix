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
 * It is an action rather than something that happens on its own because there is no scheduler in
 * this project, and a screen that quietly rewrote rows while being looked at would be a worse
 * answer than a button somebody presses and the audit log remembers.
 */
export function LapsedNotice({
  cooperativeId,
  count,
}: {
  cooperativeId: string;
  count: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [tidied, setTidied] = useState<number | null>(null);

  if (count === 0 && tidied === null) return null;

  if (tidied !== null) {
    return (
      <div className="mt-6 rounded-feature border border-border bg-surface px-5 py-4">
        <p className="type-secondary text-text-secondary">
          {tidied === 1
            ? "One lapsed request moved out of the waiting list."
            : `${tidied} lapsed requests moved out of the waiting list.`}{" "}
          No capacity changed: a lapsed hold had already stopped counting.
        </p>
      </div>
    );
  }

  return (
    <div
      className="mt-6 rounded-feature border px-5 py-4"
      style={{
        borderColor: "color-mix(in srgb, var(--clarix-warning) 40%, transparent)",
        backgroundColor: "color-mix(in srgb, var(--clarix-warning) 8%, transparent)",
      }}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-[560px]">
          <p className="type-card-title text-text">
            {count === 1
              ? "One request has been waiting past its hold"
              : `${count} requests have been waiting past their hold`}
          </p>
          <p className="type-secondary mt-1 text-text-secondary">
            Their reservations lapsed, so they can no longer be approved as they stand. The
            members&rsquo; capacity was released at the moment each one lapsed, not now.
          </p>
          {error ? (
            <p role="alert" className="type-secondary mt-2 text-danger">
              {error}
            </p>
          ) : null}
        </div>

        <Button
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              setError(null);
              const result = await expireLapsedReservationsAction(cooperativeId);
              if (result.error) {
                setError(result.error);
                return;
              }
              setTidied(result.expired ?? 0);
              router.refresh();
            })
          }
        >
          <Archive className="size-4" aria-hidden strokeWidth={2} />
          {pending ? "Tidying…" : "Move them out"}
        </Button>
      </div>
    </div>
  );
}
