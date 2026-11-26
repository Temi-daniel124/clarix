import localFont from "next/font/local";

/**
 * Figtree, the one typeface (D038, DESIGN_SYSTEM.md §4.2), in exactly the four weights the design
 * system uses. The files live in the repository (src/app/fonts, SIL OFL 1.1, licence beside them),
 * so a build never downloads a font: a Google Fonts hiccup on a CI runner once failed a build.
 * They are Figtree's full static instances, latin and latin-ext together, with the `tnum` feature
 * that money's tabular figures rely on (§4.2).
 */
export const figtree = localFont({
  variable: "--font-figtree",
  src: [
    { path: "./fonts/Figtree-400.woff2", weight: "400", style: "normal" },
    { path: "./fonts/Figtree-500.woff2", weight: "500", style: "normal" },
    { path: "./fonts/Figtree-600.woff2", weight: "600", style: "normal" },
    { path: "./fonts/Figtree-700.woff2", weight: "700", style: "normal" },
  ],
  display: "swap",
});
