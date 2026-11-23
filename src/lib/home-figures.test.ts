import { describe, expect, it } from "vitest";
import { latestChange, memberCountLabel, memberCounts, queueSegments, updatedLabel } from "./home-figures";

describe("memberCounts (rule 1: one member count everywhere)", () => {
  it("is active memberships plus roster entries not yet on Clarix", () => {
    const counts = memberCounts({
      membershipStatuses: ["active", "active", "active", "active", "active", "active", "active", "active"],
      rosterNotOnClarix: 7,
    });
    expect(counts).toMatchObject({ total: 15, onClarix: 8, notOnClarix: 7 });
    expect(memberCountLabel(counts)).toBe("15 members, 8 on Clarix");
  });

  it("does not count a pending application or a suspended membership, but reports them", () => {
    const counts = memberCounts({ membershipStatuses: ["active", "pending", "suspended"], rosterNotOnClarix: 2 });
    expect(counts).toEqual({ total: 3, onClarix: 1, notOnClarix: 2, pending: 1, suspended: 1 });
  });

  it("drops the 'on Clarix' half when everyone is on Clarix", () => {
    expect(memberCountLabel({ total: 8, onClarix: 8 })).toBe("8 members");
    expect(memberCountLabel({ total: 1, onClarix: 1 })).toBe("1 member");
    expect(memberCountLabel({ total: 0, onClarix: 0 })).toBe("0 members");
  });
});

describe("latestChange and updatedLabel (rule 2: the member home's freshness line)", () => {
  const now = new Date("2026-11-23T14:00:00Z"); // 3 pm in Lagos

  it("takes the latest ledger or loan change, whatever order they come in", () => {
    expect(
      latestChange(["2026-03-15T20:55:00Z", null, "2026-11-20T09:00:00Z", undefined, "2026-10-01T00:00:00Z"]),
    ).toBe("2026-11-20T09:00:00Z");
    expect(latestChange([null, undefined])).toBeNull();
  });

  it("says today, yesterday, or how many days ago, in Lagos days", () => {
    expect(updatedLabel("2026-11-23T08:00:00Z", now)).toBe("Updated today");
    expect(updatedLabel("2026-11-22T23:30:00Z", now)).toBe("Updated today"); // 23:30 UTC on the 22nd is 00:30 on 23 Nov in Lagos
    expect(updatedLabel("2026-11-22T22:30:00Z", now)).toBe("Updated yesterday"); // and 22:30 UTC is still the 22nd there
    expect(updatedLabel("2026-11-22T12:00:00Z", now)).toBe("Updated yesterday");
    expect(updatedLabel("2026-11-20T12:00:00Z", now)).toBe("Updated 3 days ago");
  });

  it("names the date once it is weeks old, instead of 'Current as of 15 March' in November", () => {
    expect(updatedLabel("2026-03-15T20:55:00Z", now)).toBe("Updated on 15 Mar 2026");
  });
});

describe("queueSegments (rule 3: lapsed holds never contradict 'Nothing is waiting')", () => {
  it("gives lapsed holds their own segment with a count", () => {
    expect(queueSegments({ pending: 0, lapsed: 3 })).toEqual([
      { value: "pending", label: "Waiting" },
      { value: "lapsed", label: "Lapsed (3)" },
      { value: "decided", label: "Recently decided" },
    ]);
  });

  it("leaves the segment out when nothing has lapsed", () => {
    expect(queueSegments({ pending: 2, lapsed: 0 }).map((segment) => segment.label)).toEqual([
      "Waiting (2)",
      "Recently decided",
    ]);
  });
});
