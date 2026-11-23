"use client";

import { useActionState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SectionFeedback } from "@/components/clarix/section-feedback";
import { createCooperativeAction, type PlatformState } from "@/app/platform/actions";

const INITIAL: PlatformState = {};

/**
 * Create Cooperative (super-admin blueprint 5.3).
 *
 * Four fields, one button, and the button does exactly what it says: it creates the cooperative's
 * record and issues its admin's invitation in one action, which is "the very first step of that
 * cooperative's own onboarding".
 *
 * The invitation goes through `invite_cooperative_staff()`, the same function a cooperative's own
 * admin uses to invite an officer. D027 settled that invitations are database rows written by one
 * narrow function; migration 019 admitted a platform admin as a second legitimate caller rather
 * than adding a second function to keep in step.
 *
 * The button does not claim to send an email, because Clarix cannot yet. The line beneath it says
 * what actually happens instead.
 */
export function CreateCooperativeForm() {
  const [state, formAction, pending] = useActionState(createCooperativeAction, INITIAL);

  if (state.saved) {
    return (
      <div>
        <h1 className="type-page-title text-text">Created</h1>
        <p className="type-body mt-3 max-w-[520px] text-text-secondary">{state.saved}</p>
        <p className="type-secondary mt-3 max-w-[520px] text-text-secondary">
          It is listed as inactive until its admin takes the invitation up and sets the
          cooperative running.
        </p>

        <Button className="mt-8" render={<Link href="/platform/cooperatives" />}>
          Back to the directory
          <ArrowRight className="size-4" aria-hidden strokeWidth={2.5} />
        </Button>
      </div>
    );
  }

  return (
    <div>
      <Button
        variant="tertiary"
        className="-ml-3"
        render={<Link href="/platform/cooperatives" />}
      >
        <ArrowLeft className="size-4" aria-hidden strokeWidth={2} />
        Cooperatives
      </Button>

      <h1 className="type-page-title mt-6 text-text">Create a cooperative</h1>
      <p className="type-body mt-3 max-w-[520px] text-text-secondary">
        This creates the cooperative&rsquo;s record and invites the person who will run it.
        Everything else. Its public profile, its loan rules, its member list, is theirs to set
        up once they accept.
      </p>

      <form action={formAction} className="mt-8 flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <Label htmlFor="name">Cooperative name</Label>
          <Input id="name" name="name" required maxLength={120} autoComplete="off" />
          {state.fieldErrors?.name ? (
            <p className="type-caption text-danger">{state.fieldErrors.name}</p>
          ) : null}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="note">A note for yourself (optional)</Label>
          <Input
            id="note"
            name="note"
            maxLength={400}
            autoComplete="off"
            placeholder="Which staff cooperative at FMC Abeokuta this is"
          />
          <p className="type-caption text-text-muted">
            Only platform admins ever see this. It is not part of the cooperative&rsquo;s public
            profile.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="adminName">Who will run it</Label>
          <Input id="adminName" name="adminName" required maxLength={120} autoComplete="off" />
          {state.fieldErrors?.adminName ? (
            <p className="type-caption text-danger">{state.fieldErrors.adminName}</p>
          ) : null}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="adminEmail">Their email address</Label>
          <Input
            id="adminEmail"
            name="adminEmail"
            type="email"
            required
            autoComplete="off"
            placeholder="name@fmcabeokuta.org.ng"
          />
          {state.fieldErrors?.adminEmail ? (
            <p className="type-caption text-danger">{state.fieldErrors.adminEmail}</p>
          ) : null}
          <p className="type-caption text-text-muted">
            The invitation is recorded against this address and becomes a real role the first time
            they sign in with it. Clarix cannot send the email itself until a sending domain is
            verified, so tell them it is waiting.
          </p>
        </div>

        <div>
          <Button type="submit" disabled={pending}>
            {pending ? "Creating…" : "Create and invite"}
            <ArrowRight className="size-4" aria-hidden strokeWidth={2.5} />
          </Button>
        </div>

        <SectionFeedback error={state.error} />
      </form>
    </div>
  );
}
