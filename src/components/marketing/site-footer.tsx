import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { SUPPORT_EMAIL } from "@/lib/support";
import { cn } from "@/lib/utils";
import { FOOTER, PHOTO_CREDITS, type PhotoCredit } from "./copy";

/**
 * The light marketing footer (round-2 board). There is no Terms link until real terms exist.
 * Contact is the support mailbox itself, shown as text, so it can be read or copied as well as
 * clicked. The credit line names every photographer on the page (spec §9): each page passes the
 * credits for the photos it shows (all six on the landing, the default), and a page with no
 * photographs passes none, which hides the line.
 */
const link = cn(
  "inline-flex min-h-11 min-w-11 items-center justify-center rounded-tag text-muted transition-colors duration-150 hover:text-indigo-night outline-none focus-visible:outline-2 focus-visible:outline-indigo-600 focus-visible:outline-offset-2",
);

export function SiteFooter({ credits = PHOTO_CREDITS }: { credits?: readonly PhotoCredit[] } = {}) {
  return (
    <footer className="border-t border-line bg-white">
      <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-5 px-5 pt-7 pb-9 type-body-s text-muted md:px-6">
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
          <Link
            href="/"
            aria-label={FOOTER.home}
            className="inline-flex min-h-11 items-center rounded-pill outline-none focus-visible:outline-2 focus-visible:outline-indigo-600 focus-visible:outline-offset-2"
          >
            <Logo variant="horizontal" size={20} />
          </Link>

          <nav aria-label={FOOTER.nav}>
            <ul className="flex flex-wrap gap-x-6">
              <li>
                <Link href="/privacy" className={link}>
                  {FOOTER.privacy}
                </Link>
              </li>
              <li>
                <Link href="/#faq" className={link}>
                  {FOOTER.help}
                </Link>
              </li>
              <li className="flex items-center gap-1.5">
                <span>{FOOTER.contact}</span>
                <a href={`mailto:${SUPPORT_EMAIL}`} className={link}>
                  {SUPPORT_EMAIL}
                </a>
              </li>
            </ul>
          </nav>

          <p>{FOOTER.copyright}</p>
        </div>

        {credits.length > 0 ? (
          <p className="type-caption leading-[1.6]">
            {FOOTER.photos}{" "}
            {credits.map((credit, index) => (
              <span key={credit.href}>
                <a
                  href={credit.href}
                  className="underline decoration-line underline-offset-2 transition-colors duration-150 hover:text-indigo-night hover:decoration-current"
                >
                  {credit.label}
                </a>
                {index < credits.length - 1 ? ", " : "."}
              </span>
            ))}
          </p>
        ) : null}
      </div>
    </footer>
  );
}
