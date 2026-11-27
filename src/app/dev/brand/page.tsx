import type { Metadata } from "next";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { Logo } from "@/components/clarix/logo";
import { sharesLiveDataOutsideProduction } from "@/lib/environment";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Brand",
  robots: { index: false, follow: false },
};

/**
 * Every logo variation on canvas, white and navy, at its minimum size and at a working size, plus
 * the app icons (BUILD-PLAN 2.1, docs/BRAND.md). The owner approves the set here. Preview and local
 * only: on Production this route does not exist.
 */
export default function BrandPage() {
  if (!sharesLiveDataOutsideProduction()) notFound();

  return (
    <main className="mx-auto flex w-full max-w-[1120px] flex-col gap-8 px-5 py-12 md:px-6 lg:gap-12 lg:px-8">
      <h1 className="type-title text-ink-900">Brand</h1>

      <Section title="Primary" note="Minimum 96px wide">
        <Ground kind="canvas" caption="Canvas">
          <Logo height={24} />
          <Logo height={48} />
        </Ground>
        <Ground kind="white" caption="White">
          <Logo height={24} />
          <Logo height={48} />
        </Ground>
        <Ground kind="navy" caption="Navy">
          <Logo tone="on-navy" height={24} />
          <Logo tone="on-navy" height={48} />
        </Ground>
      </Section>

      <Section title="Secondary (stacked)" note="Minimum 64px wide">
        <Ground kind="canvas" caption="Canvas">
          <Logo variant="stacked" height={47} />
          <Logo variant="stacked" height={88} />
        </Ground>
        <Ground kind="white" caption="White">
          <Logo variant="stacked" height={47} />
          <Logo variant="stacked" height={88} />
        </Ground>
        <Ground kind="navy" caption="Navy">
          <Logo variant="stacked" tone="on-navy" height={47} />
          <Logo variant="stacked" tone="on-navy" height={88} />
        </Ground>
      </Section>

      <Section title="Submark" note="Minimum 16px">
        <Ground kind="canvas" caption="Canvas">
          <Logo variant="submark" height={16} />
          <Logo variant="submark" height={64} />
        </Ground>
        <Ground kind="white" caption="White">
          <Logo variant="submark" height={16} />
          <Logo variant="submark" height={64} />
        </Ground>
        <Ground kind="navy" caption="Navy">
          <Logo variant="submark" tone="on-navy" height={16} />
          <Logo variant="submark" tone="on-navy" height={64} />
        </Ground>
      </Section>

      <Section title="Single colour" note="Committed and available split by weight or opacity">
        <Ground kind="canvas" caption="Mono navy">
          <Logo tone="mono-navy" height={24} />
          <Logo variant="submark" tone="mono-navy" height={48} />
        </Ground>
        <Ground kind="white" caption="Mono black">
          <Logo tone="mono-black" height={24} />
          <Logo variant="submark" tone="mono-black" height={48} />
        </Ground>
        <Ground kind="navy" caption="Mono white">
          <Logo tone="mono-white" height={24} />
          <Logo variant="submark" tone="mono-white" height={48} />
        </Ground>
      </Section>

      <Section title="App icons" note="Browser tab, home screen and install">
        <Ground kind="canvas" caption="Favicon 16 and 32px">
          <Icon src="/brand/png/clarix-favicon-mark-16.png" size={16} />
          <Icon src="/brand/png/clarix-favicon-mark-32.png" size={32} />
        </Ground>
        <Ground kind="white" caption="iOS home screen 60px">
          <Icon src="/apple-icon.png" size={60} className="rounded-md" />
        </Ground>
        <Ground kind="canvas" caption="Android install, maskable 64px">
          <Icon src="/icons/icon-maskable-192.png" size={64} className="rounded-pill" />
          <Icon src="/icons/icon-512.png" size={64} />
        </Ground>
      </Section>
    </main>
  );
}

function Section({ title, note, children }: { title: string; note: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="type-heading text-ink-900">{title}</h2>
        <p className="type-small text-ink-500">{note}</p>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">{children}</div>
    </section>
  );
}

const GROUND = {
  canvas: "bg-canvas border-hairline",
  white: "bg-surface border-hairline",
  navy: "bg-navy-900 border-transparent",
} as const;

function Ground({ kind, caption, children }: { kind: keyof typeof GROUND; caption: string; children: ReactNode }) {
  return (
    <figure className="flex flex-col gap-2">
      <div className={cn("flex h-40 flex-wrap content-center items-center justify-center gap-x-8 gap-y-4 rounded-md border px-5", GROUND[kind])}>
        {children}
      </div>
      <figcaption className="type-small text-ink-500">{caption}</figcaption>
    </figure>
  );
}

function Icon({ src, size, className }: { src: string; size: number; className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element -- the exported PNGs themselves, at their own pixel sizes
  return <img src={src} width={size} height={size} alt="" className={cn("block", className)} />;
}
