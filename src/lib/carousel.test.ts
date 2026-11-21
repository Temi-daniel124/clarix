import { describe, expect, test } from "vitest";
import {
  HERO_SLIDES,
  carouselShouldRun,
  nextSlideIndex,
  SLIDE_INTERVAL_MS,
} from "./carousel";

describe("nextSlideIndex", () => {
  test("wraps around", () => {
    expect(nextSlideIndex(3, 4)).toBe(0);
    expect(nextSlideIndex(1, 4)).toBe(2);
  });

  test("a single slide stays put", () => expect(nextSlideIndex(0, 1)).toBe(0));

  test("no slides at all stays at the first index", () =>
    expect(nextSlideIndex(0, 0)).toBe(0));
});

test("six seconds per slide", () => expect(SLIDE_INTERVAL_MS).toBe(6000));

test("never runs for reduced motion, hidden tabs or one slide", () => {
  expect(
    carouselShouldRun({ reducedMotion: true, documentHidden: false, count: 4 }),
  ).toBe(false);
  expect(
    carouselShouldRun({ reducedMotion: false, documentHidden: true, count: 4 }),
  ).toBe(false);
  expect(
    carouselShouldRun({
      reducedMotion: false,
      documentHidden: false,
      count: 1,
    }),
  ).toBe(false);
  expect(
    carouselShouldRun({
      reducedMotion: false,
      documentHidden: false,
      count: 4,
    }),
  ).toBe(true);
});

describe("HERO_SLIDES", () => {
  test("four local photographs, each with alt text and a caption", () => {
    expect(HERO_SLIDES).toHaveLength(4);
    for (const slide of HERO_SLIDES) {
      expect(slide.src).toMatch(/^\/images\/landing\/[a-z]+\.jpg$/);
      expect(slide.alt.length).toBeGreaterThan(0);
      expect(slide.caption.length).toBeGreaterThan(0);
      expect(slide.position).toMatch(/^\d+% \d+%$/);
    }
  });

  test("opens on the repayment", () => {
    expect(HERO_SLIDES[0].caption).toBe(
      "A repayment sent from her phone, recorded in seconds.",
    );
  });
});
