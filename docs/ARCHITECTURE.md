# ARCHITECTURE.md, Clarix

**Authority level: 3.** Defers to `DECISIONS.md` and `DATA-MODEL.md`. This describes the system
shape and deployment topology, for the database schema and reservation algorithm, see
`DATA-MODEL.md`; for local setup commands, see `BUILD.md`; for CI, see `DEVELOPMENT-WORKFLOW.md`.

## System overview

Clarix is a single Next.js application (App Router) deployed on Vercel, backed by a single
Supabase project for Postgres, Auth, and file Storage, with Resend handling transactional email
and a paid vision-capable LLM API (Claude or OpenAI) used only as a fallback step in the payslip
pipeline. There is no separate backend service, API routes / Server Actions inside the same
Next.js app are the entire server-side surface. This matches the already-agreed lean-budget,
free-tier-first infrastructure decision (`DECISIONS.md` D012).

```
Browser / installed PWA
   │
   ▼
Next.js app on Vercel  ── React + Tailwind + shadcn/base-ui + Motion (motion/react)
   │            │
   │            └── Server Actions / Route Handlers (auth checks, eligibility calc,
   │                 reservation transaction, payslip pipeline orchestration)
   ▼
Supabase (single project: "Clarix")
   ├── Postgres, schema in DATA-MODEL.md, RLS policies enforce all cooperative isolation
   ├── Auth, email/phone + password; invite-link flows for Admin/Officer roles
   └── Storage, uploaded payslip files, private bucket

Resend  ── invite emails, notifications (P1)
Claude/OpenAI API  ── payslip OCR fallback only (never the eligibility decision itself, D018)
```

## Supabase project

- **Project name:** `Clarix`
- **Organization:** the user's existing Supabase organization (already contains one unrelated
  project, never touched, queried, or referenced by this codebase; see `DECISIONS.md` D020).
- **Project ref:** `sxugaizwmqigtioqgefx`
- **Project URL:** `https://sxugaizwmqigtioqgefx.supabase.co`
- **Region:** `eu-west-1` (Ireland). Worth being aware of rather than changing: the pilot's users
  are in Abeokuta, so every request crosses to Europe and back. That is a latency cost, not a
  correctness one, and Supabase cannot move a project between regions after creation. It would
  mean a new project and a migration. Revisit only if the pilot shows latency actually hurting,
  and note that the nearest alternatives carry their own data-residency questions under the NDPA.
- **Postgres:** 17.6
- **Connection:** the Next.js app never connects directly with a raw Postgres connection string
  for application traffic. It uses the Supabase JS client (anon key, RLS-enforced) from the
  browser/server-component context, and the service-role key only from trusted server-only code
  paths that explicitly need to bypass RLS (there should be very few of these, enumerate them in
  `SECURITY.md` if any exist).

## PWA behavior

- `manifest.json` with Clarix's icon set, `display: standalone`, theme/background colors matching
  `DESIGN_SYSTEM.md` tokens.
- A service worker for offline app-shell caching and the install prompt; the install banner
  itself follows the dismissible, appears-once, per-role behavior described in each role
  blueprint under `docs/planning/`.
- Same responsive layout serves mobile and desktop, bottom tab bar vs. persistent sidebar is a
  CSS/layout-density difference, never a separately built experience (see `DESIGN_SYSTEM.md` §5).

## Payslip and statement pipeline (background-job discipline; R2 extends it to bank statements, D035)

1. Try direct PDF text extraction first (a library, not the AI API), IPPIS payslips are
   Oracle E-Business Suite-generated, real-text PDFs, so this succeeds for free on a digital
   upload. Look for `Total Gross Earnings`, `Total Net Earnings`, `IPPIS Number`, `Employee Name`
   by label.
2. Only if that fails (e.g. a photographed printed copy), fall back to a single structured-output
   call to the vision-capable LLM API.
3. Either path ends at the same human confirm-before-save screen, never auto-committed.
4. Because Vercel's Hobby tier has a short default function timeout, the AI-fallback call must run
   as a background/queued job (e.g. a Supabase Edge Function, a queued Vercel background function,
   or an equivalent), never synchronously inside the request that's waiting on the upload: a slow
   API call must not consume the request's timeout budget.

