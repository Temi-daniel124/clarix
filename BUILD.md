# BUILD.md, Clarix

**Authority level: 12 of 14.** The full order is in `AGENT.md` → "The governing documents".

Practical setup and day-to-day commands. For *why* things are set up this way, see
`docs/ARCHITECTURE.md`, `docs/DEVELOPMENT-WORKFLOW.md`, and `docs/TOOLING-POLICY.md`.

## One-time machine setup

Prerequisites: Node.js 26 (pinned in `.nvmrc` and `package.json` "engines", the same version
Vercel builds with; `nvm use` picks it up), the GitHub CLI (`gh`) or Git for Windows, the Supabase CLI
(`npm install -g supabase` or the standalone binary), and Vercel CLI (`npm install -g vercel`),
all light installs, none of them Docker.

```bash
git clone https://github.com/Temi-daniel124/clarix.git
cd clarix
git config user.name "Temi-daniel124"
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

**R2 rule (D032, D043):** there is one Supabase project for Preview and Production. Write the
migration file first and let CI test it. An **additive** migration may be applied from a branch (an
agent uses the Management API per D023; a human uses `db push`); anything that changes or removes
what `main` relies on is applied only when the owner says "merge" for that PR.

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
npm ci        # installs exactly what package-lock.json says; use `npm install` only to change a dependency
npm run dev
```

The app talks to the remote `Clarix` Supabase project via `NEXT_PUBLIC_SUPABASE_URL` /
`NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local` (never committed, see `SECURITY.md`). There is no
local backend to start separately.

## Testing

```bash
npm test              # unit tests, eligibility/reservation arithmetic, pure functions, no DB
npm run typecheck     # generates Next's route types, then tsc --noEmit
npm run lint
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
says "Migration: additive, applied" or "Migration: applies at merge" in its title (D043).

## Environment variables checklist

Set these in Vercel (Project Settings → Environment Variables) **and** in a local `.env.local`
(gitignored):

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
RESEND_API_KEY
NEXT_PUBLIC_SITE_URL          # R2 (D047)
NEXT_PUBLIC_DEMO_MODE         # R2 (D048): demo deployments only
```

**Demo sign-in chips (D048), Preview only.** Set these on the **Preview** environment only, never on
Production (where the chips are refused regardless). Mark every `DEMO_PASSWORD_*` **Sensitive** in
Vercel. A role whose two variables are not both set simply has no chip. Values never go in a
committed file, a PR, a screenshot or a message.

```
NEXT_PUBLIC_DEMO_MODE=true    # turns the chips on for that deployment
DEMO_EMAIL_MEMBER
DEMO_PASSWORD_MEMBER          # Sensitive
DEMO_EMAIL_ADMIN
DEMO_PASSWORD_ADMIN           # Sensitive
DEMO_EMAIL_OFFICER
DEMO_PASSWORD_OFFICER         # Sensitive
DEMO_EMAIL_PLATFORM
DEMO_PASSWORD_PLATFORM        # Sensitive
```

`npm run test:bundle` (run by CI after the build) fails if any `DEMO_PASSWORD_*` value or any of
these names appears in the client bundle.

`SUPABASE_SERVICE_ROLE_KEY` and `AI_PAYSLIP_API_KEY` are not used by the app; leave them unset.
Preview and Production use the same Supabase values (D043).

See `docs/ARCHITECTURE.md` for what each one is for, and `SECURITY.md` for handling rules.
