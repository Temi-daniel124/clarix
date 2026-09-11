# PROJECT-STATE.md — Clarix

**Authority level: 3.** This is a **living document** — unlike every other file in `docs/`, it is
expected to change constantly. Update it at the end of every work session, and especially at
every milestone (an account created, a repo initialized, a schema pushed, a feature accepted). An
agent picking up this project cold should read this file first, right after `DECISIONS.md`, to
know exactly what already exists and what doesn't.

**Last updated:** 2026-09-11 (session that produced the governance doc set below).

## Phase

**Planning complete. Implementation setup in progress. No code written yet.**

## What exists today

- Full planning corpus, written and saved to the "Clarix Re-visioned" Claude project:
  strategic analysis, MVP spec, design system, and four role-by-role UX blueprints (Employee,
  Cooperative Admin, Cooperative Officer, Super Admin). Copies live under `docs/planning/` in
  this repository for local/offline reference by whoever (or whatever agent) is building.
- This governance doc set (`docs/DECISIONS.md` through `docs/TOOLING-POLICY.md`, plus
  `AGENT.md`, `CLAUDE.md`, `BUILD.md`, `SECURITY.md`, `DESIGN_SYSTEM.md`).

## What does not exist yet

- [ ] No GitHub repository created yet. GitHub account exists (`temiloluwa-adebayo`); no repo.
- [ ] No Supabase project named `Clarix` yet. A Supabase account and organization exist, with one
      unrelated project already in that org — **do not touch it.** Walkthrough for creating the
      new project is being tracked separately; once created, record its project ref below and in
      `ARCHITECTURE.md`/`SECURITY.md`.
- [ ] No Vercel project linked yet. A Vercel account exists.
- [ ] Resend account exists; no domain/sender configured yet, no API key generated yet.
- [ ] No `.env.local` or Vercel environment variables configured yet.
- [ ] No database migrations written or pushed yet.
- [ ] No application code written yet.
- [ ] No CI workflow committed yet (stub provided at `.github/workflows/db-tests.yml` — needs to
      actually run once a repo and a linked Supabase project exist).
- [ ] Local git identity for this repo not yet configured on the development machine (must be set
      per-repo before the first commit — see `DEVELOPMENT-WORKFLOW.md`).

## Accounts inventory

| Service | Status | Notes |
|---|---|---|
| Supabase | Account + org exist | One unrelated project already present in the org — never touch it. New project `Clarix` not yet created. |
| GitHub | Account exists (`temiloluwa-adebayo`) | No repository yet. |
| Vercel | Account exists | No project linked yet. |
| Resend | Account exists | No domain/API key configured yet. |
| AI payslip OCR API (Claude or OpenAI) | Not yet decided/provisioned | P1 feature — not needed for the first working commit. |

## Immediate next steps (in order)

1. Create the GitHub repository.
2. Set the local git identity for this repo (see `DEVELOPMENT-WORKFLOW.md` §1).
3. Place this governance doc set in the local project folder (already done if you're reading this
   from that folder) and make the first commit.
4. Create the Supabase project `Clarix` (see the setup walkthrough); record its project ref here
   and update `ARCHITECTURE.md` / `SECURITY.md`.
5. Link the repo to Vercel; configure environment variables (placeholders until Supabase/Resend
   values exist).
6. Scaffold the Next.js app skeleton and push the first migration.

## Decision/scope drift check

Before starting any new work session, re-read `DECISIONS.md` in full and skim this file's
checklist. If something in the codebase already contradicts a locked decision, that's a bug to
fix, not a signal to update the decision — update the decision only through a new dated entry in
`DECISIONS.md` if the change is genuinely deliberate.
