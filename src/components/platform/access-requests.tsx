"use client";

import { useActionState, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { ArrowRight, KeyRound, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SectionFeedback } from "@/components/clarix/section-feedback";
import { cn } from "@/lib/utils";
import {
  GRANT_STATUS_LABEL,
  describeRemaining,
  describeScope,
  describeWait,
  grantState,
  millisRemaining,
  type AccessGrant,
  type GrantStatus,
} from "@/lib/access-grants";
import { requestAccessAction, revokeAccessAction, type AccessState } from "@/app/platform/access-actions";
import { formatShortDate, formatShortDateTime } from "@/lib/format";

const INITIAL: AccessState = {};

/**
 * Access Requests (super-admin blueprint 7.2).
 *
 * Past and current requests, each carrying who asked, which cooperative and which member if it was
 * narrowed that far, the stated reason, its status, and the time left on anything live.
 *
 * The reason field is the only part of this screen that matters more than it looks. It is shown to
 * the cooperative whose data is about to be read, kept forever, and attached to every record
 * opened under the grant, so the placeholder and the helper text ask for a sentence a stranger
 * could evaluate, and the database refuses anything under twenty characters.
 */
export function AccessRequests({
  grants,
  cooperatives,
}: {
  grants: AccessGrant[];
  cooperatives: { id: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState(requestAccessAction, INITIAL);
  const [open, setOpen] = useState(false);

  const now = useMemo(() => new Date(), []);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="type-section text-text">Requests</h2>
        {open ? null : (
          <Button type="button" size="sm" onClick={() => setOpen(true)}>
            <Plus className="size-4" aria-hidden strokeWidth={2.5} />
            New access request
          </Button>
        )}
      </div>

      {open ? (
        <form action={formAction} className="mt-6 rounded-feature border border-border bg-surface p-5 md:p-6">
          <h3 className="type-card-title text-text">New access request</h3>
          <p className="type-secondary mt-2 max-w-[560px] text-text-secondary">
            This does not open anything now. The cooperative&rsquo;s admin is told immediately, the
            access begins an hour later, and it ends a day after that unless you end it sooner.
          </p>

          <div className="mt-5 flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <Label htmlFor="cooperativeId">Which cooperative</Label>
              <select
                id="cooperativeId"
                name="cooperativeId"
                required
                defaultValue=""
                className="h-12 max-w-[420px] rounded-card border border-border bg-surface px-3 type-secondary text-text outline-none transition-[border-color] duration-150 focus-visible:border-indigo focus-visible:outline-2 focus-visible:outline-indigo focus-visible:outline-offset-1"
              >
                <option value="" disabled>
                  Choose a cooperative
                </option>
                {cooperatives.map((cooperative) => (
                  <option key={cooperative.id} value={cooperative.id}>
                    {cooperative.name}
                  </option>
                ))}
              </select>
              {state.fieldErrors?.cooperativeId ? (
                <p className="type-caption text-danger">{state.fieldErrors.cooperativeId}</p>
              ) : null}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="memberUserId">One member only (optional)</Label>
              <Input
                id="memberUserId"
                name="memberUserId"
                placeholder="Their Clarix account id, if you are narrowing it"
                className="max-w-[420px]"
              />
              <p className="type-caption max-w-[520px] text-text-muted">
                Leave this empty to cover the cooperative&rsquo;s records as a whole, which is what
                a discrepancy nobody has localised actually needs. Naming one person is narrower
                and better when you can.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="reason">Why</Label>
              <textarea
                id="reason"
                name="reason"
                required
                rows={3}
                minLength={20}
                placeholder="What you are looking into, and what you expect to find"
                className="w-full max-w-[560px] rounded-card border border-border bg-surface px-4 py-3 type-secondary text-text outline-none transition-[border-color] duration-150 focus-visible:border-indigo focus-visible:outline-2 focus-visible:outline-indigo focus-visible:outline-offset-1"
              />
              <p className="type-caption max-w-[520px] text-text-muted">
                This is shown to the cooperative, kept permanently, and attached to every record
                you open. &ldquo;Checking something&rdquo; is not a reason.
              </p>
              {state.fieldErrors?.reason ? (
                <p className="type-caption text-danger">{state.fieldErrors.reason}</p>
              ) : null}
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-4">
            <Button type="submit" disabled={pending}>
              {pending ? "Submitting…" : "Submit request"}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
              <X className="size-4" aria-hidden strokeWidth={2} />
              Cancel
            </Button>
          </div>

          <SectionFeedback saved={state.saved} error={state.error} />
        </form>
      ) : (
        <SectionFeedback saved={state.saved} error={state.error} />
      )}

      {grants.length === 0 ? (
        <div className="mt-6 rounded-feature border border-border bg-surface px-6 py-10 text-center">
          <span
            aria-hidden
            className="mx-auto flex size-12 items-center justify-center rounded-card border border-border text-text-muted"
          >
            <KeyRound className="size-5" strokeWidth={1.75} />
          </span>
          <p className="type-body mt-5 text-text">Nothing has ever been requested</p>
          <p className="type-secondary mx-auto mt-2 max-w-[460px] text-text-secondary">
            This account has no sight of any member&rsquo;s savings, loans or salary, and will not
            until a request here activates. Everything that has ever been requested stays on this
            list, including what lapsed and what was ended early.
          </p>
        </div>
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
          {grants.map((grant) => (
            <GrantCard key={grant.id} grant={grant} now={now} />
          ))}
        </ul>
      )}
    </div>
  );
}

function GrantCard({ grant, now }: { grant: AccessGrant; now: Date }) {
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ saved?: string; error?: string }>({});

  const state = grantState(grant, now);
  const live = state === "active";

  const end = () => {
    startTransition(async () => {
      const result = await revokeAccessAction(grant.id);
      setFeedback(result);
    });
  };

  return (
    <li className="rounded-feature border border-border bg-surface p-5 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="min-w-0">
          <p className="type-card-title text-text">{describeScope(grant)}</p>
          <p className="type-caption mt-1 text-text-muted">
            Requested by {grant.requesterName ?? "a platform admin"} on{" "}
            {formatDate(grant.requestedAt)}
          </p>
        </div>

        <StatusBadge state={state} />
      </div>

      <p className="type-secondary mt-4 max-w-[600px] text-text">{grant.reason}</p>

      <p className="type-caption mt-3 text-text-muted">
        {state === "pending"
          ? `Starts ${describeWait(grant, now)}, then lasts until ${formatDateTime(grant.expiresAt)}.`
          : state === "active"
            ? `${describeRemaining(millisRemaining(grant, now))} left.`
            : state === "revoked"
              ? `Ended early on ${formatDateTime(grant.revokedAt ?? grant.expiresAt)}.`
              : `Lapsed on ${formatDateTime(grant.expiresAt)}.`}
      </p>

      {live ? (
        <div className="mt-5 flex flex-wrap items-center gap-4">
          {grant.membershipId ? (
            <Button
              size="sm"
              render={<Link href={`/platform/access-requests/${grant.id}/${grant.membershipId}`} />}
            >
              Open the record
              <ArrowRight className="size-4" aria-hidden strokeWidth={2.5} />
            </Button>
          ) : (
            <p className="type-caption max-w-[420px] text-text-muted">
              This grant covers the cooperative as a whole. Opening a specific member from here
              needs the request to name them.
            </p>
          )}

          <Button variant="ghost" size="sm" type="button" onClick={end} disabled={pending}>
            {pending ? "Ending…" : "End this access now"}
          </Button>
        </div>
      ) : null}

      <SectionFeedback saved={feedback.saved} error={feedback.error} />
    </li>
  );
}

function StatusBadge({ state }: { state: GrantStatus }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 type-caption font-medium",
        state === "active"
          ? "border-warning/45 text-warning"
          : state === "pending"
            ? "border-indigo/40 text-indigo"
            : "border-border text-text-muted",
      )}
      style={
        state === "active"
          ? { backgroundColor: "color-mix(in srgb, var(--clarix-warning) 12%, transparent)" }
          : undefined
      }
    >
      {GRANT_STATUS_LABEL[state]}
    </span>
  );
}

function formatDate(iso: string): string {
  return formatShortDate(iso);
}

function formatDateTime(iso: string): string {
  return formatShortDateTime(iso);
}
