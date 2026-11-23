"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ChevronDown, Clock, Lock, Trash2, Undo2, UserCog } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { SectionFeedback } from "@/components/clarix/section-feedback";
import { cn } from "@/lib/utils";
import {
  PERMISSIONS,
  UNBUILT_PERMISSIONS,
  type PermissionKey,
} from "@/lib/permissions";
import {
  revokeOfficerAction,
  setOfficerPermissionAction,
  setOfficerTitleAction,
} from "@/app/admin/officer-actions";

/** Seconds before a removal actually happens, so an accidental tap costs nothing. */
const UNDO_SECONDS = 8;

export type ManagedOfficer = {
  id: string;
  name: string | null;
  email: string | null;
  title: string | null;
  status: "invited" | "active";
  permissions: Record<PermissionKey, boolean>;
};

/**
 * Officer Management (admin blueprint 7.2).
 *
 * The list from setup 2.5 grew up: each officer's row opens a panel with the permission toggles,
 * the editable title, and removal. What 2.5 offers is still the right thing for a first run, two
 * presets and an email address, and this is where that starting point gets refined.
 *
 * Each toggle saves on its own and each one moves a real boundary: migration 016 rewired the
 * policies behind them, so switching off "see the member list" means Postgres refuses the rows,
 * not that the screen hides them.
 */
