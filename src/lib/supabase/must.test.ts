import { describe, expect, it } from "vitest";
import { must } from "./must";

describe("must (BUILD-PLAN 1.5)", () => {
  it("passes a successful read straight through", async () => {
    const result = { data: [{ id: 1 }], error: null };
    await expect(must(Promise.resolve(result), "rows")).resolves.toBe(result);
  });

  it("throws on a failed read instead of letting it read as 'nothing here'", async () => {
    await expect(
      must(Promise.resolve({ data: null, error: { message: "permission denied" } }), "the cooperative's members"),
    ).rejects.toThrow("Could not load the cooperative's members: permission denied");
  });
});
