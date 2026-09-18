-- Clarix pgTAP suite 013: the two ends of the loan lifecycle (migration 029).
--
-- Runs ONLY on the GitHub Actions hosted runner (DECISIONS.md D015).
--
-- What makes these two transitions worth testing is that they are not symmetrical, and the tests
-- are written to hold that difference in place:
--
--   * Closing a loan MUST change capacity. An active loan counts against the member's deduction
--     cap at every cooperative they belong to, so closing one has to hand that capacity back, and
--     it has to hand it back everywhere rather than only where the loan was.
--
--   * Expiring a lapsed reservation MUST NOT change capacity, because a lapsed hold already
--     stopped counting the moment it lapsed (D024). If tidying the queue ever moved a member's
--     available figure, something would have been double-counting all along.
--
-- Both assertions below would pass trivially against a version that did nothing at all, so each
-- is paired with one that fails in that case: the stored status, and the audit entry.

create extension if not exists pgtap with schema extensions;

begin;

select plan(18);

select has_function('public', 'complete_loan', array['uuid', 'text'], 'complete_loan exists');
select has_function('public', 'expire_lapsed_reservations', array['uuid'],
  'expire_lapsed_reservations exists');

-- ---------------------------------------------------------------------------
-- Fixtures: one member at ₦250,000 gross (₦83,250/month cap) with an active loan at one
-- cooperative, plus an officer at that cooperative who may decide loans, and one who may not.
-- ---------------------------------------------------------------------------

insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
                        created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
