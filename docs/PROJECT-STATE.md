# PROJECT-STATE.md, Clarix

**Authority level: 3.** This is a **living document**, unlike every other file in `docs/`, it is
expected to change constantly. Update it at the end of every work session, and especially at
every milestone (an account created, a repo initialized, a schema pushed, a feature accepted). An
agent picking up this project cold should read this file first, right after `DECISIONS.md`, to
know exactly what already exists and what doesn't.

**Last updated:** 2026-11-22 (plan 1 of the Adire redesign is complete on branch
`claude/vigilant-mendel-xlrugr`: the light design system, logo set, SEO files, pricing logic and
the public marketing site, with a visual check that guards it).

## Redesign (started 2026-11-21)

The owner approved a full redesign ("Adire", light theme only) on 2026-11-21. Decisions D032 to
D039 in `DECISIONS.md` record it.

- **Spec:** `docs/superpowers/specs/2026-11-21-clarix-adire-design-system-design.md`
- **Plan 1 (done, awaiting merge):** `docs/superpowers/plans/2026-11-21-adire-foundation-and-landing.md`
- **Canvas:** https://claude.ai/artifact/EpN2uwZkXTKwzwLbZWBLe6
- **Hosting:** the Vercel project is now `clarix` on the owner's account, at
  https://clarix-orpin.vercel.app. The old `clarix-3w5i.vercel.app` belongs to the previous
  account and is no longer the live site.
- **GitHub:** the repository is now `Temi-daniel124/clarix`.

The seven plans:

1. Adire foundation and landing (public marketing site, tokens, logo set, SEO files).
2. Getting in: auth, invites, onboarding, self sign-up and verification.
3. Many organisations and income evidence (schema).
4. The member app.
5. The staff apps (officer, admin) and receipts.
6. Super admin and billing.
7. Statements, reports and exports.

Plans 2 to 7 are written after the previous one is approved and merged. The sections below
describe the app as it stood before the redesign.

### Plan 1 checklist (Adire foundation and landing)

- [x] **Task 1:** D032 to D039 recorded; the install repaired.
- [x] **Task 2:** light-only tokens, type (Mona Sans wide plus Figtree), radius, shadow and the
      one spring, in `src/app/globals.css`. No dark mode anywhere (D033).
- [x] **Task 3:** buttons and chips in the spec's hierarchy (primary, secondary, tertiary,
      destructive), all pills.
- [x] **Task 4:** the logo family, app icons and manifest.
- [x] **Task 5:** SEO files and per-page metadata (sitemap, robots, canonical and og:url per page,
      the OG image).
- [x] **Task 6:** pricing logic, `estimateBill` (D037), unit-tested.
- [x] **Task 7:** landing navigation and hero (photo carousel, floating product cards, 3D tilt).
- [x] **Task 8:** landing sections and footer.
- [x] **Task 9:** `/pricing`, `/for-members` and `/privacy`.
- [x] **Task 10:** `scripts/visual/check-marketing.mjs` (overflow, console errors, one primary
      per screenful, reduced-motion carousel) passing on a production build; `DESIGN_SYSTEM.md`
      now points at the Adire spec; blueprint §1.1 amended; D040 records the board-fidelity calls.

### What is left (plans 2 to 7)

2. **Getting in:** auth, invites, onboarding, cooperative self sign-up and Super Admin
   verification (D039). The sign-in and sign-up screens still carry the dark navy panel until
   this plan restyles them (spec §11.9).
3. **Many organisations and income evidence (schema):** employers as records, bank statements
   and the self-declared figure (D032, D038).
4. **The member app.**
5. **The staff apps (officer, admin) and receipts.**
6. **Super admin and billing** (trial, grace, read-only; D037).
7. **Statements, reports and exports.**

**Keep the privacy notice true as these ship.** `/privacy` has a "Coming soon, not in Clarix
yet" section (bank statements, the self-declared figure, repayment receipts, member numbers,
cooperative verification). Each item must move into the main notice, reworded as fact, in the
same pull request that ships it, chiefly in plans 2 and 3, and the "Last updated" date changes
with it.

## Phase

**Everything described below is on `main`.** The access-grant flow merged as pull request #11,
and Parts 1 to 4 of the follow-up work (the `/reset-password` and `/privacy` screens plus the
session hole found testing them, the payslip review window D031 opens, the roster-import and
deduction-policy verifications, and the em dash sweep) merged as #13. #12 carried those four
commits first and was closed automatically when its base branch disappeared on merging #11;
GitHub refuses to reopen a pull request whose base is gone, so the same commits were rebased onto
`main` with identical content and merged under the new number. Both feature branches,
`slice-16-access-grants` and `slice-17-auth-gaps`, are deleted. No pull request is open.

**Planning complete. Infra live. The employee blueprint is complete, Parts 1 to 6, every
screen built.** Landing page, auth, onboarding, the persistent navigation shell, the home-base
screens, the loan side with the reservation transaction that is the product's core mechanism,
and now the account cluster: Notifications, Profile / Settings and Help / Support. Every screen
has been walked in a browser against the live project, in both themes at both widths. There are
no holding screens left anywhere in the employee app.

**All of it is on `main`.** Until now every part lived on one long-lived branch,
`slice-01-foundations-auth`; pull request #1 merged it, `main` now carries the whole employee
app, and the branch is deleted. `clarix-3w5i.vercel.app` is served by a production deployment
off `main` rather than a Preview.

**The cooperative admin blueprint is complete, Parts 1 to 8, every screen built.** Parts 1 to 7
are on `main` already (pull requests #2 to #5, each merged after the pgTAP suites passed). Part 8
adds the account cluster: Notifications, Profile / Settings, the Cooperative Audit Log, and
Help / Support.

Both blueprints are now built end to end. What remains is not a part of either: loan completion
and the expiry sweep have no screen assigned yet, and Reports (7.6) is deferred by the
blueprint's own P1 marking rather than by omission.

**The product now does something it has never done before.** A reservation can become an active
loan or be turned down: the first transition past `reserved` anywhere in Clarix, and an
approval writes a real notification to the member, the first row anything has ever put in
`notifications` since D025 created the table. Walked end to end against the live project: an
approval on the admin side, and the member's own Notifications screen showing it unread a moment
later.

**The cooperative officer blueprint is complete, Parts 1 to 8, every screen.** Most of that role
was already standing: an officer works in the admin's own screens, and the difference is which
navigation they get, which controls appear, and what the policies let them write (D029). Parts 1
and 2 of that blueprint needed no new authentication code at all: a real officer invitation was
issued from the admin's own Officers screen, accepted through the existing invitation screen, and
the account landed on its own home. What was genuinely new is the two-slide orientation tour, the
officer's navigation, and Officer Home itself.

Two boundaries the officer blueprint exposed were missing and are now closed in the database
rather than in the interface: importing or adding a member takes a granted permission
(migration 017), and the audit log is the admin's alone to read (migration 018). Both were
previously open to any active staff member, which was invisible while officers had no screens.

**Every screen in all four blueprints is built.** Employee Parts 1 to 6, cooperative admin Parts
1 to 8, cooperative officer Parts 1 to 8, and super admin Parts 1 to 9, including the last and
most sensitive of them, the access-grant flow that is the only way a platform operator can ever
see a member's savings, loans or salary.

What remains is not a screen in any blueprint: loan completion and the expiry sweep have no
screen assigned, Reports (admin 7.6) is deferred by its own P1 marking, and submitting a loan
application on a member's behalf (officer 6.2) exists in no role.

Earlier in the same day, Parts 1 to 5 landed: The platform shell, its
one-screen orientation, the Platform Dashboard, and Cooperative Management in full: the
directory, a deliberately shallow detail screen, and creating a cooperative with its admin's
invitation in one action. Parts 6 to 9, Policy, the platform Audit Log, Access Requests,
Platform Admins and this role's own account cluster, are not built, and every one of them is a
navigation row that says so rather than a dead link.

**All four blueprints' earlier parts are now built end to end.** What remains is not a part of
the employee, admin or officer documents:
loan completion and the expiry sweep have no screen assigned, Reports (7.6) is deferred by the
blueprint's own P1 marking, and submitting a loan application on a member's behalf (officer 6.2)
is a screen neither role has. It is named in the permission panel as unavailable rather than
quietly dropped.

Reports (7.6) stays deferred, and that is the blueprint's own call rather than a gap: it is
marked P1 there.

## What exists today

- Full planning corpus under `docs/planning/`, and the governance doc set (`docs/DECISIONS.md`
  through `docs/TOOLING-POLICY.md`, plus `AGENT.md`, `CLAUDE.md`, `BUILD.md`, `SECURITY.md`,
  `DESIGN_SYSTEM.md`).
- **GitHub repository:** `github.com/Temi-daniel124/clarix` (private), default branch `main`.
  Commit identity verified per-session as Temi-daniel124 / temmydaniel124@gmail.com.
- **Vercel:** the project is **`clarix`** on the owner's (Temi-daniel124) Vercel account, and
  production is **https://clarix-orpin.vercel.app**, deployed from `main`; every other branch gets
  a Preview. The earlier `clarix_app` / `clarix-3w5i` projects and `clarix-3w5i.vercel.app`
  belong to the previous account and are no longer the live site, so mentions of them further
  down are history. `vercel.json` pins the framework preset to Next.js.
- **Supabase project `Clarix`**, ref `sxugaizwmqigtioqgefx`, linked locally (`supabase/.temp/`
  holds the link). The pre-existing unrelated project in the same organization is untouched.
  **Open item:** the region still needs recording in `docs/ARCHITECTURE.md`.

## What now exists (done in this session)

- [x] **Next.js app scaffolded**: Next 16 (App Router, Turbopack), TypeScript, Tailwind v4,
      `src/` layout, per `BUILD.md`. shadcn initialised on the **base-ui** base with
      `lucide` as its icon library, plus `motion`, `@supabase/ssr`, `zod`.
- [x] **Design tokens built exactly to `DESIGN_SYSTEM.md`** in `src/app/globals.css`: the full
      light/dark colour pairs, the eight-step type scale as `type-*` utilities with the correct
      mobile/desktop sizes, the card radius (14px mobile / 16px desktop / 20px feature), the one
      shadow elevation, and a global `prefers-reduced-motion` fallback. The shadcn/base-ui
      variables are remapped onto Clarix values so no borrowed component can render in preset
      colours. The one standard spring lives in `src/lib/motion.ts`.
- [x] **Signature motif primitives built**: `RollingNumber` (tabular digit columns on the one
      sanctioned heavier spring), `MeterBar` (committed / requested / overshoot in a single
      track) and `CapacityMeter`, which composes them with the eligible / not-eligible verdict.
      Everything showing a number against a limit goes through these.
- [x] **Eligibility arithmetic extracted and unit-tested**: `src/lib/eligibility.ts` implements
      Steps 1 and 2 of `docs/DATA-MODEL.md`; 19 Vitest cases pass (`npm test`), including the
      gross-vs-net divergence that motivates D007 and the `capOverride` path the loan
      application screen uses to preview against the cap the database computed.
- [x] **Three migrations written and applied to the remote `Clarix` project:**
      `20260911141652_init_core_identity_and_cooperatives.sql` (the six tables, their enums, the
      D009 reservation-ceiling trigger, 23 RLS policies, the signup trigger, and the seeded FMC
      Abeokuta organization row); `20260911141744_harden_function_privileges.sql`;
      `20260911144045_grant_table_privileges.sql`; `20260911211501_documents_and_payslip_storage.sql`.
      Local filenames were reconciled to the versions the database recorded, per D023, three
      had drifted, which is exactly the failure that rule exists to catch.
- [x] **FMC Abeokuta seeded**: `deduction_basis='gross'`, `deduction_max_percentage=33.30`,
      `employee_id_pattern='^[0-9]{6}$'`, `reservation_expiry_days_default=7`.
- [x] **RLS verified against the live project**, not just written: an officer of cooperative A
      sees only A's memberships, sees no B rows, cannot write into B, and `anon` reaches nothing.
      The same assertions are committed as pgTAP at
      `supabase/tests/001_rls_cooperative_isolation.sql` for CI.
- [x] **Screens built**: Landing Page (blueprint 1.1), Sign Up (1.3), Log In (1.4) and the
      Verify Contact screen (1.5) that Sign Up leads to. Sign Up creates a real Supabase auth
      user; the matching `public.users` row is created by a database trigger (D021), verified
      end-to-end against the live project.
- [x] **PWA**: manifest at `/manifest.webmanifest`, meter-ring app icons (standard and
      maskable), an app-shell service worker that never caches a financial figure, an offline
      fallback screen, and the install-prompt banner (blueprint 1.2) mounted on the dashboard
      route only.
- [x] **Three new decision entries**: D021 (credentials live in Supabase Auth), D022 (email-only
      authentication for v1) and D023 (agent-applied migrations go through the Supabase
      Management API; `supabase db push` remains the human path). `DEVELOPMENT-WORKFLOW.md` §2
      was rewritten to describe both paths rather than contradicting what actually happened.
- [x] **Local environment configured**: `.env.local` holds the Supabase URL and anon key only.
      The service-role, Resend and AI keys are deliberately absent until a code path needs them.
- [x] **Log In verified end to end in a real browser**: a confirmed test account signs in, the
      session cookie is issued, the dashboard server component reads that user's own `users` row
      under RLS and greets them by name. A signed-in session sees exactly one `users` row (its
      own) and zero memberships, which is the isolation behaviour the policies intend.
- [x] **Every screen reviewed by eye** at desktop (1280px) and mobile (390px) widths, in both
      light and dark mode, against `DESIGN_SYSTEM.md`'s checklist. Eight defects were found that
      the build, the type checker and the linter had all passed, and all eight were fixed:
      the rolling number's digits sat off the baseline and collided with the ₦ sign; the hero
      caption lagged a frame behind the meter it described; an over-cap request made the meter's
      segments overflow so flex silently shrank the committed portion; the hero card went
      near-black on navy in dark mode; the auth panel rendered near-black text on navy in light
      mode; every navigating button logged a base-ui accessibility error; the disabled primary
      button read as broken rather than unavailable; and the consent checkbox visually unticked
      itself after a failed submit while the form still considered consent given. Raw Supabase
      error text shown to employees was also replaced with plain-language wording.
- [x] **PWA install prompt verified working**. It now captures `beforeinstallprompt` from an
      inline script in the document, because Chrome fires that event before React hydrates and a
      listener registered in a component effect missed it entirely. The banner appears on the
      dashboard, never on the landing page, and a dismissal is honoured for a week.
- [x] **Deployed and reviewed on a Vercel Preview**, on branch `slice-01-foundations-auth`. Two
      further defects surfaced only there, neither of which any local check could have caught:
      a clean `npm install` failed because `create-next-app` pinned `@types/node` to 20 while
      Vitest 5 requires 22 or newer (the local lockfile had been built up incrementally and
      hid it), and the landing page rendered blank below the navigation for several seconds
      because the hero entrance was a Motion component, so the headline was server-rendered at
      opacity 0 and waited for hydration. The hero entrance is now a CSS animation on a server
      component whose resting state is visible.

- [x] **Landing page visual pass** (D017, P0). The nav is rebuilt from Watermelon's
      navigation-5, floating pill and mobile sheet kept, the four-column mega-menu cut as
      clarix-design-system.md § 4 instructs, fixed at page level, glass over backdrop-blur, and
      carrying the product's first colour-scheme control (light / system / dark, applied before
      first paint so there is no flash). The hero is rebuilt from hero-32: its staggered
      entrance kept, its four bespoke springs collapsed into the one Clarix spring expressed as
      a CSS `linear()` easing, and its sunflower photograph replaced by a composed backdrop of
      ledger rules plus one oversized capacity arc.
