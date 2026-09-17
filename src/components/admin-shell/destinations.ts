import {
  Bell,
  Building2,
  CircleQuestionMark,
  FileSpreadsheet,
  House,
  Landmark,
  Receipt,
  Scale,
  ScrollText,
  Settings2,
  UserCog,
  Users,
  type LucideIcon,
} from "lucide-react";

/**
 * The cooperative admin's information architecture, admin blueprint Part 3.
 *
 * A different set of destinations from the employee app, reached by a different role, but the
 * same principle: one information architecture expressed at two densities, never two apps. The
 * four functional areas are Home, Members, Loans, and Manage cooperative, and Manage is the one
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
 * "Manage cooperative". Its own sidebar section on desktop, and the top of More on mobile.
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

/**
 * The account cluster, admin blueprint Part 8. Their own sidebar entries on desktop, behind More
 * on mobile.
 *
 * The audit log sits here rather than under Manage cooperative because Part 8 groups it with the
 * account screens: it is consulted rather than configured, and an admin reaches for it when
 * something needs checking, not while setting anything up.
 */
export const ADMIN_ACCOUNT: AdminDestination[] = [
  { href: "/admin/notifications", label: "Notifications", icon: Bell },
  { href: "/admin/audit", label: "Audit log", icon: ScrollText },
  { href: "/admin/profile", label: "Profile", icon: Settings2 },
  { href: "/admin/help", label: "Help", icon: CircleQuestionMark },
];

export function isAdminActive(pathname: string, destination: AdminDestination): boolean {
  if (destination.matchPrefix) return pathname.startsWith(destination.href);
  return pathname === destination.href;
}

/** True when More should read as the active tab on mobile. */
export function isMoreActive(pathname: string, nav: StaffNav): boolean {
  if (pathname === "/admin/more") return true;
  return [...nav.manage, ...nav.account].some((entry) => pathname.startsWith(entry.href));
}

/**
 * The cooperative officer's information architecture, officer blueprint Part 3.
 *
 * The same four areas as an admin's, minus one whole section. "Notably absent from an Officer's
 * sidebar, compared to an Admin's, is any 'Manage cooperative' section, there's no Loan Products,
 * no Officer Management, no Public Profile Editor, no Reconciliation, no Reports, and no Audit Log
 * anywhere in this role's navigation, because none of those actions are available to an Officer
 * regardless of how their individual permissions are configured."
 *
 * Import is the one exception, and it is conditional rather than absent: an officer whose admin
 * granted `can_import_members` gets it as a direct row, "since desktop has the room to be direct
 * about the one extra thing this particular Officer can do". An officer without it never sees a
 * greyed-out entry: a control they cannot use is not shown at all, which is the same
 * default-deny-and-don't-clutter rule the permission panel follows.
 *
 * Members and Loans point at the same screens an admin uses. That is the point of the role: the
 * work is identical, the configuration power is not, and the boundary is in the policies rather
 * than in a second copy of every screen.
 */
/**
 * Members and Loans are conditional for the same reason the import row is. Both screens read
 * through `cooperative_memberships`, so an officer without `can_view_members` gets nothing from
 * either: the member list is empty and, because `loans_select_staff` reaches a loan through its
 * membership, so is the loan queue. Two tabs that always open onto nothing would be the
 * greyed-out button the blueprint rules out, wearing a different disguise.
 */
export function officerPrimary(permissions: { can_view_members: boolean }): AdminDestination[] {
  if (!permissions.can_view_members) return [ADMIN_PRIMARY[0]];
  return ADMIN_PRIMARY;
}

export const OFFICER_IMPORT: AdminDestination = {
  href: "/admin/manage/import",
  label: "Import members",
  icon: FileSpreadsheet,
};

/** No audit log: an officer cannot read one, so an entry leading to a refusal would be a lie. */
export const OFFICER_ACCOUNT: AdminDestination[] = [
  { href: "/admin/notifications", label: "Notifications", icon: Bell },
  { href: "/admin/profile", label: "Profile", icon: Settings2 },
  { href: "/admin/help", label: "Help", icon: CircleQuestionMark },
];

export type StaffNav = {
  /** The four areas: a bottom bar on mobile, the top of the sidebar on desktop. */
  primary: AdminDestination[];
  /** The "Manage cooperative" section, empty for an officer. */
  manage: AdminDestination[];
  /** The account cluster, plus an officer's conditional import row. */
  account: AdminDestination[];
};

export function staffNav(
  role: "admin" | "officer",
  permissions: { can_import_members: boolean; can_view_members: boolean },
): StaffNav {
  if (role === "admin") {
    return { primary: ADMIN_PRIMARY, manage: ADMIN_MANAGE, account: ADMIN_ACCOUNT };
  }

  return {
    primary: officerPrimary(permissions),
    manage: [],
    account: permissions.can_import_members
      ? [OFFICER_IMPORT, ...OFFICER_ACCOUNT]
      : OFFICER_ACCOUNT,
  };
}
