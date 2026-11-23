# PROJECT-STATE.md, Clarix

**Authority level: 7 of 14.** A living document: what exists now, what is broken, what is next, and what is
waiting on the owner. Keep it short. Update it at the end of every session that finishes a
`BUILD-PLAN.md` step. History lives in git and in `docs/archive/PROJECT-STATE-2026-09.md` (the full
R1 build log, 1,375 lines, last updated 13 September 2026).

**Last updated:** 23 November 2026. **Phase 0 is built** (0.1 to 0.6), in six stacked PRs waiting
on the owner. The R2 governing docs (the 14 ranked in `AGENT.md`), the build
plan and every role and screen blueprint are merged to `main` (PR #23, approved by the owner). No R2
code is on `main` yet.

## Where things stand

- **Release 1 is live** at `clarix-3w5i.vercel.app`, from `main` at `d1c3a0a` (PR #21). Every screen
  in the four role blueprints is built except officer 6.2 (apply on a member's behalf). 29 migrations,
  16 tables, all with RLS; 46 unit tests; 13 pgTAP suites in GitHub Actions; `next build` passes.
- **Release 2 has started.** Decisions D032 to D049 are in `docs/DECISIONS.md`; the ordered work is
  `docs/BUILD-PLAN.md`. **0.1 (store over-limit applications) is built and in review**, not merged:
  migrations 030 and 031 are written and tested in CI but **not applied** to the shared database;
  they apply when the owner says "merge" (031 changes `submit_loan_application`, which `main` uses).
  **0.2 (`npm ci`) is built and in review**, stacked on 0.1: lockfile regenerated on Node 26 (the
  version Vercel uses, now pinned in `.nvmrc` and `engines`), `typecheck` script, and a CI workflow
  that runs `npm ci`, lint, typecheck, tests and build on every PR. No migration.
  **0.3 (add an existing loan) is built and in review**, stacked on 0.2: Member → Loans → "Add
  existing loan", migration 032 (additive). Migration 032 is **not applied**: the Supabase account
  connected to agent sessions does not hold the `Clarix` project (it is still under the owner's
  previous account), so it waits for the owner, like 030 and 031.
  **0.4 (Preview strip) is built and in review**, stacked on 0.3: "Preview · uses the live demo
  data" on every page outside Production, and `supabase/seed/README.md`. No migration.
  **0.5 (one source per home figure) is built and in review**, stacked on 0.4: the three rules live
  in `src/lib/home-figures.ts`; migration 033 adds the roster count to the Platform directory and
  applies at merge.
  **0.6 (every loan write through a function) is built and in review**, stacked on 0.5: migration
  034 drops `loans_insert_staff` and `loans_update_staff` and revokes direct writes on `loans`;
  applies at merge. No app code wrote loans directly, and a unit test now keeps it that way.
  **Open chain, merge in order:** #24 (0.1) → #25 (0.2) → #26 (0.3) → #27 (0.4) → #28 (0.5) → 0.6.
  **Next step: BUILD-PLAN 1.1** (tokens, light only, Figtree), the start of Phase 1.
- PR #22 (an earlier redesign attempt) was rejected and its branch deleted. Nothing from it carries over.

## Known defects in the live product (fixed in Phase 0)

| Defect | Where | Step |
|---|---|---|
| "Submit anyway" applications are never stored; the member is told they were sent (fixed in the 0.1 PR, live once merged and migrations 030–031 applied) | `submit_loan_application`, migration `20260917213110_loan_product_on_application.sql` | 0.1 |
| Staff can `update` or `insert` a loan row directly (policies `loans_update_staff`, `loans_insert_staff`), bypassing `decide_loan_application` and `record_existing_loan` with their reason, permission and audit entry (fixed in the 0.6 PR) | migration `20260912054608` | 0.6 |
| `npm ci` fails: lockfile out of sync (fixed in the 0.2 PR) | `package-lock.json` | 0.2 |
| Existing loans cannot be entered, so committed starts at ₦0 for every member (fixed in the 0.3 PR) | no screen or RPC | 0.3 |
| Preview deployments share the live database (kept by the owner's choice, D043); nothing marks a Preview as such (fixed in the 0.4 PR) | layout | 0.4 |
| Admin home "Members 8" vs list "15 members" vs platform "7"; member home "Current as of 15 March" in November; admin loans says 3 lapsed and "Nothing is waiting" at once (fixed in the 0.5 PR) | home queries | 0.5 |
| Floating tab bar covers the last content on member home and staff member list (phone) | app shells | 1.4 |
| Payslips are not read; members type the figures | onboarding | 7.3 |
| Every signup is attached to the FMC organisation row | `handle_new_auth_user` (migration 001) | 3.1 |

## Accounts and environments

| Service | State | Notes |
|---|---|---|
| GitHub | `Temi-daniel124/clarix`, default branch `main` | Branch protection deferred by the owner |
| Vercel | Two projects build this repo: **`clarix`** in the owner's current account and the older **`clarix_app`** in the previous account (which serves `clarix-3w5i.vercel.app`) | Both stay until the owner has accepted the new project's designs; then the owner deletes `clarix_app` |
| Supabase production | Project `Clarix`, ref `sxugaizwmqigtioqgefx`, eu-west-1, free | Still under the owner's previous Supabase account. Holds the FMC demo data |
| Resend | Sender `onboarding@resend.dev` | Reaches only the account owner until a domain is verified. Keys are rotated only at go-live (owner's choice) |
| Domain | None | Blocks real email, canonical URLs, self-signup |

Demo accounts (one per role) exist in production for the FMC demonstration. Their emails are in the
demo seed; **their passwords are never written in this repository** (`SECURITY.md`).

## Waiting on the owner

Nothing blocks the build. Every R2 decision is Locked (the owner confirmed D048, the D041 institution
bundle and Paystack, and chose to keep one shared database, D043, on 22 November 2026).

Deliberately deferred by the owner, so do not raise them as tasks:
- Rotating keys and tokens (all rotated at go-live).
- Deleting the old `clarix_app` Vercel project (after the new one's designs are accepted).
- Branch protection on `main`.
- Moving the `Clarix` Supabase project to the new Supabase account.

Needed later, at the step named:
1. **Hero photos or a video** for the landing page: the owner picks from the shortlist PR 5.2 carries.
2. **A domain**, when the owner is ready: unlocks email, canonical URLs and cooperative self-signup.

## Decision and scope drift check

Before any session's work: re-read `DECISIONS.md` (at least D032 onward), this file, and the current
`BUILD-PLAN.md` step. If the code contradicts a Locked decision, that is a bug to fix, not a reason
to edit the decision. A deliberate change is a new dated entry.