- [x] **Employee onboarding built** (blueprint 2.1–2.5): welcome tour, staff ID entry validated
      against `organizations.employee_id_pattern`, payslip upload to a private bucket, review
      and confirm, and cooperative discovery with apply. Walked end to end in a browser against
      the live project: a real file reached Storage under the employee's own folder, the
      `documents` row was written and confirmed, and `users.salary_gross` / `salary_net` /
      `salary_verified_at` / `salary_source_doc_id` all landed correctly.
- [x] **Migration 004** adds `documents`, `users.salary_source_doc_id` and the private
      `payslips` Storage bucket, with RLS and storage policies in the same migration. Payslip
      access is deliberately narrower than anything else in the schema, and that was verified
      against the live project rather than assumed: an officer at the member's *own* cooperative
      can read that member's `users` row, where the eligibility figures live, but cannot read or
      write the payslip document. Committed as pgTAP suite 002.

- [x] **Persistent navigation shell** (blueprint Part 3): sidebar on desktop, bottom tab bar on
      mobile, both generated from one destination list so the two cannot drift into separate
      information architectures. Notifications and Profile are direct sidebar rows on desktop and
      sit behind More on mobile, exactly as the blueprint splits them. It wraps every
      authenticated screen; the bare dashboard placeholder is gone.
- [x] **Dashboard** (blueprint 4.1), replacing the placeholder wholesale: greeting, the four KPI
      cards with tap-to-expand, the freshness line, the Insights strip, and the quiet
      browse-Discovery prompt. Available Capacity is the only card that expands into the meter,
      because it is the only one that is a number against a limit.
- [x] **My Cooperatives (4.2), Discovery (4.3) and the Cooperative Discovery Profile (4.4)**,
      the last with its Benefits-and-packages and Requirements-to-join sections and the real
      "Apply to join" action.
- [x] **Migration 005** adds `cooperative_loan_products` with RLS. Read access is deliberately
      wider than the rest of the schema and that is safe: a loan product describes what a
      cooperative offers, not what any member owes. Verified in the browser that the
      `is_public` policy genuinely filters: a cooperative's unadvertised product does not
      reach the profile screen, and no query filters for it.
- [x] **The two apply paths are now one.** Onboarding 2.5 used to create memberships inline
      because 4.4 did not exist; it now links into the real profile with `?from=onboarding`, and
      that screen offers a way back into onboarding rather than into the app.

- [x] **Navigation rebuilt to match the landing page.** The mobile bar is now a floating navy
      glass pill whose active tab widens to show its label, and the desktop sidebar is a navy
      rail that collapses to icons. Both use the one standard spring: the rail's width
      transition uses `--ease-spring`, which is that same spring solved as a CSS easing, so
      there is still only one motion vocabulary in the product. The rail's state is remembered
      per device.
- [x] **Dashboard given real hierarchy**: an identity mark built from the person's initial
      rather than a stock avatar (DESIGN_SYSTEM.md rules those out and D017 makes that binding),
      an organization and staff-ID line under the greeting, the KPI row grouped under its own
      heading with the freshness line attached, and a movement-over-time indicator on the cards
      where that question makes sense. No stock photography or decorative illustration was
      added.
- [x] **The trend indicator shows an honest empty state**, and now also shows real movement.
      When it was built `savings_transactions` did not exist, so every trend read "No history
      yet" rather than drawing a flat line or an invented climb. With Part 5 landed the savings
      card plots genuine month-end balances from the ledger, and any KPI still without history
      keeps the honest empty state instead of borrowing another card's shape.
