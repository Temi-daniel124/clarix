# DECISIONS.md — Clarix

**Authority level: 1 (highest).** This is the log of record. Every other document in this
repository must agree with it. If any other doc appears to contradict an entry here, this file
wins — fix the other doc, don't reinterpret this one.

Format: each entry is locked once written. To change a decision, add a new entry that explicitly
supersedes the old one (`Supersedes: D0xx`) — never edit history in place. An AI agent (or human)
picking up this project after a break should be able to read this file top to bottom and
understand every non-obvious choice that shaped the product, without needing the original
planning conversation.

Status values: **Locked** (settled, build against it), **Provisional** (working assumption,
flagged for confirmation), **Superseded** (see the entry that replaced it).

---

### D001 — Exactly four roles, no more
**Status:** Locked
**Decision:** Clarix has exactly four roles: Super Admin, Cooperative Admin, Cooperative Officer,
Employee/User. There is no HR role, payroll officer, organization-level auditor, or
organization-supervisor role, and none will be added without a new decision entry here.
**Rationale:** Clarix is built for the cooperatives, not for the host organization (the hospital).
An organization-level role would imply Clarix serves the employer, which it explicitly does not.
**Full detail:** `docs/ROLES-AND-PERMISSIONS.md`.

### D002 — Product is a coordination layer, not accounting software
**Status:** Locked
**Decision:** Clarix's core value is cross-cooperative deduction coordination — it does not
replace a cooperative's internal accounting, does not move money, and does not integrate with
payroll/IPPIS directly.
**Rationale:** Validated against six real Nigerian cooperative-software competitors (Coopify,
Coopco, ProbityCoop, Hyves, Coopra, SODLAPP); none offer cross-cooperative visibility, and it is
the one gap worth building for. See `docs/PRODUCT.md`.

### D003 — Cross-cooperative eligibility is system-computed, not human-gated
**Status:** Locked
**Decision:** When Cooperative B looks up a member to decide on a loan, Clarix automatically
surfaces the *minimum necessary* cross-cooperative data (combined committed monthly obligations,
salary basis, resulting available capacity) — never another cooperative's savings balance or
other private records, and never mediated by a single designated human "gatekeeper" role. This
lookup is available at any time, not only during an active loan submission.
**Rationale:** Directly agreed by all committed FMC Abeokuta cooperative heads. This is the
governing privacy rule for the entire product — no screen, API, or report may expose more than
this minimum, in either direction.

### D004 — No money movement
**Status:** Locked
**Decision:** Clarix never holds, deposits, transfers, or disburses funds. Every savings and
repayment record in Clarix is a *record* of a payroll deduction that already happened elsewhere,
entered by cooperative staff or imported from a spreadsheet — never a live transaction Clarix
executes.
**Rationale:** No payment license, no custody risk, matches the lean-budget MVP.

### D005 — No payroll/IPPIS integration
**Status:** Locked
**Decision:** Clarix has no live connection to FMC's payroll system. Salary figures come from an
employee-uploaded payslip (once, at onboarding, re-uploaded on request afterward); cooperative
obligations come from Clarix's own ledger (import + on-platform activity), never from parsing a
payslip's deduction lines.
**Rationale:** No such access exists or is being sought; Clarix serves the cooperatives, not the
hospital as an institution.

### D006 — Payslip parsing extracts salary only, never classifies deductions
**Status:** Locked
**Decision:** The payslip pipeline extracts `salary_gross` and `salary_net` only. It does not
attempt to identify or classify individual deduction line items (statutory vs. cooperative),
even though a real reviewed FMC Abeokuta payslip shows both mixed together.
**Rationale:** Reliable text-label classification of a payslip's free-text deduction lines is a
real, unsolved classification problem with no clean payoff — Clarix's own ledger is already a
better source of truth for "what does this employee owe cooperatives."
**Supersedes:** an earlier working assumption that payslip deductions could be parsed and
reconciled automatically.

