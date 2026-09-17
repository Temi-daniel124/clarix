import { z } from "zod";

/**
 * Validation for the two authentication screens (employee blueprint 1.3 and 1.4).
 * Zod is the single approved validation library (TOOLING-POLICY.md); nothing else parses
 * form input anywhere in the product.
 */

const EMAIL = z.string().trim().toLowerCase().email();

/** Nigerian mobile numbers, accepted as 0803..., 234803... or +234803... */
const PHONE_PATTERN = /^(?:\+?234|0)[789][01]\d{8}$/;

export type IdentifierKind = "email" | "phone" | "unknown";

export function classifyIdentifier(raw: string): IdentifierKind {
  const value = raw.trim();
  if (!value) return "unknown";
  if (EMAIL.safeParse(value).success) return "email";
  if (PHONE_PATTERN.test(value.replace(/[\s-]/g, ""))) return "phone";
  return "unknown";
}

export const identifierSchema = z
  .string()
  .trim()
  .min(1, "Enter your email address.")
  .refine((value) => classifyIdentifier(value) !== "unknown", {
    message: "That doesn't look like an email address or a Nigerian phone number.",
  });

/**
 * Password rules. Deliberately about length first: an eight-character minimum with some
 * variety, explained in plain language rather than enforced through a wall of red text.
 */
export const passwordSchema = z
  .string()
  .min(8, "Use at least 8 characters.")
  .max(72, "Passwords can be at most 72 characters.")
  .refine((value) => /[a-zA-Z]/.test(value), { message: "Include at least one letter." })
  .refine((value) => /[0-9]/.test(value), { message: "Include at least one number." });

export const signUpSchema = z.object({
  identifier: identifierSchema,
  password: passwordSchema,
  dataUseAccepted: z
    .boolean()
    .refine((value) => value, { message: "Please confirm how your data will be used." }),
});

export const logInSchema = z.object({
  identifier: z.string().trim().min(1, "Enter your email address."),
  password: z.string().min(1, "Enter your password."),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type LogInInput = z.infer<typeof logInSchema>;

export type PasswordStrength = {
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
};

/**
 * Drives the strength indicator on Sign Up. Scored on the things that actually matter,
 * length first, then variety, rather than punishing a long passphrase for lacking a symbol.
 */
export function scorePassword(password: string): PasswordStrength {
  if (!password) return { score: 0, label: "Enter a password" };

  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password)) score += 1;

  const labels = ["Too short", "Weak", "Fair", "Strong", "Very strong"] as const;
  const clamped = Math.min(4, score) as 0 | 1 | 2 | 3 | 4;

  return { score: clamped, label: labels[clamped] };
}
