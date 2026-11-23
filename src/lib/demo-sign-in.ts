/**
 * The demo sign-in chips (D048, pulled forward from BUILD-PLAN 5.4 as R2 1.4c).
 *
 * Server code only: the login page and the demo action import this, the client form never does,
 * and `npm run test:bundle` fails the build if a password value or one of these variable names
 * ever reaches the browser. Everything here takes the environment as an argument so the gate is
 * unit-tested without touching the real one.
 */

export const DEMO_ROLES = ["member", "admin", "officer", "platform"] as const;
export type DemoRole = (typeof DEMO_ROLES)[number];

export const DEMO_ROLE_LABELS: Record<DemoRole, string> = {
  member: "Member",
  admin: "Cooperative admin",
  officer: "Officer",
  platform: "Platform",
};

type Env = Record<string, string | undefined>;

/**
 * The one gate. Both halves are required: the owner switches demo mode on per deployment, and
 * Production refuses whatever its variables say (D048: never in Production).
 */
export function demoSignInAllowed(env: Env = process.env): boolean {
  return env.NEXT_PUBLIC_DEMO_MODE === "true" && env.VERCEL_ENV !== "production";
}

function variableNames(role: DemoRole) {
  const suffix = role.toUpperCase();
  return { email: `DEMO_EMAIL_${suffix}`, password: `DEMO_PASSWORD_${suffix}` };
}

/** The account for one role, or null when the gate is shut or either variable is missing. */
export function demoCredentials(
  role: DemoRole,
  env: Env = process.env,
): { email: string; password: string } | null {
  if (!demoSignInAllowed(env)) return null;
  const names = variableNames(role);
  const email = env[names.email]?.trim();
  const password = env[names.password];
  if (!email || !password) return null;
  return { email: email.toLowerCase(), password };
}

/** The chips to draw: only roles whose two variables are both set, and none when the gate is shut. */
export function availableDemoRoles(env: Env = process.env): DemoRole[] {
  return DEMO_ROLES.filter((role) => demoCredentials(role, env) !== null);
}

export function isDemoRole(value: unknown): value is DemoRole {
  return typeof value === "string" && (DEMO_ROLES as readonly string[]).includes(value);
}
