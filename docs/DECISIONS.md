# DECISIONS.md, Clarix

**Authority level: 1 of 14 (highest).** This is the log of record. Every other document in this
repository must agree with it. If any other doc appears to contradict an entry here, this file
wins, fix the other doc, don't reinterpret this one.

Format: each entry is locked once written. To change a decision, add a new entry that explicitly
supersedes the old one (`Supersedes: D0xx`), never edit history in place. An AI agent (or human)
picking up this project after a break should be able to read this file top to bottom and
understand every non-obvious choice that shaped the product, without needing the original
planning conversation.

Status values: **Locked** (settled, build against it), **Provisional** (working assumption,
flagged for confirmation), **Superseded** (see the entry that replaced it).

---

### D001: Exactly four roles, no more
**Status:** Locked
**Decision:** Clarix has exactly four roles: Super Admin, Cooperative Admin, Cooperative Officer,
Employee/User. There is no HR role, payroll officer, organization-level auditor, or
organization-supervisor role, and none will be added without a new decision entry here.
**Rationale:** Clarix is built for the cooperatives, not for the host organization (the hospital).
An organization-level role would imply Clarix serves the employer, which it explicitly does not.
**Full detail:** `docs/ROLES-AND-PERMISSIONS.md`.

### D002, Product is a coordination layer, not accounting software
**Status:** Locked
**Decision:** Clarix's core value is cross-cooperative deduction coordination. It does not
replace a cooperative's internal accounting, does not move money, and does not integrate with
payroll/IPPIS directly.
**Rationale:** Validated against six real Nigerian cooperative-software competitors (Coopify,
Coopco, ProbityCoop, Hyves, Coopra, SODLAPP); none offer cross-cooperative visibility, and it is
the one gap worth building for. See `docs/PRODUCT.md`.

### D003, Cross-cooperative eligibility is system-computed, not human-gated
**Status:** Locked
**Decision:** When Cooperative B looks up a member to decide on a loan, Clarix automatically
surfaces the *minimum necessary* cross-cooperative data (combined committed monthly obligations,
salary basis, resulting available capacity), never another cooperative's savings balance or
other private records, and never mediated by a single designated human "gatekeeper" role. This
lookup is available at any time, not only during an active loan submission.
**Rationale:** Directly agreed by all committed FMC Abeokuta cooperative heads. This is the
governing privacy rule for the entire product: no screen, API, or report may expose more than
this minimum, in either direction.

### D004: No money movement
**Status:** Locked
**Decision:** Clarix never holds, deposits, transfers, or disburses funds. Every savings and
repayment record in Clarix is a *record* of a payroll deduction that already happened elsewhere,
entered by cooperative staff or imported from a spreadsheet, never a live transaction Clarix
executes.
**Rationale:** No payment license, no custody risk, matches the lean-budget MVP.

### D005: No payroll/IPPIS integration
**Status:** Locked
**Decision:** Clarix has no live connection to FMC's payroll system. Salary figures come from an
employee-uploaded payslip (once, at onboarding, re-uploaded on request afterward); cooperative
obligations come from Clarix's own ledger (import + on-platform activity), never from parsing a
payslip's deduction lines.
**Rationale:** No such access exists or is being sought; Clarix serves the cooperatives, not the
hospital as an institution.

### D006, Payslip parsing extracts salary only, never classifies deductions
**Status:** Locked
**Decision:** The payslip pipeline extracts `salary_gross` and `salary_net` only. It does not
attempt to identify or classify individual deduction line items (statutory vs. cooperative),
even though a real reviewed FMC Abeokuta payslip shows both mixed together.
**Rationale:** Reliable text-label classification of a payslip's free-text deduction lines is a
real, unsolved classification problem with no clean payoff, Clarix's own ledger is already a
better source of truth for "what does this employee owe cooperatives."
**Supersedes:** an earlier working assumption that payslip deductions could be parsed and
reconciled automatically.

### D007, Deduction basis defaults to gross salary; cap defaults to 33.3%
**Status:** Provisional (default is locked for build purposes; written cooperative sign-off is
still outstanding, non-blocking)
**Decision:** `organizations.deduction_basis = 'gross'`, `deduction_max_percentage = 33.3`,
matching the Nigerian Labour Act §5 cap. Evidence: on a reviewed real payslip, three named
cooperative deductions summed to 30.3% of gross vs. 58.2% of net: only the gross basis is
consistent with the cap actually being enforced today. Configurable at organization level by
Super Admin only; cooperatives inherit it and cannot override the basis or the percentage.
**Action before go-live:** get one-line written confirmation from cooperative heads.

### D008, Capacity reservation via advisory lock, at submission, not approval
**Status:** Locked
**Decision:** Submitting a loan application (not approving it) atomically reserves the requested
monthly repayment against the employee's available capacity, using
`pg_advisory_xact_lock(:user_id)` to serialize concurrent submissions for the same employee.
**Rationale:** Prevents two cooperatives simultaneously approving loans against the same slice of
headroom: the core race condition the product exists to close. See `docs/DATA-MODEL.md` for the
exact transaction.

### D009, Reservation expiry: 7-day org default, cooperative may only shorten
**Status:** Locked
**Decision:** `organizations.reservation_expiry_days_default = 7`. A cooperative may set a
shorter `reservation_expiry_days_override`, never a longer one, enforced at write time.
**Rationale:** No cooperative should be able to hold shared capacity longer than the agreed norm.

### D010. One account per email; roles and memberships are independent, cooperative-scoped rows
**Status:** Locked
**Decision:** A person has exactly one Clarix account regardless of how many cooperatives they
touch. `cooperative_memberships` (beneficiary/savings-holding) and `cooperative_staff_roles`
(admin/officer) are separate tables, both scoped by `cooperative_id`; a person can hold any
combination of either, at any number of cooperatives, simultaneously.
**Rationale:** Directly answers the "same person, multiple cooperatives" scaling question without
forcing separate logins or blocking legitimate multi-cooperative involvement.

### D011, Row-Level Security is the enforcement boundary, not the UI
**Status:** Locked
**Decision:** Per-cooperative data isolation is enforced by Postgres RLS policies keyed on
`cooperative_staff_roles` (active status, matching `cooperative_id`), not by hiding links in the
client. A UI guard alone is never sufficient for anything touching member financial data.
**Rationale:** Prevents the "`/member/1234` → `/member/1235`" class of leak structurally.

### D012, Stack: Next.js + Tailwind + shadcn/base-ui + Motion, on Vercel/Supabase/Resend
**Status:** Locked
**Decision:** React via Next.js, Tailwind CSS, shadcn/base-ui components, Motion
(`motion/react`) for animation. Deployed on Vercel. Backend/DB/Auth/Storage on Supabase.
Transactional email via Resend. All on free tiers except one paid AI API (Claude or OpenAI) used
only for payslip OCR fallback.
**Rationale:** Matches the already-adopted Watermelon UI component set (React+Tailwind+shadcn+
Motion), the already-agreed lean-budget infra, and the client's existing tool choices.

