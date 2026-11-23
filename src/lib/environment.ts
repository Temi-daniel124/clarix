/**
 * Whether this deployment shares the live demo data without being Production (D043).
 *
 * Preview and Production use one Supabase project by the owner's decision, so every Preview reads
 * and writes the same demo data the live product shows. BUILD-PLAN 0.4: say so on every page of
 * anything that is not Production. Vercel sets `VERCEL_ENV` to "production", "preview" or
 * "development"; a local `next dev` has none, and also talks to the live project, so it counts too.
 */
export function sharesLiveDataOutsideProduction(vercelEnv: string | undefined = process.env.VERCEL_ENV): boolean {
  return vercelEnv !== "production";
}
