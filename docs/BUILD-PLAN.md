# BUILD-PLAN.md, Clarix Release 2

**This is where every session starts.** Find the first step that is not ticked, read the documents it
names, build only that step on its own branch, open a pull request with the Preview link, and stop.
The owner reviews the Preview and decides when it merges (D032). Tick the step here in the same PR.

Authority: this file orders the work; it never overrides `docs/DECISIONS.md`. If a step here seems to
conflict with a decision, the decision wins and you raise it.

## How a step is done

- **One step = one branch = one PR.** Branch name `r2/<phase>-<step>-<short-name>`, for example
  `r2/0-1-store-over-limit-applications`. Small enough for the owner to review in 15 minutes.
- **PR description:** what changed, which decisions and `docs/EDGE-CASES.md` cases it covers, the
  Preview URL, phone (390px) and desktop (1440px) screenshots of every changed screen, and a
  "How to check it" list the owner can follow with the demo accounts.
- **Migrations:** written as files under `supabase/migrations/`, tested by pgTAP in GitHub Actions.
  Applied per D043: additive migrations may be applied from the branch; anything that changes what
  `main` relies on is applied only when the owner says "merge". The PR title says which.
- **Tests:** unit tests for every pure function (eligibility, parsers, import mapping, price
  calculation); pgTAP for every RLS policy and database function you add or change.
- **Done means:** acceptance criteria below all pass, `npm run lint`, `npm run typecheck`, `npm test`
  and `npm run build` pass (`typecheck` is added in 0.2), the DB tests pass in CI, and the screen passes `DESIGN_SYSTEM.md` §11.

## Overview

| Phase | What | Why this order |
|---|---|---|
| 0 | Fix what is broken in the live product | It is live, and FMC will be shown it |
| 1 | Design foundation | Every later screen builds on these tokens and components |
| 2 | Brand files and SEO | Small, visible, and needed by the landing page |
| 3 | Generalisation and copy sweep | Removes FMC from the structure, not just the words |
| 4 | Home screens (all four roles) | Biggest visible change for the FMC demo |
| 5 | Public site, sign in, sign up, onboarding | The first thing a new cooperative sees |
| 6 | Inner screens, role by role | Brings every remaining screen to the new standard |
| 7 | Income evidence (bank statements, declared income) | Needs Phase 3's schema |
| 8 | Import v2, existing loans at scale, exports, statements | The books around the check |
| 9 | Trial, subscription and billing | Only matters once a second cooperative arrives |

Phases 0 to 4 are the target before the FMC demonstration. Phases 5 to 9 follow in order; within a
phase, steps are in dependency order.

---

## Phase 0: fix what is broken in the live product

