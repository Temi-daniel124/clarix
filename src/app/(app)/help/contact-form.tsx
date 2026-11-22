"use client";

import { useActionState } from "react";
import { Check, Mail, Send, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { sendSupportMessageAction, type ContactState } from "./actions";

const INITIAL: ContactState = {};

/**
 * Contact support (blueprint 6.3): "a short message, confirmed with a brief acknowledgment,
 * no elaborate ticket-tracking UI".
 *
 * The address sits beside the form rather than behind it. A form is the convenient path and a
 * mailto is the one that works from any mail client, and right now it is also the one that
 * genuinely delivers (DECISIONS.md D026), so hiding it would be hiding the working option.
 */
export function ContactForm({ supportEmail }: { supportEmail: string }) {
  const [state, formAction, pending] = useActionState(sendSupportMessageAction, INITIAL);

  if (state.sent) {
    return (
      <div className="rounded-feature border border-border bg-surface p-6 md:p-8">
        <span
          aria-hidden
          className="flex size-11 items-center justify-center rounded-card text-emerald-700"
          style={{
            backgroundColor: "color-mix(in srgb, var(--clarix-brand-accent) 12%, transparent)",
          }}
        >
          <Check className="size-5" strokeWidth={2.5} />
        </span>
        <h3 className="type-section mt-5 text-text">Message sent</h3>
        <p className="type-body mt-2 max-w-[460px] text-text-secondary">
          Support has your message along with your name and email address, so there is nothing
          else to send. A reply will come to the address on your account.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-feature border border-border bg-surface p-6 md:p-8">
      <h3 className="type-section text-text">Still stuck?</h3>
      <p className="type-body mt-2 max-w-[520px] text-text-secondary">
        Send a short message and support will reply by email. Your name and email address go
        with it, so there is no need to include them.
      </p>

      {state.error ? (
        <p
          role="alert"
          className="mt-5 flex items-start gap-3 rounded-card border border-danger/30 px-4 py-3 type-secondary text-danger"
          style={{ backgroundColor: "color-mix(in srgb, var(--clarix-danger) 8%, transparent)" }}
        >
          <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden strokeWidth={2} />
          {state.error}
        </p>
      ) : null}

      <form action={formAction} className="mt-5 flex flex-col gap-2">
        <Label htmlFor="message">Your message</Label>
        <Textarea
          id="message"
          name="message"
          placeholder="What went wrong, or what you were trying to do."
          aria-invalid={Boolean(state.fieldErrors?.message)}
        />
        {state.fieldErrors?.message ? (
          <p role="alert" className="type-caption text-danger">
            {state.fieldErrors.message}
          </p>
        ) : null}

        <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3">
          <Button type="submit" disabled={pending} size="sm">
            {pending ? "Sending…" : "Send message"}
            {pending ? null : <Send className="size-4" aria-hidden strokeWidth={2} />}
          </Button>

          <a
            href={`mailto:${supportEmail}`}
            className="flex items-center gap-2 type-secondary text-text-secondary underline-offset-4 transition-colors duration-150 hover:text-text hover:underline focus-visible:outline-2 focus-visible:outline-indigo focus-visible:outline-offset-2"
          >
            <Mail aria-hidden strokeWidth={1.75} className="size-4" />
            {supportEmail}
          </a>
        </div>
      </form>
    </div>
  );
}