- [x] **The KPI expand animation was diagnosed rather than re-tuned.** A single tap was starting
      four overlapping animation systems: a layout animation on the card (which fires on all
      four, since one card's span change moves every sibling), two more nested inside each card,
      and an AnimatePresence height animation fighting the parent's own resize. Up to twelve
      layout animations plus a height animation settled at slightly different moments, and that
      compounding, not the spring, is what read as bouncy. Now there is one layout animation
      on the card, `layout="position"` on its content so text moves rather than stretches, and
      a plain fade for the detail. Measured over 52 frames: a single 2.9% overshoot, settled by
      470ms, no oscillation. The expanded card also rises to the top of the grid, because a
      full-width item was otherwise splitting the row around itself.

- [x] **The reservation transaction is one Postgres function, and it was proven under real
      concurrency rather than asserted.** `submit_loan_application` takes
      `pg_advisory_xact_lock` on a key derived from the caller, recomputes committed obligations
      across every cooperative *inside* that lock, and either reserves or reports the exact
      shortfall. All in a single `supabase.rpc()` call, because the lock only serialises within
      one transaction and sequential client calls would not have it. Two independent clients
      fired it simultaneously against the live project: the first reserved 50,000 a month against
      an 83,250 cap, the second queued on the lock and recomputed, and it saw 33,250 available,
      the reduced figure rather than a stale 83,250. Exactly one reservation existed afterwards.
- [x] **`capacity_for_user` and `submit_loan_application` are `SECURITY DEFINER`**, which is
      D003's narrow cross-cooperative exception, and both are now named in SECURITY.md's
      elevated-privileges list with why RLS cannot express the aggregate. Each derives the caller
      from `auth.uid()` rather than an argument, returns only totals and a verdict, and
      `submit_loan_application` refuses any `membership_id` that is not the caller's own active
      membership. `loans` deliberately has no employee insert policy at all, so the locked
      function is the only path to a reservation.
- [x] **Migration 006** adds `loans` and `savings_transactions` with their RLS in the same file;
      **migration 007** adds the two functions. Local filenames were reconciled to the versions
      the database recorded, per D023. Both had drifted, again.
- [x] **Screens built**: Loan Application (5.5) with the live CapacityMeter readout that updates
      locally on every slider move and touches the database only on submit; Cooperative Detail
      (5.1); Savings Statement (5.2); Loan Detail (5.3); and the cross-cooperative Loans overview
      (5.4). Repayment progress is derived from ledger rows, never from elapsed time.
- [x] **The dashboard's loan figures are live.** Active Loans, Monthly Deductions and the
      committed half of Available Capacity now come from the same RPC the application screen
      uses, so the two screens cannot disagree. The stale "nothing is committed yet" insight,
      which kept rendering after loans existed, is gone.
- [x] **D024 records the two deliberate departures from `DATA-MODEL.md`**: loan repayments living
      in `savings_transactions`, and a lapsed reservation counting as uncommitted at read time
      rather than waiting for a sweep to rewrite its status.
- [x] **Concurrency committed as pgTAP suite 003.** It states plainly that pgTAP cannot open two
      parallel connections, records what the live parallel run proved, and asserts every figure
      that run produced, including a foreign `membership_id` being refused with `42501`.

- [x] **Notifications (6.1)**: the `notifications` table with the narrowest RLS in the schema
      (`user_id = auth.uid()`, select and update only, and deliberately no insert policy at all),
      the reverse-chronological list with its small unread dot rather than a badge count, rows
      that lead to whatever they concern, and "Mark all as read" as a real UPDATE so a backlog
      cleared on a phone is cleared on a laptop too. **This screen is genuinely empty in
      practice, and that is expected, not a bug**, every writer (loan approved or rejected,
      membership accepted, new package published) belongs to the cooperative admin/officer
      blueprint, which does not exist yet. No rows were seeded and none were invented, the same
      call already made for the dashboard's trend indicator. The empty state says why it is
      empty rather than saying "no data".
- [x] **Profile / Settings (6.2)**: an identity summary, then four sections that each save on
      their own with their own small confirmation: Personal information, Salary information,
      Security, and Notification preferences. Log out sits apart at the bottom in a muted style,
      because signing out of a device is ordinary and reversible and the danger tone belongs to
      things that cost money.
- [x] **The Reveal & Copy pattern is now built** (`src/components/clarix/reveal-copy.tsx`) and
      masks the confirmed salary figures until asked for. It did not previously exist anywhere in
      the product despite being an adopted pattern in `docs/planning/clarix-design-system.md`, so
      it was built once as a shared primitive rather than inline on this screen. The digits are
      absent from the DOM until revealed, so masking holds against a screen reader and a copy of
      the page source, not just against a glance.
- [x] **Changing a password asks for the current one first.** Supabase does not require that, an
      open session is enough, but an unattended unlocked phone is exactly the case where that
      default is too generous for a product holding salary data.
- [x] **Re-upload payslip** reopens the onboarding Upload/Review pair (2.3–2.4) scoped to
      updating: same components, no step indicator, inside the app shell, returning to Profile.
      The destination is an allowlist rather than a free-form redirect field.
- [x] **Help / Support (6.3)**: thirteen FAQ answers under "About my savings and loans" and
      "About my account", each describing what Clarix actually does (the 33.3% cap, what
      "reserved" means, that Clarix informs rather than approves, what a cooperative can and
      cannot see), plus a short contact form. No filler, and where the honest answer is "not
      yet" it says so.
- [x] **Migration 008** adds `notifications` with its RLS; **migration 009** adds
      `users.notification_preferences`, a jsonb column where a missing key means opted in.
      Local filenames were reconciled to the recorded versions, per D023.
- [x] **D025 and D026 were written before the migrations**, per the PLAN step in
      `docs/DEVELOPMENT-WORKFLOW.md`: D025 covers the notifications table and where preferences
      live, D026 settles the support address.
- [x] **The desktop rail is now sticky and full-height.** It previously stretched to the page
      rather than the viewport, so on a long screen its foot, including the appearance control
, sat below the fold. The blueprint calls this navigation persistent.

- [x] **The pgTAP suites have executed.** Pull request #1 ran
      `.github/workflows/db-tests.yml` for the first time: `supabase start`, `supabase db reset`
      and `supabase test db` on GitHub's runner, against a database built from nothing but the
      nine migrations. **4 files, 48 tests, all passing**, in 3m27s. Until then every assertion
      had only been checked by hand against the live project, which is a different thing from
      the migrations applying cleanly in order on an empty database.

      Two real defects stood in the way, both found by reading the workflow against the repository
      before opening the PR rather than by watching CI fail:

      1. **`supabase/config.toml` did not exist.** `supabase link` writes only `supabase/.temp`,
         so nothing in the repository told the CLI what to start. `supabase start` would have
         failed before reaching a single test. The file is now committed, annotated to say it
         describes the throwaway CI stack and nothing else, with its Postgres major version kept
         in step with the hosted project.
      2. **Suite 003 created an `auth.users` row after switching to the `authenticated` role**,
         which holds no privilege on that table. That insert would have failed on permissions and
         taken the "an employee cannot reserve against somebody else's membership" assertion with
         it. Both employees are now created in the fixture block while the session is still the
         migration-running superuser. No assertion was weakened to get the check green.

- [x] **Production environment variables confirmed against the live project.** They are
      Secret-type entries in Vercel, and `vercel env pull` returns their names with empty values,
      so they genuinely cannot be read back and compared. What settles it instead is a round trip
      through the deployed site: a signup submitted on `clarix-3w5i.vercel.app` for the existing
      test address appears in this project's own logs at 11:42:40 UTC as
      `POST /auth/v1/signup → 200` with the auth event `user_repeated_signup`. A wrong URL would
      have logged nothing here and a wrong anon key would have returned 401, so production is
      reaching project `sxugaizwmqigtioqgefx` with a working key. The probe wrote nothing: it is
      the existing-user path, `auth.users` still holds exactly one row, and its `updated_at` did
      not move.

- [x] **Cooperative admin Part 1**: Accept Invite / Set Password (1.1) serving both arrivals the
      blueprint describes: a brand-new account setting a password from an invitation link, and an
      existing account told plainly that the role has been added to it. Log In (1.2) is the *same
      screen and the same action* as the employee's, with one thing added, where it sends you.
      An active staff role goes to the cooperative, an unaccepted invitation goes to the screen
      that accepts it, everyone else to the employee dashboard. The PWA prompt (1.3) reuses the
      employee mechanic unchanged.
- [x] **A new app shell, not a variant of the employee one**: Home, Members, Loans and a Manage
      cooperative section that expands into six sub-items on desktop and folds behind More on
      mobile. Same tokens, same spring, same navy glass, same collapsible rail; a different
      information architecture, in its own destination list.
- [x] **Cooperative admin Part 2, the setup sequence**: an admin-specific three-slide welcome
      (2.1), the public profile with a live Discovery preview that renders from what is in the
      form rather than what was saved (2.2), loan products with progressive disclosure and an
      out-of-range warning drawn from what other cooperatives actually require (2.3), the roster
      import (2.4), and officer invitations (2.5). All four setup screens are the same components
      the permanent Manage screens use, which is what the blueprint describes: 2.2-2.5 are a
      first run through screens that live on as 7.1-7.4.
- [x] **The import reads the file in the browser and uploads nothing.** CSV and XLSX both, with
      no new dependency: the XLSX path unzips using the platform's own `DecompressionStream` and
      reads the two XML parts a roster needs. A member list is a file full of IPPIS numbers and
      balances, and `docs/TOOLING-POLICY.md` item 5 is explicit about what may see that.
      Column-matching, row validation, duplicate detection and the CSV reader are pure functions
      with 21 unit tests of their own.
- [x] **Migration 010** adds `staff_invitations` and `member_roster_entries` with their RLS, two
      `SECURITY DEFINER` functions for inviting and claiming, and the trigger that turns a roster
      entry into a real membership. pgTAP suite 005 covers all of it. Local filenames were
      reconciled to the recorded versions, per D023.
- [x] **CI caught a real defect on suite 005's first run, and migration 011 fixes the cause.**
      Migration 010 activated an imported member from a BEFORE INSERT trigger. A policy's
      WITH CHECK is evaluated after BEFORE-triggers have had the row, so the trigger rewrote it
      into exactly the shape `cooperative_memberships_insert_own_pending` refuses: an employee
      on a roster could not join their own cooperative at all. The live check in the previous
      session missed it because the import inserts memberships as staff, where the staff policy
      permits any status; only the employee path fails, and only CI exercised it. Activation now
      happens in the AFTER trigger, where it belongs: the insert lands as `pending` exactly as
      the policy intends, and activating an imported member is a system action rather than
      something the applicant asserted. No assertion was weakened. **5 files, 60 tests, passing.**
- [x] **`cooperative_staff_roles`'s existing policies were checked rather than assumed**, which
      is why no new policy was written for them: migration 001 already had an admin-only insert,
      an admin-only update, and a separate policy letting an invited person move their own row
      from `invited` to `active` and nothing else. That is exactly the access pattern Part 1
      needed.
- [x] **The service-role key is still unused, and now by decision** (D027). Supabase's admin
      invite API was the obvious path and would have made an invitation the first thing in this
      codebase holding a key that bypasses RLS on every table. Two narrow functions cost less.

- [x] **Cooperative Dashboard (4.1)**: the same tap-to-expand KPI row as the employee
      dashboard, through the same component, over four figures about the cooperative: members,
      savings held, active loans, and what is waiting on a decision. Then the section the
      blueprint calls this screen's defining feature, "Attention required", and a short read on
      the month. The setup checklist stays above it until setup is finished, which is what
      blueprint 2.1 promises anyone who skips it.
- [x] **Attention required shows its honest empty state.** At the one cooperative this admin
      oversees, no loan application has ever been submitted, so nothing is pending, and the
      section says so rather than being seeded with a fake item to look populated. What it does
      surface is real: a member imported without a name. The same call as the trend indicator and
      Notifications.
- [x] **Member management (5.1 to 5.4)**: the always-visible search and full list, including
      roster entries marked "Not on Clarix yet" and deliberately not dressed as links; the member
      profile with its four tabs; adding one person by hand, which writes the same roster row the
      import does; and recording a contribution, withdrawal or repayment.
- [x] **The staff view of capacity is the member's own calculation, not a second one.** Migration
      012 moves the arithmetic into `capacity_core()` and gives it two doors:
      `capacity_for_user()` keeps its exact signature for the member, and
      `capacity_for_membership()` is the staff door, which refuses unless the caller is active
      staff at that membership's cooperative. Member Profile renders it with the *same*
      CapacityMeter the member sees. Verified against live data: an 83,250 cap, 40,000 committed
      across two cooperatives, 43,250 available, identical figures on either side.
- [x] **`savings_transactions` needed no new policy**, which was checked before anything was
      written: `savings_transactions_insert_staff` from migration 006 already lets a
      cooperative's active staff record against any membership at that cooperative. Same outcome
      as the `cooperative_staff_roles` check behind D027: the policy was already right.
- [x] **The savings balance now follows the ledger** (migration 012). It had been two independent
      facts kept in step by whoever wrote them; recording became routine with 5.4, so a balance
      that could disagree with the entries behind it stopped being tenable.
- [x] **Imported opening balances became ledger entries** (migration 013). Reviewing 5.2 by eye
      showed the seam those two changes left: a member with 145,000 and "nothing recorded yet"
      beneath it. Worse, the first contribution recorded against them would have recomputed the
      balance from a ledger holding only that contribution, silently erasing the import. Every
      unexplained balance was backfilled with one entry saying what it is, and the roster-link
      trigger now writes that entry rather than setting a bare number.
- [x] **pgTAP suite 006** covers all of it: both doors agreeing on one figure, the staff door
      refusing a membership at another cooperative, the balance following contributions,
      withdrawals and repayments correctly, the pre-existing insert policy refusing a foreign
      membership, and an imported member arriving with their balance explained.

- [x] **Loan management (6.1 to 6.4)**: the queue, oldest first, each card carrying the
      eligibility answer at a glance and flagging a reservation close to lapsing; the review
      screen; the active-loans list with repayment progress drawn from money that actually
      arrived; and the admin's view of one loan. The review screen shows the *same* CapacityMeter
      the member saw when they applied, because it is the same calculation, and beside it, the
      cooperative's own savings-ratio rule, which is a separate question that can disagree with
      the first.
- [x] **`audit_log` is built** (migration 014), which the blueprint had been quietly assuming
      since 5.4. Scoped to what Part 6 needs, actor, action, target, old and new value, and the
      note, with RLS that lets a cooperative's staff read their own entries and **no insert,
      update or delete policy at all**: it is written only by SECURITY DEFINER functions, so
      append-only means append-only. Reading it back (the Audit Log screen, 8.3) stays deferred,
      because recording a decision is urgent and reading the record is not.
- [x] **The over-cap note is enforced by the database, not the form.** Approving beyond what is
      left of a member's limit is allowed. Clarix informs, it never gatekeeps a cooperative's
      own decision, but `decide_loan_application` refuses it without a reason, and the reason
      lands in `audit_log.note`. The outcome ruled out was asking for a justification and
      dropping it on the floor.
- [x] **One function makes the whole decision** (migration 014): the loan's status, the audit
      entry, the member's notification, and the reason. Two of those tables accept no client
      write by design, so a single SECURITY DEFINER function is what keeps them closed and the
      set atomic. It also refuses an officer whose permissions do not include approving loans,
      which is the first time the preset from blueprint 2.5 actually bites.
- [x] **Rejecting releases the hold immediately.** A rejected loan counts towards nothing, so the
      member's capacity is free for their other requests the moment it commits, proven in pgTAP
      suite 007, which watches the figure fall and come back.
- [x] **The Timed Undo runs before the write, not after it.** Approve or Reject starts an
      eight-second countdown during which nothing has reached the database and the member has
      been told nothing, so undo genuinely undoes rather than compensating for something already
      done.
- [x] **The dashboard's Attention items open the review screen directly**, replacing the
      member-profile link that stood in honestly while 6.2 did not exist.
- [x] **A notification said "120,000" with no currency**, caught on screen during that walkthrough
      and fixed in migration 015. On a product whose whole subject is money, a figure without its
      currency is a small dishonesty about what the reader is looking at.
- [x] **pgTAP suite 007** covers who may decide, what approving and rejecting do to capacity, the
      notification and audit rows, and the over-cap refusal with and without a reason.

- [x] **7.3 and 7.4 were already permanent, and that was verified rather than assumed.** Public
      Profile Editor and the ongoing Member Roster Import are real routes under Manage
      cooperative (`/admin/manage/profile` and `/admin/manage/import`), rendering the same
      components the setup sequence uses without the wizard chrome, which is what the blueprint
      describes: 2.2 and 2.4 are a first run through screens that live on as 7.3 and 7.4.
- [x] **Officer Management (7.2) is now the fuller screen the blueprint describes**, not the
      lightweight invite form setup gave it: every officer opens into a panel with individual
      permission toggles, an editable cosmetic title, and removal behind a Timed Undo. The invite
      form from 2.5 sits beneath it, which is still the right thing for adding somebody new.
- [x] **The permission toggles change what the database permits.** This is the part that made it
      more than UI work: `permissions` was a jsonb column only one flag had ever been read from.
      Migration 016 adds `staff_has_permission()` and rewires the policies behind seeing members
      and recording entries, so switching off "see the member list" means Postgres refuses the
      rows. A switch that moved a stored value without moving a boundary would read as a control
      and behave as a label.
- [x] **The change reached further than intended, and CI is what said so.** Three older
      assertions failed: an officer with an empty permissions object now sees nothing. That is
      the change working, not a regression, but it also surfaced that the `users` policy reaches
      members *through* `cooperative_memberships`, so gating that table also gates reading a
      member's own record. Coherent, and worth writing down: "can see the member list" means "can
      see member records". No assertion was weakened; each suite now gives its officer the
      permission that gets them to the boundary under test, because an officer who can see
      nothing proves nothing about boundaries.
- [x] **Default-deny, with admins exempt.** An officer starts with nothing; an admin passes every
      check implicitly, per `docs/DATA-MODEL.md`, which is what stops an admin locking themselves
      out of their own cooperative with a mis-tap. No officer exists anywhere yet, so default-deny
      cost nobody their access.
- [x] **Removal revokes rather than deletes**, keeping who granted the role and when, and it
      touches nothing else that person holds, because every relationship in Clarix is scoped to
      its own cooperative.
- [x] **Monthly Reconciliation Entry (7.5)** with the period selector, the expected-versus-received
      table, per-row saves as each figure is entered, and an automatic shortfall flag. The
      shortfall is arithmetic where it is displayed, never a third stored number that could
      disagree. The expected figure IS stored, because what was expected at the time is the fact
      worth keeping: a loan completed since must not rewrite last month's history.
- [x] **Migration 016** adds `deduction_reconciliation`, specified in `docs/DATA-MODEL.md` from
      the start and never migrated until now, with RLS that lets a cooperative's staff read their
      own rows and the member read their own months. pgTAP suite 008 covers the permission
      boundary and the table.

- [x] **Notifications (8.1) is the employee screen's component over the same query.** One
      notifications table, one read-and-mark-read pattern, one unread dot: a second list UI would
      have been two things to keep in step for no gain. Nothing writes an admin-facing
      notification yet and the screen says so rather than being padded: the only writer,
      `decide_loan_application`, notifies the member whose loan was decided. What an admin needs
      today is on the dashboard, where Attention required already lists it.
- [x] **Cooperative Audit Log (8.3) reads the real table**, scoped by policy to the admin's own
      cooperative, with the date-range, action and search filters the blueprint asks for. It
      already has something to show: the approval walked through last session. Entries carry the
      old value beside the new: a log that only names its events is one you can count, not one
      you can review.
- [x] **Fields that only exist after an action are shown as context, not as changes.** Drawing
      `over_cap` or `available_before` with an arrow from nothing would invent a "before" that
      never existed. Caught by looking at the screen, and fixed in the reader rather than by
      changing what is recorded.
- [x] **Profile / Settings (8.2)**: the same three sections as the employee's, through the same
      components and the same server actions, deliberately without a salary section: being an
      admin does not imply being a beneficiary member anywhere. An account that also holds
      memberships gets the "Switch to my member view" link the blueprint describes, which is the
      multi-role model made visible rather than explained.
- [x] **Help / Support (8.4)**: fifteen answers under Managing members, Loans and eligibility,
      and Cooperative settings, each describing what an admin can actually do today, plus the
      same contact form and the same provisional support address (D026). Where the honest answer
      is that something is not built, correcting a recorded figure, marking a loan repaid, it
      says so.
- [x] **The audit log's read scope is covered by pgTAP** (suite 007, extended): a cooperative's
      own staff read their own entries, and nobody else reads any of it, including the member
      the entries are about, because this is a staff record.

### Cooperative officer, Parts 1 to 4

- [x] **Accept Invite (1.1) and Log In (1.2) needed no new code, which was checked rather than
      assumed.** `staff_invitations` and `invite_cooperative_staff()` were written generically by
      role from the start. An officer invitation was issued from the admin's own Officers screen
      (7.2), and because that email already had an account the function took its existing-account
      branch and wrote a `cooperative_staff_roles` row at `invited`: exactly the case the
      officer blueprint describes. Signing in routed straight to the invitation screen, which
      showed "Welcome back. This invitation is on your account", named the cooperative and the
      title the admin had set, and activated the role on one tap. The only change was where it
      leads afterwards: a brand-new officer account now goes to the tour, an existing one goes
      straight to Officer Home, per blueprint 1.1.
- [x] **Welcome to Cooperative Officer (2.1)** at `/officer/welcome`: two slides rather than
      three, no "skip setup" language because there is no setup to skip. Slide one is assembled
      per person rather than per role: it lists what this officer has actually been granted, and
      says so in plain words. An officer granted nothing is told that plainly instead of being
      shown an empty promise.
- [x] **The officer's navigation (Part 3)**: Home, Members, Loans, and the account cluster, with
      no "Manage cooperative" section and no audit log anywhere. "Import members" appears as a
      direct row only when `can_import_members` is granted. Verified as a real officer: the
      sidebar carried three primary rows plus Notifications, Profile and Help, More showed only
      the Account group, and the import row appeared the moment the permission was switched on.
- [x] **Officer Home (4.1)**: a greeting, then a persistent search field above everything else,
      because finding a member fast is this role's most common single action. Below it a pending
      task list that adapts: an officer who can decide loans sees the applications waiting, one
      who cannot is told what would appear there and why nothing does. Then a light "Today"
      strip, members this officer recorded against today, applications the cooperative received
      today, rather than the admin's cooperative-wide figures.
- [x] **Every screen an officer may not use turns them away, not just the menu.** `/admin/manage/*`
      and `/admin/audit` redirect to the officer's home, and `/admin/members/new` to the member
      list. Checked by requesting each URL directly while signed in as an officer.
- [x] **Two boundaries the blueprint exposed are now in the database.** Migration 017 makes
      writing a roster entry, importing, or adding one member, take `can_import_members`, which
      had been available to any active staff member. Migration 018 makes the audit log readable by
      that cooperative's admin alone, which blueprint 5.4 states outright. pgTAP suite 009 covers
      the first, and suite 007 was extended for the second.
- [x] **RLS was checked against the live project, not just in CI.** Acting as the real officer
      account, an import was refused with `42501` while the member list stayed readable and the
      audit log returned nothing.

### Cooperative officer, Parts 5 to 8

- [x] **Parts 5, 6 and 7 are the admin's own screens, gated three ways.** Every action was walked
      as a real officer: Add member and the import entry appear only with `can_import_members`,
      Record contribution and Record repayment only with `can_record_savings`, Approve and Reject
      only with `can_approve_loans`. Members and Loans leave the navigation entirely without
      `can_view_members`, because both read through `cooperative_memberships` and would otherwise
      be two tabs that always open onto nothing.
- [x] **Every one of those screens also turns an officer away by URL**, and the database refuses
      underneath. Probed as the real officer account: an import raised `42501`, and both
      `decide_loan_application` calls were refused with the same sentence the screen shows, while
      the application itself stayed readable, which is correct, since reading is what the
      blueprint gives every officer who can see members.
- [x] **Recording a repayment shares one permission with recording a contribution**, which was
      checked rather than assumed. `savings_transactions_insert_staff` never looks at the row's
      type, so both are `can_record_savings`, exactly as both blueprints describe. pgTAP suite 008
      now pins that: a repayment is refused without the permission and lands with it, and it does
      not move the savings balance.
- [x] **An officer's decision was taken end to end, with the permission granted through the real
      Officer Management screen and set back afterwards.** The approval moved the loan to active,
      wrote the member's notification, and wrote an audit row naming the officer as the actor,
      then that same officer could not read the entry they had just caused, while the admin could.
      That is officer blueprint 5.4 ("written regardless of which role recorded it, even though
      only an Admin can later view that log") demonstrated rather than asserted.
- [x] **Notifications (8.1) needed no new code**: the same table, query and component every role
      shares, scoped by who a notification is addressed to rather than by any role. Only the empty
      state is role-aware, because the events an officer is waiting for are different ones.
- [x] **Profile (8.2) gained the one genuinely new piece:** a read-only "Your role at
      [Cooperative]" panel carrying the title the admin set and a plain-language list of what is
      currently granted. Nothing ungranted is shown crossed out or greyed. It is simply absent,
      and a line underneath says who decides. Reviewed in both themes.
- [x] **Help (8.3)**: ten answers under the two categories the officer blueprint names, none of
      them about a screen this role cannot open, and each honest where the answer is that
      something is not built. Same contact form, same provisional support address (D026).
- [x] **A real bug was found and fixed while verifying this.** `cooperative_staff_roles` has two
      foreign keys into `users`, `user_id` and `granted_by`, so the unqualified `users(...)`
      embed the officer queries used was ambiguous and PostgREST refused the whole request. The
      refusal arrived as an error with null data, which `data ?? []` turned into "nobody works on
      this cooperative yet": a wrong answer that looked exactly like a right one, and which had
      been shipping since Part 2 unnoticed because there were no officers to miss. The embeds now
      name their foreign key, and those loaders throw on a query error rather than returning an
      empty list.

### Super Admin, Parts 1 to 5

**Two findings came out of checking before building, and both were real:**

- [x] **`platform_admins` existed and had never been seeded.** The table, `is_platform_admin()`,
      and four policies that depend on it have been in the schema since migration 001. What was
      missing was any row at all: the "one-time seed step" blueprint 1.1 describes had never
      happened, so the entire Super Admin role was unreachable and had been since the project
      started. Seeded this session with a test account.
- [x] **Every figure Parts 4 and 5 ask for was unreadable by this role.** A Super Admin can read
      `cooperatives`, because that policy is open to any signed-in user, and nothing else the
      screens need: memberships take a cooperative permission, staff roles and invitations take
      being staff there, and another person's `users` row takes staffing a cooperative they belong
      to. Member counts, officer counts, the admin's name and the pending-invite count would all
      have come back empty. Fixed with two aggregate-only functions rather than a policy exception
, see below.

**Built this session:**

- [x] **Log In (1.1, 1.2) needed no new code.** Signing in as the seeded account routes to
      `/platform`, because `landingPathFor()` now checks the platform flag first: operating the
      platform is this account's primary purpose "even if this account also happens to hold an
      ordinary cooperative membership or staff role somewhere". The PWA prompt (1.3) is the same
      component every other role uses.
- [x] **Welcome (2.1)**. One screen, one Continue button, no slides, because this role belongs to
      the operator "who already understands the product deeply". Its only job is the boundary: this
      account manages cooperatives, not their members' money.
- [x] **The navigation (Part 3) is flat, and the flatness is the design.** Eight direct rows, no
      "Manage" submenu and no collapsible rail, per the blueprint's own reasoning that this role's
      scope "is small enough that everything fits as a direct, visible entry". Nothing in it
      reaches a member's savings, loans or salary.
- [x] **Platform Dashboard (4.1)**: the same tap-to-expand KPI row every dashboard uses, over four
      counts rather than money. The employee figure is organization-wide headcount and can only
      ever be a count: the function behind it returns a single integer, so there is no version of
      that card that becomes a directory of people. "Attention required" watches invitations and
      says plainly that access requests are not built rather than implying it watches them.
- [x] **Cooperative Directory (5.1), Detail (5.2) and Create (5.3)**, walked end to end against the
      live project: a cooperative was created, its note stored, its admin invitation issued, and it
      was deactivated and reactivated through the Timed Undo, which runs before the write, so the
      undo genuinely undoes.
- [x] **5.2 has no view-members or view-loans action, and that absence is load-bearing.** Verified
      by eye rather than assumed: the screen carries counts and a status, and there is nothing on
      it to click through to a person. Reaching that data stays with the Part 7 access-request
      flow, which does not exist.
- [x] **Creating a cooperative reuses the real invitation path.** `invite_cooperative_staff()`
      already did exactly what 5.3 needs; what it refused was the caller, since a Super Admin
      creating a brand-new cooperative can never be its active admin. Migration 019 widened that
      one check to admit a platform admin. One function, two legitimate callers, rather than a
      second invitation path for D027 to drift away from.
- [x] **Two fields the blueprint asks for had nowhere to live, and neither was quietly dropped.**
      The operator's internal note now has its own platform-admin-only table (migration 021, after
      migration 020 put it on `cooperatives` and that proved unscopable: the cooperatives row is
      readable by every signed-in user and RLS cannot hide one column). The intended admin's name
      is kept on the invitation (migration 022), so a freshly created cooperative reads as
      somebody's in the directory rather than nobody's while the invitation sits unaccepted.
- [x] **The boundary was checked from both sides.** As a cooperative admin, every `/platform` route
      redirects away, and both aggregate functions raise `42501`. As the platform admin, the
      directory returns a member count of 1 for a cooperative whose membership rows the same
      caller reads as zero. pgTAP suite 010 pins all of it.

### Super Admin, Parts 6 to 9

**A correction to the entry above, since the previous session's checklist was incomplete:**
Notifications (9.1) and Profile (9.2) were written as **working screens** in that session, not
routing placeholders: 9.1 over the shared notification loader and list component, 9.2 over the
same three forms and server actions every role's Profile uses. The checklist simply failed to
mention them. Both have since gained what they were missing: 9.2 now carries the
"switch to my other view" link the blueprint asks for when the account holds another relationship.

- [x] **Deduction Policy Settings (6.1)**: a form over four organization columns that were
      already seeded and had never been editable by anything. `organizations_update_platform_admin`
      has permitted this since migration 001; no screen had ever offered it.
- [x] **The confirmation on 6.1 is a step, not a toast.** Changing the basis or the percentage
      replaces the save button with a panel naming the consequence and showing the old value struck
      through beside the new one, and the commit button says what it commits to. The server refuses
      the write without the confirmation flag, so the friction cannot be posted around either.
      Walked end to end: the cap was moved to 30%, confirmed, verified in the database, and
      restored to 33.3% the same way.
- [x] **Platform Audit Log (7.1)**: built this session because it turned out not to depend on
      anything Part 7 introduces. `audit_log.cooperative_id` has been nullable since migration 014,
      so a platform event was always storable; what was missing was a policy that could read one
      and a function that could write one.
- [x] **The two audit logs cannot leak into each other.** `audit_log_select_platform` admits a
      platform admin to rows with no cooperative and nothing else, and `record_platform_event()`
      hard-codes `cooperative_id` as NULL so it can never forge an entry into a cooperative's log.
      Verified live: the operator sees the platform's events and zero of the cooperative's.
- [x] **Cooperative creation, activation, deactivation and invite reissues now record themselves**
      in that log, which is what 7.1 lists as platform events.
- [x] **Manage Platform Admins (8.1)**: a list, an add-by-email action, and removal through the
      Timed Undo pattern. Deliberately **not** `invite_cooperative_staff()`: a platform admin is not
      cooperative staff, lives in a different table, and is scoped to no cooperative.
- [x] **The self-removal safeguard is enforced in the database.** `revoke_platform_admin()` raises
      `42501` on the caller's own id, so the rule holds however the call is made; the screen also
      omits the control on your own row, but that is only a courtesy. Verified by calling the
      function directly on the operator's own account and being refused.
- [x] **Help (9.3)**, and the navigation row that was missing. Part 3 lists Help among this role's
      destinations and the sidebar built last session did not have it. Four reference notes rather
      than an FAQ accordion, per the blueprint's read of who actually holds this role, plus the
      shared support address.
- [x] **pgTAP suite 011** pins the log separation, the grant and revoke round trip, the honest
      refusal when an address has no Clarix account, and the self-removal safeguard.

### Super Admin, Parts 7.2 and 7.3: the access-grant flow

The last screen in any blueprint, and the only mechanism in Clarix that deliberately crosses the
"no standing sight of member data" line. SECURITY.md names five properties it must have and adds
that a version missing any of them "is a security bug, not a shortcut"; each is built, and each was
verified against the live project from both directions.

- [x] **The self-activation question was settled by the data model, not guessed.** `access_grants`
      has `requested_by`, `granted_at`, `expires_at` and `revoked_at` and **no approver column at
      all**: a schema describing a flow with no approver. D030 records that reasoning, the
      one-hour delay, the 24-hour window, and why an approval gate would fail in exactly the case
      this mechanism exists for.
- [x] **No access without a live grant, enforced by RLS rather than by an absent menu.** Probed as
      the seeded operator: zero membership rows, zero savings rows, and `capacity_for_membership()`
      refusing outright. With a grant live, the same queries return the real rows and the real
      capacity figure.
- [x] **Real policies on real tables, not another aggregate.** Five select policies, each asking
      `has_active_access_grant()`. Parts 4 and 5 avoid member rows on purpose; this is the one
      place where the honest answer is to open the row, deliberately and briefly.
- [x] **Read-only in the database.** No insert, update or delete policy is granted to a grant
      holder anywhere. Verified: an insert under a live grant raised `42501`, and an update changed
      zero rows. The view rendering no write controls is the cosmetic half.
- [x] **The cooperative's admin is notified at submission, inside the same function**, so no path
      can create a grant without the notice. It uses a new `access_request` notification category
      which is deliberately the only one with no mute toggle.
- [x] **Expiry is arithmetic, not a sweep.** `has_active_access_grant()` compares against `now()`,
      and `status` never stores `'active'` or `'expired'`. Verified by moving a grant's window into
      the past: the rows became unreadable immediately and the Elevated Access View redirected back
      to Access Requests on the next request, with nothing having run.
- [x] **Every record opened is logged into the cooperative's own audit log**, where its admin reads
      it, not the platform's, where only the person who looked could. Verified: the cooperative
      admin sees the `elevated_view` row, the reason, the grant and the notification.
- [x] **The Elevated Access View is the real Member Profile** under a sticky, non-dismissible amber
      banner carrying the reason and a live countdown. Reviewed in both themes. It reuses
      `MemberProfileView` and `loadMemberProfile()` rather than a read-only copy, so what the
      operator sees cannot drift from what the cooperative sees.
- [x] **One copy bug found and fixed while reviewing.** A lapsed grant that had named one member
      described itself as covering the whole cooperative, because the wording keyed off the
      member's *name*, which stops being readable the moment the grant lapses. It now keys off the
      grant's own column and says "one member at …" when it cannot name them.
- [x] **pgTAP suite 012** covers all four properties asked for: no access without a grant, access
      ending at read time with no sweep, the granular per-record logging writing rows, and the
      cooperative admin's notification firing on submission.

### Auth gaps closed: password reset and the privacy notice

- [x] **`/reset-password`**, both halves: ask for a link, and the screen the link lands on. Thin
      over Supabase's own `resetPasswordForEmail` and `updateUser`, because Clarix never holds a
      password of its own (D021).
- [x] **The request screen never says whether an address has an account.** It reports the same
      thing either way, for the same reason the sign-in screen refuses to distinguish a wrong
      password from an unknown address: a form that answered honestly would tell anybody who asked
      which of a cooperative's staff use Clarix.
- [x] **A real hole was found and closed while testing it.** The first build of the confirm screen
      accepted *any* live session, so anybody already signed in could set a new password without
      knowing the current one, quietly undoing the check the Profile security section makes on
      purpose. I hit this by accident, on a session left over from an earlier test. The token
      exchange now also writes a short-lived, http-only, single-use ticket cookie, and the server
      action refuses without it. Somebody who is merely signed in is sent to Profile, where
      changing a password asks for the old one. Verified: `/reset-password/choose` redirects a
      signed-in visitor to `/profile`.
- [x] **The flow cannot complete end to end yet, and it is not this code's fault.** Supabase's
      `/auth/v1/recover` returns `500 Error sending recovery email` for any address but the Resend
      account owner's, and rolls the token back: the same blocker that already stops self-service
      signup. Probed directly to confirm it rather than inferring it from an empty token column.
      The screen says so plainly instead of implying a message is on its way.
- [x] **Change password, while signed in, reconfirmed end to end.** Changed the platform operator's
      password through Profile, verified the new hash in the database, and changed it back the same
      way. The current-password check is real: it re-authenticates before allowing the change.
- [x] **`/privacy`**: a complete NDPA 2023 notice written against what this system actually does.
      Names consent at signup as the lawful basis, lists what is collected and why, describes the
      per-cooperative isolation, the aggregate-only cross-cooperative figure and the logged
      access-grant model, and gives the D026 support address as the contact route. Where Clarix
      does not do something it says so: there is no automatic deletion on a schedule, and the
      notice admits that rather than describing a retention policy nobody implemented.

### The payslip fraud gap, closed (D031)

The salary figure every eligibility calculation in Clarix rests on is **self-reported**: a member
uploads a payslip, confirms the numbers on a review screen, and those numbers become the deduction
cap every cooperative then lends against. Migration 004 scoped payslips to the uploading employee
and nobody else, which was right for what it considered and left nobody able to compare the
confirmation with the document. A member who overstated their gross pay raised their own cap, and
the cooperative approving money against it had no way to notice.

- [x] **Scoped to the review, not granted generally.** Three conditions hold at once or the window
      is shut: an application still awaiting decision at that cooperative, the permission to decide
      it, and the document being the salary evidence rather than any file the member ever uploaded.
      All three live in one function, `payslip_under_review()`, so there is one definition rather
      than two that could drift.
- [x] **Both halves, row and file.** A policy on `documents` and another on `storage.objects`. A
      reviewer who could see the metadata but not open the file would be the worst of both.
- [x] **Read-only.** No insert, update or delete policy for a reviewer anywhere. pgTAP asserts that
      an attempted write leaves the document untouched.
- [x] **The window closes by itself**, with nothing having to run: expiry is arithmetic against
      `now()`, as everywhere else (D024).
- [x] **Verified live, in four directions.** The reviewing admin sees the document while an
      application waits; the platform operator sees nothing at the same moment; the same admin sees
      nothing once the application is decided; and in the browser the evidence panel is present
      during review and gone afterwards. A signed URL was issued and lasts sixty seconds.
- [x] **pgTAP suite 002 was rewritten rather than widened.** It keeps its original assertion, that
      an officer who may see members cannot reach a payslip, because D031 deliberately leaves that
      true. What it gains is the shape of the doorway: the permission alone opens nothing, both
      together open it, the read is read-only, and the decision closes it.
- [x] **The reviewer sees the confirmed figures beside the document**, which is the point of the
      panel: the comparison, not the link.
- [ ] **Periodic re-verification of an aging payslip is explicitly deferred** (D031). A salary
      confirmed two years ago is weak evidence regardless of who can read it, and prompting for a
      fresh one on a schedule is a real control worth having later. It is not what closed this gap.
- [ ] **Automatic extraction and machine verification stay P1-deferred** where `docs/MVP-SCOPE.md`
      already puts them. D031 deliberately does not touch them.

### Two things checked rather than assumed

**The roster import against a real cooperative's spreadsheet.** Extra columns were never the
problem: the importer maps by header name and reads only the columns it mapped, so a five-column
or thirteen-column sheet works and everything else is ignored. Ragged rows, where trailing blanks
leave a row shorter than the header, are also safe.

What the check did find was worse than a crash, because it was silent:

- [x] **"Loan Balance" was being imported as the savings balance** whenever it sat to the left of
      the savings column and no exact synonym matched. The old matcher took the leftmost header
      containing any synonym, and "loan balance" contains "balance". Every member's debt would have
      been recorded as their savings.
- [x] **"Next of Kin Name" was being imported as the member's name**, for the same reason.
- [x] **Fixed two ways at once.** A disqualifier list means a header containing "loan",
      "outstanding", "repayment", "kin", "bank" and so on is never *guessed* at for the field it
      would corrupt, though an admin can still choose it by hand. And among the headers that
      survive, the **longest** matching synonym wins rather than the leftmost column, so
      "Contributions To Date" beats "Loan Balance" wherever the two sit relative to each other.
- [x] **Both are now permanent regression tests** in `src/lib/roster/mapping.test.ts`, alongside the
      five- and thirteen-column sheets and the ragged-row case. 27 tests pass.

**The deduction policy propagates instantly, with nothing cached or duplicated.** There is exactly
one copy of these values, the `organizations` row. Every reader joins it at query time:
`capacity_core()` and both halves of `submit_loan_application()` in SQL, and the employee
dashboard's loader in TypeScript. Nothing denormalises it onto a user, a cooperative or a loan, and
there is no `unstable_cache`, no fetch revalidation and no route cache in front of it: the screens
that show eligibility are all `force-dynamic`.

- [x] **Verified live, twice.** In SQL, `capacity_for_user()` for a real member returned a cap of
      ₦83,250 at 33.3%, ₦62,500 the moment the figure changed to 25%, and ₦83,250 again on the way
      back. Through the product, the cap was changed to 25% on the Policy screen with its
      confirmation step, and the member's own dashboard showed available capacity fall from ₦34,917
      to ₦14,167 on the next load; it was then restored to 33.3% through the same screen.
- [x] **A second organization's policy is independent by construction**, and needs no new code:
      `capacity_core()` reaches the policy through `users.organization_id`, so a member is always
      measured against their own organization's basis and cap and never another's. Only one
      organization exists today (FMC Abeokuta, D019), so this is a statement about the scoping
      rather than an observation of two live rows.

### The em dash sweep

Every em dash in the repository is gone, 1,649 of them across 264 files, replaced one at a time by
the punctuation the sentence actually wanted rather than by a single blind substitution. The
breakdown was 373 in `.tsx`, 172 in `.ts`, 142 in `.sql`, 947 in Markdown and 15 in CSS.

- [x] **Replaced by meaning, not by rule.** A dash before a conjunction or a subordinator became a
      comma; one before a new independent clause became a full stop and a capital; one introducing
      a definition or a list became a colon; a mid-sentence aside became a pair of commas or
      parentheses. A trailing citation of a blueprint section became `(admin blueprint 5.2)`.
- [x] **UI copy first.** Fourteen dashes were standing in for a missing value on screen, where no
      punctuation is the right answer at all: those became words a member can read, "Not set",
      "Not scheduled", "None due", "Not known", "Not on file", "Not on Clarix", "Not entered" and
      "Not read", and one empty amount field became `placeholder="0.00"`.
- [x] **Nothing but prose changed in SQL.** The `.sql` pass touched comments and comment strings
      only. No DDL, no policy expression and no function body differs.
- [x] **The mechanical pass was checked by hand afterwards.** Rewriting line by line mangles a
      sentence that wraps across two lines, and it did: six of those, a possessive, two accidental
      double colons and thirty-one lines left with trailing whitespace were all repaired
      individually.
- [x] **One block is deliberately left alone.** `CLAUDE.md`'s `nextjs-agent-rules` section is
      written by `next dev` on every run, so editing it only produces a dirty tree. It keeps its
      dashes, and that is the only place any remain.
- [x] **Verified.** `tsc --noEmit`, `eslint`, `next build` and all 46 unit tests pass, and a
      repository-wide search for the character returns nothing outside that managed block.

### Both ends of the loan lifecycle (migration 029)

`loan_status` has carried `completed` and `expired` since migration 006 and nothing could write
either. The two turned out to be different problems, and the work is clearer for keeping them
apart.

- [x] **Closing a loan was the one that mattered to the numbers.** An active loan counts against
      the member's deduction cap at *every* cooperative they belong to, and nothing ever moved one
      on, so a loan repaid in 2025 was still holding capacity. `complete_loan()` releases it, takes
      `can_approve_loans` rather than `can_record_savings` (closing a loan is a loan decision, not
      a bookkeeping entry), and records in the audit log how much was actually recorded against the
      loan, which may be less than it was for.
- [x] **The expiry sweep was the one that mattered to the record, and it exposed something worse
      than a stale status.** A lapsed reservation was excluded from the waiting list, because it
      cannot be decided, and was not in the decided list either, because its stored status still
      said `reserved`. It appeared on no screen at all. `expire_lapsed_reservations()` moves it to
      `expired`, where the queue's Recently decided view shows it as "The hold lapsed before a
      decision", and the loader now returns the lapsed set so the queue can say how many there are
      rather than silently dropping them.
- [x] **Tidying frees nothing, and the screen says so.** A lapsed hold stopped counting the moment
      it lapsed (D024), so every figure was already right. The notice on the queue states that
      plainly rather than implying capacity was recovered.
- [x] **Blueprint 6.4's Loan Detail is now real.** An active loan shows what has been repaid
      against what was borrowed on the same used-against-a-limit meter used everywhere else, the
      repayment history behind it, and the closing action. Where the ledger does not add up, the
      closing form requires a short note and keeps it with the audit entry.
- [x] **Neither runs on a timer.** There is no scheduler in this project, and a sweep firing
      unwatched is a worse answer than one an admin performs and the log remembers.
- [x] **pgTAP suite 013** holds the asymmetry in place: closing must move capacity, tidying must
      not, and both must refuse an officer who can record money but not decide loans. Sixteen
      assertions.
- [x] **Verified against the live demo data.** A reservation whose hold ran out four days earlier
      was swept from the admin's own queue, landing as `expired` with an audit entry naming
      Funmilayo Adeyemi as the actor. A ₦400,000 loan with ₦109,800 recorded against it was closed
      through the Timed Undo with a note explaining the ₦290,200 gap; the audit entry carries both
      figures, and the member's committed total fell from ₦18,300 to zero.

### Reports (admin blueprint 7.6)

The blueprint's own spec for this is four lines long, and deliberately so: it calls Reports a P1
fast-follow and asks for "a short list of a few pre-built views (member growth over time, total
savings held, reconciliation shortfall trend), each opening a simple chart-plus-table page rather
than a configurable report-builder". What is built is exactly that list and nothing beside it. No
date-range picker, no grouping, no export, all of which the blueprint calls reasonable later
additions rather than part of this.

