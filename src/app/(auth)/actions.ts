"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { classifyIdentifier, logInSchema, signUpSchema } from "@/lib/validation/auth";
import { describeAuthError } from "@/lib/validation/auth-errors";

export type AuthFormState = {
  /** Shown above the form. Never echoes back which half of a credential pair was wrong. */
  error?: string;
  /** Keyed by field name, for inline messages under the offending input. */
  fieldErrors?: Partial<Record<"identifier" | "password" | "dataUseAccepted", string>>;
};

/**
 * Sign Up (employee blueprint 1.3).
 *
 * Creating the auth user is all this does: the matching public.users row is inserted by the
 * on_auth_user_created trigger in supabase/migrations, inside the same transaction as the
 * auth.users insert, so an account can never exist without its Clarix row. That also keeps
 * SECURITY.md's list of service-role-key code paths empty.
 */
export async function signUpAction(
  _previous: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = signUpSchema.safeParse({
    identifier: String(formData.get("identifier") ?? ""),
    password: String(formData.get("password") ?? ""),
    dataUseAccepted: formData.get("dataUseAccepted") === "on",
  });

  if (!parsed.success) {
    return { fieldErrors: collectFieldErrors(parsed.error) };
  }

  const { identifier, password } = parsed.data;

  // Phone sign-up needs an SMS provider, which the pilot does not have and which
  // TOOLING-POLICY.md does not approve. Say so plainly rather than failing obscurely.
  if (classifyIdentifier(identifier) === "phone") {
    return {
      fieldErrors: {
        identifier:
          "Phone sign-up isn't available yet — please use your email address for now.",
      },
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: identifier,
    password,
  });

  if (error) {
    return { error: describeAuthError(error) };
  }

  redirect("/verify");
}

/** Log In (employee blueprint 1.4). */
export async function logInAction(
  _previous: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = logInSchema.safeParse({
    identifier: String(formData.get("identifier") ?? ""),
    password: String(formData.get("password") ?? ""),
  });

  if (!parsed.success) {
    return { fieldErrors: collectFieldErrors(parsed.error) };
  }

  const { identifier, password } = parsed.data;

  if (classifyIdentifier(identifier) === "phone") {
    return {
      fieldErrors: {
        identifier: "Phone sign-in isn't available yet — please use your email address.",
      },
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: identifier.toLowerCase(),
    password,
  });

  if (error) {
    // Deliberately does not distinguish "no such account" from "wrong password".
    return { error: "That email address and password don't match an account." };
  }

  redirect("/dashboard");
}

function collectFieldErrors(error: { issues: Array<{ path: PropertyKey[]; message: string }> }) {
  const fieldErrors: AuthFormState["fieldErrors"] = {};

  for (const issue of error.issues) {
    const field = issue.path[0];
    if (field === "identifier" || field === "password" || field === "dataUseAccepted") {
      fieldErrors[field] ??= issue.message;
    }
  }

  return fieldErrors;
}
