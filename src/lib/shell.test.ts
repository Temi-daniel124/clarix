import { describe, expect, it } from "vitest";
import { isMoreActive, isNavActive, shellNav, staffQuickActions } from "@/components/shell/nav";
import { otherViewFor } from "@/components/shell/other-view";
import type { ShellIdentity } from "@/components/shell/types";
import { firstNameOf, initialsOf } from "@/lib/names";
import { preferredRole, type StaffRole } from "@/lib/staff";

const ALL = { canImport: true, canViewMembers: true };
const NONE = { canImport: false, canViewMembers: false };
const labels = (items: { label: string }[]) => items.map((item) => item.label);

describe("shellNav (BUILD-PLAN 1.4)", () => {
  it("gives every role at most three tabs before More, so the pill fits a 360px phone", () => {
    for (const kind of ["member", "admin", "officer", "platform"] as const) {
      expect(shellNav(kind, ALL).tabs.length).toBeLessThanOrEqual(3);
    }
  });

  it("keeps Profile and Help out of the sidebar: they live in the account menu", () => {
    for (const kind of ["member", "admin", "officer", "platform"] as const) {
      const rows = shellNav(kind, ALL).groups.flatMap((group) => labels(group.items));
      expect(rows).not.toContain("Profile");
      expect(rows).not.toContain("Help");
    }
  });

  it("uses sentence-case group labels, never uppercase", () => {
    for (const kind of ["member", "admin", "officer", "platform"] as const) {
      for (const group of shellNav(kind, ALL).groups) {
        if (group.label) expect(group.label).not.toBe(group.label.toUpperCase());
      }
    }
  });

  it("gives an admin the Manage cooperative section and an officer none of it", () => {
    expect(shellNav("admin", ALL).groups.map((group) => group.label)).toContain("Manage cooperative");
    const officer = shellNav("officer", ALL).groups.flatMap((group) => labels(group.items));
    expect(officer).not.toContain("Loan products");
    expect(officer).not.toContain("Audit log");
  });

  it("shows an officer Members and Loans only with can_view_members, and Import only with can_import", () => {
    expect(labels(shellNav("officer", NONE).tabs)).toEqual(["Home"]);
    expect(labels(shellNav("officer", { canImport: false, canViewMembers: true }).tabs)).toEqual(["Home", "Members", "Loans"]);
    expect(labels(shellNav("officer", { canImport: true, canViewMembers: false }).groups[0].items)).toContain("Import members");
  });

  it("offers the centre + to cooperative staff only", () => {
    expect(shellNav("member", ALL).quickActions).toEqual([]);
    expect(shellNav("platform", ALL).quickActions).toEqual([]);
    expect(shellNav("admin", ALL).quickActions.length).toBeGreaterThan(0);
  });
});

describe("staffQuickActions", () => {
  it("offers only what the role may do", () => {
    expect(staffQuickActions(NONE)).toEqual([]);
    expect(labels(staffQuickActions({ canImport: false, canViewMembers: true }))).toEqual([
      "Review loan applications",
      "Find a member",
    ]);
    expect(labels(staffQuickActions({ canImport: true, canViewMembers: false }))).toEqual([
      "Add a member",
      "Import members",
    ]);
  });
});

describe("active tab", () => {
  const nav = shellNav("admin", ALL);
  const active = (pathname: string) => [...nav.tabs, nav.more].filter((item) =>
    item === nav.more ? isMoreActive(pathname, nav) : isNavActive(pathname, item, nav.home),
  ).map((item) => item.label);

  it("lights Home only on the home route, not on everything under /admin", () => {
    expect(active("/admin")).toEqual(["Home"]);
    expect(active("/admin/members/abc")).toEqual(["Members"]);
  });

  it("lights More for anything no tab claims", () => {
    expect(active("/admin/manage/products")).toEqual(["More"]);
    expect(active("/admin/profile")).toEqual(["More"]);
    expect(active("/admin/more")).toEqual(["More"]);
  });

  it("does not confuse a route that only shares a prefix", () => {
    expect(isNavActive("/admin/membersx", nav.tabs[1], nav.home)).toBe(false);
  });
});

describe("otherViewFor", () => {
  const identity = (over: Partial<ShellIdentity>): ShellIdentity => ({
    name: "Funmilayo Adeyemi",
    firstName: "Funmilayo",
    initials: "FA",
    hasUnread: false,
    isMember: false,
    hasStaffRole: false,
    isPlatformAdmin: false,
    cooperatives: [],
    ...over,
  });

  it("offers staff who are also members their member view, and nobody else", () => {
    expect(otherViewFor("staff", identity({ isMember: true }))?.href).toBe("/dashboard");
    expect(otherViewFor("staff", identity({ isMember: false }))).toBeNull();
  });

  it("offers a member who also works at a cooperative the way back", () => {
    expect(otherViewFor("member", identity({ hasStaffRole: true }))?.href).toBe("/admin");
    expect(otherViewFor("member", identity({}))).toBeNull();
  });
});

describe("the cooperative switcher's choice", () => {
  const role = (over: Partial<StaffRole>): StaffRole => ({
    id: over.cooperativeId ?? "r",
    cooperativeId: "c1",
    cooperativeName: "One",
    role: "officer",
    status: "active",
    title: null,
    canApproveLoans: false,
    permissions: { can_view_members: true, can_record_savings: true, can_approve_loans: false, can_import_members: false },
    ...over,
  });

  it("works in the chosen cooperative, even over an admin role elsewhere", () => {
    const roles = [role({ cooperativeId: "c1", role: "admin" }), role({ cooperativeId: "c2", selected: true })];
    expect(preferredRole(roles)?.cooperativeId).toBe("c2");
  });

  it("falls back to admin first without a choice", () => {
    const roles = [role({ cooperativeId: "c1" }), role({ cooperativeId: "c2", role: "admin" })];
    expect(preferredRole(roles)?.cooperativeId).toBe("c2");
  });

  it("ignores a choice that points at a role no longer active", () => {
    const roles = [role({ cooperativeId: "c1", role: "admin" }), role({ cooperativeId: "c2", selected: true, status: "invited" })];
    expect(preferredRole(roles)?.cooperativeId).toBe("c1");
  });
});

describe("greeting", () => {
  it("greets by first name and never by the full name", () => {
    expect(firstNameOf("Funmilayo Adeyemi", null)).toBe("Funmilayo");
    expect(firstNameOf(null, "tunde@example.test")).toBe("tunde");
    expect(initialsOf("Funmilayo Adeyemi Bello", null)).toBe("FB");
    expect(initialsOf(null, "tunde@example.test")).toBe("T");
  });
});