- [x] **Three reports, each reading the records that already exist.** Member growth counts
      memberships by the month each joined; total savings held is rebuilt from the ledger month by
      month rather than read off today's balance, applying the same rule the balance trigger does
      (contributions add, recorded withdrawals subtract, loan repayments are neither); deduction
      shortfall compares expected against received per period, derived rather than stored as
      docs/DATA-MODEL.md specifies.
- [x] **No new grant, and none needed.** Every read goes through the ordinary authenticated client
      and the policies that already existed. A report is a different arrangement of rows this staff
      member could already open one at a time, and `can_view_members` gates the screen for the same
      reason it gates the member list.
- [x] **The chart is hand-drawn SVG, not a library.** TOOLING-POLICY.md sets a bar a dependency has
      to clear, and three read-only line charts do not clear it. It also keeps the palette on design
      tokens rather than a library's defaults.
- [x] **It is not a second meter.** DESIGN_SYSTEM.md reserves the meter and rolling number for a
      value against a ceiling. Nothing in a report has a ceiling: these answer which way something
      has gone, which is the question the dashboard sparkline already answers in miniature.
- [x] **The shortfall report has no data, and says why.** `deduction_reconciliation` has never been
      written to, so rather than draw an empty axis that reads as a flat trend, the screen explains
      that a month has to be entered on the Reconciliation screen first, and that an empty chart
      would imply payroll sent nothing, which is a different claim entirely.
