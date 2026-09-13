# SECURITY.md — Clarix

Clarix handles salary figures, national payroll identifiers (IPPIS numbers), payslip images/PDFs,
and loan/savings records for real hospital staff. This document is the boundary list — it's short
on purpose; every rule here is a hard requirement, not guidance to weigh against convenience.

## The core boundary: RLS, not the UI

Per-cooperative data isolation is enforced entirely by Postgres Row-Level Security policies keyed
on `cooperative_staff_roles` (see `docs/DATA-MODEL.md`). **No feature may rely on a UI-side check
alone to protect financial data.** If a screen hides a link a user "shouldn't" follow, that's a
UX nicety, not security — the RLS policy underneath must independently refuse the request. Every
new table that carries `cooperative_id` or `organization_id` gets its RLS policy in the same
migration that creates the table.

## Supabase project isolation

- **Project:** `Clarix`, project ref: `sxugaizwmqigtioqgefx` (`https://sxugaizwmqigtioqgefx.supabase.co`).
- This is a **new, standalone project** inside an existing Supabase organization that already
  contains one unrelated project. That unrelated project's database, storage, auth users, and API
  keys must never be queried, referenced, or connected to from this codebase, by any script,
  migration, or environment variable. If you are ever unsure which project a command targets,
  stop and confirm the project ref first.
