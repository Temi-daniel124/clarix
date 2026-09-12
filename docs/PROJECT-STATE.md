# PROJECT-STATE.md — Clarix

**Authority level: 3.** This is a **living document** — unlike every other file in `docs/`, it is
expected to change constantly. Update it at the end of every work session, and especially at
every milestone (an account created, a repo initialized, a schema pushed, a feature accepted). An
agent picking up this project cold should read this file first, right after `DECISIONS.md`, to
know exactly what already exists and what doesn't.

**Last updated:** 2026-09-12 (Part 6, closing the employee blueprint: Notifications, Profile /
Settings and Help / Support, with the `notifications` table and the notification-preferences
column behind them).

## Phase

**Planning complete. Infra live. The employee blueprint is complete — Parts 1 to 6, every
screen built.** Landing page, auth, onboarding, the persistent navigation shell, the home-base
screens, the loan side with the reservation transaction that is the product's core mechanism,
and now the account cluster: Notifications, Profile / Settings and Help / Support. Every screen
has been walked in a browser against the live project, in both themes at both widths. There are
no holding screens left anywhere in the employee app.

What remains is the **cooperative admin/officer blueprint**, which owns every loan transition
after reservation and is also what will write the first notification row.

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

## What does not exist yet

- [ ] **Self-service signup still cannot complete**, though it has moved forward. Custom SMTP is
      now wired to `smtp.resend.com:465`, so Supabase's built-in sender and its rate limit are
      out of the picture. What remains is the sender address: `onboarding@resend.dev` is
      Resend's shared testing sender and only delivers to the Resend account owner's own email,
      so a signup from any other address fails with "Error sending confirmation email". Verifying
      a real sending domain closes this. Until then, accounts are created directly in the
      database.
- [ ] **`NEXT_PUBLIC_SUPABASE_ANON_KEY` is set locally but its value in Vercel is unverified.**
      All five variables exist in the Vercel project as Secret-type entries, which means they
      cannot be read back out to confirm they match.
- [ ] **Automatic payslip extraction.** MVP-SCOPE.md puts this at P1, and it is not built, so
      every account currently lands on the review screen with the fields blank and editable —
      which is the degradation path blueprint 2.4 already specifies for a failed read. The
      upload itself is real, and the processing steps name only work that genuinely happens
      rather than inventing a "reading your payslip" stage for something nothing is doing.
      Building it means adding a PDF text-extraction dependency, which needs a TOOLING-POLICY.md
      check and a SECURITY.md entry first, because it would see payslip files in cleartext.
- [ ] **Test data is seeded in the live database and must be deleted before go-live.** All of
      it was written directly rather than in a migration, the same way the pilot test account
      was, so none of it will follow the schema into production by accident. What exists: three
      cooperatives carrying a "(test data)" suffix so they cannot be mistaken for real FMC
      Abeokuta cooperatives; nine loan products across them, six public; the pilot tester holding
      an active membership at two of them plus one pending application; four loans against those
      memberships — an active 360,000 over 24 months, a reserved 180,000 over 12 months, a
      completed 120,000, and a 120,000 reservation created through the application screen during
      verification; and 26 `savings_transactions` rows backing 330,000 of savings and the
      repayment history the active loan's progress is computed from.
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
- [ ] **Leaked-password protection is disabled** in Supabase Auth. The advisor recommends
      enabling it (it checks new passwords against HaveIBeenPwned), which is a cheap win for a
      product holding salary data. It is a project setting, so it needs your decision rather
      than a code change.
- [ ] The remaining tables from `docs/DATA-MODEL.md`: `deduction_reconciliation`,
      `access_grants`, `audit_log`.
- [ ] Every loan transition after reservation — approve, reject, complete, and the expiry sweep.
      Those belong to the cooperative admin/officer blueprint, and the employee-facing flow
      deliberately only ever produces `reserved`.
- [ ] The pgTAP suite has **never actually executed** — it runs only on a pull request touching
      `supabase/migrations/**` or `supabase/tests/**`. Its assertions were each verified by hand
      against the live project, but the file itself is unproven until CI runs it.
- [ ] `RESEND_API_KEY` / `AI_PAYSLIP_API_KEY` not provisioned.
- [ ] A test account, `pilot.tester@fmcabeokuta.org.ng`, exists in `auth.users` and was created
      directly in the database rather than through signup. **Delete it before go-live.**
- [ ] No screen has been reviewed on a real phone. The 390px review was done in a same-origin
      iframe, which gives CSS media queries a genuine narrow viewport but not real touch
      targets, real safe-area insets, or iOS Safari's own rendering.

## Accounts inventory

| Service                               | Status                                                    | Notes                                                                                                    |
| ------------------------------------- | --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Supabase                              | **Live, schema applied** (ref `sxugaizwmqigtioqgefx`)     | Region `eu-west-1` (Ireland), Postgres 17.6. Ten tables, one private Storage bucket, one seeded organization. The unrelated project in the same org is untouched. |
| GitHub                                | **Repo created:** `temiloluwa-adebayo/clarix` (private)   | Commits correctly authored and verified by GitHub.                                                        |
| Vercel                                | **Project building this repo: `clarix_app`**               | Serves `clarix-3w5i.vercel.app`. A separate project also named `clarix-3w5i` exists — possibly redundant, still to be confirmed and removed. |
| Resend                                | **Custom SMTP wired** to `smtp.resend.com:465`            | Sender is still `onboarding@resend.dev`, which Resend restricts to the account owner's own address, so signup mail reaches nobody else. A verified sending domain is needed before go-live. |
| AI payslip OCR API (Claude or OpenAI) | Not yet decided/provisioned                               | P1 feature.                                                                                               |

## Immediate next steps (in order)

1. **Verify a sending domain in Resend and point the sender at it.** Custom SMTP is already
   wired to `smtp.resend.com:465` and the built-in rate limiter is gone, but the sender is
   still `onboarding@resend.dev`, which Resend restricts to the account owner's own address.
   Signing up any other address now fails with "Error sending confirmation email" — a different
   failure from before, and the last thing blocking self-service signup.
2. Confirm the Vercel environment variables really hold the same Supabase URL and anon key as
   `.env.local` — they are stored as Secret-type entries and cannot be read back to check.
3. Review the Preview deployment on an actual phone, which the iframe-based review cannot stand
   in for.
4. Decide the permanent Vercel project name, and remove the redundant `clarix-3w5i` project if
   it is not serving anything.
5. Enable leaked-password protection in Supabase Auth.
6. Delete the `pilot.tester@fmcabeokuta.org.ng` account, its uploaded probe payslip, and all
   the seeded test data catalogued above, before go-live. That account now also carries a
   fictional phone number and one muted-then-restored notification preference, both written
   through the Profile screen while verifying it.
7. Build the cooperative admin/officer blueprint, which owns approve, reject and complete, and
   the expiry sweep that tidies lapsed reservations. Capacity is already correct without that
   sweep — expiry is evaluated at read time per D024 — so it is housekeeping, not a gap.

## Decision/scope drift check

Before starting any new work session, re-read `DECISIONS.md` in full and skim this file's
checklist. If something in the codebase already contradicts a locked decision, that's a bug to
fix, not a signal to update the decision — update the decision only through a new dated entry in
`DECISIONS.md` if the change is genuinely deliberate.
