import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { loadOnboardingContext } from "@/lib/supabase/onboarding-state";
import { WelcomeTour } from "./welcome-tour";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Welcome" };

export default async function WelcomePage() {
  const context = await loadOnboardingContext();
  if (!context) redirect("/login");
  return <WelcomeTour />;
}
