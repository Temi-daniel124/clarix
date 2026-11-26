import type { CSSProperties } from "react";
import type { Metadata, Viewport } from "next";
import { figtree } from "./fonts";
import "./globals.css";
import { ServiceWorkerRegistrar } from "@/components/pwa/service-worker-registrar";
import { RailScript } from "@/components/app-shell/rail-script";
import { PREVIEW_STRIP_OFFSET, PreviewStrip } from "@/components/clarix/preview-strip";
import { sharesLiveDataOutsideProduction } from "@/lib/environment";


export const metadata: Metadata = {
  title: {
    default: "Clarix, cross-cooperative deduction coordination",
    template: "%s · Clarix",
  },
  description:
    "Clarix shows a cooperative whether a member's combined deductions across every cooperative " +
    "they belong to still fit inside the agreed one-third salary cap, before a loan is approved.",
  applicationName: "Clarix",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Clarix",
    statusBarStyle: "black-translucent",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  // Light only (D037): the installed app's chrome continues the R2 canvas.
  themeColor: "#F7F7F4",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  // D043: every deployment but Production shares the live demo data, and says so (BUILD-PLAN 0.4).
  const preview = sharesLiveDataOutsideProduction();

  return (
// <html> deliberately carries no className. RailScript writes the sidebar's class onto this
    // element before first paint, and leaving React with no className of its own here means React
    // never owns that attribute and cannot overwrite it. So the font variable and the layout
    // classes live on <body>, html's height comes from CSS, and suppressHydrationWarning covers
    // the class the script adds.
    <html lang="en" suppressHydrationWarning>
      <head>
        <RailScript />
      </head>
      <body
        className={`${figtree.variable} flex min-h-full flex-col`}
        style={preview ? ({ "--clarix-preview-offset": PREVIEW_STRIP_OFFSET } as CSSProperties) : undefined}
      >
        {preview ? <PreviewStrip /> : null}
        {/*
          Chrome fires `beforeinstallprompt` during page load, typically BEFORE React has
          hydrated, so a listener registered inside a component effect misses it altogether and
          the install banner never appears. This captures the event as early as the document can
          run script, stashes it, and announces it so the banner can pick it up whenever it
          mounts. See src/components/pwa/install-prompt.tsx.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){
  window.__clarixInstallEvent = null;
  window.addEventListener('beforeinstallprompt', function (event) {
    event.preventDefault();
    window.__clarixInstallEvent = event;
    window.dispatchEvent(new Event('clarix:install-availability'));
  });
  window.addEventListener('appinstalled', function () {
    window.__clarixInstallEvent = null;
    window.dispatchEvent(new Event('clarix:install-availability'));
  });
})();`,
          }}
        />
        {children}
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}