### D007 — Deduction basis defaults to gross salary; cap defaults to 33.3%
**Status:** Provisional (default is locked for build purposes; written cooperative sign-off is
still outstanding — non-blocking)
**Decision:** `organizations.deduction_basis = 'gross'`, `deduction_max_percentage = 33.3`,
matching the Nigerian Labour Act §5 cap. Evidence: on a reviewed real payslip, three named
cooperative deductions summed to 30.3% of gross vs. 58.2% of net — only the gross basis is
consistent with the cap actually being enforced today. Configurable at organization level by
Super Admin only; cooperatives inherit it and cannot override the basis or the percentage.
**Action before go-live:** get one-line written confirmation from cooperative heads.

### D008 — Capacity reservation via advisory lock, at submission, not approval
**Status:** Locked
**Decision:** Submitting a loan application (not approving it) atomically reserves the requested
monthly repayment against the employee's available capacity, using
`pg_advisory_xact_lock(:user_id)` to serialize concurrent submissions for the same employee.
**Rationale:** Prevents two cooperatives simultaneously approving loans against the same slice of
headroom — the core race condition the product exists to close. See `docs/DATA-MODEL.md` for the
exact transaction.

### D009 — Reservation expiry: 7-day org default, cooperative may only shorten
**Status:** Locked
**Decision:** `organizations.reservation_expiry_days_default = 7`. A cooperative may set a
shorter `reservation_expiry_days_override`, never a longer one, enforced at write time.
**Rationale:** No cooperative should be able to hold shared capacity longer than the agreed norm.

### D010 — One account per email; roles and memberships are independent, cooperative-scoped rows
**Status:** Locked
**Decision:** A person has exactly one Clarix account regardless of how many cooperatives they
touch. `cooperative_memberships` (beneficiary/savings-holding) and `cooperative_staff_roles`
(admin/officer) are separate tables, both scoped by `cooperative_id`; a person can hold any
combination of either, at any number of cooperatives, simultaneously.
**Rationale:** Directly answers the "same person, multiple cooperatives" scaling question without
forcing separate logins or blocking legitimate multi-cooperative involvement.

### D011 — Row-Level Security is the enforcement boundary, not the UI
**Status:** Locked
**Decision:** Per-cooperative data isolation is enforced by Postgres RLS policies keyed on
`cooperative_staff_roles` (active status, matching `cooperative_id`), not by hiding links in the
client. A UI guard alone is never sufficient for anything touching member financial data.
**Rationale:** Prevents the "`/member/1234` → `/member/1235`" class of leak structurally.

### D012 — Stack: Next.js + Tailwind + shadcn/base-ui + Motion, on Vercel/Supabase/Resend
**Status:** Locked
**Decision:** React via Next.js, Tailwind CSS, shadcn/base-ui components, Motion
(`motion/react`) for animation. Deployed on Vercel. Backend/DB/Auth/Storage on Supabase.
Transactional email via Resend. All on free tiers except one paid AI API (Claude or OpenAI) used
only for payslip OCR fallback.
**Rationale:** Matches the already-adopted Watermelon UI component set (React+Tailwind+shadcn+
Motion), the already-agreed lean-budget infra, and the client's existing tool choices.

### D013 — `lucide-react` is the only icon library
**Status:** Locked
**Decision:** Every icon in the product comes from `lucide-react`. No `react-icons`,
`@hugeicons/react`, or any other icon package may be introduced.
**Rationale:** Mixed icon sets (different stroke weights/corner styles) are one of the fastest,
most visible ways an interface reads as assembled-from-tutorials rather than designed. See
`DESIGN_SYSTEM.md`.

