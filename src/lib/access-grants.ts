/**
 * Shapes and small questions for the access-grant flow (super-admin blueprint 7.2 and 7.3).
 *
 * Kept apart from the query module because both screens that use these are client components.
 *
 * The one thing worth reading carefully here is `grantState`. A grant's stored status only ever
 * says `pending` or `revoked`; `active` and `expired` are arithmetic against the clock, exactly as
 * a loan reservation's expiry is (D024, D030). The database computes it the same way in
 * `access_grant_state()`, and both exist so a screen and a policy can never disagree about whether
 * somebody is currently allowed to look.
 */

export type GrantStatus = "pending" | "active" | "expired" | "revoked";

export type AccessGrant = {
  id: string;
  cooperativeId: string;
  cooperativeName: string;
  /** Null when the grant covers the cooperative's records rather than one person's. */
  memberUserId: string | null;
  memberName: string | null;
  /** The membership this grant leads to, when it was narrowed to one member. */
  membershipId: string | null;
  reason: string;
  requestedBy: string;
  requesterName: string | null;
  requestedAt: string;
  activatesAt: string;
  expiresAt: string;
  revokedAt: string | null;
  stored: "pending" | "active" | "expired" | "revoked";
};

export function grantState(grant: AccessGrant, now: Date = new Date()): GrantStatus {
  if (grant.stored === "revoked") return "revoked";
  if (now >= new Date(grant.expiresAt)) return "expired";
  if (now >= new Date(grant.activatesAt)) return "active";
  return "pending";
}

export function isLive(grant: AccessGrant, now: Date = new Date()): boolean {
  return grantState(grant, now) === "active";
}

/** Milliseconds until this grant stops working, or 0 if it already has. */
export function millisRemaining(grant: AccessGrant, now: Date = new Date()): number {
  return Math.max(0, new Date(grant.expiresAt).getTime() - now.getTime());
}

/**
 * "3 hours 12 minutes", "14 minutes", "under a minute", written out rather than as a clock,
 * because a banner that has to be read at a glance should not need parsing.
 */
export function describeRemaining(millis: number): string {
  if (millis <= 0) return "expired";

  const minutes = Math.floor(millis / 60_000);
  if (minutes < 1) return "under a minute";
  if (minutes < 60) return `${minutes} ${minutes === 1 ? "minute" : "minutes"}`;

  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;

  if (rest === 0) return `${hours} ${hours === 1 ? "hour" : "hours"}`;
  return `${hours} ${hours === 1 ? "hour" : "hours"} ${rest} ${rest === 1 ? "minute" : "minutes"}`;
}

export function describeWait(grant: AccessGrant, now: Date = new Date()): string {
  const millis = new Date(grant.activatesAt).getTime() - now.getTime();
  if (millis <= 0) return "now";
  return `in ${describeRemaining(millis)}`;
}

/** What each state should say on a badge, in this role's plain register. */
export const GRANT_STATUS_LABEL: Record<GrantStatus, string> = {
  pending: "Waiting to start",
  active: "Active",
  expired: "Expired",
  revoked: "Ended early",
};

/**
 * What the grant covers, said the way a person would say it.
 *
 * Keyed on `memberUserId` rather than on `memberName`, which matters more than it looks: once a
 * grant lapses, the member's name stops being readable. That is the boundary working, and a
 * version of this that checked the name would quietly describe a narrow, expired grant as having
 * covered the whole cooperative. The row says what it was for; the lookup only says whether we can
 * still put a name to it.
 */
export function describeScope(grant: AccessGrant): string {
  if (!grant.memberUserId) return `all records at ${grant.cooperativeName}`;
  if (grant.memberName) return `${grant.memberName} at ${grant.cooperativeName}`;
  return `one member at ${grant.cooperativeName}`;
}