export function OfficerManagement({ officers }: { officers: ManagedOfficer[] }) {
  const [open, setOpen] = useState<string | null>(null);

  if (officers.length === 0) {
    return (
      <div className="rounded-feature border border-border bg-surface px-6 py-10 text-center">
        <span
          aria-hidden
          className="mx-auto flex size-12 items-center justify-center rounded-card border border-border text-text-muted"
        >
          <UserCog className="size-5" strokeWidth={1.75} />
        </span>
        <p className="type-body mt-5 text-text">Nobody else works on this cooperative yet</p>
        <p className="type-secondary mx-auto mt-2 max-w-[420px] text-text-secondary">
          Invite an officer below, and their permissions become editable here once they exist.
        </p>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {officers.map((officer) => (
        <li key={officer.id}>
          <OfficerRow
            officer={officer}
            expanded={open === officer.id}
            onToggle={() => setOpen(open === officer.id ? null : officer.id)}
          />
        </li>
      ))}
    </ul>
  );
}

function OfficerRow({
  officer,
  expanded,
  onToggle,
}: {
  officer: ManagedOfficer;
  expanded: boolean;
  onToggle: () => void;
}) {
  const reduceMotion = useReducedMotion();
  const [permissions, setPermissions] = useState(officer.permissions);
  const [title, setTitle] = useState(officer.title ?? "");
  const [feedback, setFeedback] = useState<{ saved?: string; error?: string }>({});
  const [, startTransition] = useTransition();

  const [removing, setRemoving] = useState(false);
  const [countdown, setCountdown] = useState(UNDO_SECONDS);
  const [removed, setRemoved] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  // A pending removal must not outlive the row it belongs to.
  useEffect(() => () => {
    if (timer.current) clearInterval(timer.current);
  }, []);

  const grantedCount = PERMISSIONS.filter((permission) => permissions[permission.key]).length;

  const toggle = (key: PermissionKey, enabled: boolean) => {
    const previous = permissions[key];
    setPermissions((current) => ({ ...current, [key]: enabled }));
    setFeedback({});

    startTransition(async () => {
      const result = await setOfficerPermissionAction(officer.id, key, enabled);

      if (result.error) {
        setPermissions((current) => ({ ...current, [key]: previous }));
        setFeedback({ error: result.error });
        return;
      }
      setFeedback({ saved: result.saved });
    });
  };

  const saveTitle = () => {
    startTransition(async () => {
      const result = await setOfficerTitleAction(officer.id, title);
      setFeedback(result.error ? { error: result.error } : { saved: result.saved });
    });
  };

  const beginRemoval = () => {
    setRemoving(true);
    setCountdown(UNDO_SECONDS);

    timer.current = setInterval(() => {
      setCountdown((current) => {
        if (current <= 1) {
          if (timer.current) clearInterval(timer.current);
          startTransition(async () => {
            const result = await revokeOfficerAction(officer.id);
            if (result.error) {
              setRemoving(false);
              setFeedback({ error: result.error });
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
      <div className="rounded-feature border border-border bg-surface px-5 py-4">
        <p className="type-body text-text-secondary">
          {officer.name ?? officer.email} no longer has access to this cooperative. Anything they
          hold elsewhere in Clarix is untouched.
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-feature border bg-surface transition-colors duration-150",
        expanded ? "border-text-muted/30" : "border-border",
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="flex w-full items-start gap-4 px-5 py-4 text-left focus-visible:outline-2 focus-visible:outline-indigo focus-visible:-outline-offset-2"
      >
        <span
          aria-hidden
          className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-card border border-border text-text-muted"
        >
          <UserCog className="size-4" strokeWidth={1.75} />
        </span>

        <span className="min-w-0 flex-1">
          <span className="block type-card-title truncate text-text">
            {officer.name ?? officer.email ?? "Officer"}
          </span>
          <span className="mt-1 block type-secondary text-text-secondary">
            {officer.title ?? "Officer"} ·{" "}
            {grantedCount === 0
              ? "No permissions yet"
              : `${grantedCount} of ${PERMISSIONS.length} permissions`}
          </span>
        </span>

        {officer.status === "invited" ? (
          <span className="flex items-center gap-2 type-caption whitespace-nowrap text-text-muted">
            <Clock aria-hidden strokeWidth={1.75} className="size-3.5" />
            Not accepted yet
          </span>
        ) : null}

        <ChevronDown
          aria-hidden
          strokeWidth={2}
          className={cn(
            "mt-1 size-4 shrink-0 text-text-muted transition-transform duration-200",
            expanded && "rotate-180",
          )}
        />
      </button>

      <AnimatePresence initial={false}>
        {expanded ? (
          <motion.div
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={reduceMotion ? { duration: 0 } : { duration: 0.18 }}
            className="border-t border-border px-5 py-5"
          >
            <h3 className="type-caption uppercase tracking-[0.08em] text-text-muted">
              What they can do
            </h3>

            <div className="mt-3 flex flex-col">
              {PERMISSIONS.map((permission) => (
                <div
                  key={permission.key}
                  className="flex items-start justify-between gap-5 border-b border-border py-4 last:border-b-0"
                >
                  <div className="min-w-0">
                    <p className="type-card-title text-text">{permission.label}</p>
                    <p className="type-secondary mt-1 text-text-secondary">
                      {permission.description}
                    </p>
                  </div>
                  <Switch
                    checked={permissions[permission.key]}
                    onCheckedChange={(checked) => toggle(permission.key, checked)}
                    aria-label={permission.label}
                    className="mt-1 shrink-0"
                  />
                </div>
              ))}

              {UNBUILT_PERMISSIONS.map((permission) => (
                <div
                  key={permission.label}
                  className="flex items-start justify-between gap-5 border-t border-border py-4 opacity-60"
                >
                  <div className="min-w-0">
                    <p className="type-card-title text-text">{permission.label}</p>
                    <p className="type-secondary mt-1 text-text-secondary">
                      {permission.description}
                    </p>
                  </div>
                  <span
                    aria-hidden
                    className="mt-1 flex size-6 shrink-0 items-center justify-center text-text-muted"
                  >
                    <Lock className="size-4" strokeWidth={1.75} />
                  </span>
                </div>
              ))}
            </div>

            <p className="type-caption mt-4 max-w-[560px] text-text-muted">
              Nothing is on unless you switch it on, and each switch changes what the database
              itself permits rather than only what this screen shows.
            </p>

            <div className="mt-6 border-t border-border pt-5">
              <label
                htmlFor={`title-${officer.id}`}
                className="type-secondary font-medium text-text"
              >
                What this cooperative calls them
              </label>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <Input
                  id={`title-${officer.id}`}
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Treasurer, Secretary, optional"
                  className="max-w-[280px]"
                />
                <Button variant="secondary" onClick={saveTitle}>
                  Save title
                </Button>
              </div>
              <p className="type-caption mt-2 text-text-muted">
                A display label only. It never changes what they are allowed to do.
              </p>
            </div>

            <div className="mt-6 border-t border-border pt-5">
              <SectionFeedback saved={feedback.saved} error={feedback.error} />

              {removing ? (
                <div className="mt-2 flex flex-wrap items-center gap-4 rounded-card border border-border bg-background px-4 py-3">
                  <p className="min-w-0 flex-1 type-secondary text-text">
                    Removing access in {countdown}… nothing has changed yet.
                  </p>
                  <Button variant="secondary" onClick={cancelRemoval}>
                    <Undo2 className="size-4" aria-hidden strokeWidth={2} />
                    Undo
                  </Button>
                </div>
              ) : (
                <Button
                  variant="tertiary"
                  onClick={beginRemoval}
                  className="-ml-3 text-danger"
                >
                  <Trash2 className="size-4" aria-hidden strokeWidth={2} />
                  Remove their access
                </Button>
              )}

              <p className="type-caption mt-3 max-w-[560px] text-text-muted">
                Removing access here affects this cooperative only. Anything the same person holds
                elsewhere in Clarix: an officer role at another cooperative, or their own
                membership somewhere, is scoped separately and stays exactly as it was.
              </p>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
