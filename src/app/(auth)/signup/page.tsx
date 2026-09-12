import type { Metadata } from "next";
import { SignUpForm } from "./signup-form";

export const metadata: Metadata = {
  title: "Create your account",
  description:
    "Create one Clarix account for every cooperative you belong to at Federal Medical Centre, Abeokuta.",
};

export default function SignUpPage() {
  return <SignUpForm />;
}
