"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Mail, Power, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionFeedback } from "@/components/clarix/section-feedback";
import { StatusBadge } from "./cooperative-directory";
import {
  inviteAddressee,
  invitePending,
  inviteSentAt,
  type DirectoryEntry,
} from "@/lib/platform";
import {
  resendAdminInviteAction,
  setCooperativeStatusAction,
} from "@/app/platform/actions";
import { formatFullDate } from "@/lib/format";

const UNDO_SECONDS = 8;

/**
 * Cooperative Detail (super-admin blueprint 5.2).
 *
 * "Deliberately shallow on purpose, since anything deeper than status and contact information
 * belongs to that cooperative's own Admin, not to the Super Admin."
 *
 * **There is no view-members or view-loans action on this screen, and that absence is
 * load-bearing.** The blueprint says so outright: reaching any of that data goes through the
 * explicit Access Request flow in Part 7, "never a direct click from here". The instinct to add a
 * convenient link from an admin-adjacent screen is exactly what ROLES-AND-PERMISSIONS.md calls
 * "a convenience shortcut, even for debugging" and forbids. The counts below are counts; there is
 * nothing on this page to click through to a person.
 *
 * Deactivation uses the Timed Undo pattern rather than a confirm dialog, and the countdown runs
 * BEFORE the write, so the undo genuinely undoes, because nothing has happened yet.
 */
export function CooperativeDetail({ entry }: { entry: DirectoryEntry }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ saved?: string; error?: string }>({});

  const [pendingStatus, setPendingStatus] = useState<"active" | "inactive" | null>(null);
  const [countdown, setCountdown] = useState(UNDO_SECONDS);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearInterval(timer.current);
  }, []);

  const nextStatus = entry.status === "active" ? "inactive" : "active";
  const awaitingInvite = invitePending(entry);

  const beginStatusChange = () => {
    setFeedback({});
    setPendingStatus(nextStatus);
    setCountdown(UNDO_SECONDS);

    timer.current = setInterval(() => {
      setCountdown((current) => {
        if (current <= 1) {
          if (timer.current) clearInterval(timer.current);
          startTransition(async () => {
            const result = await setCooperativeStatusAction(entry.id, nextStatus);
            setPendingStatus(null);
            if (result.error) {
              setFeedback({ error: result.error });
              return;
            }
            router.refresh();
          });
          return 0;
        }
        return current - 1;
      });
    }, 1000);
  };

  const cancelStatusChange = () => {
    if (timer.current) clearInterval(timer.current);
    setPendingStatus(null);
  };

  const resend = () => {
    const email = inviteAddressee(entry);
    if (!email) return;

    startTransition(async () => {
      const result = await resendAdminInviteAction(entry.id, email);
      setFeedback(result.error ? { error: result.error } : { saved: result.saved });
    });
  };

  return (
    <div>
      <Button
        variant="ghost"
        size="sm"
        className="-ml-2"
        render={<Link href="/platform/cooperatives" />}
      >
        <ArrowLeft className="size-4" aria-hidden strokeWidth={2} />
        Cooperatives
      </Button>

      <header className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2">
        <h1 className="type-page-title text-text">{entry.name}</h1>
        <StatusBadge entry={entry} />
      </header>

      <dl className="mt-8 grid gap-px overflow-hidden rounded-feature border border-border bg-border sm:grid-cols-2">
        <Fact label="Created" value={formatDate(entry.createdAt)} />
        <Fact
          label="Admin"
          value={entry.adminName ?? "Nobody named yet"}
          note={entry.adminEmail ?? undefined}
        />
        <Fact label="Members" value={String(entry.memberCount)} />
        <Fact label="Officers" value={String(entry.officerCount)} />
      </dl>

      <section className="mt-8 rounded-feature border border-border bg-surface p-5 md:p-6">
        <h2 className="type-card-title text-text">Deduction policy</h2>
        <p className="type-secondary mt-2 max-w-[520px] text-text-secondary">
          {entry.hasExpiryOverride
            ? "This cooperative has set its own reservation-expiry window, shorter than the organization default."
            : "This cooperative uses the organization default for reservation expiry."}
        </p>
        <p className="type-caption mt-3 max-w-[520px] text-text-muted">
          Shown so you know an override exists. Its loan products and savings rules are that
          cooperative&rsquo;s own business, and are not editable or visible from here.
        </p>
      </section>

      {entry.internalNote ? (
        <section className="mt-6 rounded-feature border border-border bg-surface p-5 md:p-6">
          <h2 className="type-card-title text-text">Your note</h2>
          <p className="type-secondary mt-2 max-w-[520px] text-text">{entry.internalNote}</p>
          <p className="type-caption mt-3 text-text-muted">
            Visible to platform admins only. This cooperative&rsquo;s own staff never see it.
          </p>
        </section>
      ) : null}

      <section className="mt-10 border-t border-border pt-8">
        <h2 className="type-section text-text">Actions</h2>

        {awaitingInvite ? (
          <div className="mt-4 rounded-feature border border-border bg-surface p-5 md:p-6">
            <p className="type-body text-text">
              {inviteAddressee(entry) ?? "The invited address"} has not taken up the admin
              invitation
            </p>
            <p className="type-secondary mt-2 max-w-[520px] text-text-secondary">
              Sent {formatDate(inviteSentAt(entry))}. Clarix cannot deliver the email itself yet,
              a verified sending domain is still outstanding, so reissuing refreshes the
              invitation rather than putting a message in front of them. It becomes a real role
              the first time they sign in with that address.
            </p>

            <Button variant="outline" size="sm" className="mt-4" type="button" onClick={resend}>
              <Mail className="size-4" aria-hidden strokeWidth={2} />
              Reissue the invitation
            </Button>
          </div>
        ) : null}

        <div className="mt-4 rounded-feature border border-border bg-surface p-5 md:p-6">
          {pendingStatus ? (
            <div className="flex flex-wrap items-center justify-between gap-4">
              <p className="type-body text-text">
                {pendingStatus === "inactive" ? "Deactivating" : "Reactivating"} {entry.name} in{" "}
                {countdown}s
              </p>
              <Button variant="outline" size="sm" type="button" onClick={cancelStatusChange}>
                <Undo2 className="size-4" aria-hidden strokeWidth={2} />
                Undo
              </Button>
            </div>
          ) : (
            <>
              <p className="type-body text-text">
                {entry.status === "active" ? "Deactivate this cooperative" : "Reactivate this cooperative"}
              </p>
              <p className="type-secondary mt-2 max-w-[520px] text-text-secondary">
                {entry.status === "active"
                  ? "It keeps every record it holds and stops appearing to employees looking for a cooperative to join."
                  : "It becomes visible again to employees browsing for a cooperative to join."}
              </p>

              <Button
                variant={entry.status === "active" ? "outline" : "primary"}
                size="sm"
                className="mt-4"
                type="button"
                onClick={beginStatusChange}
              >
                <Power className="size-4" aria-hidden strokeWidth={2} />
                {entry.status === "active" ? "Deactivate" : "Reactivate"}
              </Button>
            </>
          )}
        </div>

        <SectionFeedback saved={feedback.saved} error={feedback.error} />
      </section>
    </div>
  );
}

function Fact({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="bg-surface px-5 py-4">
      <dt className="type-caption uppercase tracking-[0.08em] text-text-muted">{label}</dt>
      <dd className="type-body mt-1 text-text">{value}</dd>
      {note ? <dd className="type-caption mt-1 text-text-muted">{note}</dd> : null}
    </div>
  );
}

function formatDate(iso: string | null): string {
  if (!iso) return "Unknown";
  return formatFullDate(iso);
}
