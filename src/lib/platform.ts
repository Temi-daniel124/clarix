/**
 * The Super Admin's own shapes and the small questions asked of them — super-admin blueprint
 * Parts 4 and 5.
 *
 * Split from `src/lib/supabase/platform-data.ts` for the same reason `src/lib/audit.ts` is split
 * from its reader: the Cooperative Detail screen is a client component and needs these types and
 * helpers, and a client component that reaches a file importing the server Supabase client fails
 * the build. Types and pure functions here; the queries stay on the server side of the line.
 */

export type PlatformOverview = {
  totalCooperatives: number;
  activeCooperatives: number;
  employeeHeadcount: number;
  pendingInvites: number;
};

export type DirectoryEntry = {
  id: string;
  name: string;
  status: "active" | "inactive";
  createdAt: string;
  memberCount: number;
  officerCount: number;
  /** The staff Admin, once one has been named. Never a member. */
  adminName: string | null;
  adminEmail: string | null;
  adminStatus: "invited" | "active" | null;
  adminInvitedAt: string | null;
  adminAcceptedAt: string | null;
  /** An invitation issued to an address that has no Clarix account yet. */
  pendingInviteEmail: string | null;
  pendingInviteSentAt: string | null;
  hasExpiryOverride: boolean;
  /** The operator's own private note, from its own platform-admin-only table (migration 021). */
  internalNote: string | null;
};

/**
 * Whether this cooperative is still waiting for somebody to take up its Admin invitation.
 *
 * Two shapes mean the same thing, which is why this is a function rather than a field: an
 * invitation to an address with no Clarix account lives in `staff_invitations`, and one to an
 * address that already has an account is a `cooperative_staff_roles` row sitting at `invited`.
 */
export function invitePending(entry: DirectoryEntry): boolean {
  if (entry.pendingInviteEmail) return true;
  return entry.adminStatus === "invited";
}

/** Who the invitation is addressed to, whichever of those two shapes it took. */
export function inviteAddressee(entry: DirectoryEntry): string | null {
  return entry.pendingInviteEmail ?? entry.adminEmail;
}

export function inviteSentAt(entry: DirectoryEntry): string | null {
  return entry.pendingInviteSentAt ?? entry.adminInvitedAt;
}

export function daysSince(iso: string | null): number | null {
  if (!iso) return null;
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000));
}
