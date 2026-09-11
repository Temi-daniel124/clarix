# PROJECT-STATE.md — Clarix

**Authority level: 3.** This is a **living document** — unlike every other file in `docs/`, it is
expected to change constantly. Update it at the end of every work session, and especially at
every milestone (an account created, a repo initialized, a schema pushed, a feature accepted). An
agent picking up this project cold should read this file first, right after `DECISIONS.md`, to
know exactly what already exists and what doesn't.

**Last updated:** 2026-09-11 (GitHub repo created and pushed; Vercel project auto-linked; Supabase
project `Clarix` created).

## Phase

**Planning complete. Accounts/infra setup in progress. No application code written yet.**

## What exists today

- Full planning corpus, written and saved to the "Clarix Re-visioned" Claude project:
  strategic analysis, MVP spec, design system, and four role-by-role UX blueprints (Employee,
  Cooperative Admin, Cooperative Officer, Super Admin). Copies live under `docs/planning/` in
  this repository for local/offline reference by whoever (or whatever agent) is building.
- This governance doc set (`docs/DECISIONS.md` through `docs/TOOLING-POLICY.md`, plus
  `AGENT.md`, `CLAUDE.md`, `BUILD.md`, `SECURITY.md`, `DESIGN_SYSTEM.md`).

## What does not exist yet

- [ ] Resend: account exists; no domain/sender configured yet, no API key generated yet.
- [ ] `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY`
      not yet set in Vercel's environment variables (the Supabase project exists — see below —
      but its keys haven't been copied into Vercel or a local `.env.local` yet).
- [ ] No database migrations written or pushed yet — the `Clarix` Supabase project is empty
      (no tables, no RLS policies). `supabase link` has not been run locally yet either.
- [ ] No application code written yet — the repo currently contains only this governance doc
      set, which is why Vercel's first deployment 404s (nothing to serve yet; expected, not a
      bug — see the note below).
- [ ] CI workflow stub is committed (`.github/workflows/db-tests.yml`) but has never run — it
      only triggers on PRs touching `supabase/migrations/**` or `supabase/tests/**`, neither of
      which exists yet.
- [ ] `RESEND_API_KEY` / `AI_PAYSLIP_API_KEY` not yet provisioned.

## What now exists (done in this session)

- [x] **GitHub repository created:** `github.com/temiloluwa-adebayo/clarix` (private), default
      branch `main`. First commit `fa4e539` ("Add governance docs and repo scaffold"), authored
      correctly as Temiloluwa Adebayo / adrianwilliams128765@gmail.com — GitHub shows it verified
      (green check) against the account. The local git identity was set **per-repo** (no
      `--global`), matching `DEVELOPMENT-WORKFLOW.md` §1.
- [x] **Vercel project linked and deployed:** Vercel auto-imported the new GitHub repo into the
      `adrianwilliams128765-pixel` account/team as project `clarix-3w5i`
      (`clarix-3w5i.vercel.app`), and it auto-deployed on the initial push. **The live URL
      currently 404s — this is expected, not an error:** the repo holds only documentation right
      now, no `package.json` and no Next.js app for Vercel to build or serve. This will resolve
      itself once the app scaffold in `BUILD.md` is committed. No git-identity-related deploy
      block occurred this time.
      **Open item:** confirm whether `clarix-3w5i` is the permanent project name/URL or should be
      renamed to something like `clarix` in Vercel's project settings before real users see it —
      not urgent, but easier to rename now than after a custom domain or shared links exist.
- [x] **Supabase project `Clarix` created**, project ref `sxugaizwmqigtioqgefx`
      (`https://sxugaizwmqigtioqgefx.supabase.co`). Recorded in `docs/ARCHITECTURE.md` and
      `SECURITY.md`. The pre-existing unrelated project in the same organization was not touched.
      **Open item:** the anon/public key and the database password generated at creation still
      need to be retrieved from the dashboard (Project Settings → API) and stored — not yet
      recorded anywhere, including here, since they're secrets (see `SECURITY.md`).

## Accounts inventory

| Service                               | Status                                                               | Notes                                                                                                                                                             |
| ------------------------------------- | -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Supabase                              | **Project `Clarix` created** (ref `sxugaizwmqigtioqgefx`)            | Lives alongside the pre-existing unrelated project in the same org — that project remains untouched. Anon key / DB password not yet retrieved from the dashboard. |
| GitHub                                | **Repo created:** `temiloluwa-adebayo/clarix` (private)              | First commit pushed, correctly authored, verified by GitHub.                                                                                                      |
| Vercel                                | **Project linked:** `clarix-3w5i` under `adrianwilliams128765-pixel` | Auto-deployed from the GitHub push; currently 404s because there's no app code yet (expected). Consider renaming the project before go-live.                      |
| Resend                                | Account exists                                                       | No domain/API key configured yet.                                                                                                                                 |
| AI payslip OCR API (Claude or OpenAI) | Not yet decided/provisioned                                          | P1 feature — not needed for the first working commit.                                                                                                             |

## Immediate next steps (in order)

1. Retrieve the Supabase anon/public key from Project Settings → API and record the database
   password somewhere safe (password manager) — neither goes in this repo (see `SECURITY.md`).
2. Run `supabase link --project-ref sxugaizwmqigtioqgefx` locally (one time per machine/checkout).
3. Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and
   `SUPABASE_SERVICE_ROLE_KEY` in Vercel's project (`clarix-3w5i`) environment variables, and in a
   local `.env.local` (gitignored).
4. Scaffold the Next.js app (per `BUILD.md`) and push it — this is what turns the current 404
   into a real running app on the next Vercel deploy.
5. Write and push the first database migration (schema from `docs/DATA-MODEL.md`), including its
   RLS policies in the same migration.
6. Set up Resend (domain + API key) when the invite-email flows are being built.

## Decision/scope drift check

Before starting any new work session, re-read `DECISIONS.md` in full and skim this file's
checklist. If something in the codebase already contradicts a locked decision, that's a bug to
fix, not a signal to update the decision — update the decision only through a new dated entry in
`DECISIONS.md` if the change is genuinely deliberate.