- The Supabase **service-role key** (which bypasses RLS entirely) is server-only. It must never
  reach the browser bundle, never be prefixed `NEXT_PUBLIC_`, and its use should be limited to a
  small, explicitly enumerated set of trusted server-only code paths — enumerate them here as
  they're introduced, so this list stays a real audit trail rather than going stale:
  - _(still none, and that is now a decision rather than an accident: `docs/DECISIONS.md` D027
    chose database rows plus two narrow `SECURITY DEFINER` functions over Supabase's
    `auth.admin.inviteUserByEmail()`, specifically so staff invitations would not become the
    first thing to hold a key that bypasses RLS on every table in the schema. Add an entry the
    first time a service-role-key code path is genuinely written, naming the file and why RLS
    can't be used there instead.)_

## Elevated database privileges that are not the service-role key

Several functions under `supabase/migrations/` run as `SECURITY DEFINER`, which means they bypass
RLS. They are listed here for the same reason the service-role list exists — so that the set of
things able to see past the boundary is written down rather than discovered later:

- `is_platform_admin()`, `is_active_staff(uuid)` and `is_active_cooperative_admin(uuid)` read
  `cooperative_staff_roles` from inside policies attached to that same table, which would
  otherwise recurse infinitely. Each takes no free-form input, returns only a boolean about the
  caller's own roles, and pins its `search_path`. `EXECUTE` is revoked from `anon` and kept for
  `authenticated` — that is required, not an oversight: a policy expression is evaluated with the
  querying role's privileges, so revoking it would disable every policy in the schema.
- `handle_new_auth_user()` is the signup trigger that writes the matching `public.users` row
  (`docs/DECISIONS.md` D021). `EXECUTE` is revoked from both `anon` and `authenticated`, so it
  exists only as a trigger and not as a callable PostgREST endpoint.
- `capacity_for_user(numeric)` and `submit_loan_application(uuid, numeric, integer, uuid)` are
  the cross-cooperative capacity calculation and the reservation transaction (D003, D008).

  **Why RLS cannot be used directly here.** Committed obligations must be summed across every
  cooperative the employee belongs to. The RLS policies on `loans` deliberately refuse that —
  they scope each staff member to their own cooperative's rows, and they must keep doing so.
  There is no policy that could express "sum across all cooperatives but reveal none of them",
  because RLS filters rows and what is needed here is an aggregate over rows the caller may not
  see individually. That is precisely D003's narrow exception.

  **What keeps it narrow.** Both functions return only an aggregate and a verdict: one summed
  monthly figure, a cap, a remainder, and eligible/not-eligible. Neither returns another
  cooperative's identity, its savings balances, its loan rows, or any figure attributable to a
  particular cooperative — a caller learns what they owe in total, never to whom. Both derive the
  caller from `auth.uid()` rather than from an argument, and `submit_loan_application` refuses
  any `membership_id` that is not the caller's own and active, so an employee can only ever
  reserve through their own record. `EXECUTE` is revoked from `anon` and granted to
  `authenticated` only.

  `submit_loan_application` is also the ONLY write path to a reservation: `loans` has no insert
  policy for employees at all, which is what forces every reservation through the advisory lock
  that makes it safe under concurrency.

- `platform_overview()` and `platform_cooperative_directory()` are the Super Admin's only reads,
  and they exist because **the alternative was a policy that would have handed this role every
  member's savings balance in order to render a number on a card.**

  **Why RLS cannot do this.** A Super Admin holds no membership and no staff role anywhere, by
  design. `cooperative_memberships_select_staff` takes a cooperative-scoped permission,
  `cooperative_staff_roles_select_same_cooperative` and `staff_invitations_select_staff` take
  being staff of that cooperative, and `users_select_own_cooperative_members` reaches another
  person's row only through a membership at a cooperative the caller staffs. The Platform
  Dashboard needs a headcount and a pending-invite count; the directory needs a member count, an
  officer count, and the name of the person invited to run each cooperative. Every one of those
  is an aggregate, or a fact about staff, over rows the caller must never read individually — the
  same shape as `capacity_for_user()` above, and the same reason a policy cannot express it. A
  select policy admitting platform admins to `cooperative_memberships` would have satisfied the
  screens and destroyed the boundary in the same line.

  **What keeps them narrow.** Both check `is_platform_admin()` first and raise `42501` otherwise,
  so a cooperative admin calling them directly is refused. Both take **no arguments at all**,
  which is what makes them un-pointable: there is no member id, cooperative id or filter a caller
  could supply to aim them at a person. Their declared return types are the whole contract —
  `platform_overview()` returns four integers, and the directory returns one row per cooperative
  carrying counts, timestamps, status, and the **staff** Admin's name and email. Neither can
  return a member's name, a savings balance, a loan, or a salary figure, because no such column
  exists in either signature. `EXECUTE` is revoked from `anon` and granted to `authenticated`
  only.

  **What they deliberately do not open.** Reaching an actual member's records stays with the
  time-boxed, logged `access_grants` flow described below and in the Super Admin blueprint's Part
  7, which is not built. `ROLES-AND-PERMISSIONS.md` calls the absence of standing access "a hard
  requirement, not a convenience shortcut, even for debugging", and a count is not a step toward
  it: the Cooperative Detail screen these feed has no view-members or view-loans action, and that
  absence is load-bearing rather than unfinished.

- `record_platform_event(...)`, `list_platform_admins()`, `grant_platform_admin(text)` and
  `revoke_platform_admin(uuid)` are migration 023's four, and each answers a question RLS could
  not.

  **Why RLS cannot do this.** `audit_log` has no insert policy for anybody, by design — every row
  in it arrives through a function that decided it was entitled to write one — so a platform event
  needed a writer of its own. `platform_admins` carries exactly one policy, read-your-own-row, so
  an operator could not see who else operates the platform, and nothing could add or remove one:
  a general write policy on that table would have been a policy granting the power to grant the
  power.

  **What keeps them narrow.** All four refuse a caller who is not a platform admin.
  `record_platform_event` hard-codes `cooperative_id` as NULL, so it can never forge an entry into
  a cooperative's own log, and `audit_log_select_platform` mirrors that on the way out by admitting
  a platform admin to rows with no cooperative and nothing else — the two logs cannot leak into
  each other in either direction. `grant_platform_admin` takes an email that must already have a
  Clarix account, because Clarix does not create accounts for people (D021), and reports honestly
  when it does not rather than implying an invitation is waiting.

  **The self-removal safeguard lives in `revoke_platform_admin`, not in the screen.** Blueprint 8.1
  asks that a Super Admin cannot remove their own access, "avoiding the mistake of a single
  operator locking themselves out entirely". The interface also omits the control on your own row,
  but that is a courtesy; the function raises `42501` on `target_user_id = auth.uid()`, so the
  safeguard holds however the call is made. Restoring access to an operator who has genuinely lost
  it is deliberately a database-level act, which is the "separate, deliberately harder-to-reach"
  path the blueprint describes.

- `invite_cooperative_staff(...)` has **two** legitimate callers as of migration 019: that
  cooperative's own active admin, inviting an officer (admin blueprint 7.2), and a platform admin
  naming the admin of a cooperative they have just created (super-admin 5.3). The second was
  added by widening the existing caller check rather than by adding a second function, because
  D027 settled that a staff invitation is a database row written by exactly one narrow elevated
  function — two functions writing the same row would be two places for the claim logic to drift.
  It still cannot do anything but write an invitation, and it still derives the inviter from
  `auth.uid()`.

- `staff_has_permission(uuid, text)` answers whether the caller may do one specific thing at one
  cooperative, and is called from inside policies — so, like `is_active_staff()`, `EXECUTE` stays
  with `authenticated`: a policy expression runs with the querying role's privileges, and
  revoking it would disable the policies that depend on it. It reads only the caller's own role
  rows, returns only a boolean, and takes the permission key as an argument rather than trusting
  one from a client payload. Admins pass every check by design (`docs/DATA-MODEL.md`: "admins
  implicitly have full cooperative permissions"), which is what stops an admin locking themselves
  out of their own cooperative. Four keys are live: `can_view_members`, `can_record_savings`,
  `can_approve_loans` and `can_import_members` — the last added by migration 017, because writing
  a roster entry carries other people's IPPIS numbers and opening balances and had until then
  been available to any active staff member.

- `invite_cooperative_staff(...)` and `claim_staff_invitations()` are the two halves of the
  staff-invitation mechanism (D027).

  **Why RLS cannot be used directly here.** Inviting somebody requires resolving an email address
  to an account, and no policy on `users` permits that: `users_select_own_cooperative_members`
  deliberately limits an officer to people who already belong to their cooperative, and an
  invitee by definition does not yet. Widening that policy to make invitations work would widen
  it for everything else that reads `users`. Claiming is the mirror image: the rows addressed to
  a new arrival sit in `staff_invitations`, whose only select policy is "staff of that
  cooperative" — which the person claiming is not, until they have claimed.

  **What keeps them narrow.** `invite_cooperative_staff` refuses anything unless the caller is
  the named cooperative's active admin, and returns only whether an account already existed —
  never the resolved user's id, name, or any other field, so it cannot be used to probe who
  holds which address. `claim_staff_invitations` takes no arguments at all: it reads the
  caller's own email from their own `users` row, so it can only ever claim invitations addressed
  to the person calling it, and it creates roles at status `invited`, never `active`. Accepting
  is still the separate, policy-governed step migration 001 already defined. `EXECUTE` on both
  is revoked from `anon` and granted to `authenticated` only.

- `decide_loan_application(uuid, text, text)` turns a reservation into an active loan or turns it
  down (admin blueprint 6.2).

  **Why RLS cannot be used directly here.** It writes to two tables that deliberately accept no
  client write at all: `notifications`, which has no insert policy because a notification records
  something the system did rather than something its recipient claims (D025), and `audit_log`,
  which has no insert, update or delete policy because append-only means append-only. It also
  reads the member's committed total across every cooperative, which is the same D003 exception
  the capacity functions carry.

  **What keeps it narrow.** It refuses unless the caller is active staff at this loan's own
  cooperative AND either an admin or an officer whose permissions include approving loans. It
  acts only on a loan still at `reserved`, so nothing can be decided twice. It refuses an
  approval that exceeds the member's available capacity unless a reason is supplied, so the note
  blueprint 6.2 asks for is enforced by the database rather than by the form. It returns a status
  and figures about this one loan, never another cooperative's rows. `EXECUTE` is revoked from
  `anon` and granted to `authenticated` only.

- `link_roster_entry()` and `apply_roster_link()` are triggers on `cooperative_memberships`
  (D028). They read `member_roster_entries`, which an employee has no access to and must not
  gain: it carries other members' IPPIS numbers and savings balances. Both are triggers only —
  `EXECUTE` is revoked from `anon` and `authenticated` alike, so neither is reachable as a
  PostgREST endpoint — and each touches exactly one entry: the one whose `employee_id` matches
  the joining person's own, in the cooperative they are joining. Nothing about that entry is
  returned to the caller; its only visible effect is on the employee's own new membership.

Table-level privileges are granted to `authenticated` only, verb by verb, matching the policies
that actually exist; `anon` holds no privilege on any table in the `public` schema. Worth
remembering when reading a policy: a GRANT is checked *before* RLS, so a missing grant denies
everything regardless of policy, and a generous grant still leaves RLS deciding which rows are
reachable.

## Secrets

- No secret (Supabase keys, Resend API key, the AI payslip-OCR API key) is ever committed to the
  repository, in any form — not in code, not in a comment, not in a "temporary" config file, not
  in a commit message.
- `.env.local` is gitignored from the very first commit. Verify `.gitignore` includes it before
  the first `.env.local` is ever created locally.
- Production secrets live in Vercel's environment variable settings, entered through the Vercel
  dashboard/CLI directly — never pasted into a file that gets committed, even briefly.
- If a secret is ever accidentally committed, treat it as compromised: rotate it immediately
  (regenerate in Supabase/Resend/the AI provider's dashboard) rather than just removing it from a
  future commit — git history retains it either way.

## PII and sensitive data handling

- **Salary figures, IPPIS numbers, and uploaded payslip files are sensitive personal data** under
  the Nigeria Data Protection Act (NDPA) 2023 — handle them with a lawful basis (the employee's
  own signup/consent flow), and never expose more of them than a given screen's stated purpose
  requires.
- Uploaded payslips are stored in a **private** Supabase Storage bucket — never a public bucket,
  never a publicly-guessable URL. Access is mediated by a signed URL or an RLS-equivalent storage
  policy, scoped to the uploading employee (and, if ever needed for support, only through the
  Access Grant flow below).
- The cross-cooperative eligibility lookup exposes only the aggregate figures the formula needs
  (salary basis, combined committed obligations, resulting capacity) — **never** another
  cooperative's savings balance or any other cooperative's private member data. This is not a UX
  choice, it's the governing rule of the whole product (`docs/DECISIONS.md` D003) and must be
  enforced at the query level, not just by what the UI chooses to render.
- **The member-roster import never uploads the spreadsheet.** A cooperative's member list is a
  file full of IPPIS numbers, names and savings balances. It is read, column-mapped and validated
  entirely in the admin's browser (`src/lib/roster/`, dependency-free on purpose — see
  `docs/TOOLING-POLICY.md` item 5), and only the rows the admin explicitly confirms are sent to
  the database. The file itself reaches no server, no bucket and no log.
- Payslip OCR: when the AI-fallback path is used, only the minimum content needed for extraction
  is sent to the API call, the response is treated as untrusted until a human confirms it
  (`docs/DECISIONS.md` D006), and no salary data is retained by that call path beyond what the
  API provider's own data-use terms allow — check those terms before enabling this path in
  production and note the outcome here.

## Super Admin's Access Grant exception

Super Admin has **no standing access** to any cooperative's member-level financial data — this is
enforced by RLS (Super Admin's role has no matching `cooperative_staff_roles` row anywhere) plus
application logic that never assumes otherwise. The one deliberate exception is the
`access_grants` flow (`docs/DATA-MODEL.md`, `docs/ROLES-AND-PERMISSIONS.md`):

- Every grant requires a non-generic, non-blank reason.
- The affected cooperative's Admin is notified the moment a request naming their cooperative is
  submitted.
- Grants are strictly time-boxed (short default window) and read-only — never write access.
- Every screen/record viewed under an active grant is logged individually, more granular than
  ordinary audit events.
- If this flow is ever implemented without every one of the above properties, it is a security
  bug, not a shortcut.

**Built, and where each property lives** (migrations 024-026, DECISIONS.md D030):

- **No standing access.** `access_grants` gates five select policies —
  `cooperative_memberships_select_granted`, `users_select_granted`,
  `savings_transactions_select_granted`, `loans_select_granted` and
  `deduction_reconciliation_select_granted` — each asking the single question
  `has_active_access_grant(cooperative_id, user_id)`. With no grant, a platform admin reads zero
  rows from every one of those tables, which is a refusal rather than an absent menu item.
- **These are real policies on real tables, not another aggregate.** Parts 4 and 5 answer their
  questions with counts precisely so member rows stay unreadable; this is the one place where the
  honest answer is that a row genuinely has to be looked at, so it is opened deliberately,
  briefly, and visibly rather than approximated.
- **A required, non-generic reason.** A CHECK constraint refuses anything under twenty characters,
  and `request_access_grant()` refuses it again before doing anything else. Length is a weak proxy
  for "non-generic" and the real defence is that the sentence is shown to the cooperative, kept
  permanently, and attached to every record opened under the grant.
- **The cooperative's admin is told at submission, not after.** The notification is written inside
  `request_access_grant()`, in the same statement as the grant, so no path exists that creates one
  without the other. It uses the `access_request` notification category, which is deliberately the
  only category with no mute toggle: a warning that can be switched off in advance is not a
  warning.
- **Time-boxed, evaluated at read time.** `has_active_access_grant()` is arithmetic against
  `now()`, so a grant stops working the instant it lapses with nothing having to run — the same
  rule D024 set for loan reservations, applied to the far more sensitive case. `status` never
  stores `'active'` or `'expired'` for that reason.
- **Read-only, in the database.** No insert, update or delete policy is granted to a grant holder
  anywhere. The Elevated Access View also renders no write controls, but that is the cosmetic half;
  a write attempted under a live grant is refused with `42501`.
- **Every record opened is logged, in the COOPERATIVE's log.** `log_elevated_view()` writes an
  `elevated_view` row carrying `cooperative_id`, so it lands in that cooperative's own audit log
  where its admin reads it. A record of who examined your members' money that only the examiner can
  read would be worse than none. The function refuses unless the grant is live at that instant, so
  the log can never claim a view the policies would not have permitted.
- **Only the requester can end a grant early**, and no one can approve or block one — see D030 for
  why the protection is the delay, the notice and the record rather than a gate.

## Audit log

Every view or edit of financial data records who, what, when, and (for edits) old→new value
(`docs/DATA-MODEL.md` → `audit_log`). This table is append-only from the application's
perspective — no UPDATE or DELETE path should ever be exposed against it.

Reading it is the **cooperative admin's** alone, not any staff member's (migration 018). An
officer records entries that land in this log and cannot read the log, which is what the officer
blueprint asks for in 5.4: entries are written "regardless of which role recorded it, even though
only an Admin can later view that log". The screen is absent from an officer's navigation, but
`audit_log_select_admin` is what makes the absence mean anything.

## Dependency security

See `docs/TOOLING-POLICY.md` §"The bar for adding anything new," item 5: anything that would see
salary figures, IPPIS numbers, or payslip files in cleartext gets called out here explicitly
before it's added — add an entry to the list below the first time such a dependency is
introduced.

- **Resend**, reached over its HTTP API from `src/lib/support.ts`, carries the Help screen's
  support messages (blueprint 6.3, `docs/DECISIONS.md` D026). It is listed here because it is the
  first outbound path that carries anything a person wrote inside Clarix to a third party, and it
  is worth being precise about what it does and does not carry. It sends the employee's name,
  their email address, and the message they typed. It deliberately does **not** carry the IPPIS
  number, any salary figure, or anything from a payslip: an employee's payroll identifier is
  sensitive personal data under the NDPA, and a support question is not a reason for it to leave
  the system. Anyone extending this path must keep that true — the account email is enough to
  find a person inside Clarix.

## Incident posture

If a security boundary described in this document is ever found to be violated in the deployed
app (an RLS gap, a leaked secret, financial data reachable without the intended check), treat it
as a stop-everything issue: fix the boundary first, rotate any exposed secret, then continue
other work — don't ship the fix alongside unrelated feature work where it could get lost in
review.
