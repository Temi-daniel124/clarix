import type { ShellIdentity } from "./types";

/**
 * The way across between someone's two sides (BUILD-PLAN 1.4): staff who are also members get
 * "Switch to my member view"; a member who also works at a cooperative, or runs the platform,
 * gets the way back. One rule, used by the desktop account menu, the switcher sheet, the palette
 * and the phone More screens.
 */
export type OtherView = { href: string; label: string };

export function otherViewFor(side: "member" | "staff" | "platform", identity: ShellIdentity): OtherView | null {
  if (side === "member") {
    if (identity.isPlatformAdmin) return { href: "/platform", label: "Switch to the platform console" };
    if (identity.hasStaffRole) return { href: "/admin", label: "Switch to my cooperative console" };
    return null;
  }
  return identity.isMember ? { href: "/dashboard", label: "Switch to my member view" } : null;
}
