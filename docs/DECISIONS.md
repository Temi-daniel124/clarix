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
