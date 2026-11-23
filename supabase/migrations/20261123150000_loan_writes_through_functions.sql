-- Clarix, migration 034: every change to a loan goes through a function.
--
-- BUILD-PLAN 0.6. Found while building 0.1 and 0.3 (docs/PROJECT-STATE.md → Known defects).
--
-- Migration 006 gave active staff two direct write policies on `loans`:
--
--   * loans_update_staff let any active staff member `update` any loan at their cooperative
--     through the API: set it active without the written reason an over-limit approval needs,
--     change its monthly repayment, move its reservation expiry, with no audit entry and no
--     notification to the member. Even an officer without `can_approve_loans` could.
--   * loans_insert_staff let them `insert` a loan directly: an `active` loan that counts against
--     the member's limit at every cooperative, or a `pre_existing` one, around
--     record_existing_loan's permission check and audit entry.
--
-- Nothing in the app uses either: every write already goes through a SECURITY DEFINER function
-- (submit_loan_application, decide_loan_application, complete_loan, expire_lapsed_reservations,
-- record_existing_loan), which runs as the table owner and is unaffected by this migration. So
-- both policies are removed, and the table-level write privileges with them.
--
-- Why revoke as well as drop: with RLS on and no update policy, a direct `update` matches no rows
-- and reports success having changed nothing. Revoking the privilege makes the same request fail
-- with "permission denied", which is the honest answer (AGENT.md: nothing silently fails).
--
-- Changes what `main` relies on (its staff could, in principle, use these policies), so it applies
-- at merge (D043). Reads are untouched: loans_select_own, loans_select_staff and the access-grant
-- read policy stay as they are.

drop policy if exists loans_insert_staff on public.loans;
drop policy if exists loans_update_staff on public.loans;

revoke insert, update, delete on public.loans from authenticated, anon;

comment on table public.loans is
  'Loan applications and obligations. monthly_repayment is what the cross-cooperative capacity calculation sums (D003, D008). Read through RLS; written only through SECURITY DEFINER functions (submit_loan_application, decide_loan_application, complete_loan, expire_lapsed_reservations, record_existing_loan), never directly (BUILD-PLAN 0.6).';
