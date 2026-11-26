# Walkthrough of the 1.4c Preview (23 Nov 2026)

The owner's notes, saved as given. Fixed in R2 1.4d (`docs/BUILD-PLAN.md`); the "Already covered"
items are listed under their phases there.

Signed in with each demo chip (Member, Admin, Officer, Platform) on the `r2/1-4c-demo-sign-in`
Preview, at desktop width (1280). Chrome would not resize to phone width, so 360 and 390 are not
checked here.

## Fix now (step 1.4d, before 1.5)

These are bugs or breaks of DESIGN_SYSTEM.md that no later step covers.

1. Loan figures disagree across screens (highest priority). For the demo member (Adebayo):
   * Member home: "Active loans 0" and "Monthly deductions ₦0, No history yet".
   * Member Loans: "Committed ₦60,975 of ₦161,838", and also "You have no loans on Clarix".
   * Admin Members list: Adebayo shows "2 active". One query or function must feed all three. Most
     likely the home and the Loans empty state count only loans created through applications, and
     miss loans entered with 0.3 (existing loans) or seeded ones. Add a test that the three agree
     for the same member.
2. Sparkline delta is wrong or unclear. Savings ₦594,000 shows a delta of ↗₦572,000; Funmilayo
   ₦188,000 shows ↗₦893,000. A delta can't exceed the total without explanation. Either compute the
   period change correctly or drop the delta.
3. Greeting uses the wrong time zone. At about 12:35 in Lagos the member home said "Good morning"
   while the admin home said "Good afternoon". Compute the greeting in Africa/Lagos on both, in one
   shared helper.
4. Meter does not follow §3. Committed draws in near-black, available in a pale tint. §3 says
   committed `ink-300`, available `emerald-500`, amber within 10%, overflow `red-500`. The ₦ sign
   must be 0.6em, `ink-500`, weight 500. Fix it in the single meter component so every use changes.
5. Sidebar shows its own scrollbar on a short window (about 585px tall). The nav should fit or
   scroll with the page, with no inner scrollbar at normal heights.
   *Replaced by 1.4e item 1 (owner's feedback on the 1.4d fix): the sidebar is always pinned at
   full height, and only its nav list scrolls, when it does not fit. See `docs/BUILD-PLAN.md` 1.4e.*
6. "Switch to my cooperative console" wraps onto two lines and uses jargon. Use a short label, for
   example "Switch to admin" or "Admin view", on one line.
7. Account menu items are not exposed as menu items to assistive tech. Give the menu `role="menu"`
   and items `role="menuitem"` (or use the existing accessible menu primitive), with arrow-key
   navigation and Escape to close.

## Already covered by later steps (do not fix now)

* Phase 3 (generalisation): "Federal Medical Centre, Abeokuta · 214508", the "Staff ID" column,
  "EMPLOYEES" on the platform home, FMC text on the sign-in panel.
* Phase 4 (home screens, D039 and §11): uppercase eyebrows, an icon tile on every stat, four stats
  instead of three, long greetings that name the whole cooperative, the install banner above the
  greeting, stale "Updated on 26 Aug 2026" and "Last entry recorded…" lines, the sparkle "Insights"
  cards, grey vs emerald avatars, no meter for available capacity on the member home, and the
  redundant "Cooperatives 5 / Active 5" platform stats.
* When each inner screen is rebuilt: paragraph intros under page titles, the Loans empty state with
  a paragraph and a second primary button, the full-screen spinner on Cooperatives (use a skeleton),
  generic building tiles instead of logos, "Nobody named yet" admins, and the officer content column
  being narrower than the admin one.

If any of these is not in BUILD-PLAN.md under its phase, the 1.4d session should add it there.

## Working as intended

Demo chips sign in for all four roles. Member count on the admin home matches (14, 7 on Clarix, 1
asking to join). Sign out, switching view, and the 1.4b centre button all work. Platform sign-in
took about 10 seconds, which is worth a look later but is not a blocker.

## What 1.4d found (added by the 1.4d session)

1. The loan disagreement was a silent failure, not a counting rule. The member's loan read named the
   columns the existing-loans migration (0.3) adds; that migration applies at merge, so on the
   shared Preview database the read failed and its error was swallowed, which the screens showed as
   "no loans". The admin list selected fewer columns and still worked; "Committed" came from the
   database function. All three now share one read and one count, and a read error is raised.
2. The admin Loans queue (`src/lib/supabase/admin-loans.ts`) also selects columns that the 0.1 and
   0.3 migrations add. It was not in these notes, so it is not changed here; it works once the
   chain's migrations apply at merge.
3. The sparkline's ₦893,000 was the cooperative's ledger: for someone who is also staff, the home's
   unfiltered ledger read returned every member's entries.
4. The account menu already exposed `role="menu"` and `role="menuitem"`, arrow keys and Escape (Base
   UI Menu); its dividers were plain elements and are now separators.