## Environments (R2, D032, D043)

| Environment | Vercel | Supabase | Who changes it |
|---|---|---|---|
| Production | the Production deployment of `main` (`clarix-3w5i.vercel.app` until a domain exists) | `Clarix` (ref `sxugaizwmqigtioqgefx`, eu-west-1). **Note:** it was created under the owner's old Supabase account; moving it to the new account is an owner task in `PROJECT-STATE.md` | Only the owner, or an agent the owner has told to, for that specific PR |
| Preview | one per branch / PR | **Today: the same production project** (a known risk). **Once created (D043, confirmed 22 Nov 2026):** `clarix-staging`, a second free project with synthetic demo data only | Agents, freely, on branches |
| Local | `npm run dev` | whichever project `.env.local` points at; never production for schema work | The person at the keyboard |

Interim rule until `clarix-staging` exists: Preview deployments read and write the production database,
so **no branch may apply a migration, and nobody tests destructive actions (delete, bulk import,
billing state changes) on a Preview** against the demo cooperatives. Free Supabase projects pause
after 7 idle days; a weekly GitHub Actions ping keeps staging awake.

## SEO and public files (D047)

Generated from code under `src/app/` (`sitemap.ts`, `robots.ts`, `manifest.ts`,
`opengraph-image.tsx`, `icon.png`, `apple-icon.png`, `favicon.ico`). `NEXT_PUBLIC_SITE_URL` gives the
absolute base. When `VERCEL_ENV !== "production"`, robots returns `Disallow: /` and the root layout
sets `robots: { index: false }`. Signed-in route groups are always `noindex`.

## Documents and exports (D036, D044)

Generated server-side in a Route Handler with the approved PDF library (`TOOLING-POLICY.md`), so the
member's data never leaves Clarix. Vercel Hobby functions have a 10-second limit: one statement per
request; bulk generation for a month runs as a client-driven queue (the browser requests statements
one at a time and zips them) rather than one long function. Each document gets a row in
`generated_documents` with its verification code before the file is returned.

## Billing (D041, D042)

The trial clock and read-only state are computed when read (like reservation expiry), not by a cron
job: `cooperative_access_state(coop_id)` returns `trial`, `active`, `grace`, or `read_only`, and every
write RPC checks it. A daily Vercel Cron (free) only sends reminders.

## Environment variables (names only, actual values live in Vercel's project settings and the

local `.env.local`, never committed; see `SECURITY.md`)

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY        # server-only, never exposed to the client bundle
RESEND_API_KEY
AI_PAYSLIP_API_KEY               # P1 only (vision fallback); not set until that decision exists
NEXT_PUBLIC_SITE_URL             # R2, D047: absolute base for sitemap, canonical, OG
NEXT_PUBLIC_DEMO_MODE            # R2, D048 (Provisional): "true" only on an owner-named demo deployment
DEMO_ACCOUNT_PASSWORDS           # R2, D048: server-only, only where DEMO_MODE is on; never in git
```

`SUPABASE_SERVICE_ROLE_KEY` remains unused by the app (privileged steps are SECURITY DEFINER
functions, `SECURITY.md`). Do not start using it without a decision entry.

## Deployment flow

Agents push **branches only**; every branch gets a Preview deployment automatically. A merge to
`main` deploys to production, and only the owner merges, or tells an agent to merge a specific PR
(D032). See
`DEVELOPMENT-WORKFLOW.md` for the commit-identity gate that must pass before this flow is allowed
to run, and for why database migrations are applied via `supabase db push` as a distinct step,
not something Vercel's build itself does.

## Scaling notes (not to be built against now, see `DECISIONS.md` D019)

Supabase free tier: 500 MB database, 1 GB file storage (uploaded payslips will be the first thing
to approach this), 5 GB egress/month, 50k MAU, projects paused after a week of inactivity. Vercel
Hobby: 4 CPU-hours/month active compute, 10s default function timeout. Watch usage dashboards
monthly once live; treat "approaching a free-tier ceiling" as the trigger to upgrade, funded by
the recurring plan once cooperatives start paying, not before.