- [x] **Verified against the live demo data.** Savings held reads ₦910,000 today from ₦960,000
      contributed less ₦50,000 withdrawn, with fifteen months of month-end figures behind it;
      member growth reads seven active members with the month each joined.

### Dates, the console error, and why tab switches were slow

**Every date in the product now formats in Africa/Lagos.** One label was fixed last round; the
other nineteen call sites were not, and rather than adding `timeZone` nineteen times the
formatters moved into `src/lib/format.ts` beside `formatNaira`. There are six shapes
(`formatFullDate`, `formatShortDate`, `formatDayMonth`, `formatDayMonthTime`,
`formatShortDateTime`, `formatMonthYear`, plus `formatMonthYearLong` for a reconciliation
period), every one pinned to Lagos, and no call site constructs its own `Intl.DateTimeFormat`
any more. A future screen cannot reintroduce the bug by forgetting.

**The console error was real, and the fix for it was worse than the error.** It comes from the
inline theme script: React logs "Encountered a script tag while rendering React component"
whenever it renders that element on the client, which happens on the 404 and error boundaries and
nowhere else. That is why it only ever appeared beside a different failure.

`next/script` with `beforeInteractive` was tried, and reverted after measuring it. Next injects
that form through its own runtime rather than leaving it in the head to be parsed: a probe
recorded it executing at `document.readyState === "interactive"`, with `document.body` already
present, which means after first paint. Anyone who has chosen light or dark would get a flash of
the other on every page load. The script stays a bare inline tag, the reasoning is written into
the file so the next person does not repeat the experiment, and it was confirmed that a
production build emits nothing at all on the same 404 that logs the error in development.

