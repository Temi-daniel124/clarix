import { expect, test } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import * as copy from "./copy";

// These guard the copy rules (spec §1 anti-goals, D032), which a reviewer cannot easily check by
// eye across many section files.
const all = JSON.stringify(copy);

test("no FMC, hospital, IPPIS or single-employer wording on the public site", () =>
  expect(all).not.toMatch(/FMC|Federal Medical|hospital|IPPIS|One salary/i));

test("no testimonial or invented-proof copy", () =>
  expect(all).not.toMatch(/testimonial|trusted by|10,000\+|★/i));

test("six cooperative types, five FAQs, six photo credits", () => {
  expect(copy.BUILT_FOR).toHaveLength(6);
  expect(copy.FAQ_ITEMS).toHaveLength(5);
  expect(copy.PHOTO_CREDITS).toHaveLength(6);
});

// The pricing and for-members pages (Task 9) hold their words here too, under the same bans.
test("the pricing page states the D037 terms", () => {
  const page = JSON.stringify(copy.PRICING_PAGE);
  for (const term of ["₦150", "₦5,000", "60 days", "14 days", "read-only"]) {
    expect(page).toContain(term);
  }
  expect(page).not.toMatch(/FMC|Federal Medical|hospital|IPPIS|One salary|testimonial|trusted by/i);
});

test("the for-members page names every kind of income evidence and stays free", () => {
  const page = JSON.stringify(copy.FOR_MEMBERS_PAGE);
  for (const term of ["payslip", "bank statements", "Free, always", "Find your cooperative"]) {
    expect(page).toContain(term);
  }
  expect(copy.FOR_MEMBERS_PAGE.steps).toHaveLength(3);
  expect(page).not.toMatch(/FMC|Federal Medical|hospital|IPPIS|One salary|testimonial|trusted by/i);
});

test("the billing FAQ answers the four billing questions", () => {
  expect(copy.BILLING_FAQ_ITEMS.length).toBeGreaterThanOrEqual(4);
  const questions = copy.BILLING_FAQ_ITEMS.map((item) => item.question).join(" ");
  expect(questions).toMatch(/active/i);
  expect(questions).toMatch(/trial/i);
  expect(questions).toMatch(/yearly/i);
  expect(questions).toMatch(/members pay/i);
});

// Pages whose copy lives in their own JSX rather than here: the privacy notice and the sign-up
// shell, which used to name one employer.
test.each([
  "src/app/privacy/page.tsx",
  "src/app/(auth)/layout.tsx",
  "src/app/(auth)/signup/page.tsx",
  "src/app/(auth)/signup/signup-form.tsx",
  "src/components/clarix/eligibility-preview.tsx",
])("%s names no single employer", (file) => {
  const source = readFileSync(resolve(process.cwd(), file), "utf8");
  expect(source).not.toMatch(/FMC|Federal Medical|hospital|IPPIS|One salary/i);
});
