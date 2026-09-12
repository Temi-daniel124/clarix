import {
  Bell,
  Building2,
  FileSpreadsheet,
  House,
  Landmark,
  Receipt,
  Scale,
  Settings2,
  UserCog,
  Users,
  type LucideIcon,
} from "lucide-react";

/**
 * The cooperative admin's information architecture — admin blueprint Part 3.
 *
 * A different set of destinations from the employee app, reached by a different role, but the
 * same principle: one information architecture expressed at two densities, never two apps. The
 * four functional areas are Home, Members, Loans, and Manage cooperative — and Manage is the one
 * that differs most between platforms, because desktop has room to list its six sub-items
 * directly while mobile folds them behind More alongside Notifications, Profile and Help.
 *
 * This is a separate list from the employee shell's rather than a variant of it. The two roles
 * share tokens, motion and the meter motif; they do not share destinations, and pretending they
 * did would mean one list full of conditionals that reads as neither role's app.
 */

export type AdminDestination = {
  href: string;
  label: string;
  icon: LucideIcon;
  matchPrefix?: boolean;
};

/** The four areas: a bottom bar on mobile, the top of the sidebar on desktop. */
export const ADMIN_PRIMARY: AdminDestination[] = [
  { href: "/admin", label: "Home", icon: House },
  { href: "/admin/members", label: "Members", icon: Users, matchPrefix: true },
  { href: "/admin/loans", label: "Loans", icon: Receipt, matchPrefix: true },
];

/**
 * "Manage cooperative" — its own sidebar section on desktop, and the top of More on mobile.
 * Everything here is a cooperative-level setting rather than a day-to-day task, which is why it
 * is one area rather than four more tabs.
 */
export const ADMIN_MANAGE: AdminDestination[] = [
  { href: "/admin/manage/products", label: "Loan products", icon: Scale },
  { href: "/admin/manage/officers", label: "Officers", icon: UserCog },
  { href: "/admin/manage/profile", label: "Public profile", icon: Building2 },
  { href: "/admin/manage/import", label: "Import members", icon: FileSpreadsheet },
  { href: "/admin/manage/reconciliation", label: "Reconciliation", icon: Landmark },
  { href: "/admin/manage/reports", label: "Reports", icon: FileSpreadsheet },
];

/** Account-level rows: their own sidebar entries on desktop, behind More on mobile. */
export const ADMIN_ACCOUNT: AdminDestination[] = [
  { href: "/admin/notifications", label: "Notifications", icon: Bell },
  { href: "/admin/profile", label: "Profile", icon: Settings2 },
];

export function isAdminActive(pathname: string, destination: AdminDestination): boolean {
  if (destination.matchPrefix) return pathname.startsWith(destination.href);
  return pathname === destination.href;
}

/** True when More should read as the active tab on mobile. */
export function isMoreActive(pathname: string): boolean {
  if (pathname === "/admin/more") return true;
  return [...ADMIN_MANAGE, ...ADMIN_ACCOUNT].some((entry) => pathname.startsWith(entry.href));
}
