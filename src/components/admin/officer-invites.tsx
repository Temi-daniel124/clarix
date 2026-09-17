"use client";

import { useActionState, useState, useTransition } from "react";
import { Clock, Mail, Plus, UserCog, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SectionFeedback } from "@/components/clarix/section-feedback";
import { cn } from "@/lib/utils";
import { PERMISSION_PRESETS, type PermissionPreset } from "@/lib/staff";
import { cancelInvitationAction, inviteOfficerAction, type AdminState } from "@/app/admin/actions";

const INITIAL: AdminState = {};

export type OfficerRow = {
  id: string;
  name: string | null;
  email: string | null;
  title: string | null;
  status: "invited" | "active";
  canApproveLoans: boolean;
};

export type PendingInvitation = {
  id: string;
  email: string;
  title: string | null;
  canApproveLoans: boolean;
  invitedAt: string;
};

/**
 * Invite Officers (admin blueprint 2.5), and later Officer Management (7.2).
 *
 * Two lists rather than one, because they are genuinely different things: people who hold a role
 * at this cooperative, and invitations that have not become roles yet. Collapsing them would mean
 * showing somebody as an officer before they have agreed to be one.
 *
 * The preset is the whole permission decision at this point. Blueprint 2.5 deliberately keeps the
 * finer-grained toggles and the cosmetic title out of this first-run moment, except the title,
 * which is offered here because a cooperative that calls its officer a Treasurer will want to say
 * so while they are thinking about the person, not later.
 */
export function OfficerInvites({
  officers,
  invitations,
}: {
  officers: OfficerRow[];
  invitations: PendingInvitation[];
}) {
  const [state, formAction, pending] = useActionState(inviteOfficerAction, INITIAL);
  const [preset, setPreset] = useState<PermissionPreset>("record_only");
  const [open, setOpen] = useState(officers.length === 0 && invitations.length === 0);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="type-section text-text">Officers</h2>
        {open ? null : (
          <Button type="button" size="sm" onClick={() => setOpen(true)}>
            <Plus className="size-4" aria-hidden strokeWidth={2.5} />
            Invite an officer
          </Button>
        )}
      </div>

      {officers.length === 0 && invitations.length === 0 ? (
        <p className="type-body mt-4 max-w-[560px] text-text-secondary">
          Nobody else works on this cooperative yet. Officers record savings, submit loan
          applications and, if you let them, approve loans. You can add them at any time, so
          there is no need to finish this now.
        </p>
      ) : null}

      {officers.length > 0 ? (
        <ul className="mt-6 divide-y divide-border rounded-feature border border-border bg-surface">
          {officers.map((officer) => (
            <li key={officer.id} className="flex items-start gap-4 px-5 py-4">
              <span
                aria-hidden
                className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-card border border-border text-text-muted"
              >
                <UserCog className="size-4" strokeWidth={1.75} />
              </span>

              <div className="min-w-0 flex-1">
                <p className="type-card-title truncate text-text">
                  {officer.name ?? officer.email ?? "Officer"}
                </p>
                <p className="type-secondary mt-1 text-text-secondary">
                  {officer.title ?? "Officer"} ·{" "}
                  {officer.canApproveLoans ? "Can approve loans" : "Records and submits only"}
                </p>
              </div>

              {officer.status === "invited" ? (
                <span className="flex items-center gap-1.5 type-caption text-text-muted">
                  <Clock aria-hidden strokeWidth={1.75} className="size-3.5" />
                  Not accepted yet
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}

      {invitations.length > 0 ? (
        <section className="mt-6">
          <h3 className="type-caption uppercase tracking-[0.08em] text-text-muted">
            Waiting on a Clarix account
          </h3>
          <ul className="mt-3 divide-y divide-border rounded-feature border border-border bg-surface">
            {invitations.map((invitation) => (
              <li key={invitation.id}>
                <InvitationRow invitation={invitation} />
              </li>
            ))}
          </ul>
          <p className="type-caption mt-3 text-text-secondary">
            These become real roles the first time each person signs in to Clarix, whether they
            already had an account or make one.
          </p>
        </section>
      ) : null}

      {open ? (
        <form action={formAction} className="mt-6 rounded-feature border border-border bg-surface p-5 md:p-6">
          <h3 className="type-card-title text-text">Invite an officer</h3>

          <div className="mt-5 flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <Label htmlFor="officer-email">Their email address</Label>
              <Input
                id="officer-email"
                name="email"
                type="email"
                placeholder="name@fmcabeokuta.org.ng"
                aria-invalid={Boolean(state.fieldErrors?.email)}
              />
              {state.fieldErrors?.email ? (
                <p role="alert" className="type-caption text-danger">
                  {state.fieldErrors.email}
                </p>
              ) : null}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="officer-title">What this cooperative calls them</Label>
              <Input id="officer-title" name="title" placeholder="Treasurer, Secretary, optional" />
            </div>

            <fieldset className="flex flex-col gap-3">
              <legend className="type-secondary font-medium text-text">What they can do</legend>
              <input type="hidden" name="preset" value={preset} />

              {(Object.keys(PERMISSION_PRESETS) as PermissionPreset[]).map((key) => {
                const option = PERMISSION_PRESETS[key];
                const selected = preset === key;

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setPreset(key)}
                    aria-pressed={selected}
                    className={cn(
                      "rounded-card border px-4 py-3 text-left transition-colors duration-150",
                      "focus-visible:outline-2 focus-visible:outline-indigo focus-visible:outline-offset-2",
                      selected ? "border-emerald bg-background" : "border-border hover:bg-background",
                    )}
                  >
                    <span className="block type-card-title text-text">{option.label}</span>
                    <span className="mt-1 block type-secondary text-text-secondary">
                      {option.description}
                    </span>
                  </button>
                );
              })}
            </fieldset>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-4">
            <Button type="submit" size="sm" disabled={pending}>
              {pending ? "Sending…" : "Send invite"}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
              {state.saved ? "Done" : "Cancel"}
            </Button>
            <SectionFeedback saved={state.saved} error={state.error} />
          </div>

          <p className="type-caption mt-4 text-text-muted">
            Clarix cannot send the email itself yet: a verified sending domain is still
            outstanding, so the invitation is recorded and waiting. Tell them it is there, and it
            activates when they sign in.
          </p>
        </form>
      ) : null}
    </div>
  );
}

function InvitationRow({ invitation }: { invitation: PendingInvitation }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex items-start gap-4 px-5 py-4">
      <span
        aria-hidden
        className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-card border border-border text-text-muted"
      >
        <Mail className="size-4" strokeWidth={1.75} />
      </span>

      <div className="min-w-0 flex-1">
        <p className="type-card-title truncate text-text">{invitation.email}</p>
        <p className="type-secondary mt-1 text-text-secondary">
          {invitation.title ?? "Officer"} ·{" "}
          {invitation.canApproveLoans ? "Can approve loans" : "Records and submits only"}
        </p>
        {error ? (
          <p role="alert" className="type-caption mt-1 text-danger">
            {error}
          </p>
        ) : null}
      </div>

      <Button
        variant="ghost"
        size="icon"
        aria-label={`Withdraw the invitation to ${invitation.email}`}
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await cancelInvitationAction(invitation.id);
            setError(result.error ?? null);
          })
        }
      >
        <X className="size-4" strokeWidth={2} />
      </Button>
    </div>
  );
}