**Tab switching was slow because every navigation did the same work twice.** Measured on a
production build rather than guessed at: a switch took 2 to 3 seconds, of which the RSC request
was 1.0 to 2.6 seconds, so the cost was server-side rather than rendering or bundle size.

Each staff screen is a shell layout plus a page, and both need to know who is signed in and what
they may do: the layout to draw the navigation, the page to decide whether to render. Both called
`loadStaffContext()`, so every navigation paid twice for the same answer, and the expensive part
is the `auth.getUser()` in front of it, which is a network round trip to the auth server rather
than a cookie read.

- [x] **`createClient()`, `getRequestUser()` and `loadStaffContext()` are wrapped in React's
      `cache()`**, which is scoped to one request. Verified by instrumenting them and counting: a
      navigation that previously made two client constructions, two auth round trips and two
      context loads now makes one of each.
- [x] **Nothing about behaviour or appearance changed.** Every caller receives exactly what it
      received before; the only difference is that the second caller is served from the first
      caller's result rather than repeating the work.
- [x] **The loading boundary is built**, as the next section describes. It was flagged rather
      than taken last round because it changes what appears between a click and a screen.

### The visual QA pass, and what it could not cover

- [x] **An automated overflow and clipping audit ran against seventeen routes** across the
      employee and cooperative-staff blueprints, checking every element under `main` for text
      clipped by its own box, anything escaping the viewport left or right, and any page that
      scrolls horizontally when it should not. Every route came back clean. The employee side
      covered the dashboard, cooperatives, discovery, loans, the application flow, payslip
      re-upload, notifications, profile and help; the staff side covered members, applications,
      loan products, officers, the public profile, import, reconciliation, reports, the audit log,
      notifications, profile and help.
