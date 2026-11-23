import type { Metadata } from "next";
import { availableDemoRoles, DEMO_ROLE_LABELS } from "@/lib/demo-sign-in";
import { LogInForm } from "./login-form";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to Clarix to see every cooperative you belong to in one place.",
};

// The demo chips depend on this deployment's environment, read at request time on the server.
export const dynamic = "force-dynamic";

export default function LogInPage() {
  // Only role ids and labels cross to the browser: never an email, never a password (D048).
  const demoRoles = availableDemoRoles().map((role) => ({ role, label: DEMO_ROLE_LABELS[role] }));
  return <LogInForm demoRoles={demoRoles} />;
}
