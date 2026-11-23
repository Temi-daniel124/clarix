import { describe, expect, it } from "vitest";
import { greeting } from "./greeting";

describe("greeting (walkthrough 1.4d item 3)", () => {
  it("reads the hour in Lagos, not the server's or the browser's clock", () => {
    // 11:35 UTC is 12:35 in Lagos (UTC+1, no daylight saving): afternoon, not morning.
    expect(greeting(new Date("2026-11-23T11:35:00Z"))).toBe("Good afternoon");
    expect(greeting(new Date("2026-11-23T10:59:00Z"))).toBe("Good morning");
    expect(greeting(new Date("2026-11-23T16:00:00Z"))).toBe("Good evening");
    expect(greeting(new Date("2026-11-23T23:30:00Z"))).toBe("Good morning");
  });
});
