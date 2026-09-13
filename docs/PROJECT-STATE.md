# PROJECT-STATE.md — Clarix

**Authority level: 3.** This is a **living document** — unlike every other file in `docs/`, it is
expected to change constantly. Update it at the end of every work session, and especially at
every milestone (an account created, a repo initialized, a schema pushed, a feature accepted). An
agent picking up this project cold should read this file first, right after `DECISIONS.md`, to
know exactly what already exists and what doesn't.

**Last updated:** 2026-09-13 (super admin Parts 1 to 5 — the first Super Admin seeded, the
platform shell, dashboard and cooperative management).

## Phase

**Planning complete. Infra live. The employee blueprint is complete — Parts 1 to 6, every
screen built.** Landing page, auth, onboarding, the persistent navigation shell, the home-base
screens, the loan side with the reservation transaction that is the product's core mechanism,
and now the account cluster: Notifications, Profile / Settings and Help / Support. Every screen
has been walked in a browser against the live project, in both themes at both widths. There are
no holding screens left anywhere in the employee app.

**All of it is on `main`.** Until now every part lived on one long-lived branch,
`slice-01-foundations-auth`; pull request #1 merged it, `main` now carries the whole employee
app, and the branch is deleted. `clarix-3w5i.vercel.app` is served by a production deployment
off `main` rather than a Preview.

