import type { Metadata, Viewport } from "next";
import { Figtree, Mona_Sans } from "next/font/google";
import "./globals.css";
import { ServiceWorkerRegistrar } from "@/components/pwa/service-worker-registrar";
import { ThemeScript } from "@/components/theme/theme-script";

/** Figtree for everything, Mona Sans with its width axis for display (D034). */
const figtree = Figtree({ variable: "--font-figtree", subsets: ["latin"], display: "swap" });
const monaSans = Mona_Sans({
  variable: "--font-mona",
  subsets: ["latin"],
  axes: ["wdth"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Clarix, cooperative management",
    template: "%s · Clarix",
  },
  description:
    "Clarix runs a cooperative's members, loans and repayments, and checks that a member's " +
    "combined deductions across every cooperative still fit their salary before a loan is approved.",
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
  // Porcelain, the page ground, so the installed app's chrome continues the page rather than
  // framing it.
  themeColor: "#F5F6FB",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // <html> deliberately carries no className. ThemeScript writes the sidebar class onto this
    // element before first paint, and leaving React with no className
    // of its own here means React never owns that attribute and cannot overwrite them. This is
    // the same arrangement next-themes requires, and it is defensive rather than a fix for an
    // observed production bug: the classes survive hydration in a production build either way,
    // but `next dev` resets the root className during hydration, which makes the preference look
    // lost while developing.
    //
    // So the font variables and the layout classes live on <body>, html's height comes from CSS,
    // and suppressHydrationWarning covers the attributes the script adds.
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className={`${figtree.variable} ${monaSans.variable} flex min-h-full flex-col`}>
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
