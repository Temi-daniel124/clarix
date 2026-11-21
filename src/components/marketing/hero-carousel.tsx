"use client";

import { useEffect, useState, type ReactNode } from "react";
import Image from "next/image";
import { useReducedMotion } from "motion/react";
import {
  carouselShouldRun,
  HERO_SLIDES,
  nextSlideIndex,
  SLIDE_INTERVAL_MS,
} from "@/lib/carousel";
import { cn } from "@/lib/utils";

/**
 * The hero's photo carousel (spec §7): four photographs in the radius-32 frame, each holding for
 * six seconds under a slow 1.00 to 1.06 zoom, then cross-fading over 1.2s.
 *
 * Only the first photo is preloaded; the rest load lazily. The timer exists only while it can
 * be seen to do something: never under reduced motion (the carousel then stays on its first
 * photo), never in a hidden tab, and never for a single slide. A dot press restarts the hold.
 *
 * `children` are the floating product cards, positioned by the hero against this root. The root
 * carries `data-active-slide` so a visual check can tell which photo is showing.
 */
export function HeroCarousel({ children }: { children?: ReactNode }) {
  const reducedMotion = Boolean(useReducedMotion());
  const [active, setActive] = useState(0);
  const [documentHidden, setDocumentHidden] = useState(false);

  useEffect(() => {
    const sync = () => setDocumentHidden(document.visibilityState === "hidden");
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, []);

  const running = carouselShouldRun({
    reducedMotion,
    documentHidden,
    count: HERO_SLIDES.length,
  });

  useEffect(() => {
    if (!running) return;
    const timer = window.setTimeout(
      () => setActive((current) => nextSlideIndex(current, HERO_SLIDES.length)),
      SLIDE_INTERVAL_MS,
    );
    return () => window.clearTimeout(timer);
  }, [running, active]);

  // Under reduced motion nothing advances on its own, so it stays on the first photo unless the
  // viewer picks another with a dot.
  const shown = active;

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label="Clarix in use"
      data-active-slide={shown}
      className="relative pb-0 lg:pb-9 lg:pl-9"
    >
      <div className="relative h-[420px] overflow-hidden rounded-[32px] bg-indigo-100 shadow-[0_30px_70px_-40px_rgba(14,18,48,0.55)] lg:h-[600px]">
        <div aria-live="off" className="absolute inset-0">
          {HERO_SLIDES.map((slide, index) => {
            const isActive = index === shown;
            return (
              <div
                key={slide.src}
                role="group"
                aria-roledescription="slide"
                aria-label={`${index + 1} of ${HERO_SLIDES.length}`}
                aria-hidden={!isActive}
                className={cn(
                  "absolute inset-0 transition-[opacity,transform] ease-out motion-reduce:transition-none",
                  "[transition-duration:1200ms,6500ms]",
                  isActive ? "opacity-100" : "opacity-0",
                  isActive && !reducedMotion ? "scale-[1.06]" : "scale-100",
                )}
              >
                <Image
                  src={slide.src}
                  alt={slide.alt}
                  fill
                  sizes="(min-width: 1024px) 560px, 100vw"
                  preload={index === 0}
                  loading={index === 0 ? undefined : "lazy"}
                  className="object-cover"
                  style={{ objectPosition: slide.position }}
                />
              </div>
            );
          })}
        </div>

        {/* The scrim sits only where the caption does (spec §2: the one permitted gradient). */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[220px] bg-linear-to-t from-indigo-night/55 to-transparent lg:h-[280px]"
        />
        <p className="absolute inset-x-5 bottom-[92px] text-[17px] leading-[1.35] font-semibold text-balance text-white lg:inset-x-6 lg:bottom-[140px]">
          {HERO_SLIDES[shown].caption}
        </p>
      </div>

      {children}

      <div className="mt-1 flex items-center justify-center lg:absolute lg:right-0 lg:-bottom-3.5 lg:mt-0 lg:justify-end">
        {HERO_SLIDES.map((slide, index) => {
          const isActive = index === shown;
          return (
            <button
              key={slide.src}
              type="button"
              aria-label={`Show photo ${index + 1}`}
              aria-pressed={isActive}
              aria-current={isActive ? "true" : undefined}
              onClick={() => setActive(index)}
              className="group/dot flex h-11 min-w-11 items-center justify-center rounded-pill outline-none focus-visible:outline-2 focus-visible:outline-indigo-600 focus-visible:-outline-offset-4"
            >
              <span
                aria-hidden
                className={cn(
                  "block h-2 rounded-pill transition-all duration-[400ms] motion-reduce:transition-none",
                  isActive
                    ? "w-7 bg-indigo-600"
                    : "w-2 bg-[#D5D9EE] group-hover/dot:bg-muted/50",
                )}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
