import Link from "next/link";
import { Wordmark } from "@/components/clarix/wordmark";
import { ThemeToggle } from "@/components/theme/theme-toggle";

/**
 * Shell for the onboarding sequence (blueprint 2.1–2.5).
 *
 * Single-column and deliberately quiet: these screens ask an employee for their staff ID and
 * their payslip, and anything competing for attention on that page is a cost. The step indicator
 * is rendered per-screen rather than here, because the Welcome Tour sits outside the numbered
 * sequence and should not show one.
 */
export default function OnboardingLayout({ children }: LayoutProps<"/onboarding">) {
  return (
    <div className="flex min-h-app flex-1 flex-col">
      <header className="mx-auto flex w-full max-w-[640px] items-center justify-between px-5 py-6 md:px-8">
        <Link href="/" aria-label="Clarix home">
          <Wordmark />
        </Link>
        <ThemeToggle />
      </header>

      <main className="mx-auto w-full max-w-[640px] flex-1 px-5 pb-16 md:px-8">{children}</main>
    </div>
  );
}
