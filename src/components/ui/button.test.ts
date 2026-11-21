import { expect, test } from "vitest";
import { buttonVariants } from "./button";

test("primary is an emerald pill with the float shadow and dark text", () => {
  const c = buttonVariants({ variant: "primary" });
  expect(c).toMatch(/rounded-pill/);
  expect(c).toMatch(/bg-emerald-500/);
  expect(c).toMatch(/text-on-emerald/);
  expect(c).toMatch(/shadow-primary-float/);
});

test("only primary carries a shadow", () => {
  for (const v of ["secondary", "tertiary", "destructive", "icon"] as const)
    expect(buttonVariants({ variant: v })).not.toMatch(/shadow-primary-float|shadow-raised/);
});

test("legacy names map onto the new hierarchy", () => {
  expect(buttonVariants({ variant: "outline" })).toBe(buttonVariants({ variant: "secondary" }));
  expect(buttonVariants({ variant: "navy" })).toBe(buttonVariants({ variant: "secondary" }));
  expect(buttonVariants({ variant: "ghost" })).toBe(buttonVariants({ variant: "tertiary" }));
  expect(buttonVariants({ variant: "link" })).toBe(buttonVariants({ variant: "tertiary" }));
  expect(buttonVariants({ variant: "danger" })).toBe(buttonVariants({ variant: "destructive" }));
});

test("every size is at least a 44px target", () => {
  expect(buttonVariants({ size: "lg" })).toMatch(/h-13/);
  expect(buttonVariants({ size: "sm" })).toMatch(/h-11/);
  expect(buttonVariants({ size: "icon" })).toMatch(/size-11/);
});
