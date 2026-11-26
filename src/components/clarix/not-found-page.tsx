import Link from "next/link";
import { SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusPage } from "./status-page";

/** A page that does not exist (BUILD-PLAN 1.5): one line, and the way back to where it belongs. */
export function NotFoundPage({ home, homeLabel = "Back to home" }: { home: string; homeLabel?: string }) {
  return (
    <StatusPage
      icon={SearchX}
      title="This page doesn’t exist."
      action={<Button render={<Link href={home} />}>{homeLabel}</Button>}
    />
  );
}
