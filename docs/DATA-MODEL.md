# DATA-MODEL.md, Clarix

**Authority level: 3 of 14.** Defers to `DECISIONS.md`. This is the canonical schema, if code and this
document disagree, this document is right and the code has drifted; fix the code (and, if the
fix reveals the model itself needs to change, add a new `DECISIONS.md` entry first).

**R2 note (22 November 2026):** the schema below is what is live (R1). The changes Release 2 makes
are specified in "R2 planned schema" at the end of this file; build them in the BUILD-PLAN step named
beside each. Until a step ships, the R1 description stays true. The note in Step 3 below ("no row
inserted") is the defect D040 fixes.

Written for Postgres/Supabase. Types below are illustrative, not exhaustive DDL, treat this as
the contract for what each table means and how it's scoped, and write the actual migration SQL to
match it.

```
organizations
  id (pk)
  name                        -- "Federal Medical Centre, Abeokuta"
  employee_id_format          -- e.g. "IPPIS", pattern = 6-digit numeric; configurable per org
  deduction_basis             -- 'gross' | 'net', default 'gross' (DECISIONS.md D007)
  deduction_max_percentage    -- e.g. 33.3, editable by Super Admin only
  reservation_expiry_days_default   -- e.g. 7: the org-wide default AND ceiling
  created_at

cooperatives
  id (pk)
  organization_id (fk -> organizations)
  name
  description                 -- public, discovery-visible
  requirements                -- public
  status                      -- 'active' | 'inactive'
  min_savings_ratio_default   -- e.g. 0.25 / 0.35 / 0.50, overridable per loan product
  reservation_expiry_days_override  -- nullable; may be SHORTER than the org default, never longer
  created_at

cooperative_loan_products
  id (pk)
  cooperative_id (fk)
  name
  min_savings_ratio
  max_tenure_months
  interest_terms               -- free text/simple structure, not modeled deeply in v1
  is_public                    -- shown in discovery

users
  id (pk)
  organization_id (fk)
  employee_id                  -- IPPIS number, unique within organization
  name
  email / phone
  password_hash
  salary_gross
  salary_net
  salary_source_doc_id (fk -> documents, nullable)
  salary_verified_at
  created_at

documents
  id (pk)
  user_id (fk)
  type                          -- 'payslip'
  file_url
  extracted_fields (jsonb)      -- raw extraction output, pre-confirmation
  review_status                 -- 'pending_review' | 'confirmed' | 'corrected'
  uploaded_at

cooperative_memberships
  id (pk)
  user_id (fk)
  cooperative_id (fk)
  status                        -- 'pending' | 'active' | 'suspended'
  savings_balance
  joined_at
  UNIQUE(user_id, cooperative_id)
  -- Beneficiary/savings-holding membership. Deliberately separate from staff roles below:
  -- a person can be a beneficiary at one cooperative and staff at another, or both at the same one.

cooperative_staff_roles
  id (pk)
  user_id (fk)
  cooperative_id (fk)
  role                          -- 'admin' | 'officer'
  title                         -- free-text display label set by the cooperative's admin,
                                 -- e.g. 'Treasurer', cosmetic only, never changes permissions
  permissions (jsonb)           -- boolean flags, meaningful only when role='officer';
                                 -- admins implicitly have full cooperative permissions.
                                 -- Live keys: can_view_members, can_record_savings,
                                 -- can_approve_loans, can_import_members. Default-deny, and each
                                 -- is enforced by a policy (migrations 016, 017), not by the UI
  granted_by (fk -> users)
  status                        -- 'invited' | 'active' | 'revoked'
  invited_at / accepted_at
  UNIQUE(user_id, cooperative_id, role)
  -- One person can hold rows here for MULTIPLE cooperatives at once (officer at A, officer at B,
  -- admin of their own C), and simultaneously hold ordinary cooperative_memberships elsewhere.
  -- Same email, same single account, throughout, DECISIONS.md D010.

platform_admins
  user_id (fk, pk)
  -- Super Admin is a platform-level flag, not scoped to any cooperative.

savings_transactions
  id (pk)
  membership_id (fk -> cooperative_memberships)
  amount
  type                           -- 'contribution' | 'withdrawal_record'
  recorded_by (fk -> users, staff)
  recorded_at

loans
  id (pk)
  membership_id (fk -> cooperative_memberships)
  requested_amount
  monthly_repayment
  tenure_months
  status                         -- 'draft' | 'reserved' | 'active' | 'rejected' | 'completed' | 'expired'
  reserved_at
  reservation_expires_at
  approved_at
  approved_by (fk -> users, staff)
  created_at

deduction_reconciliation
  id (pk)
  membership_id (fk)
  period                          -- e.g. '2026-09'
  expected_amount
  actual_amount_received          -- manually entered by cooperative admin
  entered_by (fk -> users, staff)
  entered_at

cooperative_internal_notes          -- migration 021
  cooperative_id (pk, fk)
  note                             -- the platform operator's private note about a cooperative
  updated_by (fk -> users) / updated_at
  -- Its own table rather than a column on cooperatives, because cooperatives is readable by
  -- every signed-in user (discovery needs its public fields) and RLS cannot hide one column.

access_grants
  id (pk)
  requested_by (fk -> users, platform_admins)
  cooperative_id (fk)
  member_user_id (fk, nullable)   -- narrows to one member if set, else whole cooperative
  reason                          -- required, free text, cannot be blank/generic
  status                          -- 'pending' | 'active' | 'expired' | 'revoked'
  requested_at / activates_at / expires_at / revoked_at
  -- The one deliberate, logged exception to Super Admin having no standing access to member
  -- financial data. See SECURITY.md and the Super Admin blueprint for the full flow.
  --
  -- Built in migrations 025-026, with two deviations from the sketch above (DECISIONS.md D030):
  -- `activates_at` replaces `granted_at`, because a grant self-activates after a delay and the
  -- moment of granting is therefore known in advance; and `status` only ever stores 'pending' or
  -- 'revoked', because 'active' and 'expired' are functions of the clock and are computed at read
  -- time exactly as a loan reservation's expiry is (D024).

audit_log
  id (pk)
  actor_user_id (fk)
  action                           -- 'view_member' | 'edit_loan' | 'approve_loan' | etc.
  target_table
  target_id
  old_value (jsonb, nullable)
  new_value (jsonb, nullable)
  created_at
```

## Row-Level Security: the actual enforcement of data isolation

Every table keyed by `cooperative_id` gets an RLS policy that checks the requesting user's
`cooperative_staff_roles` row (`status='active'`) against that same `cooperative_id`. A
Cooperative Admin or Officer can only read/write rows where they hold an active staff role at
*that specific* cooperative; holding one at a different cooperative grants nothing on this table.
This is what prevents the "`/member/1234` → `/member/1235`" leak: the boundary lives in the
database policy, not a UI guard a client could bypass (`DECISIONS.md` D011).

The `access_grants` table is the one deliberate exception path: a Super Admin's read access to a
specific cooperative's member data is only ever valid while a matching `access_grants` row exists
with `status='active'` and the current time is before `expires_at`. Write `RLS` policies for
Super Admin remain `false` everywhere in this domain, Super Admin never gets write access to
cooperative financial data through this mechanism, only time-boxed read access. See
`SECURITY.md`.

## Eligibility & reservation, how it actually runs

**Step 1, Compute available capacity for an employee (read-only, safe to run any time):**

```sql
cap = salary_basis_amount(user, organization.deduction_basis) * organization.deduction_max_percentage

committed = SUM(monthly_repayment)
            FROM loans
            JOIN cooperative_memberships ON loans.membership_id = memberships.id
            WHERE memberships.user_id = :user_id
              AND loans.status IN ('reserved', 'active')

available = cap - committed
```

This powers the "look up an employee, see eligibility" lookup (available any time, per
`DECISIONS.md` D003) and the employee's own dashboard. It never exposes another cooperative's
savings balance: only the *sum* of monthly obligations, which is exactly the field the cap math
needs.

**Step 2, Preview (no side effect):** re-run Step 1's formula with a hypothetical
`requested_monthly_repayment` added, return eligible/not-eligible plus the shortfall or headroom.
Read-only, safe to call repeatedly (this is what drives the live slider/meter on the loan
application screen).

**Step 3, Reservation (the concurrency-safe step, only on actual submission):**

```sql
BEGIN transaction;
  SELECT pg_advisory_xact_lock(:user_id);   -- serializes concurrent attempts for the same employee

  recompute committed and available (same formula as Step 1, inside the lock);

  IF requested_monthly_repayment <= available:
    expiry_days = COALESCE(cooperative.reservation_expiry_days_override,
                            organization.reservation_expiry_days_default);
    -- cooperative override may only be SHORTER than the org default, enforced at write time
    INSERT INTO loans (..., status='reserved', reserved_at=now(),
                        reservation_expires_at = now() + expiry_days days);
    result = ELIGIBLE;
  ELSE:
    result = NOT_ELIGIBLE (shortfall = requested - available);
    -- no row inserted, nothing reserved

COMMIT;
```

The advisory lock means a second cooperative's submission for the *same employee*, arriving
milliseconds later, waits for the first transaction to finish and then recomputes `committed`
including the just-reserved loan, so it correctly sees the reduced `available`, not a stale
number. This is the mechanism that makes "capacity reservation" hold under real concurrent use,
not just in a happy-path demo (`DECISIONS.md` D008).

**Step 4, Resolution:** Admin/Officer approves → `status='active'` (reservation becomes a real
obligation, no change to the capacity math). Rejects → `status='rejected'`, excluded from
`committed` going forward, capacity released immediately. Un-actioned past
`reservation_expires_at` → a scheduled job flips `status='expired'`, same release effect, and
(P1) triggers a Resend email nudging the admin.

## Migration discipline

- Every schema change is a `supabase/migrations/*.sql` file, applied via `supabase db push`
  against the linked remote project, never a manual dashboard edit. See `DEVELOPMENT-WORKFLOW.md`
  and `BUILD.md` for the exact commands and the no-local-Docker constraint.
- Every table with a `cooperative_id` or `organization_id` column ships its RLS policy in the same
  migration that creates the table, never as a follow-up "add security later" step.


---

## R2 planned schema (D034 to D044)

Contract, not DDL. Each change ships with its RLS policies and pgTAP tests in the same migration
(rule above). Names may be adjusted in implementation; if one is, update this section in the same PR.

### Over-limit applications (BUILD-PLAN 0.1, D040)

```
loans.status                 += 'pending_review'    -- stored, holds no capacity, staff decide
loans.over_capacity          boolean not null default false
loans.shortfall_at_submission numeric(14,2)          -- requested monthly minus available, at submit
```

Step 3 becomes: inside the lock, if `requested <= available` insert `reserved` as today; **else insert
`pending_review` with `over_capacity = true`, `reservation_expires_at = null`**, and return
`NOT_ELIGIBLE_STORED`. `committed` (Step 1) counts only `reserved` (unexpired) and `active`. Approving
a `pending_review` loan requires `approval_reason` and sets `active`.

Built in migrations `20261122120000` (enum value, columns) and `20261122120100` (functions,
constraint `loans_pending_review_holds_nothing`). There is no `approval_reason` column: the reason is
the `note` argument of `decide_loan_application`, stored in `audit_log.note` as for every over-limit
approval since R1.

### Existing loans (BUILD-PLAN 0.3 and 8.2, D036)

```
loans.origin                       'clarix' | 'pre_existing'   default 'clarix'
loans.outstanding_balance_at_entry numeric(14,2)   -- pre_existing only
loans.started_on                   date            -- pre_existing required: first day of the start month
loans.expected_end_date            date            -- pre_existing required; clarix derived from tenure
loans.entered_by                   fk -> users     -- staff who keyed or imported it
```

A `pre_existing` loan is inserted as `active` through `record_existing_loan(...)` (SECURITY DEFINER,
checks the caller's record permission at that cooperative), never through reservation. It counts in
`committed` immediately.

Built in migration `20261123090000` (BUILD-PLAN 0.3). `started_on` was added to the contract above
because the sheet asks for a start month and nothing else held it. Constraint
`loans_pre_existing_shape`: a `pre_existing` loan is `active` or `completed` and has a balance above
zero, a start month and an end month no earlier than it. `requested_amount` holds the original amount
when given, else the balance at entry; `tenure_months` is the months from start to end, both included
(at most 120). What is left on a `pre_existing` loan is `outstanding_balance_at_entry` minus the
repayments recorded since (`src/lib/loan-status.ts` → `loanBalance`). `cooperative_has_existing_loans
(cooperative_id)` answers the E08 note.

### Institutions and member IDs (BUILD-PLAN 3.1, D034)

```
organizations  -> concept renamed "institution" (table rename optional; record the choice)
  is now OPTIONAL for a cooperative: cooperatives.organization_id becomes nullable
  employee_id_format / pattern move to cooperatives (below)

cooperatives
  member_id_label        text default 'Member ID'      -- e.g. 'IPPIS number', 'Staff number'
  member_id_pattern      text null                     -- regex, null = any text
  member_id_required     boolean default false
  short_name             text                          -- for chips and the switcher ("FMC Multipurpose")

cooperative_memberships
  member_number          text null                     -- the cooperative's ID for this person, stored as text
  unique (cooperative_id, member_number) where member_number is not null

users
  employee_id            -> deprecated; copied into member_number for each FMC membership, then dropped
  organization_id        -> dropped (institution comes through the cooperative)
```

`handle_new_auth_user()` stops attaching new users to any organisation.

### Repayment policy per cooperative (BUILD-PLAN 3.1, D035)

```
repayment_policies
  id, scope ('institution' | 'cooperative'), institution_id null, cooperative_id null
  income_basis           'gross' | 'net' | 'average_inflow'
  max_percentage         numeric(5,2)   -- 1..100; a cooperative row may not exceed its institution row
  allow_declared_income  boolean default false
  evidence_max_age_months int default 12
  sanity_band_max        numeric(14,2) null
```

Limit for a member = **min** over their active memberships of (their income on that policy's basis ×
that policy's percentage). FMC's five cooperatives are seeded with gross / 33.3%, matching today.

### Income evidence (BUILD-PLAN 7.1, D035)

```
income_evidence
  id, user_id, source ('payslip' | 'bank_statement' | 'declared')
  period_start, period_end
  monthly_gross, monthly_net        -- payslip
  monthly_average_inflow            -- bank statement (after exclusions)
  monthly_declared                  -- declared
  status ('unverified' | 'verified' | 'superseded')
  verified_by fk -> users null, verified_at
  document_ids uuid[]               -- documents rows; private bucket, same access rule as D031
  created_at

declared_obligations                 -- EDGE-CASES E16
  id, user_id, description, monthly_amount, declared_by, created_at, ends_on null
```

`users.salary_gross / salary_net` become a view over the latest payslip evidence for compatibility,
then are dropped once nothing reads them.

### Documents and exports (BUILD-PLAN 8.1–8.4, D044)

```
generated_documents
  id, cooperative_id, kind ('member_statement' | 'loan_statement' | 'report' | 'invoice')
  subject_user_id null, period_start, period_end
  verification_code text unique      -- 10 chars, Crockford base32, shown in the PDF footer
  generated_by, generated_at, sha256 of the file bytes
```

RLS: readable by the cooperative's staff with the export permission and by the subject member; the
`/verify/[code]` lookup returns only kind, cooperative, period and generated_at.

### Billing (BUILD-PLAN 9.1–9.4, D041, D042)

```
subscriptions
  cooperative_id (pk), trial_started_at, trial_ends_at (trial_started_at + 60 days)
  plan ('monthly' | 'yearly'), founding_price_lock numeric null, status computed by
  cooperative_access_state(): 'trial' | 'active' | 'grace' | 'read_only'

invoices
  id, cooperative_id, period_start, period_end, active_members, unit_price, minimum_applied boolean,
  amount, status ('open' | 'paid' | 'void'), due_at, generated_document_id

payments
  id, invoice_id, amount, method ('transfer' | 'paystack'), reference, recorded_by, paid_at
```

**Active member** (the billing unit, D041.1): a membership with at least one saving, repayment, loan
or eligibility check recorded in that calendar month. Roster rows not yet on Clarix are never billed. Defined once in
`active_members_for(coop, period)` and unit-tested.
