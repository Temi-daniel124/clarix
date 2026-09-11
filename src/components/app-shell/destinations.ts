import { Building2, House, Bell, Receipt, User, type LucideIcon } from "lucide-react";

/**
 * The employee app's information architecture — blueprint Part 3.
 *
 * There is one set of functional areas, expressed two ways. Mobile gets a four-item bottom bar
 * with Notifications, Profile and Help folded behind "More", because five items in a bottom bar
 * is crowded and "More" is a space-saving device. Desktop has the width, so Notifications and
 * Profile become their own sidebar rows and "More" does not exist there at all.
 *
 * The blueprint is explicit that this must never become two different information architectures,
 * which is why both bars are generated from this one list rather than written out separately.
 */

export type Destination = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Which bar this appears in directly. "more" items live behind More on mobile. */
  placement: "both" | "more";
  /** Match nested routes, so /cooperatives/discover still lights the Cooperatives tab. */
  matchPrefix?: boolean;
};

export const DESTINATIONS: Destination[] = [
  { href: "/dashboard", label: "Home", icon: House, placement: "both" },
  {
    href: "/cooperatives",
    label: "Cooperatives",
    icon: Building2,
    placement: "both",
    matchPrefix: true,
  },
  { href: "/loans", label: "Loans", icon: Receipt, placement: "both", matchPrefix: true },
  { href: "/notifications", label: "Notifications", icon: Bell, placement: "more" },
  { href: "/profile", label: "Profile", icon: User, placement: "more" },
];

/** The four bottom-bar entries: the three shared areas, plus More. */
export const PRIMARY_DESTINATIONS = DESTINATIONS.filter((entry) => entry.placement === "both");

/** What sits behind More on mobile, and appears as its own sidebar row on desktop. */
export const SECONDARY_DESTINATIONS = DESTINATIONS.filter((entry) => entry.placement === "more");

export function isActive(pathname: string, destination: Destination): boolean {
  if (destination.matchPrefix) return pathname.startsWith(destination.href);
  return pathname === destination.href;
}