**The cooperative admin blueprint is complete — Parts 1 to 8, every screen built.** Parts 1 to 7
are on `main` already (pull requests #2 to #5, each merged after the pgTAP suites passed). Part 8
adds the account cluster: Notifications, Profile / Settings, the Cooperative Audit Log, and
Help / Support.

Both blueprints are now built end to end. What remains is not a part of either: loan completion
and the expiry sweep have no screen assigned yet, and Reports (7.6) is deferred by the
blueprint's own P1 marking rather than by omission.

**The product now does something it has never done before.** A reservation can become an active
loan or be turned down — the first transition past `reserved` anywhere in Clarix — and an
approval writes a real notification to the member, the first row anything has ever put in
`notifications` since D025 created the table. Walked end to end against the live project: an
approval on the admin side, and the member's own Notifications screen showing it unread a moment
later.

**The cooperative officer blueprint is complete — Parts 1 to 8, every screen.** Most of that role
was already standing: an officer works in the admin's own screens, and the difference is which
navigation they get, which controls appear, and what the policies let them write (D029). Parts 1
and 2 of that blueprint needed no new authentication code at all — a real officer invitation was
issued from the admin's own Officers screen, accepted through the existing invitation screen, and
the account landed on its own home. What was genuinely new is the two-slide orientation tour, the
officer's navigation, and Officer Home itself.

Two boundaries the officer blueprint exposed were missing and are now closed in the database
rather than in the interface: importing or adding a member takes a granted permission
(migration 017), and the audit log is the admin's alone to read (migration 018). Both were
previously open to any active staff member, which was invisible while officers had no screens.

**The super admin blueprint is under way — Parts 1 to 5 are built.** The platform shell, its
one-screen orientation, the Platform Dashboard, and Cooperative Management in full: the
directory, a deliberately shallow detail screen, and creating a cooperative with its admin's
invitation in one action. Parts 6 to 9 — Policy, the platform Audit Log, Access Requests,
Platform Admins and this role's own account cluster — are not built, and every one of them is a
navigation row that says so rather than a dead link.

**All four blueprints' earlier parts are now built end to end.** What remains is not a part of
the employee, admin or officer documents:
loan completion and the expiry sweep have no screen assigned, Reports (7.6) is deferred by the
blueprint's own P1 marking, and submitting a loan application on a member's behalf (officer 6.2)
is a screen neither role has — it is named in the permission panel as unavailable rather than
quietly dropped.

Reports (7.6) stays deferred, and that is the blueprint's own call rather than a gap: it is
marked P1 there.

## What exists today

- Full planning corpus under `docs/planning/`, and the governance doc set (`docs/DECISIONS.md`
  through `docs/TOOLING-POLICY.md`, plus `AGENT.md`, `CLAUDE.md`, `BUILD.md`, `SECURITY.md`,
  `DESIGN_SYSTEM.md`).
- **GitHub repository:** `github.com/temiloluwa-adebayo/clarix` (private), default branch `main`.
  Commit identity verified per-session as Temiloluwa Adebayo / adrianwilliams128765@gmail.com.
- **Vercel:** the project actually building this repository is **`clarix_app`**, which serves
  `clarix-3w5i.vercel.app`. A second Vercel project named `clarix-3w5i` also exists in the same
  account with its own separate URL. Earlier revisions of this document named `clarix-3w5i` as
  the project, which was wrong. **Open items:** confirm whether the second project is also
  connected to this repository and delete it if it is redundant, then decide the permanent
  project name and URL before real users or a custom domain exist.
  `vercel.json` pins the framework preset to Next.js, because `clarix_app` had been configured
  before any app code existed and was looking for a `dist/` directory.
- **Supabase project `Clarix`**, ref `sxugaizwmqigtioqgefx`, linked locally (`supabase/.temp/`
  holds the link). The pre-existing unrelated project in the same organization is untouched.
  **Open item:** the region still needs recording in `docs/ARCHITECTURE.md`.

## What now exists (done in this session)

- [x] **Next.js app scaffolded** — Next 16 (App Router, Turbopack), TypeScript, Tailwind v4,
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
- [x] **Eligibility arithmetic extracted and unit-tested** — `src/lib/eligibility.ts` implements
      Steps 1 and 2 of `docs/DATA-MODEL.md`; 19 Vitest cases pass (`npm test`), including the
      gross-vs-net divergence that motivates D007 and the `capOverride` path the loan
      application screen uses to preview against the cap the database computed.
- [x] **Three migrations written and applied to the remote `Clarix` project:**
      `20260911141652_init_core_identity_and_cooperatives.sql` (the six tables, their enums, the
      D009 reservation-ceiling trigger, 23 RLS policies, the signup trigger, and the seeded FMC
      Abeokuta organization row); `20260911141744_harden_function_privileges.sql`;
      `20260911144045_grant_table_privileges.sql`; `20260911211501_documents_and_payslip_storage.sql`.
      Local filenames were reconciled to the versions the database recorded, per D023 — three
      had drifted, which is exactly the failure that rule exists to catch.
- [x] **FMC Abeokuta seeded** — `deduction_basis='gross'`, `deduction_max_percentage=33.30`,
      `employee_id_pattern='^[0-9]{6}$'`, `reservation_expiry_days_default=7`.
- [x] **RLS verified against the live project**, not just written: an officer of cooperative A
      sees only A's memberships, sees no B rows, cannot write into B, and `anon` reaches nothing.
      The same assertions are committed as pgTAP at
      `supabase/tests/001_rls_cooperative_isolation.sql` for CI.
- [x] **Screens built** — Landing Page (blueprint 1.1), Sign Up (1.3), Log In (1.4) and the
      Verify Contact screen (1.5) that Sign Up leads to. Sign Up creates a real Supabase auth
      user; the matching `public.users` row is created by a database trigger (D021), verified
      end-to-end against the live project.
- [x] **PWA** — manifest at `/manifest.webmanifest`, meter-ring app icons (standard and
      maskable), an app-shell service worker that never caches a financial figure, an offline
      fallback screen, and the install-prompt banner (blueprint 1.2) mounted on the dashboard
      route only.
- [x] **Three new decision entries** — D021 (credentials live in Supabase Auth), D022 (email-only
      authentication for v1) and D023 (agent-applied migrations go through the Supabase
      Management API; `supabase db push` remains the human path). `DEVELOPMENT-WORKFLOW.md` §2
      was rewritten to describe both paths rather than contradicting what actually happened.
- [x] **Local environment configured** — `.env.local` holds the Supabase URL and anon key only.
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
- [x] **PWA install prompt verified working** — it now captures `beforeinstallprompt` from an
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
      navigation-5 — floating pill and mobile sheet kept, the four-column mega-menu cut as
      clarix-design-system.md § 4 instructs — fixed at page level, glass over backdrop-blur, and
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
      `is_public` policy genuinely filters — a cooperative's unadvertised product does not
      reach the profile screen, and no query filters for it.
- [x] **The two apply paths are now one.** Onboarding 2.5 used to create memberships inline
      because 4.4 did not exist; it now links into the real profile with `?from=onboarding`, and
      that screen offers a way back into onboarding rather than into the app.

- [x] **Navigation rebuilt to match the landing page.** The mobile bar is now a floating navy
      glass pill whose active tab widens to show its label, and the desktop sidebar is a navy
      rail that collapses to icons. Both use the one standard spring — the rail's width
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
      compounding — not the spring — is what read as bouncy. Now there is one layout animation
      on the card, `layout="position"` on its content so text moves rather than stretches, and
      a plain fade for the detail. Measured over 52 frames: a single 2.9% overshoot, settled by
      470ms, no oscillation. The expanded card also rises to the top of the grid, because a
      full-width item was otherwise splitting the row around itself.

- [x] **The reservation transaction is one Postgres function, and it was proven under real
      concurrency rather than asserted.** `submit_loan_application` takes
      `pg_advisory_xact_lock` on a key derived from the caller, recomputes committed obligations
      across every cooperative *inside* that lock, and either reserves or reports the exact
      shortfall — all in a single `supabase.rpc()` call, because the lock only serialises within
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
      the database recorded, per D023 — both had drifted, again.
- [x] **Screens built** — Loan Application (5.5) with the live CapacityMeter readout that updates
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

- [x] **Notifications (6.1)** — the `notifications` table with the narrowest RLS in the schema
      (`user_id = auth.uid()`, select and update only, and deliberately no insert policy at all),
      the reverse-chronological list with its small unread dot rather than a badge count, rows
      that lead to whatever they concern, and "Mark all as read" as a real UPDATE so a backlog
      cleared on a phone is cleared on a laptop too. **This screen is genuinely empty in
      practice, and that is expected, not a bug** — every writer (loan approved or rejected,
      membership accepted, new package published) belongs to the cooperative admin/officer
      blueprint, which does not exist yet. No rows were seeded and none were invented, the same
      call already made for the dashboard's trend indicator. The empty state says why it is
      empty rather than saying "no data".
- [x] **Profile / Settings (6.2)** — an identity summary, then four sections that each save on
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
- [x] **Changing a password asks for the current one first.** Supabase does not require that — an
      open session is enough — but an unattended unlocked phone is exactly the case where that
      default is too generous for a product holding salary data.
- [x] **Re-upload payslip** reopens the onboarding Upload/Review pair (2.3–2.4) scoped to
      updating: same components, no step indicator, inside the app shell, returning to Profile.
      The destination is an allowlist rather than a free-form redirect field.
- [x] **Help / Support (6.3)** — thirteen FAQ answers under "About my savings and loans" and
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
      rather than the viewport, so on a long screen its foot — including the appearance control
      — sat below the fold. The blueprint calls this navigation persistent.

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

- [x] **Cooperative admin Part 1** — Accept Invite / Set Password (1.1) serving both arrivals the
      blueprint describes: a brand-new account setting a password from an invitation link, and an
      existing account told plainly that the role has been added to it. Log In (1.2) is the *same
      screen and the same action* as the employee's, with one thing added — where it sends you.
      An active staff role goes to the cooperative, an unaccepted invitation goes to the screen
      that accepts it, everyone else to the employee dashboard. The PWA prompt (1.3) reuses the
      employee mechanic unchanged.
- [x] **A new app shell, not a variant of the employee one** — Home, Members, Loans and a Manage
      cooperative section that expands into six sub-items on desktop and folds behind More on
      mobile. Same tokens, same spring, same navy glass, same collapsible rail; a different
      information architecture, in its own destination list.
- [x] **Cooperative admin Part 2, the setup sequence** — an admin-specific three-slide welcome
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
      into exactly the shape `cooperative_memberships_insert_own_pending` refuses — an employee
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

- [x] **Cooperative Dashboard (4.1)** — the same tap-to-expand KPI row as the employee
      dashboard, through the same component, over four figures about the cooperative: members,
      savings held, active loans, and what is waiting on a decision. Then the section the
      blueprint calls this screen's defining feature, "Attention required", and a short read on
      the month. The setup checklist stays above it until setup is finished, which is what
      blueprint 2.1 promises anyone who skips it.
- [x] **Attention required shows its honest empty state.** At the one cooperative this admin
      oversees, no loan application has ever been submitted, so nothing is pending — and the
      section says so rather than being seeded with a fake item to look populated. What it does
      surface is real: a member imported without a name. The same call as the trend indicator and
      Notifications.
- [x] **Member management (5.1 to 5.4)** — the always-visible search and full list, including
      roster entries marked "Not on Clarix yet" and deliberately not dressed as links; the member
      profile with its four tabs; adding one person by hand, which writes the same roster row the
      import does; and recording a contribution, withdrawal or repayment.
- [x] **The staff view of capacity is the member's own calculation, not a second one.** Migration
      012 moves the arithmetic into `capacity_core()` and gives it two doors:
      `capacity_for_user()` keeps its exact signature for the member, and
      `capacity_for_membership()` is the staff door, which refuses unless the caller is active
      staff at that membership's cooperative. Member Profile renders it with the *same*
      CapacityMeter the member sees. Verified against live data: an 83,250 cap, 40,000 committed
      across two cooperatives, 43,250 available — identical figures on either side.
- [x] **`savings_transactions` needed no new policy**, which was checked before anything was
      written: `savings_transactions_insert_staff` from migration 006 already lets a
      cooperative's active staff record against any membership at that cooperative. Same outcome
      as the `cooperative_staff_roles` check behind D027 — the policy was already right.
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

- [x] **Loan management (6.1 to 6.4)** — the queue, oldest first, each card carrying the
      eligibility answer at a glance and flagging a reservation close to lapsing; the review
      screen; the active-loans list with repayment progress drawn from money that actually
      arrived; and the admin's view of one loan. The review screen shows the *same* CapacityMeter
      the member saw when they applied, because it is the same calculation — and beside it, the
      cooperative's own savings-ratio rule, which is a separate question that can disagree with
      the first.
- [x] **`audit_log` is built** (migration 014), which the blueprint had been quietly assuming
      since 5.4. Scoped to what Part 6 needs — actor, action, target, old and new value, and the
      note — with RLS that lets a cooperative's staff read their own entries and **no insert,
      update or delete policy at all**: it is written only by SECURITY DEFINER functions, so
      append-only means append-only. Reading it back (the Audit Log screen, 8.3) stays deferred,
      because recording a decision is urgent and reading the record is not.
- [x] **The over-cap note is enforced by the database, not the form.** Approving beyond what is
      left of a member's limit is allowed — Clarix informs, it never gatekeeps a cooperative's
      own decision — but `decide_loan_application` refuses it without a reason, and the reason
      lands in `audit_log.note`. The outcome ruled out was asking for a justification and
      dropping it on the floor.
- [x] **One function makes the whole decision** (migration 014): the loan's status, the audit
      entry, the member's notification, and the reason. Two of those tables accept no client
      write by design, so a single SECURITY DEFINER function is what keeps them closed and the
      set atomic. It also refuses an officer whose permissions do not include approving loans,
      which is the first time the preset from blueprint 2.5 actually bites.
- [x] **Rejecting releases the hold immediately.** A rejected loan counts towards nothing, so the
      member's capacity is free for their other requests the moment it commits — proven in pgTAP
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
      components the setup sequence uses without the wizard chrome — which is what the blueprint
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
      the change working, not a regression — but it also surfaced that the `users` policy reaches
      members *through* `cooperative_memberships`, so gating that table also gates reading a
      member's own record. Coherent, and worth writing down: "can see the member list" means "can
      see member records". No assertion was weakened; each suite now gives its officer the
      permission that gets them to the boundary under test, because an officer who can see
      nothing proves nothing about boundaries.
- [x] **Default-deny, with admins exempt.** An officer starts with nothing; an admin passes every
      check implicitly, per `docs/DATA-MODEL.md`, which is what stops an admin locking themselves
      out of their own cooperative with a mis-tap. No officer exists anywhere yet, so default-deny
      cost nobody their access.
- [x] **Removal revokes rather than deletes**, keeping who granted the role and when — and it
      touches nothing else that person holds, because every relationship in Clarix is scoped to
      its own cooperative.
- [x] **Monthly Reconciliation Entry (7.5)** with the period selector, the expected-versus-received
      table, per-row saves as each figure is entered, and an automatic shortfall flag. The
      shortfall is arithmetic where it is displayed, never a third stored number that could
      disagree. The expected figure IS stored, because what was expected at the time is the fact
      worth keeping — a loan completed since must not rewrite last month's history.
- [x] **Migration 016** adds `deduction_reconciliation`, specified in `docs/DATA-MODEL.md` from
      the start and never migrated until now, with RLS that lets a cooperative's staff read their
      own rows and the member read their own months. pgTAP suite 008 covers the permission
      boundary and the table.

- [x] **Notifications (8.1) is the employee screen's component over the same query.** One
      notifications table, one read-and-mark-read pattern, one unread dot — a second list UI would
      have been two things to keep in step for no gain. Nothing writes an admin-facing
      notification yet and the screen says so rather than being padded: the only writer,
      `decide_loan_application`, notifies the member whose loan was decided. What an admin needs
      today is on the dashboard, where Attention required already lists it.
- [x] **Cooperative Audit Log (8.3) reads the real table**, scoped by policy to the admin's own
      cooperative, with the date-range, action and search filters the blueprint asks for. It
      already has something to show: the approval walked through last session. Entries carry the
      old value beside the new — a log that only names its events is one you can count, not one
      you can review.
- [x] **Fields that only exist after an action are shown as context, not as changes.** Drawing
      `over_cap` or `available_before` with an arrow from nothing would invent a "before" that
      never existed. Caught by looking at the screen, and fixed in the reader rather than by
      changing what is recorded.
- [x] **Profile / Settings (8.2)** — the same three sections as the employee's, through the same
      components and the same server actions, deliberately without a salary section: being an
      admin does not imply being a beneficiary member anywhere. An account that also holds
      memberships gets the "Switch to my member view" link the blueprint describes, which is the
      multi-role model made visible rather than explained.
- [x] **Help / Support (8.4)** — fifteen answers under Managing members, Loans and eligibility,
      and Cooperative settings, each describing what an admin can actually do today, plus the
      same contact form and the same provisional support address (D026). Where the honest answer
      is that something is not built — correcting a recorded figure, marking a loan repaid — it
      says so.
- [x] **The audit log's read scope is covered by pgTAP** (suite 007, extended): a cooperative's
      own staff read their own entries, and nobody else reads any of it — including the member
      the entries are about, because this is a staff record.

### Cooperative officer, Parts 1 to 4

- [x] **Accept Invite (1.1) and Log In (1.2) needed no new code, which was checked rather than
      assumed.** `staff_invitations` and `invite_cooperative_staff()` were written generically by
      role from the start. An officer invitation was issued from the admin's own Officers screen
      (7.2), and because that email already had an account the function took its existing-account
      branch and wrote a `cooperative_staff_roles` row at `invited` — exactly the case the
      officer blueprint describes. Signing in routed straight to the invitation screen, which
      showed "Welcome back — this invitation is on your account", named the cooperative and the
      title the admin had set, and activated the role on one tap. The only change was where it
      leads afterwards: a brand-new officer account now goes to the tour, an existing one goes
      straight to Officer Home, per blueprint 1.1.
- [x] **Welcome to Cooperative Officer (2.1)** at `/officer/welcome` — two slides rather than
      three, no "skip setup" language because there is no setup to skip. Slide one is assembled
      per person rather than per role: it lists what this officer has actually been granted, and
      says so in plain words. An officer granted nothing is told that plainly instead of being
      shown an empty promise.
- [x] **The officer's navigation (Part 3)** — Home, Members, Loans, and the account cluster, with
      no "Manage cooperative" section and no audit log anywhere. "Import members" appears as a
      direct row only when `can_import_members` is granted. Verified as a real officer: the
      sidebar carried three primary rows plus Notifications, Profile and Help, More showed only
      the Account group, and the import row appeared the moment the permission was switched on.
- [x] **Officer Home (4.1)** — a greeting, then a persistent search field above everything else,
      because finding a member fast is this role's most common single action. Below it a pending
      task list that adapts: an officer who can decide loans sees the applications waiting, one
      who cannot is told what would appear there and why nothing does. Then a light "Today"
      strip — members this officer recorded against today, applications the cooperative received
      today — rather than the admin's cooperative-wide figures.
- [x] **Every screen an officer may not use turns them away, not just the menu.** `/admin/manage/*`
      and `/admin/audit` redirect to the officer's home, and `/admin/members/new` to the member
      list. Checked by requesting each URL directly while signed in as an officer.
- [x] **Two boundaries the blueprint exposed are now in the database.** Migration 017 makes
      writing a roster entry — importing, or adding one member — take `can_import_members`, which
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
      the application itself stayed readable — which is correct, since reading is what the
      blueprint gives every officer who can see members.
- [x] **Recording a repayment shares one permission with recording a contribution**, which was
      checked rather than assumed. `savings_transactions_insert_staff` never looks at the row's
      type, so both are `can_record_savings`, exactly as both blueprints describe. pgTAP suite 008
      now pins that: a repayment is refused without the permission and lands with it, and it does
      not move the savings balance.
- [x] **An officer's decision was taken end to end, with the permission granted through the real
      Officer Management screen and set back afterwards.** The approval moved the loan to active,
      wrote the member's notification, and wrote an audit row naming the officer as the actor —
      then that same officer could not read the entry they had just caused, while the admin could.
      That is officer blueprint 5.4 ("written regardless of which role recorded it, even though
      only an Admin can later view that log") demonstrated rather than asserted.
- [x] **Notifications (8.1) needed no new code** — the same table, query and component every role
      shares, scoped by who a notification is addressed to rather than by any role. Only the empty
      state is role-aware, because the events an officer is waiting for are different ones.
- [x] **Profile (8.2) gained the one genuinely new piece:** a read-only "Your role at
      [Cooperative]" panel carrying the title the admin set and a plain-language list of what is
      currently granted. Nothing ungranted is shown crossed out or greyed — it is simply absent,
      and a line underneath says who decides. Reviewed in both themes.
- [x] **Help (8.3)** — ten answers under the two categories the officer blueprint names, none of
      them about a screen this role cannot open, and each honest where the answer is that
      something is not built. Same contact form, same provisional support address (D026).
- [x] **A real bug was found and fixed while verifying this.** `cooperative_staff_roles` has two
      foreign keys into `users` — `user_id` and `granted_by` — so the unqualified `users(...)`
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
      — see below.

**Built this session:**

- [x] **Log In (1.1, 1.2) needed no new code.** Signing in as the seeded account routes to
      `/platform`, because `landingPathFor()` now checks the platform flag first: operating the
      platform is this account's primary purpose "even if this account also happens to hold an
      ordinary cooperative membership or staff role somewhere". The PWA prompt (1.3) is the same
      component every other role uses.
- [x] **Welcome (2.1)** — one screen, one Continue button, no slides, because this role belongs to
      the operator "who already understands the product deeply". Its only job is the boundary: this
      account manages cooperatives, not their members' money.
- [x] **The navigation (Part 3) is flat, and the flatness is the design.** Eight direct rows, no
      "Manage" submenu and no collapsible rail, per the blueprint's own reasoning that this role's
      scope "is small enough that everything fits as a direct, visible entry". Nothing in it
      reaches a member's savings, loans or salary.
- [x] **Platform Dashboard (4.1)** — the same tap-to-expand KPI row every dashboard uses, over four
      counts rather than money. The employee figure is organization-wide headcount and can only
      ever be a count: the function behind it returns a single integer, so there is no version of
      that card that becomes a directory of people. "Attention required" watches invitations and
      says plainly that access requests are not built rather than implying it watches them.
- [x] **Cooperative Directory (5.1), Detail (5.2) and Create (5.3)**, walked end to end against the
      live project: a cooperative was created, its note stored, its admin invitation issued, and it
      was deactivated and reactivated through the Timed Undo — which runs before the write, so the
      undo genuinely undoes.
- [x] **5.2 has no view-members or view-loans action, and that absence is load-bearing.** Verified
      by eye rather than assumed: the screen carries counts and a status, and there is nothing on
      it to click through to a person. Reaching that data stays with the Part 7 access-request
      flow, which does not exist.
- [x] **Creating a cooperative reuses the real invitation path.** `invite_cooperative_staff()`
      already did exactly what 5.3 needs; what it refused was the caller, since a Super Admin
      creating a brand-new cooperative can never be its active admin. Migration 019 widened that
      one check to admit a platform admin — one function, two legitimate callers, rather than a
      second invitation path for D027 to drift away from.
- [x] **Two fields the blueprint asks for had nowhere to live, and neither was quietly dropped.**
      The operator's internal note now has its own platform-admin-only table (migration 021, after
      migration 020 put it on `cooperatives` and that proved unscopable — the cooperatives row is
      readable by every signed-in user and RLS cannot hide one column). The intended admin's name
      is kept on the invitation (migration 022), so a freshly created cooperative reads as
      somebody's in the directory rather than nobody's while the invitation sits unaccepted.
- [x] **The boundary was checked from both sides.** As a cooperative admin, every `/platform` route
      redirects away, and both aggregate functions raise `42501`. As the platform admin, the
      directory returns a member count of 1 for a cooperative whose membership rows the same
      caller reads as zero. pgTAP suite 010 pins all of it.

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
      every account currently lands on the review screen with the fields blank and editable —
      which is the degradation path blueprint 2.4 already specifies for a failed read. The
      upload itself is real, and the processing steps name only work that genuinely happens
      rather than inventing a "reading your payslip" stage for something nothing is doing.
      Building it means adding a PDF text-extraction dependency, which needs a TOOLING-POLICY.md
      check and a SECURITY.md entry first, because it would see payslip files in cleartext.
- [ ] **A cooperative-admin invitation for `coop.admin@fmcabeokuta.org.ng`**, holding an
      `invited` admin role at Staff Multipurpose Cooperative (test data) — the one seeded
      cooperative with nothing set up, so the setup sequence has somewhere real to run. **Delete
      it with the rest of the test data before go-live.**

      Its password was generated inside the database from `gen_random_uuid()` and unseen by
      anybody, so it was set by a one-off administrative statement against the live project and
      the role has since been activated: the account is now an **active** cooperative admin. The
      password is `ClarixTest-Coop-2026`, which is safe to write down here only because this
      account is test data that goes before go-live.
- [ ] **Four roster entries and one staff invitation at that same cooperative**, written through
      the real screens while reviewing them: staff IDs 204817, 300121, 300122 and 300123, of
      which 204817 matched the pilot tester and became an active membership carrying the imported
      145,000 — the roster-linking trigger doing its job, and also why that account now shows a
      third cooperative. The invitation to `test.officer@fmcabeokuta.org.ng` is still unclaimed,
      and cannot be claimed: creating that account needs either a sending domain or one permitted
      `insert` into `auth.users`, neither of which exists yet. All of it goes before go-live with
      everything else.
- [ ] **The pilot tester now also holds an active officer role** at Staff Multipurpose
      Cooperative (test data), titled Secretary, invited through the admin's own Officers screen
      and accepted through the real invitation screen while verifying the officer blueprint.
      Its permissions are the record-only preset: see members, record entries, no approving and
      no importing. Two consequences worth knowing before using that account for employee-side
      testing: its password was reset to `ClarixTest-Officer-2026`, and signing in now lands on
      the officer home at `/admin` rather than the employee dashboard, which is still reachable
      at `/dashboard`. Remove the role, or the whole account, with the rest of the test data.

      That role was used to verify Parts 5 to 8 and left four things behind at that cooperative,
      all of which go with the rest of the test data: a fifth roster entry, staff ID 300124
      ("Kemi Alabi"), added through the officer's own Add member screen; a ₦100,000 loan
      submitted by that account on the employee side and then **approved by it on the staff
      side**, which is now active at ₨8,333 a month; the member notification that approval wrote;
      and the audit-log entry naming the officer as the actor. Its permissions were temporarily
      widened to all four through the real Officer Management screen and set back to record-only
      afterwards, so what is stored now is what that screen actually granted.
- [ ] **A test Super Admin, `super.admin@fmcabeokuta.org.ng`**, seeded directly into
      `auth.users` and `platform_admins` because blueprint 1.1 describes the first one as a
      one-time database entry and there is no screen that could create it. Its password is
      `ClarixTest-Platform-2026`. **This is provisional on purpose** — the real operator account
      is a deliberate decision to be made closer to go-live, not guessed at now — so delete this
      one with the rest of the test data.

      Worth knowing for the next account created this way: GoTrue refuses to sign in a row whose
      token columns are NULL, which reads as "that email address and password don't match an
      account" even though the hash is correct. Set `confirmation_token`, `recovery_token`,
      `email_change`, `email_change_token_new`, `email_change_token_current`, `phone_change`,
      `phone_change_token` and `reauthentication_token` to empty strings.
- [ ] **A fourth cooperative, `Nursing Staff Cooperative (test data)`**, created through the real
      5.3 screen while verifying it, along with its internal note and an unclaimed admin
      invitation to `nursing.admin@fmcabeokuta.org.ng` in the name of "Folake Adeniyi". It sits
      inactive, which is correct for a cooperative whose admin has not accepted. Goes with the
      rest of the test data.
- [ ] **Test data is seeded in the live database and must be deleted before go-live.** All of
      it was written directly rather than in a migration, the same way the pilot test account
      was, so none of it will follow the schema into production by accident. What exists: three
      cooperatives carrying a "(test data)" suffix so they cannot be mistaken for real FMC
      Abeokuta cooperatives; nine loan products across them, six public; the pilot tester holding
      an active membership at two of them plus one pending application; four loans against those
      memberships — an active 360,000 over 24 months, a reserved 180,000 over 12 months, a
      completed 120,000, and a 120,000 reservation created through the application screen during
      verification; and 26 `savings_transactions` rows backing 330,000 of savings and the
      repayment history the active loan's progress is computed from. **One of those reservations
      is now an approved, active loan**: the 120,000 at Allied Health Savings Cooperative was
      approved through the real review screen while checking Part 6, which also produced the
      project's first notification row and first audit-log entry.
- [ ] **Nothing writes a notification row.** The table, its policies and the screen are real and
      were exercised against the live project, but the list will stay empty until the cooperative
      admin/officer blueprint can approve a loan, accept a membership, or publish a package
      (D025). Expected, and stated on the screen itself.
- [ ] **The Help contact form cannot deliver yet.** It posts to Resend's API against
      `RESEND_API_KEY`, which is not provisioned, and even once it is, Resend will only deliver
      to the account owner until a sending domain is verified — the same blocker holding up
      signup mail. Until then the form fails honestly and the screen shows `support@clarix.ng` as
      a mailto link, which is the path that works. The address itself is provisional (D026) and
      needs the domain question settled.
- [ ] `src/app/dashboard/page.tsx` is a **deliberate placeholder**, not blueprint 6.1. It exists
      so Log In lands somewhere honest and so the install prompt has its correct home. Replace it
      wholesale when the real dashboard is built.
- [ ] `/privacy` and `/reset-password` are linked from the auth screens but not built.
- [ ] Notification preferences govern email that nothing sends yet. The toggles write to the
      database and are read back correctly; what reads them at send time arrives with the
      notification writers.
- [ ] The remaining tables from `docs/DATA-MODEL.md`: `deduction_reconciliation`,
      `access_grants`, `audit_log`.
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
      and the notification categories for them do not exist in the enum either — adding them
      before something writes them would be speculative schema. The dashboard's Attention
      required covers the same ground today.
- [ ] **Reports (7.6)**, deferred by the blueprint's own P1 marking rather than by omission.
- [ ] Every loan transition after reservation — approve, reject, complete, and the expiry sweep.
      Those belong to the cooperative admin/officer blueprint, and the employee-facing flow
      deliberately only ever produces `reserved`.
- [ ] The pgTAP workflow still only runs on a pull request touching `supabase/migrations/**`
      or `supabase/tests/**`. That is deliberate — it is the only expensive check — but it means
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
- [ ] A test account, `pilot.tester@fmcabeokuta.org.ng`, exists in `auth.users` and was created
      directly in the database rather than through signup. **Delete it before go-live.**
- [ ] No screen has been reviewed on a real phone. The 390px review was done in a same-origin
      iframe, which gives CSS media queries a genuine narrow viewport but not real touch
      targets, real safe-area insets, or iOS Safari's own rendering.

## Accounts inventory

| Service                               | Status                                                    | Notes                                                                                                    |
| ------------------------------------- | --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Supabase                              | **Live, schema applied** (ref `sxugaizwmqigtioqgefx`)     | Region `eu-west-1` (Ireland), Postgres 17.6. Fourteen tables, one private Storage bucket, one seeded organization. The unrelated project in the same org is untouched. |
| GitHub                                | **Repo created:** `temiloluwa-adebayo/clarix` (private)   | Commits correctly authored and verified by GitHub. PR #1 merged the employee blueprint to `main`; Actions runs the pgTAP suites on any PR touching `supabase/`. Branch protection is not on yet. |
| Vercel                                | **Project building this repo: `clarix_app`**               | Serves `clarix-3w5i.vercel.app`, now from a **production** deployment off `main` rather than a Preview. A separate project also named `clarix-3w5i` exists — possibly redundant, still to be confirmed and removed. |
| Resend                                | **Custom SMTP wired** to `smtp.resend.com:465`            | Sender is still `onboarding@resend.dev`, which Resend restricts to the account owner's own address, so signup mail reaches nobody else. A verified sending domain is needed before go-live. |
| AI payslip OCR API (Claude or OpenAI) | Not yet decided/provisioned                               | P1 feature.                                                                                               |

## Immediate next steps (in order)

1. **Verify a sending domain in Resend and point the sender at it.** Custom SMTP is already
   wired to `smtp.resend.com:465` and the built-in rate limiter is gone, but the sender is
   still `onboarding@resend.dev`, which Resend restricts to the account owner's own address.
   Signing up any other address now fails with "Error sending confirmation email" — a different
   failure from before, and the last thing blocking self-service signup.
2. Review the production site on an actual phone, which the iframe-based review cannot stand
   in for. A password-verified sign-in there closes the last part of the environment check.
3. Decide the permanent Vercel project name, and remove the redundant `clarix-3w5i` project if
   it is not serving anything.
4. Turn on branch protection for `main`, so the database check blocks a merge rather than merely
   reporting.
5. Delete the `pilot.tester@fmcabeokuta.org.ng` account, its uploaded probe payslip, and all
   the seeded test data catalogued above, before go-live. That account now also carries a
   fictional phone number and one muted-then-restored notification preference, both written
   through the Profile screen while verifying it.
6. Finish the **super admin blueprint**: Part 6 (organization-wide policy), Part 7 (the platform
   audit log, and the access-request flow that is the one deliberate exception to this role having
   no sight of member data), Part 8 (managing platform admins — note that `platform_admins` has no
   insert policy at all, so that screen needs one) and Part 9 (its account cluster). Access
   Requests deserves its own session: it needs the `access_grants` table, which is specced in
   `docs/DATA-MODEL.md` and does not exist.
7. Decide what happens to **submitting a loan application on a member's behalf** (officer
   blueprint 6.2). It is the one screen no role has: members apply for themselves, staff can only
   read and decide. The permission panel already names it as not built rather than pretending
   otherwise, so this is a scheduling decision rather than a hidden gap.
7. Settle where **loan completion and the expiry sweep** live. Neither blueprint assigns them a
   screen: marking a loan repaid in full and tidying a lapsed reservation to `expired` are real
   gaps in the loan lifecycle rather than deferred features. Capacity is already correct without
   the sweep, because expiry is evaluated at read time (D024), so this is about the record
   reading true rather than about the arithmetic.

## Decision/scope drift check

Before starting any new work session, re-read `DECISIONS.md` in full and skim this file's
checklist. If something in the codebase already contradicts a locked decision, that's a bug to
fix, not a signal to update the decision — update the decision only through a new dated entry in
`DECISIONS.md` if the change is genuinely deliberate.