### D014 — No native mobile app; a well-built PWA is the entire mobile strategy
**Status:** Locked
**Rationale:** Matches lean-budget constraints and the installability requirement already
gathered from the client ("must act like a normal mobile application and a normal desktop
application").

### D015 — No local Docker on the development machine
**Status:** Locked
**Decision:** Local schema work uses `supabase link` plus `supabase db diff` / `db push` against
the real remote Supabase project. Docker-dependent tooling (pgTAP, full RLS integration tests,
`supabase db start`) never runs on the developer's laptop — it runs inside GitHub Actions on the
hosted Ubuntu runner, which provides its own Docker.
**Rationale:** Docker Desktop measured ~2.3 GB RAM / ~6.4 GB disk before Postgres even started, on
a machine where that's not affordable long-term. GitHub Actions' hosted runner is the
Supabase-documented way to get faithful `auth.users`/RLS/pgTAP behavior without that local cost.
Full detail and the workflow stub: `docs/DEVELOPMENT-WORKFLOW.md`.

### D016 — Fixed commit identity, verified every session
**Status:** Locked
**Decision:** Every commit in this repository is authored as `Temiloluwa Adebayo` /
`adrianwilliams128765@gmail.com`. This is verified (not assumed) before the first commit of every
working session.
**Rationale:** A prior mismatch between the committing identity and what Vercel/GitHub expected
caused Vercel to block a production deployment. This is now a hard gate, not a convention. Full
procedure: `docs/DEVELOPMENT-WORKFLOW.md`.

### D017 — Design must never read as AI-generated or generic
**Status:** Locked
**Decision:** Every screen is built against the signature visual motif (rolling-number figures +
used-vs-available meter), the fixed token set, and the anti-generic-design checklist in
`DESIGN_SYSTEM.md`. Every UI-producing task is treated as pixel-level work, not "good enough."
**Rationale:** Explicit, repeated client requirement. This is a non-negotiable acceptance
criterion on every screen, not a stylistic preference.

### D018 — No AI/ML in the eligibility decision itself
**Status:** Locked
**Decision:** Eligibility is deterministic arithmetic against an agreed policy (see D007, D008) —
auditable, reproducible, never a model output. AI's only role anywhere in v1 is optional,
human-reviewed payslip field extraction (see D006, and the fallback pipeline in
`docs/ARCHITECTURE.md`).

### D019 — Single-organization data model for v1
**Status:** Locked
**Decision:** The schema is scoped by `organization_id`/`cooperative_id` throughout, but v1 only
ever populates one `organizations` row (Federal Medical Centre, Abeokuta). Nothing in P0/P1 scope
depends on, or should be built toward, a second organization.
**Rationale:** Keeps the build lean; the scoping columns exist so a second organization is a new
row later, not a rewrite — but that day is not today.

### D020 — The Supabase project "Clarix" is new and standalone
**Status:** Locked
**Decision:** A brand-new Supabase project named `Clarix` is created inside the existing Supabase
organization, alongside — and completely independent of — an existing unrelated project in that
same organization. The existing project's database, auth users, storage, API keys, and settings
are never touched, queried, or referenced by anything in this codebase.
**Rationale:** Explicit client instruction; accidental cross-project access would be a serious
data-boundary failure for an unrelated client's data.

### D021 — Credentials live in Supabase Auth; `public.users` is a 1:1 profile keyed to `auth.users`
**Status:** Locked
**Decision:** `public.users.id` is a primary key that references `auth.users(id)` with
`on delete cascade`, and the table carries no `password_hash` column — the illustrative one in
`docs/DATA-MODEL.md` is satisfied by Supabase Auth, which owns credentials, email/phone
verification and session issuance. The matching `public.users` row is created by a
`SECURITY DEFINER` trigger (`on_auth_user_created`) in the same transaction as the `auth.users`
insert, rather than by a second write from application code.
**Rationale:** Two writes from the client can half-succeed, leaving an account that can sign in
but has no Clarix row. Doing it in the database makes that impossible, and avoids introducing
the first service-role-key code path in the product — `SECURITY.md`'s enumerated list of those
stays empty, which is worth keeping true for as long as possible.
**Consequence:** `users.employee_id`, `name`, `salary_gross` and `salary_net` are all nullable
at creation and filled in during onboarding (blueprint 2.2–2.4); `employee_id` is unique per
organization, not globally.

### D022 — v1 authentication is email and password only; phone sign-in is deferred
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
### D023 — Agent-applied migrations go through the Supabase Management API; `db push` stays the human path
**Status:** Locked
**Supersedes:** nothing; it narrows the operational detail of D015, which is unchanged — no local
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
   database, and no dashboard SQL-editor edits — the prohibition in `DATA-MODEL.md`
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

### D024 — Two deliberate departures from `DATA-MODEL.md` in the loan/savings schema
**Status:** Locked
**Supersedes:** nothing; it records where the implemented schema knowingly goes past what
`DATA-MODEL.md` describes, so the difference is a decision rather than drift.

**Decision 1 — `savings_transactions` carries loan repayments, not only savings movements.**
The table gains a `loan_repayment` value in its type enum and a nullable `loan_id` column,
constrained so `loan_id` is present exactly when the type is `loan_repayment` and absent
otherwise. `DATA-MODEL.md` defines no repayment ledger at all, yet Loan Detail (blueprint 5.3)
has to show how much of a loan has actually been repaid, and a loan's progress must be derived
from money that genuinely moved rather than from how many months have elapsed since approval. A
separate `loan_repayments` table was the alternative and was rejected: both kinds of row are the
same shape — a dated, described, signed amount against one membership — and keeping them in one
ledger means a member's statement can be assembled from a single ordered query. The savings
statement screen filters the repayment rows out, because a repayment leaves the salary and does
not move the savings balance.

**Decision 2 — a lapsed reservation is not a committed obligation, even while its status still
reads `reserved`.** Every capacity calculation counts a reserved loan only while
`reservation_expires_at` is still in the future. Nothing sweeps the table to rewrite statuses to
`expired`, so a row can read `reserved` and contribute nothing to the committed total. The
alternative — a scheduled job flipping statuses — was rejected because capacity would then be
wrong for as long as the job was late, down, or between runs, and being wrong about capacity is
the one failure this product cannot have. Expiry is therefore evaluated at read time, which makes
it exact by construction. A background sweep may still be added later for tidiness, but it would
be cosmetic: it could only ever agree with what the read-time check already computed.

**Consequence:** `DATA-MODEL.md` describes the shape of the intent, and these two points are where
the implementation is authoritative instead. Anything computing committed obligations must apply
the expiry check; anything reading the ledger must filter by type rather than assuming every row
is a savings movement.

---

### D025 — `notifications` is a real table from the start, and preferences live on `users`
**Status:** Locked
**Supersedes:** nothing. `docs/DATA-MODEL.md` describes neither of these, so this entry adds them
rather than changing anything.

**Decision 1 — the `notifications` table.** Blueprint 6.1 needs somewhere for "anything that
needs the employee's attention" to live, and `DATA-MODEL.md` has no such table. It is:

```
notifications(id, user_id -> users.id, category, message, target_url, read_at nullable, created_at)
```

`category` is an enum rather than free text, because the screen renders an icon per category and
a typo in a string would silently produce an unlabelled row. RLS is the narrowest in the schema:
`user_id = auth.uid()`, for select and update only. A notification is addressed to one person and
there is no reading over anyone's shoulder — not by a cooperative's officers, not by an admin.
There is deliberately **no insert policy at all**, the same shape as `loans`: an employee cannot
write their own notifications, because every notification is something the system or a
cooperative did, not something its recipient claims happened. The write path arrives with the
cooperative admin/officer blueprint.

"Mark all as read" is a real `UPDATE` setting `read_at`, not a client-side flag. An employee who
clears a backlog on their phone must find it cleared on their laptop, and the unread dot must
mean the same thing to every device.

**Decision 2 — notification preferences are a `jsonb` column on `users`, not a table.** There is
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
employee blueprint writes a notification row — every writer (a loan approved or rejected, a
membership approved, a new public loan product) belongs to the cooperative admin/officer
blueprint, which does not exist yet. No rows are seeded and none will be fabricated to make the
screen look populated. This is the same call already made for the dashboard's trend indicator,
which read "No history yet" until `savings_transactions` existed rather than drawing an invented
line: a screen that is honestly empty is worth more than one that demonstrates well.

---

### D026 — The employee support address is `support@clarix.ng`, read from configuration
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

### D027 — Staff invitations are database rows, not Supabase admin-API calls; the service-role key stays unused
**Status:** Locked
**Supersedes:** nothing. It settles a mechanism the blueprints assume ("the Super Admin sends a
one-time invite link by email") without saying how it is built.

**Decision:** A cooperative admin invites an officer — and a Super Admin invites a cooperative's
first admin — by writing a row, never by calling Supabase's `auth.admin` API. There are two cases
and the mechanism handles both:

- **The invitee already has a Clarix account.** A `cooperative_staff_roles` row is written at
  status `invited`. Migration 001 already anticipated exactly this: it has an insert policy for a
  cooperative's admin and a separate policy letting the invited person move their own row from
  `invited` to `active` and nothing else. No new policy was needed, which is worth recording —
  the access pattern was checked against the live database rather than assumed.
- **The invitee has no account yet.** A `staff_invitations` row is written against their email
  address, and `claim_staff_invitations()` turns it into a real staff role the first time that
  person signs in. One email resolves to one account (D010), so a claim can never attach a role
  to the wrong person.

**Why not `auth.admin.inviteUserByEmail()`**, which is the obvious path and the one most Supabase
projects take: it requires the service-role key, which bypasses RLS entirely for every table in
the schema. Clarix has reached the whole employee blueprint and both halves of the loan mechanism
with `SECURITY.md`'s service-role list still empty, and an invitation — the lowest-stakes write in
the product — is a poor reason to be the first entry on it. The alternative costs two
`SECURITY DEFINER` functions whose reach is one email lookup and one insert each, which is a far
smaller hole than a key that can read every payslip and every loan in the database.

**What this does not solve.** The invitation still has to reach the person. That is email, and
email is blocked on the same thing everything else is: Resend has no verified sending domain yet,
so it delivers only to the account owner. The invitation row is real and correct the moment it is
written; the notification about it lights up when the domain lands. An invitation that exists but
has not been emailed is recoverable — an admin can read it back and pass the link on — whereas an
account created through an admin API that never received its email is not.

---

### D028 — An imported member roster is its own table, and becomes a membership when the person joins
**Status:** Locked
**Supersedes:** nothing; `docs/DATA-MODEL.md` describes no import staging at all.

**Decision:** Blueprint 2.4 and `MVP-SCOPE.md` P0 #2 require a cooperative to bring hundreds of
existing members in from a spreadsheet. Those rows carry an IPPIS number, a name and a savings
balance — and no Clarix account. `cooperative_memberships.user_id` is not null and references
`users`, which references `auth.users`, so an imported member cannot be a membership until that
person has actually signed up.

So an import writes `member_roster_entries`: one row per person per cooperative, holding what the
cooperative already knows. When a row matches an existing account's IPPIS number the membership is
created immediately. When it does not, the entry waits, and a trigger on
`cooperative_memberships` links the two the moment that person joins Clarix — carrying the savings
balance the cooperative recorded onto the new membership and activating it, because a cooperative
that imported somebody has already decided they are a member.

**The alternatives, and why they lose.** Creating an `auth.users` row per imported member would
mean mass-creating accounts for people who have not consented, mostly without email addresses,
using the service-role key (D027 says why not). Relaxing the `users` foreign key so members can
exist without accounts would break the identity rule D021 rests on and leave RLS with rows it
cannot attribute to anybody. Storing the sheet as an uninterpreted blob until someone signs up
would mean the cooperative could not see or correct its own roster, which is half of what the
import is for.

**Consequence:** a roster entry is member data and is scoped exactly like a membership — staff of
that cooperative only, never the employee, who has no read access to the table at all. The
employee side gains something without doing anything: an imported member who joins finds their
savings balance already there rather than starting at zero.

---

### D029 — Officers and admins share one set of staff screens, separated by permission rather than by a second app

**Decided:** 2026-09-12, while starting the cooperative officer blueprint.

**Decision:** the cooperative officer does not get a parallel route tree. Both staff roles work in
the same screens under `/admin/*`, and the difference between them is expressed in three places:
the navigation the shell builds (`staffNav()` — an officer has no "Manage cooperative" section and
no audit log at all), a guard at the top of each screen a role may not open, and, underneath both,
the RLS policies keyed on `staff_has_permission()`. Home is the one screen that genuinely differs,
and `/admin` renders a different component per role rather than hiding pieces of one.

The officer's own first-run tour is the exception and lives at `/officer/welcome`, because it is
the only screen that belongs to this role and to nobody else.

**Why.** The officer blueprint says it plainly: an officer "does the same day-to-day work an Admin
does ... but holds none of the cooperative-wide configuration power", and most of their screens are
"near-identical in shape to the equivalent Admin screens". Two copies of Member Profile, Record
Entry and Loan Review would drift — and the copy that drifted would be the officer's, since it is
the one nobody demos. A single screen whose controls appear or do not appear cannot drift.

**The alternative, and why it loses.** A `/officer/*` route group would read better in the address
bar, and it was the obvious first instinct. It costs a base-path parameter threaded through every
shared component's links, so that an officer clicking a member does not land back in the admin's
URL space, and it touches every already-tested admin screen to do it. The prefix is a cosmetic gain
paid for with a real refactor of working code.

**Consequence:** an officer's browser says `/admin/members`, which is a wart and is accepted as
one. Renaming the whole tree to something role-neutral stays available as a mechanical change if it
ever matters. The rule that must not be broken meanwhile: a screen an officer may not use needs a
guard of its own, because leaving it out of the navigation is not a boundary — only the guard and
the policy behind it are.

---

### D030 — An access grant self-activates after a delay; it is not approved, and it lasts 24 hours

**Decided:** 2026-09-13, building super-admin blueprint 7.2 and 7.3.

**Decision:** a Super Admin's request to see a cooperative's member data becomes usable **on its
own, one hour after it is submitted**, and expires **24 hours after it activates**. The affected
cooperative's admin is notified the instant it is submitted, and can do nothing to stop it — what
they get is the hour, the reason, and a permanent record.

**Why self-activation rather than approval.** The blueprint deliberately left this configurable
("it either self-grants with a short mandatory delay ... or requires that Admin's explicit
approval"), so the tie-break came from `docs/DATA-MODEL.md`, which settles it by omission:
`access_grants` has `requested_by`, `granted_at`, `expires_at` and `revoked_at`, and **no
approver column at all**. An approval nobody is recorded as having given would be unauditable,
which contradicts everything else about that table — so a schema with no `approved_by` is a schema
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
not a gate — it is that the request is justified in writing, announced before it takes effect,
limited to a day, revocable by the requester, read-only in the database, and logged record by
record in that cooperative's own audit log, where its admin reads it.

---

### D031 — A cooperative's reviewer may open the payslip behind an application they are deciding, and only then

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
its original assertion — an officer who may see members still cannot reach a payslip — because that
is still true and is now the interesting half. What it gains is the other half: with an application
waiting and the permission to decide it, the reviewer can; once decided, they cannot again.

---

## Standing operational constraints

Not decisions — facts about the environment that keep being rediscovered and re-proposed as work.
They live here because this file is read in full at the start of every session, and
`docs/PROJECT-STATE.md` is rewritten often enough that a note there does not survive.

- **Leaked-password protection cannot be enabled.** Supabase's advisor recommends it, and it has
  been listed as an action item more than once, but checking passwords against HaveIBeenPwned is a
  **Pro-plan feature** and Clarix is on the free plan (`docs/ARCHITECTURE.md` → Scaling notes).
  There is nothing to switch on. Do not re-raise it as a task; if the project moves to Pro for
  some other reason, enabling it is a one-click setting and can be picked up then.

---

## Open, not yet decided

Tracked here so they don't get silently assumed. Move an item to a numbered entry above the
moment it's actually decided.

- Final repository name and GitHub visibility (private, presumably — confirm).
- Production domain (using Vercel's default `*.vercel.app` subdomain, or a custom domain).
- Whether Employee-role payslip OCR launches with pure PDF-text-extraction only, or with the
  vision-LLM fallback live from day one (both are in scope per `MVP-SCOPE.md`; sequencing is open).
- Paid recurring-plan pricing packages — explicitly deferred to after the free hook month; do not
  design or build toward specific numbers yet.
