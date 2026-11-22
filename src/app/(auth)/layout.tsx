import Link from "next/link";
import { EligibilityPreview } from "@/components/clarix/eligibility-preview";
import { Wordmark } from "@/components/clarix/wordmark";

/**
 * Shared shell for Sign Up (1.3) and Log In (1.4).
 *
 * Desktop: two panels, dark navy on the left carrying a subtler, slower version of the
 * landing page's live meter and one short reassuring line; the form vertically centred on the
 * right. Mobile: no left panel at all, just the wordmark and the form, with generous top
 * spacing so the form never sits cramped against the status bar.
 */
export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-dvh flex-1 flex-col lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      {/* Left panel, desktop only. */}
      <aside className="theme-dark relative hidden flex-col justify-between bg-navy-surface p-12 lg:flex">
        <Link href="/" className="w-fit" aria-label="Clarix home">
          <Wordmark tone="onDark" />
        </Link>

        <div className="max-w-[420px]">
          <EligibilityPreview pace="calm" />
          <p className="type-body mt-8 text-white/60">
            Approve loans against what a member actually owes everywhere, not what one
            cooperative can see.
          </p>
        </div>

        <p className="type-caption text-white/35">
          Clarix never moves money and is not connected to payroll.
        </p>
      </aside>

      {/* Form panel. */}
      <main className="flex flex-1 flex-col px-5 pt-16 pb-12 md:px-8 lg:justify-center lg:px-16 lg:pt-12">
        <Link href="/" className="mb-10 w-fit lg:hidden" aria-label="Clarix home">
          <Wordmark />
        </Link>

        <div className="mx-auto w-full max-w-[420px] lg:mx-0">{children}</div>
      </main>
    </div>
  );
}
