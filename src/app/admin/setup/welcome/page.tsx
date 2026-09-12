import type { Metadata } from "next";
import { AdminWelcomeTour } from "./welcome-tour";

export const metadata: Metadata = { title: "Welcome to Clarix" };

/**
 * Welcome to Cooperative Admin — admin blueprint 2.1.
 *
 * Deliberately not the employee tour: an admin is about to be asked for a public profile, loan
 * rules and a member list, none of which the employee sequence mentions.
 */
export default function AdminWelcomePage() {
  return <AdminWelcomeTour />;
}
