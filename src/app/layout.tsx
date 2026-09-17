import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ServiceWorkerRegistrar } from "@/components/pwa/service-worker-registrar";
import { ThemeScript } from "@/components/theme/theme-script";

/** Inter, one family, loaded once, DESIGN_SYSTEM.md § Typography. */
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

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
  themeColor: [
    // Matches the DESIGN_SYSTEM.md background tokens, so the installed app's chrome
    // continues the page rather than framing it.
    { media: "(prefers-color-scheme: light)", color: "#F6F8FB" },
    { media: "(prefers-color-scheme: dark)", color: "#0B0B0E" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
// <html> deliberately carries no className. ThemeScript writes the colour-scheme and
    // sidebar classes onto this element before first paint, and leaving React with no className
    // of its own here means React never owns that attribute and cannot overwrite them. This is
    // the same arrangement next-themes requires, and it is defensive rather than a fix for an
    // observed production bug: the classes survive hydration in a production build either way,
    // but `next dev` resets the root className during hydration, which makes the preference look
    // lost while developing.
    //
    // So the font variable and the layout classes live on <body>, html's height comes from CSS,
    // and suppressHydrationWarning covers the attributes the script adds.
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className={`${inter.variable} flex min-h-full flex-col`}>
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
