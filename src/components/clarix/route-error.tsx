"use client";

import { useEffect } from "react";
import { CloudOff, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusPage } from "./status-page";

/**
 * What every error boundary shows (BUILD-PLAN 1.5): a page or its data failed to load. One line and
 * "Try again", which calls Next's retry(): it refetches the segment's data and renders it again, so
 * a read that failed for a moment comes back without a full reload. The error itself goes to the
 * console (and so to the logs); the person never sees a message, code or digest.
 */
export function RouteError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <>
      <title>{"Page didn’t load · Clarix"}</title>
      <StatusPage
        icon={CloudOff}
        title="This page didn’t load."
        action={
          <Button onClick={() => retry()}>
            <RotateCw aria-hidden />
            Try again
          </Button>
        }
      />
    </>
  );
}
