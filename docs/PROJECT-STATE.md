# PROJECT-STATE.md, Clarix

**Authority level: 3.** A living document: what exists now, what is broken, what is next, and what is
waiting on the owner. Keep it short. Update it at the end of every session that finishes a
`BUILD-PLAN.md` step. History lives in git and in `docs/archive/PROJECT-STATE-2026-09.md` (the full
R1 build log, 1,375 lines, last updated 13 September 2026).

**Last updated:** 22 November 2026, R2 planning docs written (this PR). No R2 code exists yet.

## Where things stand

- **Release 1 is live** at `clarix-3w5i.vercel.app`, from `main` at `d1c3a0a` (PR #21). Every screen
  in the four role blueprints is built except officer 6.2 (apply on a member's behalf). 29 migrations,
  16 tables, all with RLS; 46 unit tests; 13 pgTAP suites in GitHub Actions; `next build` passes.
- **Release 2 is planned, not started.** Decisions D032 to D049 are in `docs/DECISIONS.md`; the
  ordered work is `docs/BUILD-PLAN.md`. **Next step: BUILD-PLAN 0.1** (store over-limit applications).
- PR #22 (an earlier redesign attempt) was rejected and its branch deleted. Nothing from it carries over.

## Known defects in the live product (fixed in Phase 0)

| Defect | Where | Step |
|---|---|---|
| "Submit anyway" applications are never stored; the member is told they were sent | `submit_loan_application`, migration `20260917213110_loan_product_on_application.sql` | 0.1 |
| `npm ci` fails: lockfile out of sync | `package-lock.json` | 0.2 |
| Existing loans cannot be entered, so committed starts at ₦0 for every member | no screen or RPC | 0.3 |
| Preview deployments read and write the production database | Vercel env vars | 0.4 (D043 confirmed; staging project to create) |
| Admin home "Members 8" vs list "15 members" vs platform "7"; member home "Current as of 15 March" in November; admin loans says 3 lapsed and "Nothing is waiting" at once | home queries | 0.5 |
| Floating tab bar covers the last content on member home and staff member list (phone) | app shells | 1.4 |
| Payslips are not read; members type the figures | onboarding | 7.3 |
| Every signup is attached to the FMC organisation row | `handle_new_auth_user` (migration 001) | 3.1 |

## Accounts and environments

| Service | State | Notes |
|---|---|---|
| GitHub | `Temi-daniel124/clarix`, default branch `main` | Only `main` plus planning branches. Branch protection not yet on |
| Vercel | Two projects build this repo (seen on PR #23): **`clarix`** in the owner's current account (Preview ready) and the older **`clarix_app`** in the previous account, which still serves `clarix-3w5i.vercel.app` | Decide which project is Production; then disconnect the other from the repo so each push builds once |
| Supabase production | Project `Clarix`, ref `sxugaizwmqigtioqgefx`, eu-west-1, free | Still under the owner's previous Supabase account. Holds the FMC demo data |
| Supabase staging | Not created yet | D043 confirmed 22 Nov; owner creates it (BUILD.md) |
| Resend | Sender `onboarding@resend.dev` | Reaches only the account owner until a domain is verified. Key in the shared zip must be rotated |
| Domain | None | Blocks real email, canonical URLs, self-signup |

Demo accounts (one per role) exist in production for the FMC demonstration. Their emails are in the
demo seed; **their passwords are never written in this repository** (`SECURITY.md`).

## Waiting on the owner

These block or shape specific steps. An agent does the work around them, never past them.

1. **Create the `clarix-staging` Supabase project** (D043, confirmed 22 Nov): a free project in the
   new account, eu-west-1. Steps in `BUILD.md`. Until it exists, no branch applies a migration.
2. **Confirm D048** (demo sign-in chips on a named demo deployment). Affects 5.4.
3. **Confirm the D041 institution bundle** (10% off each when 3+ cooperatives in one institution pay).
4. **Confirm Paystack** as the payment provider (D042). Blocks 9.5 only.
5. **Rotate the Resend API key** that was in the shared zip, and delete the zip's `.vercel/` folder.
6. **Move the `Clarix` Supabase project** to the new Supabase account (Supabase dashboard → Project
   settings → Transfer), or confirm it stays where it is.
7. **Pick one Vercel project** (`clarix` in the new account is recommended) and disconnect `clarix_app`
   in the old account from the repo, after moving the production domain/alias if needed.
8. **Turn on branch protection** for `main` (require a PR and the DB-tests check).
9. **Choose hero photos or a video** for the landing page (5.2), from the shortlist that PR will carry.
10. **Buy a domain** when ready; it unlocks email, canonical URLs and cooperative self-signup.
11. Revoke the Supabase access token shared with planning sessions once R2 work no longer needs it.

## Decision and scope drift check

Before any session's work: re-read `DECISIONS.md` (at least D032 onward), this file, and the current
`BUILD-PLAN.md` step. If the code contradicts a Locked decision, that is a bug to fix, not a reason
to edit the decision. A deliberate change is a new dated entry.
