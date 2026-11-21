/**
 * Where the site lives and which of its routes search engines may see. One place, so robots.txt,
 * the sitemap, the Open Graph image and the root metadata can never disagree.
 */

/**
 * The site's absolute origin, without a trailing slash: the configured public URL, else the
 * production domain Vercel provides, else the local dev server.
 */
export function siteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) return configured.replace(/\/+$/, "");

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