values
  ('d1111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'lifecycle.member@example.test', 'x', now(), now(), '{}', '{}'),
  ('d2222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'lifecycle.officer@example.test', 'x', now(), now(), '{}', '{}'),
  ('d3333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'lifecycle.recorder@example.test', 'x', now(), now(), '{}', '{}');

update public.users
   set salary_gross = 250000, salary_net = 180000, salary_verified_at = now()
 where id = 'd1111111-1111-1111-1111-111111111111';

insert into public.cooperatives (id, organization_id, name)
select 'd0000001-1111-1111-1111-111111111111', id, 'Cooperative L' from public.organizations;

insert into public.cooperative_memberships (id, user_id, cooperative_id, status, joined_at, savings_balance)
values
  ('d0000002-1111-1111-1111-111111111111', 'd1111111-1111-1111-1111-111111111111',
   'd0000001-1111-1111-1111-111111111111', 'active', now(), 200000);

-- An officer who can decide loans, and one who can only record money. The second exists to prove
-- that closing a loan is a loan decision rather than a bookkeeping entry.
insert into public.cooperative_staff_roles
  (user_id, cooperative_id, role, status, permissions, accepted_at)
values
  ('d2222222-2222-2222-2222-222222222222', 'd0000001-1111-1111-1111-111111111111',
   'officer', 'active',
   '{"can_view_members": true, "can_approve_loans": true, "can_record_savings": true}'::jsonb, now()),
  ('d3333333-3333-3333-3333-333333333333', 'd0000001-1111-1111-1111-111111111111',
   'officer', 'active',
   '{"can_view_members": true, "can_approve_loans": false, "can_record_savings": true}'::jsonb, now());

-- An active loan at ₦20,000 a month, and a reservation whose hold ran out a day ago.
insert into public.loans
  (id, membership_id, requested_amount, monthly_repayment, tenure_months, status,
   reserved_at, reservation_expires_at, approved_at)
values
  ('d0000003-1111-1111-1111-111111111111', 'd0000002-1111-1111-1111-111111111111',
   480000, 20000, 24, 'active', now() - interval '200 days', now() - interval '193 days',
   now() - interval '199 days'),
  ('d0000004-1111-1111-1111-111111111111', 'd0000002-1111-1111-1111-111111111111',
   90000, 15000, 6, 'reserved', now() - interval '8 days', now() - interval '1 day', null);

-- Part of the active loan repaid, so the closure has a ledger to report against.
insert into public.savings_transactions (membership_id, type, amount, loan_id, recorded_at)
select 'd0000002-1111-1111-1111-111111111111', 'loan_repayment', 20000,
       'd0000003-1111-1111-1111-111111111111', now() - (n || ' months')::interval
from generate_series(1, 6) as n;

-- ---------------------------------------------------------------------------
-- Before anything: the lapsed reservation is already not counted
-- ---------------------------------------------------------------------------

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"d1111111-1111-1111-1111-111111111111","role":"authenticated"}', true);

select is(
  (select committed from public.capacity_for_user()),
  20000::numeric,
  'only the active loan is committed; the lapsed hold already stopped counting (D024)'
);

select is(
  (select available from public.capacity_for_user()),
  63250::numeric,
  'so ₦63,250 of the ₦83,250 cap is available before anything is tidied'
);

-- ---------------------------------------------------------------------------
-- An officer who cannot decide loans cannot close one
-- ---------------------------------------------------------------------------

select set_config('request.jwt.claims',
  '{"sub":"d3333333-3333-3333-3333-333333333333","role":"authenticated"}', true);

select throws_ok(
  $$ select * from public.complete_loan('d0000003-1111-1111-1111-111111111111') $$,
  '42501',
  null,
  'recording money does not carry the right to close a loan'
);

select throws_ok(
  $$ select * from public.expire_lapsed_reservations('d0000001-1111-1111-1111-111111111111') $$,
  '42501',
  null,
  'nor to tidy the applications queue'
);

select is(
  (select status::text from public.loans where id = 'd0000003-1111-1111-1111-111111111111'),
  'active',
  'and the loan is untouched after the refusal'
);

-- ---------------------------------------------------------------------------
-- Expiring the lapsed reservation: the record changes, the arithmetic does not
-- ---------------------------------------------------------------------------

select set_config('request.jwt.claims',
  '{"sub":"d2222222-2222-2222-2222-222222222222","role":"authenticated"}', true);

select is(
  public.expire_lapsed_reservations('d0000001-1111-1111-1111-111111111111'),
  1,
  'the one lapsed reservation is swept'
);

select is(
  (select status::text from public.loans where id = 'd0000004-1111-1111-1111-111111111111'),
  'expired',
  'and now says so, rather than sitting in the queue as though it were still waiting'
);

-- `audit_log_select_admin` (migration 018) lets a cooperative's admin read this table and nobody
-- else, and the actor here is an officer. The row is written by a SECURITY DEFINER function
-- regardless of who can read it, so its existence is asserted as the superuser rather than by
-- loosening a policy to suit a test.
reset role;

select is(
  (select count(*)::int from public.audit_log
    where action = 'expire_reservation' and target_id = 'd0000004-1111-1111-1111-111111111111'),
  1,
  'with an audit entry naming what happened to it'
);

set local role authenticated;

select is(
  public.expire_lapsed_reservations('d0000001-1111-1111-1111-111111111111'),
  0,
  'running it again sweeps nothing, so it is safe to press twice'
);

select set_config('request.jwt.claims',
  '{"sub":"d1111111-1111-1111-1111-111111111111","role":"authenticated"}', true);

select is(
  (select available from public.capacity_for_user()),
  63250::numeric,
  'and the member''s available capacity is EXACTLY as it was: tidying frees nothing'
);

-- ---------------------------------------------------------------------------
-- Closing the active loan: this one must move the arithmetic
-- ---------------------------------------------------------------------------

select set_config('request.jwt.claims',
  '{"sub":"d2222222-2222-2222-2222-222222222222","role":"authenticated"}', true);

select is(
  (select released_monthly from public.complete_loan(
     'd0000003-1111-1111-1111-111111111111', 'The balance was settled at the office.')),
  20000::numeric,
  'closing reports the monthly repayment it releases'
);

select is(
  (select status::text from public.loans where id = 'd0000003-1111-1111-1111-111111111111'),
  'completed',
  'the loan is completed'
);

-- Six repayments of ₦20,000 against a ₦480,000 loan: the ledger is ₦360,000 short, and the log
-- records that rather than implying the loan added up.
reset role;

select is(
  (select (new_value ->> 'shortfall_in_ledger')::numeric from public.audit_log
    where action = 'complete_loan' and target_id = 'd0000003-1111-1111-1111-111111111111'),
  360000::numeric,
  'and the audit entry records how much of it was never recorded as repaid'
);

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"d2222222-2222-2222-2222-222222222222","role":"authenticated"}', true);

select throws_ok(
  $$ select * from public.complete_loan('d0000003-1111-1111-1111-111111111111') $$,
  '22023',
  null,
  'a loan already closed cannot be closed again'
);

select set_config('request.jwt.claims',
  '{"sub":"d1111111-1111-1111-1111-111111111111","role":"authenticated"}', true);

select is(
  (select committed from public.capacity_for_user()),
  0::numeric,
  'the member now carries nothing'
);

select is(
  (select available from public.capacity_for_user()),
  83250::numeric,
  'and the whole cap is theirs again, at every cooperative rather than only this one'
);

reset role;

select * from finish();

rollback;
