import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ServiceWorkerRegistrar } from "@/components/pwa/service-worker-registrar";
import { ThemeScript } from "@/components/theme/theme-script";

/** Inter, one family, loaded once — DESIGN_SYSTEM.md § Typography. */
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Clarix — cross-cooperative deduction coordination",
    template: "%s · Clarix",
  },
  description:
    "Clarix shows a cooperative whether a member's combined deductions across every cooperative " +
    "they belong to still fit inside the agreed one-third salary cap — before a loan is approved.",
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
    // suppressHydrationWarning is required here and applies to this element's own attributes
    // only, not to its subtree: ThemeScript adds a `light` or `dark` class to <html> before
    // React hydrates, so the class attribute the client sees legitimately differs from the one
    // the server rendered. Without it, every page load logs a hydration mismatch.
    <html lang="en" className={`${inter.variable} h-full`} suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className="flex min-h-full flex-col">
        {/*
          Chrome fires `beforeinstallprompt` during page load, typically BEFORE React has
          hydrated — so a listener registered inside a component effect misses it altogether and
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
