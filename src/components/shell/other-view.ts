import type { ShellIdentity } from "./types";

/**
 * The way across between someone's two sides (BUILD-PLAN 1.4): staff who are also members get
 * "Switch to my member view"; a member who also works at a cooperative, or runs the platform,
 * gets the way back. One rule, used by the desktop account menu, the switcher sheet, the palette
 * and the phone More screens. Labels stay short enough for one line in the 224px menu, and say
 * "staff", not "admin", because an officer gets the same row (walkthrough 1.4d item 6).
 */
export type OtherView = { href: string; label: string };

export function otherViewFor(side: "member" | "staff" | "platform", identity: ShellIdentity): OtherView | null {
  if (side === "member") {
    if (identity.isPlatformAdmin) return { href: "/platform", label: "Switch to platform" };
    if (identity.hasStaffRole) return { href: "/admin", label: "Switch to staff view" };
    return null;
  }
  return identity.isMember ? { href: "/dashboard", label: "Switch to my member view" } : null;
}
