"use client";

import { useState } from "react";
import Link from "next/link";
import { Dialog } from "@base-ui/react/dialog";
import { ArrowRight, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Wordmark } from "@/components/clarix/wordmark";

/**
 * Landing page navigation (employee blueprint 1.1), built on the Watermelon navigation-5
 * structure and then reskinned completely.
 *
 * What was kept from it: the floating pill shape, and the mobile sheet.
 *
 * What was cut, on instruction from docs/planning/clarix-design-system.md § 4 ("simplify
 * sharply"): the four-column "Solutions" mega-menu, which is real over-engineering for a
 * marketing page with four links. With it went the navigation-menu and badge primitives it
 * needed, the demo's `href="#"` placeholders, its Watermelon wordmark and orange logo mark, its
 * blue/sky palette, and its Cpu/Layers/GitBranch/Terminal product icons, none of which
 * describe anything Clarix does.
 *
 * The pill is fixed and rendered at page level rather than inside the hero. Sticky inside the
 * hero looked correct until you scrolled: `position: sticky` is bounded by its containing block,
 * so the bar left the screen the moment the hero did. It carries a backdrop blur, which needs a
 * translucent surface legible over both the navy hero above and the light sections below, and it
 * holds the product's only colour-scheme control.
 */

const LINKS = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#for-cooperatives", label: "For cooperatives" },
  { href: "#faq", label: "FAQ" },
];

export function LandingNav() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed inset-x-0 top-[var(--clarix-preview-offset,0px)] z-50 w-full px-4 pt-4 md:px-6 md:pt-6">
      <nav
        aria-label="Main"
        className="enter-drop mx-auto flex h-14 w-full max-w-[980px] items-center justify-between gap-2 rounded-full border border-white/10 bg-navy-surface/88 pr-2 pl-2 shadow-[0_8px_30px_rgba(11,18,32,0.18)] backdrop-blur-xl md:h-16 md:pr-3"
      >
        <Link
          href="/"
          aria-label="Clarix home"
          className="rounded-full px-3 focus-visible:outline-2 focus-visible:outline-indigo focus-visible:outline-offset-2"
        >
          <Wordmark tone="onDark" />
        </Link>

        <div className="hidden items-center gap-8 px-4 md:flex">
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="type-secondary text-white/70 transition-colors duration-150 hover:text-white"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            className="hidden border-white/15 bg-white/10 text-white hover:bg-white/15 sm:inline-flex"
            render={<Link href="/login" />}
          >
            Sign in
          </Button>

          {/* Mobile sheet trigger. */}
          <Dialog.Root open={open} onOpenChange={setOpen}>
            <Dialog.Trigger
              className="flex size-10 items-center justify-center rounded-full text-white/80 transition-colors duration-150 hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-indigo focus-visible:outline-offset-2 md:hidden"
              aria-label="Open menu"
            >
              <Menu className="size-5" strokeWidth={2} aria-hidden />
            </Dialog.Trigger>

            <Dialog.Portal>
              <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-opacity duration-200 data-ending-style:opacity-0 data-starting-style:opacity-0" />

              <Dialog.Popup className="surface-navy fixed inset-x-3 top-3 z-50 origin-top rounded-feature border border-white/12 bg-navy-surface p-5 transition-all duration-200 data-ending-style:-translate-y-2 data-ending-style:opacity-0 data-starting-style:-translate-y-2 data-starting-style:opacity-0">
                <div className="flex items-center justify-between">
                  <Wordmark tone="onDark" />
                  <Dialog.Close
                    className="flex size-10 items-center justify-center rounded-full text-white/70 transition-colors duration-150 hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-indigo"
                    aria-label="Close menu"
                  >
                    <X className="size-5" strokeWidth={2} aria-hidden />
                  </Dialog.Close>
                </div>

                <ul className="mt-6 flex flex-col">
                  {LINKS.map((link) => (
                    <li key={link.href}>
                      <a
                        href={link.href}
                        onClick={() => setOpen(false)}
                        className="block border-b border-white/8 py-4 type-body text-white/80"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>

                <Button className="mt-6 w-full" render={<Link href="/signup" />}>
                  Get started
                  <ArrowRight className="size-4" aria-hidden strokeWidth={2.5} />
                </Button>

                <Button
                  variant="secondary"
                  className="mt-3 w-full border-white/15 bg-white/10 text-white hover:bg-white/15"
                  render={<Link href="/login" />}
                >
                  Sign in
                </Button>
              </Dialog.Popup>
            </Dialog.Portal>
          </Dialog.Root>
        </div>
      </nav>
    </div>
  );
}
