import type { Metadata } from "next";
import { pageMetadata } from "@/lib/site";
import { SignUpForm } from "./signup-form";

const title = "Create your account";
const description =
  "Create one Clarix account for every cooperative you belong to, or set up your own cooperative with a 60-day free trial.";

export const metadata: Metadata = {
  title,
  description,
  ...pageMetadata("/signup", { title, description }),
};

export default function SignUpPage() {
  return <SignUpForm />;
}