- [x] **The mobile half of this pass is done**, recorded in its own section below. It was
      outstanding at the end of the previous round because resizing the browser window is ignored
      in this environment.

### A loading state for every shell

Every screen behind a signed-in shell is `force-dynamic`, so Next has nothing it can prefetch and
nothing to show between a click and the answer. On a slow connection the previous screen simply
sat there, and the product read as frozen rather than busy.

- [x] **`loading.tsx` in all three shells**: `(app)` for members, `admin/(shell)` for cooperative
      admins and officers, and `platform/(shell)` for the operator. One boundary per shell covers
      every route beneath it, so the loading state is consistent across the whole product rather
      than only on the routes that were profiled.
- [x] **It is the motif the design system already specified, not a new one.** DESIGN_SYSTEM.md
      lists, under the signature motif, "the app's own splash/loading state, as a small ring
      filling", and nothing had built it. `LoadingRing` is the wordmark's own ring (same radius,
      stroke and viewBox) with its arc filling on a loop. It fills rather than spins, because a
      meter filling says "working" in this product's own vocabulary.
- [x] **It honours reduced motion**: the ring is drawn at rest, two thirds filled, exactly as the
      wordmark draws it.
- [x] **Nothing about a loaded screen changes.** The boundary renders inside the shell's own
      `<main>`, so the navigation stays put and only the content area shows the ring, and it is
      replaced the instant the real screen is ready. It is deliberately not a skeleton: a skeleton
      guesses the shape of what is coming and is wrong the moment a screen changes.
- [x] **Verified in all three shells at mobile and desktop width.** A click was followed by polling
      for the ring under the server's real latency: it appeared in all six cases, carrying the
      navigation with it (the destination tab already active), and was gone once the screen landed.
      With the boundaries present, `main`'s first child is each page's own root element on all
      twelve screens checked, so the boundary contributes no DOM to a loaded screen, which is what a
      Suspense boundary is.
- [ ] **Two things were not verified, and should not be read as though they were.** A pixel diff of
      loaded screens with and without the boundaries could not run: removing them forces a recompile
      that exhausted this machine's memory twice. And in development the ring appeared about a
      second after the click, because each shell's layout awaits the signed-in context before the
      boundary can stream and development does not prefetch. In production `<Link>` prefetches a
      dynamic route's loading boundary, which should make it near-instant, but that was not measured
      on a production build.

### The mobile visual QA pass, done properly this time

**How it was driven.** Neither route the previous round tried gave a real viewport: resizing the
browser is ignored here, and the Playwright MCP server's browser was wedged on a locked profile.
The pass instead drove the system Chrome directly with `playwright-core` from a scratch directory
outside the project, with genuine device emulation: a fixed viewport, `isMobile`, `hasTouch` and a
2x pixel ratio. That is stronger than the same-origin iframe the earlier 390px review used,
because it also emulates touch. What it still cannot give is real safe-area insets or a physical
screen, which need a device.

**Coverage.** 48 screens across all four blueprints plus the public pages (the landing page, sign
in, sign up, password reset and the privacy notice; ten employee screens; sixteen admin; seven
officer; ten platform), at 360px, the common budget-Android width in the market this is for, and
at 390px and 414px.

**What was checked, per screen.** Horizontal page scroll; any element past the viewport; any
element escaping its own parent's box, which the viewport check cannot see; leaf text clipped by
its own box; single-line placeholders wider than their input; and, at 360px, pills whose text had
wrapped onto a second line. Every screen was then looked at by eye on contact sheets at true CSS
size.

**Result: all 48 screens clean at all three widths.** The only remaining flags are two intentional
ones: the landing hero's decorative glow bleeding past the edge (clipped by its container, with no
horizontal scroll), and the `-ml-2` idiom that aligns a ghost back button's icon with the content
edge. The final confirming run at 390px and 414px, after the last pill fix, was stopped by Claude
Code under memory pressure; the run before it was clean at both widths on every other check, and
the pill check is clean at 360px, where wrapping is most likely.

- [x] **KPI figures overran their cards, by up to 19px.** Six-figure balances do not fit a
      two-column card grid at phone width, and a seven-figure one, which a real cooperative will
      hold, would have been worse. A new `type-kpi-fit` utility keeps type-kpi's 28px and 36px as
      the ceiling and shrinks a figure only when its character count would not fit, measured
      against the card with a container query. A figure that fits renders exactly as before.
- [x] **KPI labels overran by up to 11.6px at 360px.** "DEDUCTIONS" and "COOPERATIVES" are single
      uppercase words and cannot wrap. Card padding went from 16px to 12px on mobile, and below a
      144px card the icon stacks above the label. Wider cards are unchanged.
- [x] **The trend delta ran out of its card by 15px.** The row now wraps, so the amount drops under
      the sparkline instead.
- [x] **Accordion triggers overran by 1.9px** on every profile screen: the classic flexbox trap, a
      `flex-1` item that cannot shrink below its content. Fixed with `min-w-0`.
- [x] **Two-column discovery cards were 2px short** for their status row at 360px. Their padding
      went from 20px to 16px on mobile.
- [x] **"Requirements apply" wrapped onto two lines inside a fully rounded pill**, which turns a pill
      into a blob. It now reads "Requirements" and never wraps, on both screens that show it.
- [x] **Two search placeholders were cut off mid-word**, on the cooperative and platform audit logs.
      Both are shortened to fit.
- [x] **The audit log showed raw machine values**: "monthly repayment 18300", "available before
      115238.00", and the two actions migration 029 introduced as bare lowercase verbs. Fields now
      have readable labels, money shows in naira, timestamps show in Lagos time, and "Loan marked
      repaid in full" and "Lapsed request moved out of the queue" are named properly.
- [x] **Spacing moved onto the 4/8/12/16/20/24/32/40/48/64 scale.** Seventeen 2px gaps between text
      blocks became 4px; search-input icon clearance went from 44px to 48px, symmetric about the
      icon; currency prefixes and the IPPIS confirmation tick were given on-scale clearance; and the
      remaining half-step internals of rows, pills, badges, icon-label gaps and the floating tab
      bar were moved to their nearest scale value.
- [x] **The sub-grid values that remain are deliberate.** A 2px nudge on an icon or radio beside
      text centres a 16px glyph on a 20px line, so rounding it to the grid would misalign it. The
      switch's 2px thumb inset, the segmented theme toggle's inset and the trend arrow's gap are
      control geometry, fitting one element inside another. RollingNumber's 1px and 2px are glyph
      kerning. The landing hero's 112px and 144px top padding clear the fixed floating nav, which
      the scale, topping out at 64, cannot express.
- [x] **One icon set.** Every icon is `lucide-react`; the only inline SVG outside the Clarix motif
      components is the reports chart and the landing backdrop, both drawings rather than icons.

## What does not exist yet

- [ ] **Self-service signup still cannot complete**, though it has moved forward. Custom SMTP is
      now wired to `smtp.resend.com:465`, so Supabase's built-in sender and its rate limit are
      out of the picture. What remains is the sender address: `onboarding@resend.dev` is
      Resend's shared testing sender and only delivers to the Resend account owner's own email,
      so a signup from any other address fails with "Error sending confirmation email". Verifying
      a real sending domain closes this. Until then, accounts are created directly in the
      database.
- [x] **`NEXT_PUBLIC_SUPABASE_ANON_KEY` and `NEXT_PUBLIC_SUPABASE_URL` in Vercel are now
      confirmed** by the production round trip described above, rather than by reading the values
      back, which Secret-type entries do not allow.
- [ ] **Automatic payslip extraction.** MVP-SCOPE.md puts this at P1, and it is not built, so
      every account currently lands on the review screen with the fields blank and editable,
      which is the degradation path blueprint 2.4 already specifies for a failed read. The
      upload itself is real, and the processing steps name only work that genuinely happens
      rather than inventing a "reading your payslip" stage for something nothing is doing.
      Building it means adding a PDF text-extraction dependency, which needs a TOOLING-POLICY.md
      check and a SECURITY.md entry first, because it would see payslip files in cleartext.
- [x] **Every seeded test record listed here previously has been deleted from the live project.**
      Each entry was cross-checked against this inventory first, then removed: the four
      "(test data)" cooperatives and everything that cascaded from them (nine loan products,
      three memberships, five loans, twenty-eight savings rows, five roster entries, two staff
      roles, two invitations, twelve audit entries, two access grants and the internal note), the
      three catalogued accounts `pilot.tester@`, `coop.admin@` and `super.admin@fmcabeokuta.org.ng`
      with their documents, notifications and platform-admin row, and the eight platform-level
      audit entries that hang off no cooperative. Only the `organizations` row survived, which is
      real (D019) and is at its statutory 33.3% of gross.
- [ ] **One uploaded payslip file is orphaned in the `payslips` bucket.** Its `documents` row went
      with the account that owned it, but Storage refuses a direct SQL delete
      (`storage.protect_delete()`: "Use the Storage API instead"), and the Storage API needs
      either that member's own session or the service-role key, which D027 keeps out of reach.
      The file is `d42ed2e2-b221-4250-a6c8-22e55e76789c/591af24c-49f1-407f-92f0-b7bba931ffaa.pdf`
      and it is unreferenced by anything. **Delete it from the Storage browser in the Supabase
      dashboard.**
- [ ] **An account this file never catalogued was found during the cleanup and deliberately left
      alone.** `testcoopadmin@gmail.com` was created on 14 September, is confirmed, has never
      signed in, and holds no membership, staff role, loan or platform-admin row. It appears in no
      session record here, and it is an external address rather than an `fmcabeokuta.org.ng` test
      one, so removing it was not this cleanup's call to make. **Decide whether it is yours and
      delete it if not.**

### The demo environment

Everything below was written by administrative SQL against the live project, the same way every
prior account was and never through the service-role key. **All of it is demo data and goes before
go-live**, but nothing carries a "(test data)" suffix any more: the names are plausible so the
product can be shown to somebody without the seams showing.

- [x] **Five cooperatives**, each with a description and joining requirements in its own voice:
      FMC Abeokuta Staff Multipurpose Cooperative Society, Medical and Health Workers Thrift and
      Credit Society, Allied Health Professionals Savings and Loans Cooperative, Nurses and
      Midwives Cooperative Society, and Administrative Staff Savings Cooperative.
- [x] **Twenty-eight loan products**, five or six per cooperative, each with its own savings ratio,
      maximum tenure and interest terms written the way a Nigerian cooperative writes them
      ("5% flat per annum, deducted at source with the monthly contribution"). Six are private to
      their committee rather than public.
