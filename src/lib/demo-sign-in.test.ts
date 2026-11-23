import { describe, expect, it } from "vitest";
import { availableDemoRoles, demoCredentials, demoSignInAllowed } from "./demo-sign-in";

const ALL = {
  DEMO_EMAIL_MEMBER: "Member@Example.test",
  DEMO_PASSWORD_MEMBER: "m-secret",
  DEMO_EMAIL_ADMIN: "admin@example.test",
  DEMO_PASSWORD_ADMIN: "a-secret",
  DEMO_EMAIL_OFFICER: "officer@example.test",
  DEMO_PASSWORD_OFFICER: "o-secret",
  DEMO_EMAIL_PLATFORM: "platform@example.test",
  DEMO_PASSWORD_PLATFORM: "p-secret",
};

describe("demo sign-in gate (D048)", () => {
  it("opens only when demo mode is on and this is not Production", () => {
    expect(demoSignInAllowed({ NEXT_PUBLIC_DEMO_MODE: "true", VERCEL_ENV: "preview" })).toBe(true);
    expect(demoSignInAllowed({ NEXT_PUBLIC_DEMO_MODE: "true", VERCEL_ENV: undefined })).toBe(true);
  });

  it("never opens in Production, even with demo mode switched on", () => {
    expect(demoSignInAllowed({ NEXT_PUBLIC_DEMO_MODE: "true", VERCEL_ENV: "production" })).toBe(false);
    expect(availableDemoRoles({ ...ALL, NEXT_PUBLIC_DEMO_MODE: "true", VERCEL_ENV: "production" })).toEqual([]);
    expect(demoCredentials("admin", { ...ALL, NEXT_PUBLIC_DEMO_MODE: "true", VERCEL_ENV: "production" })).toBeNull();
  });

  it("stays shut unless demo mode is exactly \"true\"", () => {
    for (const value of [undefined, "", "false", "TRUE", "1", "yes"]) {
      expect(demoSignInAllowed({ NEXT_PUBLIC_DEMO_MODE: value, VERCEL_ENV: "preview" })).toBe(false);
    }
  });

  it("offers all four roles when every variable is set", () => {
    expect(availableDemoRoles({ ...ALL, NEXT_PUBLIC_DEMO_MODE: "true", VERCEL_ENV: "preview" })).toEqual([
      "member",
      "admin",
      "officer",
      "platform",
    ]);
  });

  it("hides a role whose email or password is missing", () => {
    const env = { ...ALL, NEXT_PUBLIC_DEMO_MODE: "true", VERCEL_ENV: "preview", DEMO_PASSWORD_OFFICER: undefined, DEMO_EMAIL_PLATFORM: " " };
    expect(availableDemoRoles(env)).toEqual(["member", "admin"]);
    expect(demoCredentials("officer", env)).toBeNull();
  });

  it("hands the server action a trimmed, lower-cased email and the password as set", () => {
    expect(demoCredentials("member", { ...ALL, NEXT_PUBLIC_DEMO_MODE: "true", VERCEL_ENV: "preview" })).toEqual({
      email: "member@example.test",
      password: "m-secret",
    });
  });
});
