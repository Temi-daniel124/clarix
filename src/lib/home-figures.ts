/**
 * The three rules behind the figures BUILD-PLAN 0.5 found contradicting each other on the live
 * homes (docs/REFERENCE-STUDY.md §1). Each is defined once here, so every screen that shows the
 * figure reads it the same way (DESIGN_SYSTEM.md §11: "Every figure has one source").
 */

// ---------------------------------------------------------------------------
// 1. How many members a cooperative has
// ---------------------------------------------------------------------------

export type MemberCounts = {
  /** Active memberships plus roster entries not yet on Clarix. The number a cooperative quotes. */
  total: number;
  /** Active memberships: people with a Clarix account who belong to this cooperative. */
  onClarix: number;
  /** On the cooperative's roster, not yet signed up. */
  notOnClarix: number;
  /** Applied to join, not yet approved. Not members yet, so not in `total`. */
  pending: number;
  suspended: number;
};

/**
 * Members = active memberships + roster entries not yet on Clarix. A pending application is not a
 * member yet, and a suspended membership is not active, so neither is counted; they are reported
 * beside the count so a list showing those rows never looks like it disagrees with its own header.
 */
export function memberCounts(input: {
  membershipStatuses: string[];
  /** Roster rows whose person has no Clarix membership yet. */
  rosterNotOnClarix: number;
}): MemberCounts {
  const onClarix = input.membershipStatuses.filter((status) => status === "active").length;
  const pending = input.membershipStatuses.filter((status) => status === "pending").length;
  const suspended = input.membershipStatuses.filter((status) => status === "suspended").length;
  const notOnClarix = Math.max(input.rosterNotOnClarix, 0);

  return { total: onClarix + notOnClarix, onClarix, notOnClarix, pending, suspended };
}

/** "15 members, 8 on Clarix", or "8 members" when everyone is on Clarix. */
export function memberCountLabel(counts: Pick<MemberCounts, "total" | "onClarix">): string {
  const noun = counts.total === 1 ? "member" : "members";
  if (counts.total === counts.onClarix) return `${counts.total} ${noun}`;
  return `${counts.total} ${noun}, ${counts.onClarix} on Clarix`;
}

// ---------------------------------------------------------------------------
// 2. When a member's figures last changed
// ---------------------------------------------------------------------------

/** The latest of the given timestamps (ISO strings), ignoring empty ones. */
export function latestChange(timestamps: Array<string | null | undefined>): string | null {
  let latest: string | null = null;
  let latestTime = -Infinity;

  for (const value of timestamps) {
    if (!value) continue;
    const time = new Date(value).getTime();
    if (Number.isNaN(time)) continue;
    if (time > latestTime) {
      latest = value;
      latestTime = time;
    }
  }

  return latest;
}

const LAGOS_DAY = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Africa/Lagos",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const LAGOS_DATE = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Africa/Lagos",
  day: "numeric",
  month: "short",
  year: "numeric",
});

function lagosDayNumber(value: Date): number {
  const [year, month, day] = LAGOS_DAY.format(value).split("-").map(Number);
  return Date.UTC(year, month - 1, day) / 86_400_000;
}

/**
 * "Updated today", "Updated yesterday", "Updated 3 days ago", counted in Lagos calendar days.
 * Past four weeks a count of days stops being useful, so it names the date: "Updated on 15 Mar
 * 2026" (DESIGN_SYSTEM.md §8 date style).
 */
export function updatedLabel(iso: string, now: Date = new Date()): string {
  const then = new Date(iso);
  const days = Math.max(lagosDayNumber(now) - lagosDayNumber(then), 0);

  if (days === 0) return "Updated today";
  if (days === 1) return "Updated yesterday";
  if (days < 28) return `Updated ${days} days ago`;
  return `Updated on ${LAGOS_DATE.format(then)}`;
}

// ---------------------------------------------------------------------------
// 3. The segments of the staff applications queue
// ---------------------------------------------------------------------------

export type QueueSegment = "pending" | "lapsed" | "decided";

/**
 * Waiting, Lapsed and Recently decided. Lapsed is its own segment with its own count, shown only
 * when there is something in it, so "Nothing is waiting" and "3 holds lapsed" are never said about
 * the same list.
 */
export function queueSegments(counts: {
  pending: number;
  lapsed: number;
}): Array<{ key: QueueSegment; label: string }> {
  const segments: Array<{ key: QueueSegment; label: string }> = [
    { key: "pending", label: counts.pending > 0 ? `Waiting (${counts.pending})` : "Waiting" },
  ];

  if (counts.lapsed > 0) segments.push({ key: "lapsed", label: `Lapsed (${counts.lapsed})` });

  segments.push({ key: "decided", label: "Recently decided" });
  return segments;
}
