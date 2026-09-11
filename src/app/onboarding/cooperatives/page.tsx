import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { StepIndicator } from "@/components/clarix/step-indicator";
import { createClient } from "@/lib/supabase/server";
import { loadOnboardingContext } from "@/lib/supabase/onboarding-state";
import { CooperativeBrowser } from "./cooperative-browser";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Join a cooperative" };

export default async function CooperativesPage() {
  const context = await loadOnboardingContext();
  if (!context) redirect("/login");

  const supabase = await createClient();

  const [{ data: cooperatives }, { data: memberships }] = await Promise.all([
    supabase
      .from("cooperatives")
      .select("id, name, description, requirements")
      .eq("organization_id", context.organization.id)
      .eq("status", "active")
      .order("name"),
    supabase.from("cooperative_memberships").select("cooperative_id").eq("user_id", context.userId),
  ]);

  const appliedTo = new Set((memberships ?? []).map((row) => row.cooperative_id));

  return (
    <>
      <StepIndicator current="cooperatives" />
      <CooperativeBrowser
        organizationName={context.organization.name}
        cooperatives={(cooperatives ?? []).map((entry) => ({
          id: entry.id,
          name: entry.name,
          description: entry.description,
          requirements: entry.requirements,
          applied: appliedTo.has(entry.id),
        }))}
      />
    </>
  );
}
