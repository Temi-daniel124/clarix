# DATA-MODEL.md, Clarix

**Authority level: 3.** Defers to `DECISIONS.md`. This is the canonical schema, if code and this
document disagree, this document is right and the code has drifted; fix the code (and, if the
fix reveals the model itself needs to change, add a new `DECISIONS.md` entry first).

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
