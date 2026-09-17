"use client";

import { useTransition } from "react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { logOutAction } from "./actions";

/**
 * Log out (blueprint 6.2), "at the very bottom, visually separated from everything else, in a
 * muted rather than alarming style".
 *
 * Muted is the correct reading of the action: signing out of a device is ordinary and reversible
 * in ten seconds, so a red button would be overstating it. The danger tone in this product is
 * reserved for things that cost money or cannot be undone.
 */
export function LogOutButton() {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={() => startTransition(() => logOutAction())}
      className="text-text-secondary"
    >
      <LogOut className="size-4" aria-hidden strokeWidth={2} />
      {pending ? "Signing out…" : "Log out"}
    </Button>
  );
}
