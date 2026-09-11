"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Wordmark } from "@/components/clarix/wordmark";
import { springStandard } from "@/lib/motion";

/**
 * Landing page top bar — employee blueprint 1.1: wordmark on the left, a few text links and a
 * "Sign in" button on the right, collapsing to a hamburger menu on mobile.
 *
 * Deliberately not the four-column mega-menu of the component it is adapted from: a marketing
 * site with four links does not need one (docs/planning/clarix-design-system.md § 4).
 */

const LINKS = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#for-cooperatives", label: "For cooperatives" },
  { href: "#faq", label: "FAQ" },
];

export function LandingNav() {
  const reduceMotion = useReducedMotion();
  const [open, setOpen] = useState(false);

  return (
    <header className="relative z-20">
      <nav
        className="mx-auto flex w-full max-w-[1160px] items-center justify-between px-5 py-5 md:px-8"
        aria-label="Main"
      >
        <Link href="/" className="rounded-card" aria-label="Clarix home">
          <Wordmark tone="onDark" />
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="type-secondary text-white/70 transition-colors duration-150 hover:text-white"
            >
              {link.label}
            </a>
          ))}

          <Button
            size="sm"
            variant="outline"
            className="border-white/20 bg-white/5 text-white hover:bg-white/10"
            render={<Link href="/login" />}
          >
            Sign in
          </Button>
        </div>

        <Button
          size="icon"
          variant="ghost"
          className="text-white/80 hover:bg-white/10 hover:text-white md:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </Button>
      </nav>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
            transition={reduceMotion ? { duration: 0 } : springStandard}
            className="mx-5 mb-4 overflow-hidden rounded-card border border-white/10 bg-white/[0.06] px-5 py-4 backdrop-blur-sm md:hidden"
          >
            <ul className="flex flex-col gap-1">
              {LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="block py-3 type-body text-white/80"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>

            <Button
              size="sm"
              variant="outline"
              className="mt-3 w-full border-white/20 bg-white/5 text-white hover:bg-white/10"
              render={<Link href="/login" />}
            >
              Sign in
            </Button>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
