/** Plain data the server layouts hand the client shell (no components, so it can cross over). */

export type ShellKind = "member" | "admin" | "officer" | "platform";

export type ShellCooperative = {
  id: string;
  name: string;
  /** "Admin", "Officer", or the cosmetic title the cooperative uses (Treasurer, Secretary). */
  roleLabel: string;
  current: boolean;
};

export type ShellIdentity = {
  name: string;
  firstName: string;
  initials: string;
  hasUnread: boolean;
  /** Holds an active membership somewhere, so "Switch to my member view" is offered. */
  isMember: boolean;
  /** Holds an active staff role somewhere, so the member app offers the way back. */
  hasStaffRole: boolean;
  isPlatformAdmin: boolean;
  /** The cooperatives this person works at, for the switcher. Empty for members. */
  cooperatives: ShellCooperative[];
};

/** What a staff shell may offer, decided on the server from the current role. */
export type ShellPermissions = {
  canImport: boolean;
  canViewMembers: boolean;
};
