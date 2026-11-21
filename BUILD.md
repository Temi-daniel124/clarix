# BUILD.md, Clarix

Practical setup and day-to-day commands. For *why* things are set up this way, see
`docs/ARCHITECTURE.md`, `docs/DEVELOPMENT-WORKFLOW.md`, and `docs/TOOLING-POLICY.md`.

## One-time machine setup

Prerequisites: Node.js (LTS), the GitHub CLI (`gh`) or Git for Windows, the Supabase CLI
(`npm install -g supabase` or the standalone binary), and Vercel CLI (`npm install -g vercel`),
all light installs, none of them Docker.

```bash
# from inside C:\Users\hp\Documents\CLARIX, once the repo exists there:
git config user.name "Temi-daniel124"
git config user.email "temmydaniel124@gmail.com"
```

This sets the identity **for this repository only** (no `--global` flag), see
`docs/DEVELOPMENT-WORKFLOW.md` §1 for why this must never drift.

## First-time project scaffold (once the repo exists and this doc set is in it)

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
# then wire up shadcn/ui, Motion, lucide-react, the Supabase JS client, Resend's SDK,
# see docs/TOOLING-POLICY.md for the exact approved package list.
```

## Linking to Supabase (no local Docker, see docs/DEVELOPMENT-WORKFLOW.md §2)

```bash
supabase login                                    # once per machine
supabase link --project-ref <Clarix project ref>  # from docs/ARCHITECTURE.md, once per checkout
```

## Ongoing schema changes

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
git add <files>
git commit -m "…"     # only after the git-identity check in docs/DEVELOPMENT-WORKFLOW.md §1
git push
```

Vercel's GitHub integration builds and deploys automatically: a pull request gets a Preview
deployment, a merge to the default branch deploys to production. Nothing further to run manually
beyond the `supabase db push` step for any schema change that needs to land alongside the code.

## Environment variables checklist

Set these in Vercel (Project Settings → Environment Variables) **and** in a local `.env.local`
(gitignored):

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
RESEND_API_KEY
AI_PAYSLIP_API_KEY
```

See `docs/ARCHITECTURE.md` for what each one is for, and `SECURITY.md` for handling rules.