### ☑ 0.1 Store over-limit applications (D040)
Read: D040, `docs/DATA-MODEL.md` → Eligibility, `docs/EDGE-CASES.md` E05, E06.
- Migration: add `pending_review` to the loan status enum, `over_capacity boolean not null default false`
  and `shortfall_at_submission numeric(14,2)` to `loans`. Change `submit_loan_application` so that
  when the monthly repayment exceeds available capacity (or the member's limit is "Not assessed yet")
  it **inserts** the loan as `pending_review`, `over_capacity = true`, with no reservation expiry.
- `capacity_core` must not count `pending_review` loans in committed.
- Staff queue: these appear under Waiting with an "Above limit by ₦X" chip. Approving one still needs
  the written reason (existing rule) and moves it to `active`.
- Member confirmation copy exactly as D040.
- **Accept when:** a pgTAP test proves an over-limit submission is stored, holds no capacity, appears
  to staff, and can be approved with a reason; the member sees the right confirmation; the old
  "returns without inserting" path no longer exists.

### ☑ 0.2 Make `npm ci` pass
- Regenerate `package-lock.json` with the pinned Node version (`.nvmrc` or `engines`), no dependency
  changes. Add `npm ci` as the first CI step, and a `typecheck` script (`tsc --noEmit`) run in CI.
- **Accept when:** a fresh clone runs `npm ci && npm run build` with no errors in CI.

### ☑ 0.3 Let staff enter a loan a member already owes (D036)
Read: D036, `docs/planning/clarix-documents-blueprint.md` §3, `docs/EDGE-CASES.md` E08.
- Migration: `loans.origin` (`clarix` | `pre_existing`), `outstanding_balance_at_entry`,
  `expected_end_date`. A `pre_existing` loan is created directly as `active`, never passes through
  reservation, and counts in committed from the moment it is saved.
- Admin (and officers with the record permission): Member sheet → Loans → "Add existing loan":
  product (optional), original amount (optional), outstanding balance, monthly repayment, start
  month, expected end month. Audit-logged.
- **Accept when:** adding an existing loan immediately lowers that member's available figure at every
  cooperative; pgTAP covers RLS (an officer at another cooperative cannot create one) and the
  committed sum; the bulk version waits for 8.2.

### ☑ 0.4 Mark every Preview as using the live demo data (D043)
- Preview and Production share one database by the owner's decision. Add a 32px `amber-50` strip
  with `amber-700` `small` text "Preview · uses the live demo data" at the top of every page when
  `VERCEL_ENV !== "production"`. It does not scroll away on phones and is not dismissible.
- Add a `supabase/seed/README.md` stating that the demo data is never reset or deleted without the
  owner (D043.2), and how to create and remove a throwaway test cooperative.
- **Accept when:** the strip shows on the Preview and not on Production.

### ☑ 0.5 Fix the stale and contradictory figures on the live homes
Observed in the live walkthrough (`docs/REFERENCE-STUDY.md` §1):
- Admin home "Members 8" vs Members list "15 members" vs Platform list "7": define one rule (members
  = active memberships + roster entries not yet on Clarix, shown as "15 members, 8 on Clarix") and
  use one query everywhere.
- Member home "Current as of 15 March at 21:55" in November: the timestamp must be the latest ledger
  or loan change, and say "Updated today" / "Updated 3 days ago".
- Admin loans "3 requests have been waiting past their hold" while the list says "Nothing is waiting":
  show the lapsed group as its own segment with a count, never contradict it in the same view.
- **Accept when:** a unit test per rule, and the three screens agree on the demo data.

### ☑ 0.6 Every loan status change goes through `decide_loan_application`
Found while building 0.1 (logged in `docs/PROJECT-STATE.md` → Known defects).
- Migration: drop the `loans_update_staff` policy (migration `20260912054608`), which lets any
  active staff member `update` a loan row directly through the API, skipping the written reason,
  the audit entry and the member's notification. Drop `loans_insert_staff` from the same migration
  for the same reason: it lets staff insert an `active` or `pre_existing` loan directly, around
  `record_existing_loan`'s permission check and audit entry (found while building 0.3). Every change of status then goes through a
  SECURITY DEFINER function: `decide_loan_application`, `complete_loan`,
  `expire_lapsed_reservations` (and `record_existing_loan` from 0.3).
- Before writing it, list every app code path that updates `loans` directly and move each onto an
  RPC in the same PR. This removes something `main` uses, so it applies only at merge (D043).
- **Accept when:** pgTAP proves an admin and an officer with `can_approve_loans` cannot `update` a
  loan row directly (status, monthly repayment or expiry), while the four functions still work; no
  `.from("loans").update(` remains in `src`.

---

## Phase 1: design foundation

Read for every step: `DESIGN_SYSTEM.md` in full.

### ☑ 1.1 Tokens, light only, Figtree
- Replace the token block in `src/app/globals.css` with `DESIGN_SYSTEM.md` §4.1–4.5. Map them into
  Tailwind 4 `@theme`. Delete the dark block, every `dark:` class, `src/components/theme/*`, the
  ThemeScript in `src/app/layout.tsx`, and set `themeColor` to `#F7F7F4` only.
- Load Figtree via `next/font/google` (400, 500, 600, 700, variable `--font-figtree`). Verify tabular
  figures in Chrome, Safari and Android Chrome with a test page of rolling numbers; record the result
  in D038's place in `docs/PROJECT-STATE.md`. If it fails, money figures use Inter.
- Add the motion names (`fadeQuick`, `scrollReveal`, `heroCrossfade`) to `src/lib/motion.ts`.
- **Accept when:** `grep -r "dark:" src` returns nothing; no screen has a theme toggle; every screen
  renders in Figtree on the Preview; a screenshot pair (before/after) for five screens is in the PR.

### ☑ 1.2 Buttons, inputs, chips, segmented control
- Rebuild `src/components/ui/button.tsx` with the five variants in §5.1 (pill, heights, pressed
  scale, inner spinner). Inputs per §5.2 including the `₦` money input and `+234` phone input.
  Chips and Continuous Tabs per §5.6.
- Replace every bespoke button in `src` with the shared one.
- **Accept when:** a `/dev/components` route (Preview only, `notFound()` in production) shows every
  variant and state; no non-pill button remains.

### ☑ 1.3 Sheet and side panel
- One `Sheet` component (§5.4) on Base UI Dialog: phone detents, drag to dismiss, back button closes,
  desktop 440px right panel, focus trap, reduced motion. Try Base UI first; if drag on iOS Safari is
  not smooth, use `vaul` (pre-approved in `docs/TOOLING-POLICY.md`).
- **Accept when:** tested on a real iPhone and a real Android phone (owner's), with a short screen
  recording in the PR.
- **Built** on Base UI's Drawer (Base UI Dialog with swipe and snap points), so `vaul` was not
  needed. Chromium touch emulation and a recording are in the PR; the real-iPhone and real-Android
  check is the owner's, listed in `docs/PROJECT-STATE.md` → "Waiting on the owner".

### ☑ 1.4 App shells
- Phone: top bar, floating pill tab bar, centre "+" for staff, 112px bottom reserve on every scroll
  container (fixes the covered content in the live app).
- Desktop: 248px light sidebar, collapsible, command palette (`Ctrl/⌘ K`), cooperative switcher for
  staff who hold roles at more than one cooperative, and "Switch to my member view" for staff who are
  also members.
- **Accept when:** all four roles' shells pass §11 at 360/390/1280/1440px.
- **Built** as one `AppShell` (`src/components/shell/`) for member, admin, officer and platform, with
  the values recorded in DESIGN_SYSTEM §5.5. The screens inside are unchanged; they are rebuilt in
  Phases 4 to 6.
- Followed by three owner-requested refinements, each its own PR: 1.4a and 1.4b (the raised centre
  quick action, D051) and 1.4c (the D048 demo sign-in chips, pulled forward from 5.4).

### ☑ 1.4d Walkthrough fixes
The "Fix now" items from the owner's signed-in walkthrough of the 1.4c Preview
(`docs/WALKTHROUGH-1-4c.md`), before 1.5.
- One source for a member's loans and committed figure: the member home, the member's Loans screen
  and the cooperative's Members list (and member page) read rows through `loadLoanRows` and count
  them with `summariseLoans`. A database read error is thrown, never shown as "no loans".
- The savings sparkline reads only the member's own ledger and walks back from the real balance.
- One Africa/Lagos greeting helper for every home.
- The meter follows DESIGN_SYSTEM §3 in its one component; the ₦ sign is 0.6em `ink-500` 500.
- ~~The desktop sidebar pins only while it fits the window~~; replaced by 1.4e item 1.
- Short view-switch labels ("Switch to staff view", "Switch to platform").
- The account menu's dividers are real separators; the menu, items, arrow keys and Escape verified.
- **Accept when:** a test proves the three loan screens agree for one member, and the walkthrough's
  seven items are fixed at 360/390/1280/1440px.

### ☑ 1.4e Sidebar scroll and small fixes
- Sidebar (the owner's feedback, replacing 1.4d item 5): always pinned at the full window height;
  logo row, switcher and search fixed at the top, account row at the bottom; only the nav list
  between them scrolls, and only when it does not fit, with `overscroll-behavior: contain` and a
  thin scrollbar shown while hovering or scrolling. 1.4d's fits-the-window switch is gone. Nav rows
  36px and group labels 16px above / 4px below, so the full admin nav fits at 1280×800.
- Member home: no "No history yet" under Monthly deductions when loans are running.
- Loan cards: the next deduction is the next date on the loan's monthly schedule, never one in the
  past, and left out once the schedule has ended.
- The sign-in page's sample meter is the shared `MeterBar` with the §3 colours; its hydration
  mismatch under reduced motion is fixed.
- **Accept when:** the sidebar is checked at 585, 800 and 900px tall for member, admin and officer on
  a long and a short page, and the three small fixes at 360/390/1280/1440px.


### ☑ 1.5 Not-found, error and loading-failure pages
- Replace Next's default black 404 (it ignores the light theme, D037) and the bare error boundaries
  with designed pages in the Calm Ledger style: `src/app/not-found.tsx`, `src/app/error.tsx`,
  `src/app/global-error.tsx`, plus a `not-found` and `error` inside each signed-in shell so the
  sidebar and tab bar stay. One line that says what happened, one primary action (back to home, or
  try again), the small meter-ring line drawing from §7, no stack traces or error codes on screen.
- A page whose data fails to load says so in one line with a "Try again" that refetches, instead of
  rendering an empty screen that reads as "nothing here" (AGENT.md: nothing silently fails).
- **Accept when:** visiting an unknown URL, throwing in a route and failing a data read each show
  the designed page at 360/390/1280/1440px; no Next default page can be reached.
- **Built (r2/1-5-error-pages):** one `StatusPage` (ring drawing, one line, one action) behind
  `NotFoundPage` and `RouteError`; root `not-found`, `error` and `global-error` (own `<html>`, the
  shared `fonts.ts`); a `not-found` and `error` in the member, admin and platform shells, with an
  `[...missing]` catch-all in admin and platform so unknown URLs there keep the sidebar. Data reads
  on the member home, loans, admin members and officer home go through `must()`, which throws on a
  query error so the shell's "This page didn't load" with "Try again" (`retry()`) shows instead of an
  empty list. The admin Loans queue is left out until the 0.1/0.3 migrations apply (it reads their
  columns); it moves to `must()` in 6.5.
---

## Phase 2: brand files and SEO

### ☑ 2.1 Logo variation set
Read: `docs/BRAND.md`.
- SVG masters in `public/brand/`: primary, secondary (stacked), submark, favicon mark, mono navy, mono
  white, mono black. A `Logo` component with `variant` and `tone` props replaces `wordmark.tsx`
  everywhere. (`identity-mark.tsx` is the person's avatar, not the logo; restyle it to initials on
  `emerald-100` per `DESIGN_SYSTEM.md` §5.5 and drop its indigo tint.)
- PNG exports 16, 32, 180, 192, 512, 1024 and maskable 192/512; `src/app/favicon.ico`,
  `src/app/icon.png`, `src/app/apple-icon.png`.
- **Accept when:** a `/dev/brand` Preview page shows every variation on paper, white and navy, at
  minimum size; the browser tab, iOS home screen and Android install show the new mark.
- **Built (r2/2-1-logo-variations):** the masters and exports listed in `docs/BRAND.md` → "Files",
  with the exact construction under "As built"; `Logo` (`variant` primary, stacked or submark;
  `tone` default, on-navy, mono-navy, mono-white or mono-black) at all 12 places `Wordmark` was,
  which is deleted; `IdentityMark` is initials on `emerald-100`; `/dev/brand` on Preview and local
  only. The icons also move from the old `#16A57A` to the `emerald-500` token. The manifest still
  lists the SVG icons; its PNG icons and wording are 2.2.

### ☐ 2.2 SEO and app files (D047)
- `src/app/sitemap.ts`, `src/app/robots.ts`, update `src/app/manifest.ts` (name "Clarix", description
  without salary language, PNG icons, shortcuts "Apply for a loan" and "Record a payment"),
  `src/app/opengraph-image.tsx` (1200×630 navy card, primary logo, headline), per-page `metadata`,
  JSON-LD (Organization, SoftwareApplication) on `/`.
- `NEXT_PUBLIC_SITE_URL` drives every absolute URL. `VERCEL_ENV !== "production"` → robots
  `Disallow: /` and `noindex` everywhere.
- **Accept when:** `/sitemap.xml`, `/robots.txt`, `/manifest.webmanifest` and `/opengraph-image`
  return correct content on the Preview; a WhatsApp link preview of the Preview URL shows the card.

---

## Phase 3: generalisation and copy sweep (D034)

### ☐ 3.1 Schema: institution optional, member ID per cooperative
Read: D034, `docs/DATA-MODEL.md` → R2 planned schema, `docs/EDGE-CASES.md` E01–E03, E12.
- Rename the concept `organizations` → institution (keep the table name if renaming is risky; add a
  view or comment, and record the choice as a new decision). A cooperative may have no institution.
- `handle_new_auth_user` no longer attaches anyone to the oldest organisation. A person's institution
  link comes only from joining a cooperative that has one.
- Move `employee_id` off `users` into `cooperative_memberships.member_number` (label, pattern and
  "required or not" set per cooperative; default label "Member ID", no pattern).
- Repayment policy per cooperative (D035): basis, percentage, evidence max age. An institution cap can
  only lower it. Migrate FMC's five cooperatives to their current values so nothing changes for them.
- **Accept when:** pgTAP proves a new signup with no cooperative has no institution; FMC members'
  limits are identical before and after (snapshot test on the demo data); a cooperative with no
  institution can be created and used end to end.

### ☐ 3.2 Copy sweep
- Replace every FMC, Federal Medical Centre, IPPIS, hospital, "employee", "salary", "staff ID" and
  `fmcabeokuta.org.ng` string in `src` with the D034/D035 words (`DESIGN_SYSTEM.md` §8). Placeholders
  become `name@yourcooperative.ng`.
- Add a unit test that fails if any of those strings appear in `src` outside `supabase/seed/`.
- Rewrite the privacy notice for any cooperative (NDPA 2023), listing bank statements and declared
  income as data Clarix may hold (only once Phase 7 ships them; until then, say what is collected now).
- **Accept when:** the test passes and the owner reads the privacy notice on the Preview.

### ☐ 3.3 Onboarding without a salary
- Onboarding becomes: name and phone → join or find a cooperative → (optional) member ID → (optional)
  proof of income. A member can save and see their cooperatives with no income evidence; their limit
  shows "Not assessed yet" and applying sends a `pending_review` application (D040).
- **Accept when:** a member with no ID and no payslip reaches home in under 60 seconds on a phone.

---

## Phase 4: home screens (D039)

Read: D039, `DESIGN_SYSTEM.md` §5.3–5.5, the role blueprint's R2 header and "Home" section.

### ☐ 4.1 Member home
Header "Hi, Adebayo" + bell. Hero card: **Available to borrow** (rolling figure, meter, "of ₦161,838
repayment limit", `Declared` chip when relevant) and one primary "Apply for a loan". Stat row:
Savings (total), Loans (count and balance), This month (repayments). Each opens a breakdown sheet
(per cooperative). Needs you: up to 3 (decision on an application, a statement ready, evidence
expiring). Optional Highlights strip (D046). The insights strip and join prompt move to Cooperatives.

### ☐ 4.2 Cooperative admin home
"Hi, Funmilayo" + cooperative switcher chip. Hero: **Savings held** with this month's change. Stats:
Members (on Clarix / total), Active loans (value), Waiting (applications). Needs you: up to 3
(applications closest to hold expiry first, over-limit applications, unreconciled month, trial
ending). "+" sheet: Record a payment, Add a member, Add an existing loan, Import.

### ☐ 4.3 Officer home
Hero: **member search** (large field, recent members). One stat line "Recorded today: 4 entries,
₦62,000". Needs you: up to 3 tasks. "+" opens Record a payment.

### ☐ 4.4 Platform home
Hero: **Active cooperatives**, split trial / paid / read-only. Stats: Members, Invites pending, Access
requests. Needs you: up to 3 (trial ending, unpaid invoice, invite not taken up). Activity moves to
Audit log. Calm, factual copy.

**Accept (each):** nothing above the fold except header, hero, stats, needs-you; every tappable thing
opens a sheet or panel; numbers agree with inner screens; §11 passes at all four widths.

**Also, from the 1.4c walkthrough (`docs/WALKTHROUGH-1-4c.md`), each home must lose:** uppercase
eyebrows; an icon tile on every stat; a fourth stat; a greeting that names the whole cooperative; the
install banner above the greeting (it moves below the hero, or into Profile); the stale "Updated on…"
and "Last entry recorded…" lines; the sparkle "Insights" cards; grey letter avatars (initials on
`emerald-100`, §5.5); and on the platform home the redundant "Cooperatives 5 / Active 5" pair. The
member home gains the meter for Available to borrow (4.1).

---

## Phase 5: public site, sign in, sign up, onboarding

Read: `docs/planning/clarix-public-site-blueprint.md` (every step here is specified there).

- ☐ 5.1 Landing page structure and copy (no photos yet, product hero)
- ☐ 5.2 Hero photo carousel or background video with the owner's chosen images (D046); scroll reveal,
  phone mockup tilt
- ☐ 5.3 Pricing section and `/pricing` page (D041), only after 9.1's price function exists so figures
  come from one source
- ☐ 5.4 Sign in and sign up (split layout on desktop, demo chips behind D048). The D048 chips
  already exist, pulled forward at the owner's request as R2 1.4c; 5.4 restyles them with the rest
  of the screen rather than building them.
- ☐ 5.5 Onboarding screens restyled (one question per screen, thin progress line)
- ☐ 5.6 Privacy, terms and help as reading pages

**Accept:** Lighthouse on the Preview: Performance ≥ 90 phone, Accessibility ≥ 95, SEO 100 (on a
production-like build with indexing allowed); no claim on the page that the app cannot do today.

---

## Phase 6: inner screens

One PR per bullet. Each uses sheets for detail and passes §11. From the 1.4c walkthrough
(`docs/WALKTHROUGH-1-4c.md`), every screen rebuilt here also drops the paragraph intro under its
title (one line at most, §2 rule 4), and: the Loans empty state is one line and one action, not a
paragraph and a second primary button (6.2); Cooperatives loads with a skeleton, not a full-screen
spinner (6.1); cooperatives show their logo or initials, not a generic building tile (6.1, 6.9); a
cooperative with no admin yet reads in plain words, not "Nobody named yet" (6.9); and the officer's
content column is the same width as the admin's (6.4 to 6.8). Platform sign-in took about 10
seconds in the walkthrough; look at what the platform home loads first (6.9).

- ☐ 6.1 Member: Cooperatives list + cooperative sheet; Discover
- ☐ 6.2 Member: Loans list, loan sheet with the state timeline (Applied → Capacity held → Approved →
  Repaying → Closed, the Freight Africa pattern); Apply flow (range slider + rolling number, tenure
  stepper, one pinned primary)
- ☐ 6.3 Member: Profile as grouped settings; income evidence entry point
- ☐ 6.4 Staff: Members list (search pinned, filters, table on desktop) + member sheet (Overview,
  Savings, Loans, Activity)
- ☐ 6.5 Staff: Loans queue (segments Waiting / Above limit / Active / Closed / Lapsed) + review panel
  with fixed Approve / Decline bar
- ☐ 6.6 Staff: Apply on a member's behalf (officer blueprint 6.2, never built)
- ☐ 6.7 Staff: Record a payment and bulk monthly entry (D036)
- ☐ 6.8 Staff: Loan products, officers and permissions, public profile, reconciliation
- ☐ 6.9 Platform: Cooperatives, cooperative detail, policy, access requests, platform admins, audit log
- ☐ 6.10 Notifications screen and the missing staff notices ("new application", "hold expiring")

---

## Phase 7: income evidence (D035)

Read: D035, `docs/planning/clarix-documents-blueprint.md` §5, `docs/EDGE-CASES.md` E01–E04, E09–E11.

- ☐ 7.1 Schema: `income_evidence` (source payslip / bank_statement / declared, period, monthly figure,
  status unverified / verified / expired, verified_by, file refs). The limit uses the latest verified
  evidence, or declared (marked) if the cooperative allows it.
- ☐ 7.2 Bank statement upload (3 to 6 months), staff confirm the average monthly inflow figure
- ☐ 7.3 Payslip text-layer parsing for PDF payslips (label-based gross/net extraction, member confirms),
  handling the diagonal watermark text and multi-person files; scanned images fall back to typing
- ☐ 7.4 Evidence ageing: after the cooperative's max age (default 12 months) the figure shows its age to
  staff and the member is asked for fresh evidence; nothing is blocked
- ☐ 7.5 Sanity bands: a figure more than 3× the previous one, or above the cooperative's band, asks the
  member to confirm and flags it to the reviewer

---

## Phase 8: the books around the check (D036, D044)

Read: `docs/planning/clarix-documents-blueprint.md`.

- ☐ 8.1 PDF library approved and added (`docs/TOOLING-POLICY.md` → PDF), document template with header,
  watermark, verification code, footer; `/verify/[code]` lookup for staff
- ☐ 8.2 Import v2: more columns (phone, email, member number, joined date, savings, existing loans),
  server-side re-validation, XLSX tests on real files (dates, formulas, leading zeros, several sheets),
  5,000-row limit with chunked saves
- ☐ 8.3 Member statement PDF (per cooperative and combined) and loan statement PDF; member downloads,
  staff bulk-generate for a month
- ☐ 8.4 Report exports (CSV, XLSX, PDF) for the existing three reports plus "Members and balances" and
  "Loans book", with a date range
- ☐ 8.5 Imported members join automatically when they sign up with a matching phone, email or member
  number, after the cooperative confirms the match (`docs/EDGE-CASES.md` E12)

---

## Phase 9: trial, subscription and billing (D041, D042)

Read: `docs/planning/clarix-billing-blueprint.md`.

- ☐ 9.1 Schema and price function: `subscriptions`, `invoices`, `payments`; active-member count rule;
  `price_for(cooperative, period)` as one tested function used by the app and the pricing page
- ☐ 9.2 Trial: 60 days from the cooperative's activation, reminders on days 46 and 57 (in-app now, email
  once the domain exists), 14-day grace
- ☐ 9.3 Read-only mode after grace: every write path refuses with a clear banner; loans still count in
  other cooperatives' checks; nothing is deleted
- ☐ 9.4 Super Admin records a manual payment (bank transfer), invoice PDF with the document template
- ☐ 9.5 Paystack checkout for the cooperative's subscription (D042, confirmed 22 Nov 2026)

---

## Not in this plan (and why)

Phone sign-in (needs paid SMS, D022), cooperative self-signup (needs a domain and email, Open list in
`DECISIONS.md`), payroll integration (D004), interest modelling, mobile app store builds. Raise them
as new decisions if they become needed.
