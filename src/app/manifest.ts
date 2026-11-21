import type { MetadataRoute } from "next";

/**
 * PWA manifest, docs/ARCHITECTURE.md § PWA behavior and DECISIONS.md D014 (a well-built PWA
 * is the entire mobile strategy; there is no native app).
 *
 * Light only (D033): the splash and the installed app's chrome are porcelain, the page ground.
 * No `orientation`, so the installed desktop app can be any shape. The PNG icons are rendered
 * from the SVGs in public/icons by scripts/brand/render-icons.mjs.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Clarix",
    short_name: "Clarix",
    description:
      "Savings, loans, repayments and member statements for every kind of cooperative, with a " +
      "limit check across every cooperative a member belongs to.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#F5F6FB",
    theme_color: "#F5F6FB",
    categories: ["finance", "business", "productivity"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      { src: "/icons/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
  };
}
