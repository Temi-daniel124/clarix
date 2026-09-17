import type { MetadataRoute } from "next";

/**
 * PWA manifest, docs/ARCHITECTURE.md § PWA behavior and DECISIONS.md D014 (a well-built PWA
 * is the entire mobile strategy; there is no native app).
 *
 * Theme and background colours are the DESIGN_SYSTEM.md tokens, so the splash screen and the
 * installed app's chrome are the same surface the app itself paints.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Clarix, cross-cooperative deduction coordination",
    short_name: "Clarix",
    description:
      "See every cooperative you belong to in one place, and know before you borrow whether a " +
      "new loan still fits inside your agreed salary-deduction limit.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#F6F8FB",
    theme_color: "#0B1220",
    categories: ["finance", "productivity"],
    icons: [
      {
        src: "/icons/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
