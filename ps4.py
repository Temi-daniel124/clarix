# -*- coding: utf-8 -*-
import io

def rep_file(path, pairs):
    s = io.open(path, encoding='utf-8').read()
    for old, new in pairs:
        assert old in s, (path, old[:60])
        s = s.replace(old, new, 1)
    io.open(path, 'w', encoding='utf-8', newline='').write(s)

rep_file('SECURITY.md', [(
"""- Payslip OCR: when the AI-fallback path is used,""",
"""- **The member-roster import never uploads the spreadsheet.** A cooperative's member list is a
  file full of IPPIS numbers, names and savings balances. It is read, column-mapped and validated
  entirely in the admin's browser (`src/lib/roster/`, dependency-free on purpose — see
  `docs/TOOLING-POLICY.md` item 5), and only the rows the admin explicitly confirms are sent to
  the database. The file itself reaches no server, no bucket and no log.
- Payslip OCR: when the AI-fallback path is used,""")])

rep_file('docs/PROJECT-STATE.md', [
(
"""**Last updated:** 2026-09-12 (the six-part employee blueprint merged to `main` — the first
production merge and the first production deploy — with the pgTAP suites executing in CI for the
first time).""",
"""**Last updated:** 2026-09-12 (the cooperative admin blueprint begins: Part 1 authentication and
Part 2's setup sequence, on a new app shell, with the invite mechanism and the roster import that
Part 2 needed inventing before it could be built)."""),
(
"""What remains is the **cooperative admin/officer blueprint**, which owns every loan transition
after reservation and is also what will write the first notification row.""",
"""**The cooperative admin blueprint has started.** Parts 1 and 2 are built — accepting an
invitation, role-aware login, and the five-screen setup sequence — on their own app shell with
their own four destinations. The work stops deliberately at the first arrival on the Cooperative
Dashboard (4.1): that screen, Members (Part 5), Loans (Part 6) and the rest belong to the next
block, and each says so plainly rather than imitating itself.

That side is also what will eventually write the first notification row and make the first loan
transition after reservation."""),
(
"""## What does not exist yet""",
"""- [x] **Cooperative admin Part 1** — Accept Invite / Set Password (1.1) serving both arrivals the
      blueprint describes: a brand-new account setting a password from an invitation link, and an
      existing account being told plainly that the role has been added to it. Log In (1.2) is the
      *same screen and the same action* as the employee's, with one thing added: where it sends
      you. An active staff role goes to the cooperative, an unaccepted invitation goes to the
      screen that accepts it, everyone else to the employee dashboard. The PWA prompt (1.3)
      reuses the employee mechanic unchanged.
- [x] **A new app shell, not a variant of the employee one** — Home, Members, Loans and a Manage
      cooperative section that expands into six sub-items on desktop and folds behind More on
      mobile. Same tokens, same spring, same navy glass, same collapsible rail; a different
      information architecture, in its own destination list.
- [x] **Cooperative admin Part 2, the setup sequence** — an admin-specific three-slide welcome
      (2.1), the public profile with a live Discovery preview that renders from what is in the
      form rather than what is saved (2.2), loan products with progressive disclosure and an
      out-of-range warning drawn from what other cooperatives actually require (2.3), the roster
      import (2.4), and officer invitations (2.5). All four setup screens are the same components
      the permanent Manage screens use, which is what the blueprint describes: 2.2-2.5 are a
      first run through screens that live on as 7.1-7.4.
- [x] **The import reads the file in the browser and uploads nothing.** CSV and XLSX both, with
      no new dependency: the XLSX path unzips with the platform's own `DecompressionStream` and
      reads the two XML parts a roster needs. A member list is a file full of IPPIS numbers and
      balances, and `docs/TOOLING-POLICY.md` item 5 is explicit about what may see that.
      Column-matching, row validation, duplicate detection and the CSV reader are pure functions
      with 21 unit tests of their own.
- [x] **Migration 010** adds `staff_invitations` and `member_roster_entries` with their RLS, two
      `SECURITY DEFINER` functions for inviting and claiming, and the trigger pair that turns a
      roster entry into a real membership. pgTAP suite 005 covers all of it. Local filenames
      reconciled to the recorded version, per D023.
- [x] **`cooperative_staff_roles`'s existing policies were checked rather than assumed**, which
      is why no new policy was written for them: migration 001 already had an admin-only insert,
      an admin-only update, and a separate policy letting an invited person move their own row
      from `invited` to `active` and nothing else. That is exactly the access pattern Part 1
      needed.
- [x] **The service-role key is still unused, and now by decision** (D027). Supabase's admin
      invite API would have been the obvious path and would have made an invitation the first
      thing in the codebase holding a key that bypasses RLS everywhere. Two narrow functions cost
      less.

## What does not exist yet"""),
(
"""- [ ] **Test data is seeded in the live database and must be deleted before go-live.** All of
      it was written directly rather than in a migration, the same way the pilot test account
      was, so none of it will follow the schema into production by accident. What exists: three
      cooperatives carrying a "(test data)" suffix so they cannot be mistaken for real FMC
      Abeokuta cooperatives; nine loan products across them, six public; the pilot tester holding
      an active membership at two of them plus one pending application; four loans against those
      memberships — an active 360,000 over 24 months, a reserved 180,000 over 12 months, a
      completed 120,000, and a 120,000 reservation created through the application screen during
      verification; and 26 `savings_transactions` rows backing 330,000 of savings and the
      repayment history the active loan's progress is computed from.""",
"""- [ ] **Test data is seeded in the live database and must be deleted before go-live.** All of
      it was written directly rather than in a migration, the same way the pilot test account
      was, so none of it will follow the schema into production by accident. What exists: three
      cooperatives carrying a "(test data)" suffix so they cannot be mistaken for real FMC
      Abeokuta cooperatives; nine loan products across them, six public; the pilot tester holding
      an active membership at two of them plus one pending application; four loans against those
      memberships — an active 360,000 over 24 months, a reserved 180,000 over 12 months, a
      completed 120,000, and a 120,000 reservation created through the application screen during
      verification; and 26 `savings_transactions` rows backing 330,000 of savings and the
      repayment history the active loan's progress is computed from.
- [ ] **A cooperative-admin invitation for `coop.admin@fmcabeokuta.org.ng`**, holding an
      `invited` admin role at Staff Multipurpose Cooperative (test data) — the one cooperative
      with nothing set up, so the setup sequence has somewhere real to run. **Delete it with the
      rest before go-live.**

      Its password was generated inside the database from `gen_random_uuid()` and has never been
      seen by anyone, including the session that created the row, so **it must be set before the
      account can be used**: Supabase dashboard, Authentication, Users, then either send a
      recovery mail or set a password directly. Nothing else about the account needs touching.
- [ ] **Four roster entries and one staff invitation at that same cooperative**, written through
      the real screens while reviewing them: staff IDs 204817, 300121, 300122 and 300123, of
      which 204817 matched the pilot tester and became an active membership carrying the imported
      145,000 — which is the roster-linking trigger doing its job, and also why that account now
      shows a third cooperative. The invitation is to `test.officer@fmcabeokuta.org.ng`. All of
      it goes with the rest before go-live."""),
(
"""- [ ] Notifications, Profile and Help are reachable from the navigation but show a short honest
      holding screen""",
"""- [ ] **XLSX import is written but has only been exercised against CSV.** The reader unzips and
      parses the two XML parts a roster needs, which covers a plain sheet from Excel, LibreOffice
      or Google Sheets; a file using dates, formulas or a second worksheet is not something it
      has been shown. If it cannot read one it says so and asks for CSV rather than importing
      something wrong.
- [ ] **Nothing emails an invitation.** The invitation row is real and claims correctly on first
      sign-in; the email telling somebody it exists waits on the same verified sending domain
      everything else does. The officer screen says this on the form rather than implying a
      message went out.
- [ ] Every screen of admin Parts 4 to 8 — the Cooperative Dashboard, Members, Loans,
      Reconciliation, Reports, Notifications and Profile. Each is reachable from the navigation
      and says what will be there.
- [ ] Notifications, Profile and Help are reachable from the navigation but show a short honest
      holding screen"""),
(
"""| Supabase                              | **Live, schema applied** (ref `sxugaizwmqigtioqgefx`)     | Region `eu-west-1` (Ireland), Postgres 17.6. Ten tables, one private Storage bucket, one seeded organization.""",
"""| Supabase                              | **Live, schema applied** (ref `sxugaizwmqigtioqgefx`)     | Region `eu-west-1` (Ireland), Postgres 17.6. Twelve tables, one private Storage bucket, one seeded organization."""),
])

print('ok')
