/**
 * Where the site lives and which of its routes search engines may see. One place, so robots.txt,
 * the sitemap, the Open Graph image and the root metadata can never disagree.
 */

export const SITE_TITLE = "Clarix · Cooperative management with a cross-cooperative limit check";
export const SITE_DESCRIPTION =
  "Savings, loans, repayments and member statements for every kind of cooperative in Nigeria. " +
  "Before a loan is approved, Clarix checks what the member already owes in every cooperative " +
  "they belong to.";

/**
 * The site's absolute origin, without a trailing slash: the configured public URL, else the
 * production domain Vercel provides, else the local dev server. A configured value without a
 * scheme ("clarix.ng") gets https://, and one that still will not parse is skipped, so
 * `new URL(siteUrl())` can never throw.
 */
export function siteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) {
    const withScheme = /^[a-z][a-z\d+.-]*:\/\//i.test(configured) ? configured : `https://${configured}`;
    const origin = withScheme.replace(/\/+$/, "");
    // Anything still unparseable (a stray space, say) falls through to the next source.
    if (URL.canParse(origin)) return origin;
  }

  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercel) return `https://${vercel.replace(/\/+$/, "")}`;

  return "http://localhost:3000";
}

export type PublicRoute = {
  path: string;
  priority: number;
  changeFrequency: "weekly" | "monthly" | "yearly";
};

/** Every page a stranger can read, in sitemap order (the home page first). */
export const PUBLIC_ROUTES: readonly PublicRoute[] = [
  { path: "/", priority: 1.0, changeFrequency: "weekly" },
  { path: "/pricing", priority: 0.9, changeFrequency: "monthly" },
  { path: "/for-members", priority: 0.8, changeFrequency: "monthly" },
  { path: "/privacy", priority: 0.3, changeFrequency: "yearly" },
  { path: "/login", priority: 0.2, changeFrequency: "yearly" },
  { path: "/signup", priority: 0.5, changeFrequency: "yearly" },
];

/** Every authenticated or one-time area. Crawlers are told to stay out of all of them. */
export const PRIVATE_PREFIXES: readonly string[] = [
  "/admin",
  "/platform",
  "/officer",
  "/onboarding",
  "/dashboard",
  "/cooperatives",
  "/loans",
  "/notifications",
  "/profile",
  "/help",
  "/more",
  "/invite",
  "/verify",
  "/reset-password",
  "/offline",
  "/api",
];

/**
 * Per-page canonical URL and Open Graph block. Next replaces a parent's `openGraph` object
 * wholesale when a page sets its own, so the shared fields are repeated here; spread the result
 * into the page's metadata: `{ title, description, ...pageMetadata("/privacy", { title, description }) }`.
 * The root layout deliberately sets neither, or every route would claim to be the home page.
 */
export function pageMetadata(
  path: string,
  { title, description }: { title?: string; description?: string } = {},
) {
  return {
    alternates: { canonical: path },
    openGraph: {
      type: "website" as const,
      locale: "en_NG",
      siteName: "Clarix",
      url: path,
      // A page-level openGraph replaces the segment's file-convention image too, so name it.
      images: [
        {
          url: "/opengraph-image",
          width: 1200,
          height: 630,
          alt: "Clarix. Run your cooperative with every number in view.",
        },
      ],
      ...(title ? { title } : {}),
      ...(description ? { description } : {}),
    },
  };
}
