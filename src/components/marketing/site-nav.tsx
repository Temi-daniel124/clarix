"use client";

import { useState } from "react";
import Link from "next/link";
import { Dialog } from "@base-ui/react/dialog";
import { AnimatePresence, motion } from "motion/react";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { buttonVariants } from "@/components/ui/button";
import { reducedMotionTransition, springStandard } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { usePrefersReducedMotion } from "./use-hydrated-preferences";

/**
 * The marketing navigation (spec §8, Watermelon navigation-5), as drawn on the round-2 landing
 * board: a floating white pill, 1240 wide, with the flat hairline under the raised shadow.
 *
 * Its "Start free trial" is the secondary button on every page. Each page's own call to action
 * is that page's one primary (spec §5), so the nav never competes with it.
 *
 * On mobile the links move into a base-ui Dialog sheet. base-ui gives it the modal behaviour an
 * overlay needs: focus is trapped inside while it is open, Escape closes it, and focus returns
 * to the menu button. The sheet rises from the bottom on the standard spring (spec §7); under
 * reduced motion it only fades. Motion drives it, so, as base-ui's animation handbook asks, the
 * dialog is controlled, the portal stays mounted and AnimatePresence decides when it leaves.
 */

const LINKS = [
  { href: "/#how-it-works", label: "Product" },
  { href: "/for-members", label: "For members" },
  { href: "/pricing", label: "Pricing" },
  { href: "/#faq", label: "Help" },
] as const;

const focusRing =
  "outline-none focus-visible:outline-2 focus-visible:outline-indigo-600 focus-visible:outline-offset-2";

const navLink = cn(
  "inline-flex h-11 items-center rounded-pill px-3.5 type-body font-medium text-ink-2",
  "transition-colors duration-150 hover:bg-porcelain hover:text-indigo-night",
  focusRing,
);

export function SiteNav() {
  const [open, setOpen] = useState(false);
  const reduceMotion = usePrefersReducedMotion();
  // Opacity is always part of the animation (0.9999 when only rising): base-ui waits on
  // element.getAnimations(), which reports opacity, before it lets the sheet go.
  const sheetMotion = reduceMotion
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: reducedMotionTransition,
      }
    : {
        initial: { y: "calc(100% + 12px)", opacity: 0.9999 },
        animate: { y: 0, opacity: 1 },
        exit: { y: "calc(100% + 12px)", opacity: 0.9999 },
        transition: springStandard,
      };
  const scrimMotion = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: reduceMotion ? reducedMotionTransition : springStandard,
  };

  return (
    <div className="sticky top-0 z-50 px-4 pt-4 md:px-6 md:pt-5">
      <header className="mx-auto flex w-full max-w-[1240px] items-center justify-between gap-4 rounded-pill bg-white py-2.5 pr-2.5 pl-5 shadow-raised ring-1 ring-line md:pl-6">
        <Link
          href="/"
          aria-label="Clarix home"
          className={cn(
            "inline-flex h-11 items-center rounded-pill",
            focusRing,
          )}
        >
          <Logo variant="horizontal" size={24} />
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-0.5 lg:flex">
          {LINKS.map((link) => (
            <Link key={link.href} href={link.href} className={navLink}>
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1.5">
          <Link
            href="/login"
            className={cn(
              buttonVariants({ variant: "tertiary", size: "sm" }),
              "hidden text-indigo-night lg:inline-flex",
            )}
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            // Below 360 the logo, this and the menu button do not fit; the menu carries it there.
            className={cn(
              buttonVariants({ variant: "secondary", size: "sm" }),
              "max-[359px]:hidden",
            )}
          >
            Start free trial
          </Link>

          <Dialog.Root open={open} onOpenChange={setOpen}>
            <Dialog.Trigger
              aria-label="Open menu"
              className={cn(
                buttonVariants({ variant: "icon", size: "icon" }),
                "text-indigo-night lg:hidden",
              )}
            >
              <Menu className="size-5" strokeWidth={2} aria-hidden />
            </Dialog.Trigger>

            <AnimatePresence>
              {open && (
                <Dialog.Portal keepMounted>
                  <Dialog.Backdrop
                    render={<motion.div {...scrimMotion} />}
                    className="fixed inset-0 z-50 bg-indigo-night/30"
                  />

                  <Dialog.Popup
                    render={<motion.div {...sheetMotion} />}
                    className="fixed inset-x-3 bottom-3 z-50 rounded-sheet bg-white p-5 pb-[max(--spacing(5),env(safe-area-inset-bottom))] shadow-raised"
                  >
                    <Dialog.Title className="sr-only">Menu</Dialog.Title>

                    <div className="flex items-center justify-between">
                      <Logo variant="horizontal" size={24} />
                      <Dialog.Close
                        aria-label="Close menu"
                        className={cn(
                          buttonVariants({ variant: "icon", size: "icon" }),
                          "text-indigo-night",
                        )}
                      >
                        <X className="size-5" strokeWidth={2} aria-hidden />
                      </Dialog.Close>
                    </div>

                    <ul className="mt-4 flex flex-col">
                      {LINKS.map((link) => (
                        <li
                          key={link.href}
                          className="border-b border-line last:border-b-0"
                        >
                          <Link
                            href={link.href}
                            onClick={() => setOpen(false)}
                            className={cn(
                              "flex h-13 items-center rounded-group px-2 type-body-m font-semibold text-indigo-night",
                              focusRing,
                            )}
                          >
                            {link.label}
                          </Link>
                        </li>
                      ))}
                    </ul>

                    <div className="mt-5 flex flex-col gap-2">
                      <Link
                        href="/signup"
                        onClick={() => setOpen(false)}
                        className={cn(
                          buttonVariants({ variant: "secondary" }),
                          "w-full",
                        )}
                      >
                        Start free trial
                      </Link>
                      <Link
                        href="/login"
                        onClick={() => setOpen(false)}
                        className={cn(
                          buttonVariants({ variant: "tertiary" }),
                          "w-full",
                        )}
                      >
                        Sign in
                      </Link>
                    </div>
                  </Dialog.Popup>
                </Dialog.Portal>
              )}
            </AnimatePresence>
          </Dialog.Root>
        </div>
      </header>
    </div>
  );
}
