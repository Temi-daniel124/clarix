/**
 * The landing hero's photo carousel: its slides and the two rules that drive it.
 *
 * Kept free of React so the timing rules can be unit-tested. The component in
 * src/components/marketing/hero-carousel.tsx only wires these to the DOM.
 *
 * Slides, alt text and captions are the round-2 landing board's, verbatim (spec §7 and §9). Each
 * `position` is that board's object-position for the photo, which keeps the face in frame at
 * both the 600px desktop frame and the 420px mobile one. Photo credits: public/images/landing/CREDITS.md.
 */

export type HeroSlide = {
  src: string;
  alt: string;
  caption: string;
  /** CSS object-position for the photo inside the frame. */
  position: string;
};

export const HERO_SLIDES: readonly HeroSlide[] = [
  {
    src: "/images/landing/repay.jpg",
    alt: "A young woman smiling at her phone",
    caption: "A repayment sent from her phone, recorded in seconds.",
    position: "50% 25%",
  },
  {
    src: "/images/landing/treasurer.jpg",
    alt: "A man at his office laptop",
    caption: "The treasurer confirms it against the bank alert.",
    position: "45% 40%",
  },
  {
    src: "/images/landing/approve.jpg",
    alt: "A man laughing with his phone in hand",
    caption: "A loan approved, with the full picture in view.",
    position: "50% 20%",
  },
  {
    src: "/images/landing/desk.jpg",
    alt: "A woman at her desk with her phone and laptop",
    caption: "Statements and reports, ready the moment the committee asks.",
    position: "50% 25%",
  },
];

/** How long each photo holds before the next cross-fades in (spec §7). */
export const SLIDE_INTERVAL_MS = 6000;

/** The slide after `current`, wrapping to the first. With one slide or none, stays at 0. */
export function nextSlideIndex(current: number, count: number): number {
  if (count <= 1) return 0;
  return (current + 1) % count;
}

/**
 * Whether the autoplay timer should exist at all. It never runs under reduced motion (the
 * carousel stops on its first image, spec §7), in a hidden tab (no work nobody can see), or with
 * nothing to advance to.
 */
export function carouselShouldRun({
  reducedMotion,
  documentHidden,
  count,
}: {
  reducedMotion: boolean;
  documentHidden: boolean;
  count: number;
}): boolean {
  return !reducedMotion && !documentHidden && count > 1;
}
