"use client";

import { useState } from "react";
import Link from "next/link";
import { Dialog } from "@base-ui/react/dialog";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * The marketing navigation (spec §8, Watermelon navigation-5), as drawn on the round-2 landing
 * board: a floating white pill, 1240 wide, with the flat hairline under the raised shadow.
 *
 * Its "Start free trial" is the secondary button on every page. Each page's own call to action
 * is that page's one primary (spec §5), so the nav never competes with it.
 *
 * On mobile the links move into a base-ui Dialog sheet. base-ui gives it the modal behaviour an
 * overlay needs: focus is trapped inside while it is open, Escape closes it, and focus returns
 * to the menu button.
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
  "inline-flex h-11 items-center rounded-pill px-3.5 text-[15px] font-medium text-ink-2",
  "transition-colors duration-150 hover:bg-porcelain hover:text-indigo-night",
  focusRing,
);

export function SiteNav() {
  const [open, setOpen] = useState(false);

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

            <Dialog.Portal>
              <Dialog.Backdrop className="fixed inset-0 z-50 bg-indigo-night/30 transition-opacity duration-200 data-ending-style:opacity-0 data-starting-style:opacity-0" />

              <Dialog.Popup className="fixed inset-x-3 top-3 z-50 origin-top rounded-sheet bg-white p-5 shadow-raised transition-[opacity,translate] duration-200 data-ending-style:-translate-y-2 data-ending-style:opacity-0 data-starting-style:-translate-y-2 data-starting-style:opacity-0 motion-reduce:transition-opacity">
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
                          "flex h-13 items-center rounded-group px-2 text-[17px] font-semibold text-indigo-night",
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
          </Dialog.Root>
        </div>
      </header>
    </div>
  );
}
