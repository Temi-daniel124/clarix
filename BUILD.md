# BUILD.md, Clarix

Practical setup and day-to-day commands. For *why* things are set up this way, see
`docs/ARCHITECTURE.md`, `docs/DEVELOPMENT-WORKFLOW.md`, and `docs/TOOLING-POLICY.md`.

## One-time machine setup

Prerequisites: Node.js (LTS), the GitHub CLI (`gh`) or Git for Windows, the Supabase CLI
(`npm install -g supabase` or the standalone binary), and Vercel CLI (`npm install -g vercel`),
all light installs, none of them Docker.

```bash
git clone https://github.com/Temi-daniel124/clarix.git
cd clarix
git config user.name "Temiloluwa Adebayo"
git config user.email "temmydaniel124@gmail.com"   # D033
npm ci
```

This sets the identity **for this repository only** (no `--global` flag), see
`docs/DEVELOPMENT-WORKFLOW.md` §1 for why this must never drift.

## Linking to Supabase (no local Docker, see docs/DEVELOPMENT-WORKFLOW.md §2)

```bash
supabase login                                    # once per machine
supabase link --project-ref <Clarix project ref>  # from docs/ARCHITECTURE.md, once per checkout
```

## Ongoing schema changes

**R2 rule (D032, D043):** an agent writes the migration file and lets CI test it; it never runs
`db push` against production. Only the owner applies a migration to production, after merging the
PR. Once staging exists, agents apply to staging only. The commands below are the owner's path.

```bash
# edit schema locally (e.g. in supabase/migrations or via the CLI's schema-diff workflow),
# then generate and apply a migration against the REAL remote Clarix project:
supabase db diff -f <descriptive_migration_name>
supabase db push
```

There is no local database to reset if something goes wrong: the remote `Clarix` project is the
only database. Be deliberate, especially with anything destructive.

## Running the app locally

```bash
npm install
npm run dev
```

The app talks to the remote `Clarix` Supabase project via `NEXT_PUBLIC_SUPABASE_URL` /
`NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local` (never committed, see `SECURITY.md`). There is no
local backend to start separately.

## Testing

```bash
npm test              # unit tests, eligibility/reservation arithmetic, pure functions, no DB
```

pgTAP / RLS / concurrency tests run only in GitHub Actions (`.github/workflows/db-tests.yml`),
see `docs/DEVELOPMENT-WORKFLOW.md` §3 for why, and don't try to run them locally.

## Deploying

```bash
git switch -c r2/<phase>-<step>-<name>
git add <files>
git commit -m "…"     # only after the git-identity check in docs/DEVELOPMENT-WORKFLOW.md §1
git push -u origin r2/<phase>-<step>-<name>
```

Push **a branch**, never `main` (D032). Vercel builds a Preview for every branch. Open a PR with the
Preview link. Only the owner merges; a merge to `main` deploys to Production. A PR with a migration
says "Needs migration applied" in its title, and the owner (not an agent) applies it to production
after merging (D043's interim rule).

## Environment variables checklist

Set these in Vercel (Project Settings → Environment Variables) **and** in a local `.env.local`
(gitignored):

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
RESEND_API_KEY
NEXT_PUBLIC_SITE_URL          # R2 (D047)
NEXT_PUBLIC_DEMO_MODE         # R2 (D048, Provisional): demo deployments only
```

`SUPABASE_SERVICE_ROLE_KEY` and `AI_PAYSLIP_API_KEY` are not used by the app; leave them unset.
Scope Preview variables to the staging project once it exists (D043).

See `docs/ARCHITECTURE.md` for what each one is for, and `SECURITY.md` for handling rules.

## Setting up the staging database (D043, confirmed 22 November 2026)

1. Owner: create a free Supabase project `clarix-staging` (same region, eu-west-1) in the new account.
2. Agent: apply every file in `supabase/migrations/` to it in order (Management API or `db push`
   against staging only), then `supabase/seed/demo.sql` (synthetic data, no real people).
3. Owner: in Vercel → Settings → Environment Variables, set `NEXT_PUBLIC_SUPABASE_URL` and
   `NEXT_PUBLIC_SUPABASE_ANON_KEY` for **Preview** to the staging values; Production keeps its own.
4. Add the weekly keep-awake workflow (`.github/workflows/staging-ping.yml`).