### D013, `lucide-react` is the only icon library
**Status:** Locked
**Decision:** Every icon in the product comes from `lucide-react`. No `react-icons`,
`@hugeicons/react`, or any other icon package may be introduced.
**Rationale:** Mixed icon sets (different stroke weights/corner styles) are one of the fastest,
most visible ways an interface reads as assembled-from-tutorials rather than designed. See
`DESIGN_SYSTEM.md`.

### D014: No native mobile app; a well-built PWA is the entire mobile strategy
**Status:** Locked
**Rationale:** Matches lean-budget constraints and the installability requirement already
gathered from the client ("must act like a normal mobile application and a normal desktop
application").

### D015: No local Docker on the development machine
**Status:** Locked
**Decision:** Local schema work uses `supabase link` plus `supabase db diff` / `db push` against
the real remote Supabase project. Docker-dependent tooling (pgTAP, full RLS integration tests,
`supabase db start`) never runs on the developer's laptop. It runs inside GitHub Actions on the
hosted Ubuntu runner, which provides its own Docker.
**Rationale:** Docker Desktop measured ~2.3 GB RAM / ~6.4 GB disk before Postgres even started, on
a machine where that's not affordable long-term. GitHub Actions' hosted runner is the
Supabase-documented way to get faithful `auth.users`/RLS/pgTAP behavior without that local cost.
Full detail and the workflow stub: `docs/DEVELOPMENT-WORKFLOW.md`.

### D016, Fixed commit identity, verified every session
**Status:** Locked
**Decision:** Every commit in this repository is authored as `Temiloluwa Adebayo` /
`adrianwilliams128765@gmail.com`. This is verified (not assumed) before the first commit of every
working session.
**Rationale:** A prior mismatch between the committing identity and what Vercel/GitHub expected
caused Vercel to block a production deployment. This is now a hard gate, not a convention. Full
procedure: `docs/DEVELOPMENT-WORKFLOW.md`.

### D017, Design must never read as AI-generated or generic
**Status:** Locked
**Decision:** Every screen is built against the signature visual motif (rolling-number figures +
used-vs-available meter), the fixed token set, and the anti-generic-design checklist in
`DESIGN_SYSTEM.md`. Every UI-producing task is treated as pixel-level work, not "good enough."
**Rationale:** Explicit, repeated client requirement. This is a non-negotiable acceptance
criterion on every screen, not a stylistic preference.

### D018: No AI/ML in the eligibility decision itself
**Status:** Locked
**Decision:** Eligibility is deterministic arithmetic against an agreed policy (see D007, D008),
auditable, reproducible, never a model output. AI's only role anywhere in v1 is optional,
human-reviewed payslip field extraction (see D006, and the fallback pipeline in
`docs/ARCHITECTURE.md`).

### D019, Single-organization data model for v1
**Status:** Locked
**Decision:** The schema is scoped by `organization_id`/`cooperative_id` throughout, but v1 only
ever populates one `organizations` row (Federal Medical Centre, Abeokuta). Nothing in P0/P1 scope
depends on, or should be built toward, a second organization.
**Rationale:** Keeps the build lean; the scoping columns exist so a second organization is a new
row later, not a rewrite, but that day is not today.

### D020: The Supabase project "Clarix" is new and standalone
**Status:** Locked
**Decision:** A brand-new Supabase project named `Clarix` is created inside the existing Supabase
organization, alongside, and completely independent of: an existing unrelated project in that
same organization. The existing project's database, auth users, storage, API keys, and settings
are never touched, queried, or referenced by anything in this codebase.
**Rationale:** Explicit client instruction; accidental cross-project access would be a serious
data-boundary failure for an unrelated client's data.

### D021, Credentials live in Supabase Auth; `public.users` is a 1:1 profile keyed to `auth.users`
**Status:** Locked
**Decision:** `public.users.id` is a primary key that references `auth.users(id)` with
`on delete cascade`, and the table carries no `password_hash` column: the illustrative one in
`docs/DATA-MODEL.md` is satisfied by Supabase Auth, which owns credentials, email/phone
verification and session issuance. The matching `public.users` row is created by a
`SECURITY DEFINER` trigger (`on_auth_user_created`) in the same transaction as the `auth.users`
insert, rather than by a second write from application code.
**Rationale:** Two writes from the client can half-succeed, leaving an account that can sign in
but has no Clarix row. Doing it in the database makes that impossible, and avoids introducing
the first service-role-key code path in the product, `SECURITY.md`'s enumerated list of those
stays empty, which is worth keeping true for as long as possible.
**Consequence:** `users.employee_id`, `name`, `salary_gross` and `salary_net` are all nullable
at creation and filled in during onboarding (blueprint 2.2–2.4); `employee_id` is unique per
organization, not globally.

### D022, v1 authentication is email and password only; phone sign-in is deferred
**Status:** Provisional (revisit if an SMS provider is ever budgeted)
**Decision:** Sign Up and Log In accept an email address and password. A phone number entered in
the identifier field is recognised and answered with a plain inline message saying phone
sign-up is not available yet, rather than being silently rejected or failing obscurely.
**Rationale:** `docs/ROLES-AND-PERMISSIONS.md` describes "email/phone + password", but phone
authentication in Supabase requires a third-party SMS provider. That is a second paid service,
which `docs/TOOLING-POLICY.md` does not approve and which nobody has agreed to fund; the only
budgeted paid service is the payslip-OCR API. Recording the gap here rather than building around
it silently.
**Action before go-live:** confirm with the cooperative heads that email-only sign-in is
acceptable for the pilot, since some staff may not use email routinely.

---
### D023, Agent-applied migrations go through the Supabase Management API; `db push` stays the human path
**Status:** Locked
**Supersedes:** nothing; it narrows the operational detail of D015, which is unchanged: no local
Docker, and the remote `Clarix` project is still the only database.

**Decision:** A migration written by an AI agent is applied to the remote `Clarix` project through
the Supabase Management API, using the agent's already-authorized Supabase connection, rather than
`supabase db push`. Three conditions make this the approved path rather than a workaround, and all
three are binding:

1. **The migration exists as a reviewed `.sql` file under `supabase/migrations/` first.** The file
   is the artefact of record. Applying it is a second, separate step, and the file's timestamp
   prefix is reconciled to the version the API records, so `supabase db push` run later by a human
   sees the migration as already applied and does not attempt to re-run it.
2. **The agent is never given the raw database password.** That is the entire point. The password
   lives in the maintainer's password manager and is not pasted into a prompt, a file, an
   environment variable the agent can read, or a terminal command the agent composes.
3. **Nothing is applied that was not written down first.** No ad-hoc DDL typed straight at the
   database, and no dashboard SQL-editor edits: the prohibition in `DATA-MODEL.md`
   ("Migration discipline") is unchanged and still applies to both humans and agents.

`supabase db push` remains correct and preferred for a human maintainer working locally, and
remains the documented path in `BUILD.md`. This entry does not deprecate it; it records which of
the two paths applies to which kind of operator.

**Rationale:** `supabase db push` authenticates to Postgres directly and therefore needs the
database password. The three ways to give an agent that capability are all worse than the
Management API: putting the password in `.env` or the shell environment makes it readable by
anything the agent runs and one `cat` away from a transcript; passing it inline puts it in the
session history permanently; and caching it into the CLI's stored credentials still means it was
handed over once. The Management API path uses a token that is already scoped to project
administration, can be revoked independently, and never exposes the database superuser credential
at all. Losing `db push`'s local diffing convenience is a small price for an agent that cannot
leak a password it was never given.

**What would make `db push` workable for an agent without that exposure**, recorded so this can be
revisited rather than re-derived: the maintainer sets `SUPABASE_DB_PASSWORD` once in their own
shell profile (never in the repository, never in `.env.local`), or runs `supabase link` once
interactively so the CLI caches the credential in the OS keyring. The agent then runs
`supabase db push` and the CLI reads the secret itself. That is a legitimate future option; it is
not adopted now because it still places a live database password in an environment the agent
executes inside, which is a meaningfully weaker boundary than not having it at all.

**Consequence for `DEVELOPMENT-WORKFLOW.md` §2:** that section is updated to describe both paths
instead of naming `db push` as the only one, which it previously did and which the first
implementation slice already contradicted.

---

### D024: Two deliberate departures from `DATA-MODEL.md` in the loan/savings schema
**Status:** Locked
**Supersedes:** nothing; it records where the implemented schema knowingly goes past what
`DATA-MODEL.md` describes, so the difference is a decision rather than drift.

**Decision 1, `savings_transactions` carries loan repayments, not only savings movements.**
The table gains a `loan_repayment` value in its type enum and a nullable `loan_id` column,
constrained so `loan_id` is present exactly when the type is `loan_repayment` and absent
otherwise. `DATA-MODEL.md` defines no repayment ledger at all, yet Loan Detail (blueprint 5.3)
has to show how much of a loan has actually been repaid, and a loan's progress must be derived
from money that genuinely moved rather than from how many months have elapsed since approval. A
separate `loan_repayments` table was the alternative and was rejected: both kinds of row are the
same shape: a dated, described, signed amount against one membership, and keeping them in one
ledger means a member's statement can be assembled from a single ordered query. The savings
statement screen filters the repayment rows out, because a repayment leaves the salary and does
not move the savings balance.

**Decision 2: a lapsed reservation is not a committed obligation, even while its status still
reads `reserved`.** Every capacity calculation counts a reserved loan only while
`reservation_expires_at` is still in the future. Nothing sweeps the table to rewrite statuses to
`expired`, so a row can read `reserved` and contribute nothing to the committed total. The
alternative: a scheduled job flipping statuses, was rejected because capacity would then be
wrong for as long as the job was late, down, or between runs, and being wrong about capacity is
the one failure this product cannot have. Expiry is therefore evaluated at read time, which makes
it exact by construction. A background sweep may still be added later for tidiness, but it would
be cosmetic: it could only ever agree with what the read-time check already computed.

**Consequence:** `DATA-MODEL.md` describes the shape of the intent, and these two points are where
the implementation is authoritative instead. Anything computing committed obligations must apply
the expiry check; anything reading the ledger must filter by type rather than assuming every row
is a savings movement.

---

### D025, `notifications` is a real table from the start, and preferences live on `users`
**Status:** Locked
**Supersedes:** nothing. `docs/DATA-MODEL.md` describes neither of these, so this entry adds them
rather than changing anything.

**Decision 1: the `notifications` table.** Blueprint 6.1 needs somewhere for "anything that
needs the employee's attention" to live, and `DATA-MODEL.md` has no such table. It is:

```
notifications(id, user_id -> users.id, category, message, target_url, read_at nullable, created_at)
```

`category` is an enum rather than free text, because the screen renders an icon per category and
a typo in a string would silently produce an unlabelled row. RLS is the narrowest in the schema:
`user_id = auth.uid()`, for select and update only. A notification is addressed to one person and
there is no reading over anyone's shoulder, not by a cooperative's officers, not by an admin.
There is deliberately **no insert policy at all**, the same shape as `loans`: an employee cannot
write their own notifications, because every notification is something the system or a
cooperative did, not something its recipient claims happened. The write path arrives with the
cooperative admin/officer blueprint.

"Mark all as read" is a real `UPDATE` setting `read_at`, not a client-side flag. An employee who
clears a backlog on their phone must find it cleared on their laptop, and the unread dot must
mean the same thing to every device.

**Decision 2, notification preferences are a `jsonb` column on `users`, not a table.** There is
exactly one preferences row per user and it is only ever read as a whole, alongside the user
record the screen has already loaded. A separate table would add a join and a second RLS policy
to express a relationship that is already one-to-one. `users.notification_preferences` is
`jsonb not null default '{}'`, and a **missing key means opted in**: an employee who has never
touched the toggles receives everything, and only an explicit `false` turns a category off. That
way a category added later is on by default for everyone rather than silently off for every
existing account, which is the failure mode a per-row-per-preference table would have had too.
Preferences are a delivery choice, never a suppression of the record: a muted category is still
written to `notifications` and still appears in the list. What it will eventually suppress is
email about it.

**This screen will show a genuine empty state in practice, and that is expected.** Nothing in the
employee blueprint writes a notification row, every writer (a loan approved or rejected, a
membership approved, a new public loan product) belongs to the cooperative admin/officer
blueprint, which does not exist yet. No rows are seeded and none will be fabricated to make the
screen look populated. This is the same call already made for the dashboard's trend indicator,
which read "No history yet" until `savings_transactions` existed rather than drawing an invented
line: a screen that is honestly empty is worth more than one that demonstrates well.

---

### D026: The employee support address is `support@clarix.ng`, read from configuration
**Status:** Provisional. The address shape is settled; the domain depends on the still-open
production-domain question at the foot of this document, so confirm it before go-live.

**Decision:** Help / Support (blueprint 6.3) sends its contact form to a single support mailbox,
and shows that same address on screen as a `mailto:` link so an employee is never dependent on
the form working. The address is `support@clarix.ng` unless `CLARIX_SUPPORT_EMAIL` overrides it,
so the pilot can point support at a real inbox without a code change.

**Rationale:** nothing in the repository settled a support address, and the blueprint is explicit
that this stage gets a mailbox rather than a ticketing system. A role address rather than a
person's own mailbox is the only choice that survives the pilot handing over to whoever runs
support next. Showing the address alongside the form is not redundancy for its own sake: the form
sends through Resend, and Resend cannot deliver to anyone but the account owner until a sending
domain is verified, so for now the `mailto:` link is the path that actually works. The form is
built correctly against the real API and starts working the moment that domain lands, which is
the same blocker already holding up signup confirmation mail.

**What still needs confirming:** whether `clarix.ng` is the domain that gets registered. If the
production domain lands somewhere else, this address moves with it and this entry is amended
rather than replaced.

---

### D027, Staff invitations are database rows, not Supabase admin-API calls; the service-role key stays unused
**Status:** Locked
**Supersedes:** nothing. It settles a mechanism the blueprints assume ("the Super Admin sends a
one-time invite link by email") without saying how it is built.

**Decision:** A cooperative admin invites an officer, and a Super Admin invites a cooperative's
first admin, by writing a row, never by calling Supabase's `auth.admin` API. There are two cases
and the mechanism handles both:

- **The invitee already has a Clarix account.** A `cooperative_staff_roles` row is written at
  status `invited`. Migration 001 already anticipated exactly this: it has an insert policy for a
  cooperative's admin and a separate policy letting the invited person move their own row from
  `invited` to `active` and nothing else. No new policy was needed, which is worth recording,
  the access pattern was checked against the live database rather than assumed.
- **The invitee has no account yet.** A `staff_invitations` row is written against their email
  address, and `claim_staff_invitations()` turns it into a real staff role the first time that
  person signs in. One email resolves to one account (D010), so a claim can never attach a role
  to the wrong person.

**Why not `auth.admin.inviteUserByEmail()`**, which is the obvious path and the one most Supabase
projects take: it requires the service-role key, which bypasses RLS entirely for every table in
the schema. Clarix has reached the whole employee blueprint and both halves of the loan mechanism
with `SECURITY.md`'s service-role list still empty, and an invitation: the lowest-stakes write in
the product, is a poor reason to be the first entry on it. The alternative costs two
`SECURITY DEFINER` functions whose reach is one email lookup and one insert each, which is a far
smaller hole than a key that can read every payslip and every loan in the database.

**What this does not solve.** The invitation still has to reach the person. That is email, and
email is blocked on the same thing everything else is: Resend has no verified sending domain yet,
so it delivers only to the account owner. The invitation row is real and correct the moment it is
written; the notification about it lights up when the domain lands. An invitation that exists but
has not been emailed is recoverable: an admin can read it back and pass the link on, whereas an
account created through an admin API that never received its email is not.

---

### D028: An imported member roster is its own table, and becomes a membership when the person joins
**Status:** Locked
**Supersedes:** nothing; `docs/DATA-MODEL.md` describes no import staging at all.

**Decision:** Blueprint 2.4 and `MVP-SCOPE.md` P0 #2 require a cooperative to bring hundreds of
existing members in from a spreadsheet. Those rows carry an IPPIS number, a name and a savings
balance, and no Clarix account. `cooperative_memberships.user_id` is not null and references
`users`, which references `auth.users`, so an imported member cannot be a membership until that
person has actually signed up.

So an import writes `member_roster_entries`: one row per person per cooperative, holding what the
cooperative already knows. When a row matches an existing account's IPPIS number the membership is
created immediately. When it does not, the entry waits, and a trigger on
`cooperative_memberships` links the two the moment that person joins Clarix, carrying the savings
balance the cooperative recorded onto the new membership and activating it, because a cooperative
that imported somebody has already decided they are a member.

**The alternatives, and why they lose.** Creating an `auth.users` row per imported member would
mean mass-creating accounts for people who have not consented, mostly without email addresses,
using the service-role key (D027 says why not). Relaxing the `users` foreign key so members can
exist without accounts would break the identity rule D021 rests on and leave RLS with rows it
cannot attribute to anybody. Storing the sheet as an uninterpreted blob until someone signs up
would mean the cooperative could not see or correct its own roster, which is half of what the
import is for.

**Consequence:** a roster entry is member data and is scoped exactly like a membership, staff of
that cooperative only, never the employee, who has no read access to the table at all. The
employee side gains something without doing anything: an imported member who joins finds their
savings balance already there rather than starting at zero.

---

### D029, Officers and admins share one set of staff screens, separated by permission rather than by a second app

**Decided:** 2026-09-12, while starting the cooperative officer blueprint.

**Decision:** the cooperative officer does not get a parallel route tree. Both staff roles work in
the same screens under `/admin/*`, and the difference between them is expressed in three places:
the navigation the shell builds (`staffNav()`: an officer has no "Manage cooperative" section and
no audit log at all), a guard at the top of each screen a role may not open, and, underneath both,
the RLS policies keyed on `staff_has_permission()`. Home is the one screen that genuinely differs,
and `/admin` renders a different component per role rather than hiding pieces of one.

The officer's own first-run tour is the exception and lives at `/officer/welcome`, because it is
the only screen that belongs to this role and to nobody else.

**Why.** The officer blueprint says it plainly: an officer "does the same day-to-day work an Admin
does ... but holds none of the cooperative-wide configuration power", and most of their screens are
"near-identical in shape to the equivalent Admin screens". Two copies of Member Profile, Record
Entry and Loan Review would drift, and the copy that drifted would be the officer's, since it is
the one nobody demos. A single screen whose controls appear or do not appear cannot drift.

**The alternative, and why it loses.** A `/officer/*` route group would read better in the address
bar, and it was the obvious first instinct. It costs a base-path parameter threaded through every
shared component's links, so that an officer clicking a member does not land back in the admin's
URL space, and it touches every already-tested admin screen to do it. The prefix is a cosmetic gain
paid for with a real refactor of working code.

**Consequence:** an officer's browser says `/admin/members`, which is a wart and is accepted as
one. Renaming the whole tree to something role-neutral stays available as a mechanical change if it
ever matters. The rule that must not be broken meanwhile: a screen an officer may not use needs a
guard of its own, because leaving it out of the navigation is not a boundary: only the guard and
the policy behind it are.

---

### D030: An access grant self-activates after a delay; it is not approved, and it lasts 24 hours

**Decided:** 2026-09-13, building super-admin blueprint 7.2 and 7.3.

**Decision:** a Super Admin's request to see a cooperative's member data becomes usable **on its
own, one hour after it is submitted**, and expires **24 hours after it activates**. The affected
cooperative's admin is notified the instant it is submitted, and can do nothing to stop it, what
they get is the hour, the reason, and a permanent record.

**Why self-activation rather than approval.** The blueprint deliberately left this configurable
("it either self-grants with a short mandatory delay ... or requires that Admin's explicit
approval"), so the tie-break came from `docs/DATA-MODEL.md`, which settles it by omission:
`access_grants` has `requested_by`, `granted_at`, `expires_at` and `revoked_at`, and **no
approver column at all**. An approval nobody is recorded as having given would be unauditable,
which contradicts everything else about that table, so a schema with no `approved_by` is a schema
describing a flow with no approver.

It is also the more honest of the two for this product's actual situation. Requiring approval
sounds safer and is worse in the case it exists for: a cooperative reports a discrepancy it cannot
explain, and the person who must approve the investigation is the person whose cooperative is
behaving oddly, possibly unreachable, possibly the problem. A support path that stalls when the
subject does not answer is a support path that does not work.

**Why one hour, and what it is really for.** The delay is not a veto window, because there is no
veto. It exists so that a cooperative's admin learns about the access *before* it happens rather
than afterwards, which is the difference between being told and being informed. An hour is long
enough to be a real warning during a working day and short enough that a genuine support case is
not held overnight. Nothing rests on the number; it is a starting value, and changing it is a
one-line change to `access_grants.activates_at`'s default.

**Why 24 hours.** The blueprint suggests it, nothing contradicts it, and it is short enough that
an unused grant lapses within a day while long enough to survive a support case that spans a
night. Same reasoning, same one-line change if experience says otherwise.

**Two schema deviations this forces**, recorded here rather than silently:

- `activates_at` is a column `docs/DATA-MODEL.md` does not list. The spec's flow had no delay to
  represent. It is the delay.
- `status` never stores `'active'` or `'expired'`. Both are functions of the clock, so both are
  computed at read time exactly as a loan reservation's expiry is (D024). What is stored is
  `'pending'` and `'revoked'`, which are the only two states a person ever puts a grant into. A
  stored `'expired'` would need a sweep job to stay true, and a status that is only true until the
  next tick is worse than no status.

**Consequence:** there is no screen anywhere that lets a cooperative admin approve or block an
access request, and that absence is deliberate rather than unbuilt. What protects a cooperative is
not a gate. It is that the request is justified in writing, announced before it takes effect,
limited to a day, revocable by the requester, read-only in the database, and logged record by
record in that cooperative's own audit log, where its admin reads it.

---

### D031: A cooperative's reviewer may open the payslip behind an application they are deciding, and only then

**Decided:** 2026-09-13, closing a fraud gap nobody had accounted for.

**Decision:** while a member has a loan application awaiting decision at a cooperative, staff of
that cooperative who hold the power to decide it can open and download the payslip the member's
salary figure came from. Outside that window, nothing changes: the document is the member's alone,
exactly as migration 004 established.

**What this reverses, and why that migration was not wrong.** Migration 004 scoped payslips to the
uploading employee and said so plainly: "cooperative staff have NO access to these rows or these
files, not even for members of their own cooperative. The eligibility figures they are entitled to
see come from `users.salary_gross` and the loan ledger, never from the document itself." That
reasoning was sound for what it considered. What it did not consider is that the figure it points
at is **self-reported**. A member uploads a payslip, confirms the numbers on a review screen, and
those numbers become the basis of everybody's eligibility arithmetic thereafter. Nothing in the
system has ever compared the confirmed figure to the document behind it, because nothing in the
system could see the document. A member who overstates their gross pay raises their own deduction
cap, and a cooperative approving money against that cap has no way to notice.

That is not a hypothetical: it is the one number the entire product rests on, and it was the one
number nobody could check.

**Why scoped to the review rather than granted generally.** The NDPA principle this schema is built
on is that no screen should expose more than its purpose requires. "Staff can see member payslips"
would be a general capability serving an occasional purpose. What is actually needed is narrower and
has a natural shape: a reviewer, deciding a specific application, checking the figure that decision
rests on against its evidence. So the access exists exactly while that application is waiting, ends
when it is decided or lapses, and belongs only to people who can decide it. An officer who may see
members but not decide loans gains nothing here, which is the same default-deny rule the rest of
their permissions follow.

It is narrower than general access in three ways at once: only during a live application, only for
the document the salary figure actually came from, and only for staff with approval permission.

**The alternatives, and why they lose.** Showing the extracted figures without the document would
mean trusting the same self-report the check exists to test. Letting the member attach a payslip to
each application would be more ceremony for the same file and would leave the confirmed salary
unchecked anyway. Requiring the member's per-application consent sounds better and is worse: consent
that is required to get a loan is not consent, and it would teach members that refusing is what
guilty people do.

**Explicitly deferred, not built:** periodic re-verification of an aging payslip. A salary confirmed
two years ago is weak evidence regardless of who can see it, and prompting for a fresh one on a
schedule is a real control worth having. It is not needed to close this gap, because the gap was
that nobody could ever check the document at all, and the scoped review access is the deterrent
that matters now. Automatic extraction and machine verification stay P1-deferred where
`docs/MVP-SCOPE.md` already puts them; this decision deliberately does not touch them.

**Consequence:** `SECURITY.md`'s payslip section and pgTAP suite 002 both change. Suite 002 keeps
its original assertion: an officer who may see members still cannot reach a payslip, because that
is still true and is now the interesting half. What it gains is the other half: with an application
waiting and the permission to decide it, the reviewer can; once decided, they cannot again.

---


## Release 2 (R2): the decisions behind the rebuild, 22 November 2026

Everything from D032 onward was decided by the owner (Temiloluwa) on 22 November 2026, while
planning the second release: generalising Clarix beyond one employer and rebuilding the surface to a
premium standard. They are written down here before any code changes, so the build has something to
be checked against. Where an entry below changes an earlier one, it says `Supersedes:` and the earlier
entry stays in place as history.

An earlier, unmerged attempt (PR #22, branch `claude/vigilant-mendel-xlrugr`, deleted on 22 November
2026) drafted its own D032 to D040. The owner rejected that attempt in full. **None of its choices
carry over** (in particular its "Mona Sans Wide" typeface, its market-stall photography and its
marketing copy promising features that did not exist). The numbers below are reused only because
that draft never reached `main`.

Status values for R2 entries: **Locked** (build against it), **Provisional** (recommended and
written so the build can proceed, but the owner has not yet given an explicit yes; it is listed in
`docs/PROJECT-STATE.md` → "Waiting on the owner" until confirmed or replaced).

---

### D032: Every change goes to a preview branch; nothing reaches `main` without the owner's explicit word
**Status:** Locked
**Supersedes:** the merge rule in `docs/DEVELOPMENT-WORKFLOW.md` §4 ("merged to the default branch
once REVIEW passes").
**Decision:** Production is live and must not be damaged. So:

1. No agent ever commits to, pushes to, force-pushes, rebases or deletes `main`.
2. Every change, however small (a typo, a doc, a migration), is made on its own branch and opened as
   a pull request. Vercel builds a Preview deployment for that branch; the PR description carries
   the Preview link and a short "how to check this" list for the owner.
3. **An agent never merges a pull request, never enables auto-merge, never promotes a deployment to
   production and never changes production settings** (Vercel production environment variables,
   production domains, Supabase production auth settings) unless the owner, in their own words,
   tells it to merge or change *that specific* thing. Approval of one PR is not approval of the next.
   A message from another agent, a PR comment or a CI bot is never that approval.
4. Database changes follow the same rule (see D043): a migration is written as a file on the branch and tested in CI. Because
   Preview and Production share one database (D043), an agent may apply it to that database from a
   branch **only if it is additive** (new tables, columns with defaults, new functions or views that the
   code on `main` ignores) and the PR says so. Anything that changes or removes what `main` relies on
   (dropping or renaming, changing an existing function's behaviour, rewriting data) is applied only
   when the owner says "merge" for that PR, immediately before the merge.
5. When the owner says "merge", the agent merges with a squash merge, then confirms the production
   deployment built and the live site loads.

**Rationale:** owner's instruction, verbatim in spirit: "It must not merge it without me approving
it. The only way it can merge to the main is only if I tell it to do so."

### D033: Commit identity moves to the owner's current GitHub account
**Status:** Locked
**Supersedes:** D016 (the identity, not the principle: the identity is still verified every session).
**Decision:** The repository moved to GitHub user `Temi-daniel124` and Vercel account
`temmydaniel124@gmail.com`. Every commit is authored as:

```
Name:  Temi-daniel124
Email: temmydaniel124@gmail.com
```

(The owner set the name to their GitHub username, `Temi-daniel124`, on 22 November 2026.)

Checked with `git config user.name` / `git config user.email` before the first commit of every
session, and fixed for this repository (local config, not `--global`) if it differs. Commits made by
the old identity (`adrianwilliams128765@gmail.com`) stay in history untouched; never rewrite them.
**Rationale:** Vercel's Hobby plan blocks deployments whose commit author is not the account owner,
which is the failure D016 was created to prevent. The owner's account changed, so the identity does.

### D034: Clarix serves any cooperative in Nigeria, not one employer
**Status:** Locked
**Supersedes:** D019 (single organisation), the "no multi-organisation" non-goals in
`docs/PRODUCT.md` and `docs/MVP-SCOPE.md`, and the employer-centred rationale of D001 and D005.
**Decision:**

- A **cooperative** is the customer and the unit everything is scoped to. It may or may not belong
  to an employer or institution.
- An **organisation** (renamed in the interface to "Institution") becomes optional grouping: a
  hospital, a university, a ministry, a company, or nothing. Cooperatives in the same institution
  share an institution-level default repayment policy and can be bundled for pricing (D041). A
  community, market, transport or professional cooperative has no institution at all.
- The fourth role is renamed from **Employee** to **Member** everywhere a person reads it (screens,
  copy, docs). The database keeps its table names (`users`, `cooperative_memberships`); renaming
  tables is not worth the migration risk.
- Every hard-coded reference to Federal Medical Centre, Abeokuta, IPPIS, "the hospital", "staff
  cooperatives" or `fmcabeokuta.org.ng` is removed from product code and copy. FMC-named records may
  remain **only as demo data** in the database.
- The member identifier becomes "Member ID" by default. A cooperative or institution that uses
  staff numbers (IPPIS, a payroll number, a matric number) sets its own label and optional pattern;
  a cooperative without one gets a Clarix-issued member number. No identifier pattern is ever global.
- The signup trigger no longer attaches every account to "the oldest organisation". A member's link
  to an institution comes from the cooperative they join, never from signup.

D001 stays: there are still exactly four roles (Super Admin, Cooperative Admin, Cooperative Officer,
Member). Its rationale now reads "Clarix is built for cooperatives, not for any employer".

**Rationale:** owner: "We are tying a platform that can become a great unicorn project to just one
specific cooperative... I'm trying to make the platform global for everybody, for every cooperative
around Nigeria." FMC Abeokuta remains the first prospective customer and the live demo audience.

### D035: Income evidence is a payslip, a bank statement, or a declared figure; nothing breaks without one
**Status:** Locked
**Supersedes:** D005's "salary figures come from an employee-uploaded payslip", D006's scope
(extended, not reversed), and D007's single platform-wide cap.
**Decision:**

1. A member's repayment capacity is computed from a **monthly income figure** with a recorded
   **source**: `payslip`, `bank_statement`, or `declared`. Each source records the evidence period
   and when it was confirmed.
2. **Payslip:** as today, gross and net monthly pay, plus the document.
   **Bank statement:** 3 to 6 consecutive months of statements. The figure used is the **average
   monthly inflow, excluding transfers between the member's own accounts and one-off lumps the
   member or staff mark as such**. Staff confirm it before it counts.
   **Declared:** the member types a figure with no document. It is shown everywhere as
   "Declared, not verified" until a staff member with approval permission marks it verified.
3. Each cooperative sets its own **repayment policy**: which income basis it uses (gross pay, net
   pay, or average inflow), the percentage cap (default 33.3% for payroll deductions, per the Labour
   Act; default 30% of average inflow for bank-statement income; any value 1 to 100 allowed), and
   whether unverified income may be used at all. An institution can set a default its cooperatives
   inherit; a cooperative inside an institution may only set a **lower** cap than the institution's,
   never higher (same rule shape as D009).
4. **The cross-cooperative limit is computed once per member, not per cooperative.** When a member's
   cooperatives use different policies, the check uses the **most conservative** (lowest) resulting
   limit, and says so in one line ("Using the lowest limit of your cooperatives").
5. **No income evidence never blocks joining, saving or browsing.** It only means the limit reads
   "Not assessed yet" with one action ("Add proof of income"), and a loan application from such a
   member is still stored (D040) and decided by the cooperative.
6. Extraction stays deterministic and human-confirmed: text extraction from real-text PDFs first,
   with an optional AI fallback for photographed documents (P2, needs its own approval under
   `docs/TOOLING-POLICY.md`). The member always confirms the figures; staff can see the evidence
   while an application is waiting (D031, now covering bank statements too). Nothing ever classifies
   individual deduction lines or transactions automatically (D006 holds).
7. Evidence ages: a figure older than the cooperative's evidence window (default 12 months) shows its
   age on every review and prompts the member to refresh it. It still counts until replaced.

**Rationale:** owner: "Some members don't collect pay slips... We need to be able to collect
something like bank statements... instead of wrong entry breaking the system, it needs to have a
proper fallback." `docs/EDGE-CASES.md` lists every scenario this decision answers.

### D036: Clarix keeps the books a cooperative needs to run day to day, around the cross-cooperative check
**Status:** Locked
**Supersedes:** D002 in part. Clarix is no longer "coordination only".
**Decision:** The cross-cooperative eligibility check stays the core and the reason Clarix exists.
Around it, Clarix becomes the cooperative's working record for members, savings and loans:

- import of members **with their existing loans** (balance, monthly repayment, start and end date),
  and a staff screen to add an existing loan by hand, so committed totals are right on day one;
- bulk monthly entries (one month's contributions and repayments for many members at once, from a
  sheet or a grid);
- **report export** as CSV, Excel (XLSX) and PDF;
- **member statements** as PDF: per cooperative and per period, watermarked (D044);
- reconciliation (already built).

Still out: holding or moving money (D004 is unchanged), payroll integration, full double-entry
accounting, general ledger and the cooperative's statutory books. Clarix records what happened; it
never executes it.
**Rationale:** owner asked how import, export and member statements work, and found that two of the
three did not exist. A cooperative will not pay for a tool it must still keep a second spreadsheet
beside. The pricing research also shows competitors that sell bookkeeping charge more.

### D037: Light theme only
**Status:** Locked
**Supersedes:** the light/dark token pairs in `DESIGN_SYSTEM.md`, the theme toggle, and the "both
themes" acceptance check in `docs/DEVELOPMENT-WORKFLOW.md`.
**Decision:** Clarix ships one light theme. The theme toggle, `ThemeScript`, the dark token values and
every `dark:` variant are removed. Navy remains a brand surface inside the light theme (auth side
panel, the landing hero band, the PDF header), so the product keeps its depth without a dark mode.
**Rationale:** owner: "we would be doing light theme only, but it needs to be very neat, clean, and
well thought through." One theme done perfectly beats two done adequately, and halves the visual QA.

### D038: Figtree is the typeface
**Status:** Locked
**Supersedes:** the Inter typography rule in `DESIGN_SYSTEM.md`.
**Decision:** Figtree (Google Fonts, Open Font License), loaded through `next/font/google` with weights
400, 500, 600 and 700, is the only typeface in the interface, the landing site and generated PDFs.
Money uses tabular figures (`font-variant-numeric: tabular-nums`). **First task of the foundation
PR:** confirm Figtree's tabular figures actually render as equal-width digits in Chrome, Safari and
Android Chrome (rolling numbers must not jitter). If they do not, money figures alone fall back to
**Inter** (already proven in this codebase) at the same sizes, and that is the only second face
ever allowed. No display faces, no serif, no wide faces.
**Rationale:** owner: "Fonts like Fig Tree, fonts like the current font... we don't need to use all
these over luxurious fonts."

### D039: Home screens summarise; detail opens in a bottom sheet
**Status:** Locked
**Supersedes:** the home-screen layouts in all four role blueprints (each blueprint's R2 header says
exactly which sections).
**Decision:** Every role's home follows one shape: a compact header (first name only, never the full
cooperative name in a sentence), **one hero figure**, **up to three stats**, **up to three "Needs
you" items**, and nothing else above the fold. Tapping any stat, item or row opens a **bottom sheet**
on phones (half and full height, drag to dismiss, back button closes it) and a **right-hand panel**
on desktop, so the person never loses their place. Long explanatory paragraphs, uppercase eyebrow
labels and "This month" essay cards are removed from home screens.
**Rationale:** owner: "The dashboard is meant to pass across a summary of what's happening... you can
use some of all those bottom pop-ups, like how iPhone normally do it... Instead of overcomplicating
the home page, just make it simple."

### D040: An over-limit application is always stored, never silently dropped
**Status:** Locked
**Supersedes:** nothing; it fixes a defect against `docs/PRODUCT.md` principle 3 ("Informs, never
gatekeeps").
**Decision:** Today `submit_loan_application` returns without inserting anything when the monthly
repayment exceeds available capacity, while the screen tells the member "the cooperative has your
application". From R2:

- An application above capacity (or from a member whose limit is "Not assessed yet") is **stored**
  with status `pending_review` and an `over_capacity` flag plus the shortfall at submission time.
- A `pending_review` loan **holds no capacity** and is never counted in anyone's committed total.
- Staff see it in the same queue, marked "Above limit by ₦X". Approving it still requires a written
  reason (the existing over-capacity approval rule) and, on approval, it becomes `active` and counts.
- The member's confirmation screen says exactly what happened: "Sent to [cooperative]. It is above
  your limit, so nothing is held for you. The cooperative will decide."
**This is Phase 0 of `docs/BUILD-PLAN.md`** because it affects the live product and the FMC demo.

### D041: Pricing: the cooperative pays per active member; members never pay
**Status:** Locked (the institution bundle in point 6 was confirmed by the owner on 22 November 2026).
**Supersedes:** the "Open, not yet decided" pricing item, and `docs/PRODUCT.md`'s instruction not to
build pricing.
**Decision:**

1. **₦150 per active member per month**, billed to the cooperative, **₦5,000 monthly minimum**.
   "Active" means the member had at least one saving, repayment, loan or eligibility check recorded
   in that calendar month.
2. **Members never pay.** They bring the cross-cooperative data that makes the product work.
3. **Yearly billing** at 10 months' price for 12. Quarterly is not offered at launch.
4. **60-day free trial** from the day the Super Admin activates the cooperative, all features, no
   card. Reminders on day 46 and day 57. Then a **14-day grace period** with a banner and a pay
   action. Then **read-only** until paid (D042).
5. **Founding price lock:** cooperatives that join before the first anniversary of R2's launch keep
   ₦150 for 12 months.
6. **Institution bundle (confirmed 22 Nov 2026):** when 3 or more cooperatives in the same institution are
   paying, each gets 10% off.
7. FMC Abeokuta's agreed MVP price and its promised free month are honoured as agreed; the 60-day
   trial applies to cooperatives that join afterwards.

The competitor prices and break-even maths are summarised in `docs/PRODUCT.md` (the owner holds the
full pricing report). **Collecting money is built last** (D042 and `docs/BUILD-PLAN.md` Phase 9).

### D042: A cooperative that stops paying goes read-only; its records keep protecting everyone else
**Status:** Locked
**Decision:** After trial plus grace (D041), an unpaid cooperative is **read-only**: staff can view
and export everything, members can view their own records and statements, and nothing new can be
recorded or applied for there. Paying restores everything instantly, with nothing lost. Records are
never deleted or hidden for non-payment.
**The network rule:** a read-only cooperative's existing active loans **keep counting** in every
other cooperative's eligibility checks. If they dropped out, a member could borrow twice against the
same room, which is the exact failure Clarix exists to prevent.
**Collection:** at launch, a Super Admin records a payment by hand (bank transfer against an emailed
invoice) on the cooperative's billing screen. Card and transfer collection through Paystack comes
later. **Paystack was confirmed by the owner on 22 November 2026** as the provider; it gets its `docs/TOOLING-POLICY.md` entry, because
it is the first payment SDK. It does not contradict D004: D004 forbids moving *members'* money; a
cooperative paying for its software subscription is ordinary SaaS billing.

### D043: One shared Supabase project for Preview and Production until go-live
**Status:** Locked (the owner decided on 22 November 2026; an earlier draft of this entry proposed a
separate staging project, and the owner declined it)
**Decision:** Clarix stays on the single `Clarix` Supabase project (`sxugaizwmqigtioqgefx`) for both
Preview and Production while it is a demonstration product. No staging project is created. Because a
Preview build therefore reads and writes the same database as the live site:

1. Migrations follow D032 point 4: additive changes may be applied from a branch and named in the
   PR; anything that changes or removes what `main` relies on is applied only when the owner says
   "merge" for that PR.
2. Nobody deletes, resets or bulk-rewrites the demo data (the five FMC cooperatives and the four demo
   accounts) without the owner's word. Tests of destructive actions (decline, delete entry, bulk
   import, billing states) use a throwaway cooperative created for the test and removed afterwards.
3. Every non-production deployment shows a thin `amber-50` strip at the top: "Preview · uses the live
   demo data" (BUILD-PLAN 0.4), so nobody mistakes a Preview for a sandbox.

**Revisit:** at go-live, when real cooperatives' data arrives, a separate project for previews becomes
a new decision.
**Rationale:** owner: "leave the database the way it is; there is no need for a staging database...
They are all still for demonstration; nothing official has been done."

### D044: Generated documents carry the brand and a diagonal watermark
**Status:** Locked
**Decision:** Every generated PDF (member statement, loan statement, report export) has: the Clarix
primary logo and the cooperative's name in the header; a document title, period and generation time
(Africa/Lagos); a **diagonal watermark** of the Clarix submark plus the cooperative's name at about
6% opacity, rotated 30 degrees, repeated down the page; a footer with page numbers and a short
**verification code** that a Super Admin or the cooperative can look up to confirm the document is
genuine. CSV and XLSX exports carry the cooperative name, period and generation time in their first
rows instead. Exports are logged in the cooperative's audit log (who, what, when).
**Rationale:** owner: "Those documents need to be properly watermarked, maybe like a faded-out logo
and name that lies diagonally and on the header of the document."

### D045: Buttons are pills; one primary per screen
**Status:** Locked
**Decision:** Every button is fully rounded (`border-radius: 9999px`, which reads as the 45px-radius
look the owner asked for at every height). Four levels, never confused: **primary** (filled
emerald, one per screen or sheet), **secondary** (quiet filled neutral), **tertiary** (text only),
**destructive** (red, always behind Timed Undo or a sheet confirmation). Cards and sheets use the
nested radius scale in `DESIGN_SYSTEM.md`, not pills.
**Rationale:** owner: "I love it when a CTA or button has a proper border radius like 45px."

### D046: Imagery is real and relevant, public site only; motion is purposeful and 60fps
**Status:** Locked (rules). Which photos is decided per PR by the owner.
**Decision:**

- **Public site only:** a hero with a slow, cross-fading background photo carousel (or a faint,
  muted, looping background video) of Nigerian cooperative life: people saving and meeting, nurses,
  teachers, traders, artisans, a cooperative meeting, a member checking a phone. Every image must
  match the words beside it; a market photo beside banking copy is a defect. Licensed sources only
  (Unsplash licence or commissioned); credit recorded in `public/images/CREDITS.md`.
- **Inside the app:** no stock photos. Cooperative logos where uploaded, initials otherwise. One
  exception: the member home may show a swipeable **Highlights** strip (at most 3 cards: a
  cooperative announcement, a new loan product, a statement ready) using the cooperative's own
  uploaded image or a brand pattern, and it only appears when there is something real to show.
- **Motion:** transform and opacity only, so it holds 60fps on a cheap Android phone. Tasteful
  depth is allowed on the public site (a phone mockup that tilts slightly in perspective as you
  scroll, parallax on the hero background, cards rising in on scroll). No floating blobs, no
  glass orbs, no confetti. Everything respects `prefers-reduced-motion`.
**Rationale:** owner asked for a hero carousel or background video, 3D scrolling, and images that
"reflect what you're trying to pass across".

### D047: SEO and app files are generated from code
**Status:** Locked
**Decision:** `app/sitemap.ts`, `app/robots.ts`, `app/manifest.ts` (exists), favicon and PNG app
icons, `app/opengraph-image.tsx`, per-page metadata and JSON-LD on the landing page. The site URL
comes from `NEXT_PUBLIC_SITE_URL`, so the day a domain is bought nothing else changes. `robots.txt`
allows only public pages, blocks every signed-in area, and returns `Disallow: /` on Preview
deployments so review links are never indexed. All signed-in pages are `noindex`.

### D048: A demo sign-in shortcut exists only where the owner switches it on
**Status:** Locked (confirmed by the owner on 22 November 2026)
**Decision:** For the FMC live demonstration, the sign-in screen may show "Sign in as" chips for the
four demo roles, so the presenter switches roles in one tap. It renders only when
`NEXT_PUBLIC_DEMO_MODE=true`, which is set **only on a demo or preview deployment the owner names**,
never in Production. The chips submit the normal sign-in form; demo passwords live in that
deployment's environment variables, never in the repository.
**Rationale:** the domain is not bought, Resend cannot send to anyone yet, so demo accounts are how
Clarix is shown until FMC pays.

### D049: Clarix runs on free tiers until the first cooperative pays
**Status:** Locked
**Decision:** Vercel Hobby, Supabase Free, Resend Free, no custom domain, until revenue arrives. The
day the first cooperative pays: Supabase Pro (daily backups, no pausing), Vercel Pro (Hobby's terms
restrict commercial use; confirm on vercel.com/legal before the first invoice), a domain, and a
verified Resend sending domain. No feature may assume a paid tier before then. Every new dependency
must work on the free tier (`docs/TOOLING-POLICY.md`).
**Consequence until then:** self-service signup, invitation emails and statement emails cannot reach
anyone but the account owner. Every screen that depends on email must say so plainly and offer the
working path (a copyable link, a download) rather than pretend a message was sent.

### D050: Figtree is bundled in the repository
**Status:** Locked
**Supersedes:** the `next/font/google` loading in D038. The typeface, the four weights and the
tabular-figure rule stand.
**Decision:** Figtree's four static weights (400, 500, 600, 700) are committed as woff2 files in
`src/app/fonts/`, with the SIL Open Font License beside them, and loaded with `next/font/local` under
the same `--font-figtree` variable and `display: swap`. They are the full instances (latin and
latin-ext together, 430 to 431 glyphs) with the `tnum` feature money relies on. No build downloads a font.
**Rationale:** owner's instruction (BUILD-PLAN 1.3 PR). A Google Fonts download failing on a CI
runner had already failed a build (R2 1.2); a font in the repository cannot.

### D051: The staff quick action rises above the tab bar
**Status:** Locked
**Supersedes:** the level 48px "+" in the R2 1.4 tab bar (DESIGN_SYSTEM §5.5 before 23 Nov 2026).
**Decision:** On phones, the admin's and officer's "+" is not a fifth tab. It is a 52px
`emerald-500` circle in a 72px `canvas` ring, centred on the tab bar's top edge so it reads as cut out
of the navy and raised above it. The bar keeps equal slots (two tabs, the centre action, two tabs),
each tab a 24px icon over a 12px label; the member bar keeps four equal slots with no centre action.
Every value is in DESIGN_SYSTEM §4.2 (`tab-label`) and §5.5.
**Rationale:** owner's choice, 23 Nov 2026, from a reference image: the quick action is the primary
action on a staff phone, so it should look like one rather than sit level with the tabs.

---

## Standing operational constraints

Not decisions, facts about the environment that keep being rediscovered and re-proposed as work.
They live here because this file is read in full at the start of every session, and
`docs/PROJECT-STATE.md` is rewritten often enough that a note there does not survive.

- **Leaked-password protection cannot be enabled.** Supabase's advisor recommends it, and it has
  been listed as an action item more than once, but checking passwords against HaveIBeenPwned is a
  **Pro-plan feature** and Clarix is on the free plan (`docs/ARCHITECTURE.md` → Scaling notes).
  There is nothing to switch on. Do not re-raise it as a task; if the project moves to Pro for
  some other reason, enabling it is a one-click setting and can be picked up then.

- **Keys and tokens are not rotated until go-live** (owner, 22 November 2026). The Supabase keys,
  the Resend API key and any access tokens the owner has shared keep being used as they are while
  Clarix is a demonstration product; all of them are rotated when the platform is about to go live
  officially. Do not raise rotation as a task before then. They are still never committed, printed in
  logs, PRs or messages, or pasted into any file outside `.env.local` (`SECURITY.md`).
- **The old Vercel project `clarix_app` stays connected** until the owner has accepted the new
  `clarix` project's designs and improvements; the owner will delete it then. Two Preview builds per
  push are expected until that day. Do not disconnect or change it.
- **Branch protection on `main` is deferred** by the owner; it blocks nothing. D032 is the rule
  meanwhile.

---

## Open, not yet decided

Tracked here so they don't get silently assumed. Move an item to a numbered entry above the
moment it's actually decided. Owner tasks (as opposed to open questions) live in
`docs/PROJECT-STATE.md` → "Waiting on the owner".

- Production domain. Several R2 items wait on it: a verified Resend sending domain, real invitation
  and statement emails, `NEXT_PUBLIC_SITE_URL` in sitemap and canonical URLs (D047), and
  cooperative self-signup.
- Whether a cooperative can sign itself up from the public site, or stays onboarded by the Super
  Admin as today (D010). Not before the domain exists, because self-signup needs email.
- Payslip and statement reading (Phase 7 of `docs/BUILD-PLAN.md`): text-layer PDF parsing only, or
  with an OCR or vision fallback for scanned images. A vision fallback sends a member's document to a
  third party and needs its own entry and a `SECURITY.md` update before it is built.
- Quarterly billing as a third option beside monthly and yearly (D041).
- Final repository visibility (private, presumably; confirm).