- [x] **Seventy member and roster rows.** Twenty-four memberships (twenty-two active, two pending
      so the admin's applications queue is not empty) and forty-six roster entries, of which
      twenty-two are linked to a membership exactly as the roster trigger would have linked them
      and twenty-four are staff the cooperative carries on its books who have not joined Clarix,
      which is the ordinary state of a roster after an import.
- [x] **Believable histories, not round numbers.** 229 savings rows: 148 monthly contributions
      scaled to each member's salary and their cooperative's minimum, 77 loan repayments tied to
      the loan each one is paying down, and four recorded part-withdrawals so no ledger is a
      straight line upward.
- [x] **Twenty loans across the whole lifecycle**, and now twenty-one: active, reserved and
      awaiting a decision, completed, and one rejected. Every member's committed total sits under
      their own cap, checked with `capacity_core()` for all fourteen: the tightest is Blessing Eze
      at ₦30,000 committed against a ₦50,882 cap, which is what a member close to the limit is
      supposed to look like.
- [x] **Salaries and staff IDs that match the employer.** Six-digit IPPIS numbers against the
      organization's own `^[0-9]{6}$` pattern, and gross pay from ₦152,800 for an administrative
      officer to ₦642,000 for a consultant.
- [x] **One outstanding officer invitation** and three of the platform operator's private internal
      notes, so the Officers screen and the cooperative detail screen both have real rows.

- [x] **Walked end to end through the real product, on the production deployment.** Signed in as
      Adebayo Ogunleye, whose dashboard read ₦594,000 saved, two active loans, ₦46,600 deducted
      and ₦115,238 available, every figure matching `capacity_core()` exactly. Applied for
      ₦345,000 over 24 months at the multipurpose society; the live preview showed the request at
      ₦14,375 against a ₦161,838 cap and said ₦100,863 would still be free. Submitted, and the
      reservation was created with a seven-day hold. Signed in as the officer Chidi Okonkwo, whose
      navigation correctly lacks the Manage cooperative section the admin gets, opened the
      application, saw the same meter and the same ₦46,600 "committed elsewhere" without any
      cooperative being named, and approved it through the Timed Undo. The database then held the
      loan `active`, approved by that officer, with the member's notification and the audit entry
      carrying the capacity snapshot. Signed in as the admin and as the platform operator and both
      read their own screens correctly.

- [x] **Two stale statements were found during that walk and corrected.** The Platform Dashboard
      and this role's Help screen both still said the access-grant flow was not built, which
      stopped being true when it merged. The Help wording mattered most: it told a platform
      operator there was "no path at all from this account to a member's records", which is now
      the opposite of the truth outside a live grant.
- [x] **A loan application records which product it is for, and the savings rule is checked**
      (migration 028). The apply screen picks a product, skipping the choice when a cooperative
      offers one and defaulting to the gentlest rule when it offers several; the amount and tenure
      bounds follow the chosen product, and a panel shows what it requires saved against what the
      member holds. The function validates that the product belongs to the cooperative applied to,
      refuses a tenure past its maximum, and returns the requirement, the shortfall and whether it
      is met.

      Nothing blocks. Blueprint 5.5 is explicit that Clarix informs rather than gatekeeps, so a
      shortfall flags the application and the cooperative decides, exactly as a capacity shortfall
      already does. One consequence worth recording: the amount slider used to be bounded by
      savings divided by the ratio, which meant the savings rule could never be broken and the
      check could never fail. It is now bounded by what the remaining capacity could repay over
      the product's longest tenure, so both checks are genuinely reachable.

      Verified against the live demo data, both directions. Kolawole Ajayi, holding ₦36,000 at the
      multipurpose society, asked for ₦295,000 under a rule requiring 30%: the apply screen showed
      the capacity check passing and the savings check ₦52,500 short, the button read "Submit
      anyway", and the confirmation said the shortfall was the cooperative's own rule to waive or
      not. The reservation was still held. On the officer's review screen the same application now
      reads "Rent Assistance Loan requires 30%, ₦88,500, ₦52,500 short of your own requirement"
      where it used to say the application was tied to no product at all.

      pgTAP 003 carries ten assertions for it, written to fail against the previous version: the
      same member and amount under two different products must produce different requirements,
      a shortfall must still reserve, and another cooperative's product must be refused.
- [ ] **No demo member has a payslip on file**, because a file cannot be put into Storage by SQL.
      Salary figures are set and marked verified, so every screen that reads a salary works, but
      the payslip-review window D031 opens has nothing to show until somebody uploads one through
      the real screen.
      project's first notification row and first audit-log entry.
- [x] **Notifications are written and read.** A loan decision writes the member's row, and an
      access request writes the cooperative admin's, both in the same statement as the thing they
      describe. What is still missing is the email: the toggles govern mail nothing sends, and
      that waits on the same verified sending domain everything else does.
- [ ] **The Help contact form cannot deliver yet.** It posts to Resend's API against
      `RESEND_API_KEY`, which is not provisioned, and even once it is, Resend will only deliver
      to the account owner until a sending domain is verified: the same blocker holding up
      signup mail. Until then the form fails honestly and the screen shows `support@clarix.ng` as
      a mailto link, which is the path that works. The address itself is provisional (D026) and
      needs the domain question settled.
- [ ] `src/app/dashboard/page.tsx` is a **deliberate placeholder**, not blueprint 6.1. It exists
      so Log In lands somewhere honest and so the install prompt has its correct home. Replace it
      wholesale when the real dashboard is built.
- [x] **`/privacy` and `/reset-password` are built.** Both had been dead links from the auth
      screens since the first slice. See the section below for what each covers and the one real
      hole the reset flow turned up on its way in.
- [ ] Notification preferences govern email that nothing sends yet. The toggles write to the
      database and are read back correctly; what reads them at send time arrives with the
      notification writers.
- [ ] `deduction_reconciliation` is the last table in `docs/DATA-MODEL.md` with no rows in it.
      The screen that fills it is built; nothing has been reconciled against a real payroll file
      yet, because there has not been one.
- [ ] **XLSX import is written but has only been exercised against CSV.** The reader unzips and
      parses the two XML parts a roster needs, which covers a plain sheet out of Excel,
      LibreOffice or Google Sheets; a file using dates, formulas or a second worksheet is not
      something it has been shown. When it cannot read one it says so and asks for CSV rather
      than importing something wrong.
- [ ] **Nothing emails an invitation.** The row is real and claims correctly on first sign-in;
      the email telling somebody it exists waits on the same verified sending domain everything
      else does. The officer screen says exactly that on the form rather than implying a message
      went out.
- [ ] **Completing a loan has no screen, and no part of either blueprint owns it.** Approve and
      reject exist; marking a loan repaid in full is still only implied by the repayment ledger
      adding up, and nothing flips the status to `completed`. Nor does anything sweep a lapsed
      reservation to `expired`, which costs nothing because expiry is evaluated at read time
      (D024). Deciding where that work lands is the next thing to settle.
- [ ] **Nothing writes an admin-facing notification.** A new application arriving, a reservation
      nearing expiry and an officer accepting an invitation are all real events with no writer,
      and the notification categories for them do not exist in the enum either, adding them
      before something writes them would be speculative schema. The dashboard's Attention
      required covers the same ground today.
- [ ] **Reports (7.6)**, deferred by the blueprint's own P1 marking rather than by omission.
- [ ] Every loan transition after reservation, approve, reject, complete, and the expiry sweep.
      Those belong to the cooperative admin/officer blueprint, and the employee-facing flow
      deliberately only ever produces `reserved`.
- [ ] The pgTAP workflow still only runs on a pull request touching `supabase/migrations/**`
      or `supabase/tests/**`. That is deliberate. It is the only expensive check, but it means
      a pull request touching neither gets no database coverage at all.
- [ ] Branch protection is not turned on, so nothing yet *requires* the database check to pass
      before a merge. `docs/DEVELOPMENT-WORKFLOW.md` §3 already assumes it ("blocking merge, once
      branch protection is turned on"); it is a repository setting, so it needs your decision
      rather than a code change.
- [ ] A password-verified sign-in has not been performed against production. The signup round
      trip above proves the URL and anon key are right; the account password is in your keeping,
      so completing a real login on `clarix-3w5i.vercel.app` is a one-minute check only you can
      do.
- [ ] `RESEND_API_KEY` / `AI_PAYSLIP_API_KEY` not provisioned.
- [ ] Fifteen demo accounts exist in `auth.users`, created directly in the database rather than
      through signup, because signup still cannot complete. **Delete all of them before go-live**;
      they are listed in the demo environment section above.
- [ ] No screen has been reviewed on a real phone. The 390px review was done in a same-origin
      iframe, which gives CSS media queries a genuine narrow viewport but not real touch
      targets, real safe-area insets, or iOS Safari's own rendering.

## Accounts inventory

| Service                               | Status                                                    | Notes                                                                                                    |
| ------------------------------------- | --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Supabase                              | **Live, schema applied** (ref `sxugaizwmqigtioqgefx`)     | Region `eu-west-1` (Ireland), Postgres 17.6. Fourteen tables, one private Storage bucket, one seeded organization. The unrelated project in the same org is untouched. |
| GitHub                                | **Repo created:** `Temi-daniel124/clarix` (private)        | Commits correctly authored and verified by GitHub. PR #1 merged the employee blueprint to `main`; Actions runs the pgTAP suites on any PR touching `supabase/`. Branch protection is not on yet. |
| Vercel                                | **Project building this repo: `clarix_app`**               | Serves `clarix-3w5i.vercel.app`, now from a **production** deployment off `main` rather than a Preview. A separate project also named `clarix-3w5i` exists, possibly redundant, still to be confirmed and removed. |
| Resend                                | **Custom SMTP wired** to `smtp.resend.com:465`            | Sender is still `onboarding@resend.dev`, which Resend restricts to the account owner's own address, so signup mail reaches nobody else. A verified sending domain is needed before go-live. |
| AI payslip OCR API (Claude or OpenAI) | Not yet decided/provisioned                               | P1 feature.                                                                                               |

## Immediate next steps (in order)

1. **Verify a sending domain in Resend and point the sender at it.** Custom SMTP is already
   wired to `smtp.resend.com:465` and the built-in rate limiter is gone, but the sender is
   still `onboarding@resend.dev`, which Resend restricts to the account owner's own address.
   Signing up any other address now fails with "Error sending confirmation email": a different
   failure from before, and the last thing blocking self-service signup.
2. Review the production site on an actual phone, which the iframe-based review cannot stand
   in for. A password-verified sign-in there closes the last part of the environment check.
3. Decide the permanent Vercel project name, and remove the redundant `clarix-3w5i` project if
   it is not serving anything.
4. Turn on branch protection for `main`, so the database check blocks a merge rather than merely
   reporting.
5. Delete the whole demo environment before go-live: fifteen accounts, five cooperatives and
   everything hanging off them, all catalogued above. Two loose ends need you rather than SQL: one
   orphaned payslip file in Storage, which only the dashboard's Storage browser can remove, and
   the uncatalogued `testcoopadmin@gmail.com` account, which was left alone deliberately.
6. **No blueprint screen is left to build.** Loan completion, the expiry sweep and Reports are
   all built (below). The only thing any blueprint names that does not exist is submitting a loan
   application on a member's behalf (officer 6.2).
7. Decide what happens to **submitting a loan application on a member's behalf** (officer
   blueprint 6.2). It is the one screen no role has: members apply for themselves, staff can only
   read and decide. The permission panel already names it as not built rather than pretending
   otherwise, so this is a scheduling decision rather than a hidden gap.
7. Nothing further on the loan lifecycle: both ends are built and verified (below).

## Decision/scope drift check

Before starting any new work session, re-read `DECISIONS.md` in full and skim this file's
checklist. If something in the codebase already contradicts a locked decision, that's a bug to
fix, not a signal to update the decision. Update the decision only through a new dated entry in
`DECISIONS.md` if the change is genuinely deliberate.
