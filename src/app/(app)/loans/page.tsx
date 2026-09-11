import type { Metadata } from "next";
import { Receipt } from "lucide-react";
import { ComingLater } from "@/components/app-shell/coming-later";

export const metadata: Metadata = { title: "Loans" };

export default function LoansPage() {
  return (
    <ComingLater
      icon={Receipt}
      title="Loans"
      body="Everything you have borrowed, across every cooperative, in one view — and the eligibility check that runs before a new loan is approved. This is the next thing being built."
    />
  );
}
