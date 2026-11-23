import { describe, expect, it } from "vitest";
import { groupThousands, parseMoney } from "./money-input";

describe("groupThousands (the ₦ input, §5.2)", () => {
  it("adds separators as you type", () => {
    expect(groupThousands("1")).toBe("1");
    expect(groupThousands("1500")).toBe("1,500");
    expect(groupThousands("1500000")).toBe("1,500,000");
  });

  it("keeps an existing separator in the right place when editing", () => {
    expect(groupThousands("1,5000")).toBe("15,000");
  });

  it("drops anything that is not a digit or a decimal point", () => {
    expect(groupThousands("₦ 25 000abc")).toBe("25,000");
  });

  it("keeps at most two decimal places and no leading zeros", () => {
    expect(groupThousands("0012500.756")).toBe("12,500.75");
    expect(groupThousands("0")).toBe("0");
  });
});

describe("parseMoney", () => {
  it("reads the number behind the formatted text", () => {
    expect(parseMoney("₦1,500,000.50")).toBe(1500000.5);
    expect(parseMoney("25,000")).toBe(25000);
  });

  it("returns null for nothing, never 0", () => {
    expect(parseMoney("")).toBeNull();
    expect(parseMoney("  ")).toBeNull();
    expect(parseMoney("1.2.3")).toBeNull();
  });
});
