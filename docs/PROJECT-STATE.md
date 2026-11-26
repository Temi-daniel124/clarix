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
- **Release 2 has started.** Decisions D032 to D051 are in `docs/DECISIONS.md`; the ordered work is
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
  **1.1 (tokens, light only, Figtree) is built and in review**, stacked on 0.6: DESIGN_SYSTEM §4.1
  to §4.5 in `globals.css`, R1 token names kept as aliases onto R2 values until Phases 4 to 6
  rebuild each screen; the dark palette, theme toggle and ThemeScript are gone (the sidebar's
  remembered width moved to `RailScript`). No migration.
  **1.2 (buttons, inputs, chips, segmented control) is built and in review**, stacked on 1.1: the
  §5.1 button (pill, six variants, loading), §5.2 inputs (money, phone, password), `Chip`,
  `FilterChip` and `SegmentedControl`, every bespoke button moved onto them, and `/dev/components`
  (Previews only). It also fixed focus rings: R1's shared button and inputs showed none
  (`outline-none` cancelled them). No migration.
  **1.3 (Sheet and side panel) is built and in review**, stacked on 1.2: `src/components/ui/sheet.tsx`
  on Base UI's Drawer (50% and 92% detents, drag to dismiss, back button closes, 440px right panel
  from 1024px, a `filter` kind that leaves the page usable), demoed on `/dev/components`. The same PR
  bundles Figtree in the repository with `next/font/local` (D050), so builds no longer download it.
  No migration.
  **1.4 (app shells) is built and in review**, stacked on 1.3: one `AppShell` for all four roles,
  phone top bar and floating tab bar (centre "+" for staff, 112px bottom reserve), the light 248px
  sidebar (72px collapsed), the `Ctrl/⌘ K` palette, the cooperative switcher (a cookie that
  `preferredRole` honours, so every staff screen follows it) and "Switch to my member view". The
  More screens lost their uppercase labels and gained Sign out. No migration.
  **1.4a (raised centre quick action) is built and in review**, stacked on 1.4: the owner's design
  fix (D051). The staff "+" rises out of the tab bar in a canvas ring; every tab is an icon over a
  12px label in equal slots. Not a BUILD-PLAN step. No migration.
  **1.4b (quick action grows out of the bar) is built and in review**, stacked on 1.4a: the owner's
  refinement of D051. The canvas ring is gone; the button is a 56px emerald circle with a 4px navy
  border, rising 20px above the bar, with its own emerald shadow. Staff bottom reserve 120px. Not a
  BUILD-PLAN step. No migration.
  **1.4c (demo sign-in chips, D048) is built and in review**, stacked on 1.4b, pulled forward from
  5.4 at the owner's request: "Sign in as" chips on the sign-in page, a server action holding the
  Preview-only demo credentials, refused in Production, and a CI check that no demo password or
  variable name reaches the client bundle. **The owner sets the eight Preview variables in Vercel**
  (names in BUILD.md). No migration.
  **1.4d (walkthrough fixes) is built and in review**, stacked on 1.4c: the seven "Fix now" items
  from `docs/WALKTHROUGH-1-4c.md`. The member's loans now share one read and one count with the
  cooperative's Members list (they disagreed because the member's read named columns from the 0.3
  migration, failed on the shared Preview database and showed "no loans"); savings trend, Lagos
  greeting, §3 meter, sidebar height, view-switch labels and menu separators. No migration.
  On a Preview before the chain merges, the admin Loans queue still reads columns from the 0.1 and
  0.3 migrations (not in the walkthrough, so not changed); it works once they apply at merge.
  **1.4e (sidebar scroll and small fixes) is built and in review**, stacked on 1.4d: the sidebar is
  always pinned at full height and only its nav list scrolls (replacing 1.4d item 5), with rows
  tightened so the admin nav fits at 1280×800; no "No history yet" beside running loans; the next
  deduction date follows the loan's schedule; the sign-in meter's colours and hydration. No
  migration.
  **Open chain, merge in order:** #24 (0.1) → #25 (0.2) → #26 (0.3) → #27 (0.4) → #28 (0.5) → #29 (0.6)
  → #30 (1.1) → #31 (1.2) → #32 (1.3) → #33 (1.4) → #34 (1.4a) → #35 (1.4b) → #36 (1.4c) → #37 (1.4d) → #38 (1.4e).
  **Next step: BUILD-PLAN 1.5**
  (not-found, error and loading-failure pages).
- **D038, Figtree's tabular figures: pass** (checked 23 Nov 2026, BUILD-PLAN 1.1). Money figures use
  Figtree; the Inter fallback is not needed and Inter is no longer loaded.
  - Chrome (desktop) and Android Chrome (Pixel 7 emulation): with `tabular-nums` all ten digits
    render at one width (spread 0px at 400, 500, 600 and 700; 12.7px spread without it); ₦111,111
    and ₦888,888 are the same width.
  - Safari: no WebKit build is available in agent sessions, so the font file was checked instead.
    The Figtree files (bundled in `src/app/fonts/` since D050, re-checked then) have an OpenType `tnum` feature that maps all ten digits to
    one advance in each weight (623 to 632 units, against nine different advances without it). Safari shapes from the
    same table, so the result does not depend on the engine. The owner may still want to glance at
    a rolling number on an iPhone.
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

To accept a built step:
- **R2 1.4c, the demo sign-in chips.** In Vercel → Settings → Environment Variables, on the
  **Preview** environment only: `NEXT_PUBLIC_DEMO_MODE=true` and the four demo accounts'
  `DEMO_EMAIL_*` / `DEMO_PASSWORD_*` (names in BUILD.md; mark the passwords Sensitive), then
  redeploy the Preview. Until then the chips stay hidden.
- **BUILD-PLAN 1.3, the Sheet on your own phones.** Open `/dev/components` on the PR's Preview on an
  iPhone (Safari) and an Android phone (Chrome): drag the sheet between half and nearly full, drag it
  away, tap outside, and press Android's back button. If dragging feels wrong on iOS Safari, the
  plan's fallback is `vaul`. A short screen recording from each phone goes in the PR.

Needed later, at the step named:
1. **Hero photos or a video** for the landing page: the owner picks from the shortlist PR 5.2 carries.
2. **A domain**, when the owner is ready: unlocks email, canonical URLs and cooperative self-signup.

## Decision and scope drift check

Before any session's work: re-read `DECISIONS.md` (at least D032 onward), this file, and the current
`BUILD-PLAN.md` step. If the code contradicts a Locked decision, that is a bug to fix, not a reason
to edit the decision. A deliberate change is a new dated entry.
