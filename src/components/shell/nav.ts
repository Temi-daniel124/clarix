import { Ellipsis, FileSpreadsheet, Inbox, Search, UserPlus, type LucideIcon } from "lucide-react";
import { DESTINATIONS } from "@/components/app-shell/destinations";
import {
  ADMIN_ACCOUNT,
  ADMIN_MANAGE,
  OFFICER_ACCOUNT,
  OFFICER_IMPORT,
  officerPrimary,
} from "@/components/admin-shell/destinations";
import {
  PLATFORM_ACCOUNT,
  PLATFORM_OVERSIGHT,
  PLATFORM_PRIMARY,
} from "@/components/platform-shell/destinations";
import type { ShellKind, ShellPermissions } from "./types";

/**
 * Each role's shell, from the destination lists the More pages already use, so the phone and
 * desktop navigations can never become two information architectures (the blueprints' Part 3).
 *
 * Profile and Help are not sidebar rows: they live in the account menu pinned to the bottom of
 * the sidebar (DESIGN_SYSTEM §5.5), and behind More on phones.
 */

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  matchPrefix?: boolean;
};

export type NavGroup = {
  /** Sentence case, never uppercase (§2 rule 2). The first group has none. */
  label?: string;
  items: NavItem[];
};

export type ShellNav = {
  home: string;
  /** The bottom tab bar: at most three destinations before More. */
  tabs: NavItem[];
  more: NavItem;
  /** The desktop sidebar. */
  groups: NavGroup[];
  /** The centre "+" on phones, cooperative staff only. Empty means no "+". */
  quickActions: NavItem[];
  notifications: string;
  profile: string;
  help: string;
};

const MORE_ICON_HREF = { member: "/more", admin: "/admin/more", officer: "/admin/more", platform: "/platform/more" };

function withoutAccountRows(items: NavItem[]): NavItem[] {
  return items.filter((item) => !/\/(profile|help)$/.test(item.href));
}

export function shellNav(kind: ShellKind, permissions: ShellPermissions): ShellNav {
  const more = (icon: LucideIcon): NavItem => ({ href: MORE_ICON_HREF[kind], label: "More", icon });

  if (kind === "member") {
    const primary = DESTINATIONS.filter((entry) => entry.placement === "both");
    const notifications = DESTINATIONS.find((entry) => entry.href === "/notifications")!;
    return {
      home: "/dashboard",
      tabs: primary,
      more: more(Ellipsis),
      groups: [{ items: primary }, { label: "Activity", items: [notifications] }],
      quickActions: [],
      notifications: "/notifications",
      profile: "/profile",
      help: "/help",
    };
  }

  if (kind === "platform") {
    return {
      home: "/platform",
      tabs: PLATFORM_PRIMARY,
      more: more(Ellipsis),
      groups: [
        { items: PLATFORM_PRIMARY },
        { label: "Oversight", items: PLATFORM_OVERSIGHT },
        { label: "Activity", items: withoutAccountRows(PLATFORM_ACCOUNT) },
      ],
      quickActions: [],
      notifications: "/platform/notifications",
      profile: "/platform/profile",
      help: "/platform/help",
    };
  }

  const primary = kind === "admin"
    ? officerPrimary({ can_view_members: true })
    : officerPrimary({ can_view_members: permissions.canViewMembers });
  const account = kind === "admin" ? ADMIN_ACCOUNT : OFFICER_ACCOUNT;

  const groups: NavGroup[] = [
    // An officer's one extra power sits with the day-to-day work, not under a settings heading.
    { items: kind === "officer" && permissions.canImport ? [...primary, OFFICER_IMPORT] : primary },
  ];
  if (kind === "admin") groups.push({ label: "Manage cooperative", items: ADMIN_MANAGE });
  groups.push({ label: "Activity", items: withoutAccountRows(account) });

  return {
    home: "/admin",
    tabs: primary,
    more: more(Ellipsis),
    groups,
    quickActions: staffQuickActions(permissions),
    notifications: "/admin/notifications",
    profile: "/admin/profile",
    help: "/admin/help",
  };
}

/**
 * The centre "+" sheet: only actions this role may take, and only routes that exist. Each one is
 * guarded again by its own screen and by the database; this list only decides what is offered.
 */
export function staffQuickActions(permissions: ShellPermissions): NavItem[] {
  const actions: NavItem[] = [];
  if (permissions.canViewMembers) {
    actions.push({ href: "/admin/loans", label: "Review loan applications", icon: Inbox });
    actions.push({ href: "/admin/members", label: "Find a member", icon: Search });
  }
  if (permissions.canImport) {
    actions.push({ href: "/admin/members/new", label: "Add a member", icon: UserPlus });
    actions.push({ href: "/admin/manage/import", label: "Import members", icon: FileSpreadsheet });
  }
  return actions;
}

export function isNavActive(pathname: string, item: NavItem, home: string): boolean {
  if (item.href === home) return pathname === home;
  if (item.matchPrefix) return pathname === item.href || pathname.startsWith(`${item.href}/`);
  return pathname === item.href;
}

/**
 * More reads as active on its own page and on everything reached only through it (Profile, Help,
 * Notifications, the Manage screens): anywhere no tab claims.
 */
export function isMoreActive(pathname: string, nav: ShellNav): boolean {
  return pathname === nav.more.href || !nav.tabs.some((tab) => isNavActive(pathname, tab, nav.home));
}
