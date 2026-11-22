import { expect, test } from "vitest";
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
