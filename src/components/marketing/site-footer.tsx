import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { SUPPORT_EMAIL } from "@/lib/support";
import { PHOTO_CREDITS } from "./copy";

/**
 * The light marketing footer (round-2 board). There is no Terms link until real terms exist.
 * Contact is the support mailbox itself, shown as text, so it can be read or copied as well as
 * clicked. The credit line names every photographer on the page (spec §9).
 */
const link =
  "inline-flex min-h-11 min-w-11 items-center justify-center rounded-tag text-muted transition-colors duration-150 hover:text-indigo-night outline-none focus-visible:outline-2 focus-visible:outline-indigo-600 focus-visible:outline-offset-2";

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-white">
      <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-5 px-5 pt-7 pb-9 text-[14px] text-muted md:px-6">
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
          <Link
            href="/"
            aria-label="Clarix home"
            className="inline-flex min-h-11 items-center rounded-pill outline-none focus-visible:outline-2 focus-visible:outline-indigo-600 focus-visible:outline-offset-2"
          >
            <Logo variant="horizontal" size={20} />
          </Link>

          <nav aria-label="Footer">
            <ul className="flex flex-wrap gap-x-6">
              <li>
                <Link href="/privacy" className={link}>
                  Privacy
                </Link>
              </li>
              <li>
                <Link href="/#faq" className={link}>
                  Help
                </Link>
              </li>
              <li className="flex items-center gap-1.5">
                <span>Contact</span>
                <a href={`mailto:${SUPPORT_EMAIL}`} className={`${link} text-indigo-600`}>
                  {SUPPORT_EMAIL}
                </a>
              </li>
            </ul>
          </nav>

          <p>© 2026 Clarix</p>
        </div>

        <p className="text-[12.5px] leading-[1.6]">
          Photos:{" "}
          {PHOTO_CREDITS.map((credit, index) => (
            <span key={credit.href}>
              <a
                href={credit.href}
                className="underline decoration-line underline-offset-2 transition-colors duration-150 hover:text-indigo-night hover:decoration-current"
              >
                {credit.label}
              </a>
              {index < PHOTO_CREDITS.length - 1 ? ", " : "."}
            </span>
          ))}
        </p>
      </div>
    </footer>
  );
}
