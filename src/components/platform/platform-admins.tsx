"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Plus, ShieldCheck, Undo2, UserMinus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SectionFeedback } from "@/components/clarix/section-feedback";
import {
  grantPlatformAdminAction,
  revokePlatformAdminAction,
} from "@/app/platform/admin-actions";
import type { PlatformAdminRow } from "@/lib/supabase/platform-admin-data";
import { formatShortDate } from "@/lib/format";

const UNDO_SECONDS = 8;

/**
 * Manage Platform Admins (super-admin blueprint 8.1).
 *
 * Who else operates the platform. Adding someone grants a flag on `platform_admins`, which is a
 * different table and a different thing from cooperative staff, which is why this does not reuse
 * `invite_cooperative_staff()`. A platform admin belongs to no cooperative.
 *
 * Removal uses the Timed Undo pattern, with the countdown before the write as everywhere else.
 * **You cannot remove yourself**, and the control is absent on your own row, but the absence is
 * only a courtesy. `revoke_platform_admin()` refuses self-removal in the database, so the
 * safeguard holds whether or not the button was ever rendered.
 */
export function PlatformAdmins({
  admins,
  currentUserId,
}: {
  admins: PlatformAdminRow[];
  currentUserId: string;
}) {
  const [feedback, setFeedback] = useState<{ saved?: string; error?: string }>({});
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [pending, startTransition] = useTransition();

  const add = () => {
    setFeedback({});
    startTransition(async () => {
      const result = await grantPlatformAdminAction(email);
      setFeedback(result);
      if (result.saved) {
        setEmail("");
        setOpen(false);
      }
    });
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="type-section text-text">Who operates the platform</h2>
        {open ? null : (
          <Button type="button" size="sm" onClick={() => setOpen(true)}>
            <Plus className="size-4" aria-hidden strokeWidth={2.5} />
            Add a platform admin
          </Button>
        )}
      </div>

      <ul className="mt-6 divide-y divide-border rounded-feature border border-border bg-surface">
        {admins.map((admin) => (
          <AdminRow
            key={admin.userId}
            admin={admin}
            isSelf={admin.userId === currentUserId}
            onFeedback={setFeedback}
          />
        ))}
      </ul>

      {open ? (
        <div className="mt-6 rounded-feature border border-border bg-surface p-5 md:p-6">
          <h3 className="type-card-title text-text">Add a platform admin</h3>
          <p className="type-secondary mt-2 max-w-[520px] text-text-secondary">
            They need a Clarix account already. There is no signup door into this role and Clarix
            does not create accounts for people, so grant it to an address that has one.
          </p>

          <div className="mt-4 flex flex-col gap-2">
            <Label htmlFor="admin-email">Their email address</Label>
            <Input
              id="admin-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@fmcabeokuta.org.ng"
              className="max-w-[360px]"
            />
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-4">
            <Button type="button" size="sm" onClick={add} disabled={pending || !email.trim()}>
              {pending ? "Adding…" : "Add"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setOpen(false);
                setFeedback({});
              }}
            >
              <X className="size-4" aria-hidden strokeWidth={2} />
              Cancel
            </Button>
          </div>
        </div>
      ) : null}

      <SectionFeedback saved={feedback.saved} error={feedback.error} />
    </div>
  );
}

function AdminRow({
  admin,
  isSelf,
  onFeedback,
}: {
  admin: PlatformAdminRow;
  isSelf: boolean;
  onFeedback: (feedback: { saved?: string; error?: string }) => void;
}) {
  const [, startTransition] = useTransition();
  const [removing, setRemoving] = useState(false);
  const [removed, setRemoved] = useState(false);
  const [countdown, setCountdown] = useState(UNDO_SECONDS);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearInterval(timer.current);
  }, []);

  const beginRemoval = () => {
    onFeedback({});
    setRemoving(true);
    setCountdown(UNDO_SECONDS);

    timer.current = setInterval(() => {
      setCountdown((current) => {
        if (current <= 1) {
          if (timer.current) clearInterval(timer.current);
          startTransition(async () => {
            const result = await revokePlatformAdminAction(admin.userId);
            if (result.error) {
              setRemoving(false);
              onFeedback({ error: result.error });
              return;
            }
            setRemoved(true);
          });
          return 0;
        }
        return current - 1;
      });
    }, 1000);
  };

  const cancelRemoval = () => {
    if (timer.current) clearInterval(timer.current);
    setRemoving(false);
  };

  if (removed) {
    return (
      <li className="px-5 py-4">
        <p className="type-secondary text-text-secondary">
          {admin.name ?? admin.email} no longer operates the platform.
        </p>
      </li>
    );
  }

  return (
    <li className="flex flex-wrap items-center gap-4 px-5 py-4">
      <span
        aria-hidden
        className="flex size-10 shrink-0 items-center justify-center rounded-card border border-border text-text-muted"
      >
        <ShieldCheck className="size-[18px]" strokeWidth={1.75} />
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate type-body text-text">
          {admin.name ?? admin.email ?? "A platform admin"}
          {isSelf ? <span className="ml-2 type-caption text-text-muted">You</span> : null}
        </p>
        <p className="type-caption mt-1 truncate text-text-muted">
          {admin.email}
          {" · added "}
          {formatDate(admin.grantedAt)}
        </p>
      </div>

      {isSelf ? (
        <p className="type-caption max-w-[220px] text-text-muted">
          You cannot remove your own access here, so a single operator cannot lock themselves out.
        </p>
      ) : removing ? (
        <div className="flex items-center gap-3">
          <span className="type-caption text-text-secondary">Removing in {countdown}s</span>
          <Button variant="outline" size="sm" type="button" onClick={cancelRemoval}>
            <Undo2 className="size-4" aria-hidden strokeWidth={2} />
            Undo
          </Button>
        </div>
      ) : (
        <Button variant="ghost" size="sm" type="button" onClick={beginRemoval}>
          <UserMinus className="size-4" aria-hidden strokeWidth={2} />
          Remove
        </Button>
      )}
    </li>
  );
}

function formatDate(iso: string): string {
  return formatShortDate(iso);
}
