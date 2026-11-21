import type { Metadata } from "next";
import { pageMetadata } from "@/lib/site";
import { LogInForm } from "./login-form";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to Clarix to see every cooperative you belong to in one place.",
  ...pageMetadata("/login", { title: "Sign in", description: "Sign in to Clarix to see every cooperative you belong to in one place." }),
};

export default function LogInPage() {
  return <LogInForm />;
}
