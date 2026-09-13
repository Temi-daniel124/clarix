import {
  Bell,
  Building2,
  CircleQuestionMark,
  House,
  KeyRound,
  ScrollText,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  type LucideIcon,
} from "lucide-react";

/**
 * The Super Admin's information architecture — super-admin blueprint Part 3.
 *
 * Flat on purpose. Every other staff role nests its configuration behind a "Manage cooperative"
 * section; this one does not, because "this role's entire scope is small enough that everything
 * fits as a direct, visible entry, which is itself consistent with the 'calm infrastructure, not
 * a consumer app' design principle for this specific role".
 *
 * Nothing in this list reaches a member's savings, loans or salary, and that absence is the
 * feature rather than a gap in the build. The one path to that data is Access Requests, which is
 * an explicit, time-boxed, logged flow rather than a screen that simply shows it.
 */

export type PlatformDestination = {
  href: string;
  label: string;
  icon: LucideIcon;
  matchPrefix?: boolean;
};

/** The four areas the mobile tab bar carries: Home, Cooperatives, Policy, and More. */
export const PLATFORM_PRIMARY: PlatformDestination[] = [
  { href: "/platform", label: "Home", icon: House },
  { href: "/platform/cooperatives", label: "Cooperatives", icon: Building2, matchPrefix: true },
  { href: "/platform/policy", label: "Policy", icon: SlidersHorizontal },
];

/**
 * Direct sidebar rows on desktop, and the first group behind More on mobile. Oversight and the
 * one deliberate exception to the financial-data boundary.
 */
export const PLATFORM_OVERSIGHT: PlatformDestination[] = [
  { href: "/platform/audit", label: "Audit log", icon: ScrollText },
  { href: "/platform/access-requests", label: "Access requests", icon: KeyRound },
  { href: "/platform/admins", label: "Platform admins", icon: ShieldCheck },
];

export const PLATFORM_ACCOUNT: PlatformDestination[] = [
  { href: "/platform/notifications", label: "Notifications", icon: Bell },
  { href: "/platform/profile", label: "Profile", icon: Settings2 },
  { href: "/platform/help", label: "Help", icon: CircleQuestionMark },
];

export function isPlatformActive(pathname: string, destination: PlatformDestination): boolean {
  if (destination.matchPrefix) return pathname.startsWith(destination.href);
  return pathname === destination.href;
}

export function isPlatformMoreActive(pathname: string): boolean {
  if (pathname === "/platform/more") return true;
  return [...PLATFORM_OVERSIGHT, ...PLATFORM_ACCOUNT].some((entry) =>
    pathname.startsWith(entry.href),
  );
}
