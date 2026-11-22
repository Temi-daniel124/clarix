-- Clarix pgTAP suite 014, an application above the member's limit is stored (D040).
--
-- Runs ONLY on the GitHub Actions hosted runner (DECISIONS.md D015).
--
-- BUILD-PLAN 0.1's acceptance criteria, one by one: an over-limit submission is stored, holds no
-- capacity, appears to staff, and can be approved with a reason. EDGE-CASES E05 (over the limit),
-- E06 (no limit yet) and E07 (pending_review is outside the locked arithmetic) are each pinned.

create extension if not exists pgtap with schema extensions;

begin;

select plan(31);

-- ---------------------------------------------------------------------------
-- Schema
-- ---------------------------------------------------------------------------

select has_column('public', 'loans', 'over_capacity', 'loans.over_capacity exists');
select has_column('public', 'loans', 'shortfall_at_submission', 'loans.shortfall_at_submission exists');

select ok(
  'pending_review' = any (enum_range(null::public.loan_status)::text[]),
  'loan_status includes pending_review'
);

-- ---------------------------------------------------------------------------
-- Fixtures: a member on 250,000 gross (cap 83,250), a member with no income on record (cap 0),
-- an admin of their cooperative, and an officer at a different cooperative who may decide loans
-- there.
-- ---------------------------------------------------------------------------

insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
                        created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
values
  ('e0140001-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'over-member@example.test', 'x', now(), now(), '{}', '{}'),
  ('e0140001-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'unassessed@example.test', 'x', now(), now(), '{}', '{}'),
  ('e0140001-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'over-admin@example.test', 'x', now(), now(), '{}', '{}'),
  ('e0140001-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'other-officer@example.test', 'x', now(), now(), '{}', '{}');

update public.users
   set salary_gross = 250000, salary_net = 180000, salary_verified_at = now()
 where id = 'e0140001-0000-0000-0000-000000000001';

insert into public.cooperatives (id, organization_id, name)
select 'c0140001-0000-0000-0000-000000000001', id, 'Review Cooperative' from public.organizations;

insert into public.cooperatives (id, organization_id, name)
select 'c0140001-0000-0000-0000-000000000002', id, 'Elsewhere Cooperative' from public.organizations;

insert into public.cooperative_staff_roles (user_id, cooperative_id, role, status, permissions)
values
  ('e0140001-0000-0000-0000-000000000003', 'c0140001-0000-0000-0000-000000000001',
   'admin', 'active', '{}'::jsonb),
  ('e0140001-0000-0000-0000-000000000004', 'c0140001-0000-0000-0000-000000000002',
   'officer', 'active', '{"can_approve_loans": true}'::jsonb);

insert into public.cooperative_memberships (id, user_id, cooperative_id, status, joined_at)
values
  ('b0140001-0000-0000-0000-000000000001', 'e0140001-0000-0000-0000-000000000001',
   'c0140001-0000-0000-0000-000000000001', 'active', now()),
  ('b0140001-0000-0000-0000-000000000002', 'e0140001-0000-0000-0000-000000000002',
   'c0140001-0000-0000-0000-000000000001', 'active', now());

-- A pending_review row can never carry an expiry: it holds nothing, so it has nothing to lapse.
select throws_ok(
  $$ insert into public.loans (membership_id, requested_amount, monthly_repayment, tenure_months,
                               status, over_capacity, reservation_expires_at)
     values ('b0140001-0000-0000-0000-000000000001', 120000, 10000, 12,
             'pending_review', true, now() + interval '7 days') $$,
  '23514',
  null,
  'a pending_review loan with a reservation expiry is refused by the table itself'
);

-- ---------------------------------------------------------------------------
-- E05: over the limit, from the member's own session
-- ---------------------------------------------------------------------------

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"e0140001-0000-0000-0000-000000000001","role":"authenticated"}',
  true
);

-- ₦1,200,000 over 12 months is ₦100,000 a month against ₦83,250 available.
create temp table over_result on commit drop as
select * from public.submit_loan_application(
  'b0140001-0000-0000-0000-000000000001', 1200000, 12);

select is((select eligible from over_result), false, 'an over-limit request is reported as not fitting');

select isnt((select loan_id from over_result), null, 'and it comes back with a loan id: it was stored');

select is((select shortfall from over_result), 16750::numeric, 'with the exact monthly shortfall');

select is(
  (select status::text from public.loans where id = (select loan_id from over_result)),
  'pending_review',
  'the stored loan is pending_review'
);

select is(
  (select over_capacity from public.loans where id = (select loan_id from over_result)),
  true,
  'flagged over_capacity'
);

select is(
  (select shortfall_at_submission from public.loans where id = (select loan_id from over_result)),
  16750::numeric,
  'with the shortfall at submission kept on the row'
);

select is(
  (select reservation_expires_at from public.loans where id = (select loan_id from over_result)),
  null,
  'and no reservation expiry'
);

select is(
  (select available from public.capacity_for_user()),
  83250::numeric,
  'it holds no capacity: the whole limit is still available'
);

-- ---------------------------------------------------------------------------
-- E07: the next submission, computed inside the advisory lock, does not count it either
-- ---------------------------------------------------------------------------

create temp table fit_result on commit drop as
select * from public.submit_loan_application(
  'b0140001-0000-0000-0000-000000000001', 600000, 12);

select is(
  (select available from fit_result),
  83250::numeric,
  'inside the lock, a pending_review loan is excluded from committed'
);

select is((select eligible from fit_result), true, 'so a ₦50,000 a month request that fits still reserves');

select is(
  (select available from public.capacity_for_user()),
  33250::numeric,
  'and only that reservation is held'
);

-- ---------------------------------------------------------------------------
-- E06: a member with no limit yet is stored the same way
-- ---------------------------------------------------------------------------

select set_config(
  'request.jwt.claims',
  '{"sub":"e0140001-0000-0000-0000-000000000002","role":"authenticated"}',
  true
);

create temp table unassessed_result on commit drop as
select * from public.submit_loan_application(
  'b0140001-0000-0000-0000-000000000002', 120000, 12);

select is(
  (select status::text from public.loans where id = (select loan_id from unassessed_result)),
  'pending_review',
  'an application from a member with no limit is stored as pending_review, not dropped'
);

select is(
  (select shortfall from unassessed_result),
  10000::numeric,
  'and its shortfall is the whole monthly repayment'
);

select is(
  (select count(*)::int from public.loans where status = 'pending_review'),
  1,
  'a member reads their own pending_review application, and only their own'
);

-- ---------------------------------------------------------------------------
-- Staff see them; staff elsewhere do not
-- ---------------------------------------------------------------------------

select set_config(
  'request.jwt.claims',
  '{"sub":"e0140001-0000-0000-0000-000000000003","role":"authenticated"}',
  true
);

select is(
  (select count(*)::int from public.loans
    where status = 'pending_review' and over_capacity),
  2,
  'the cooperative''s admin sees both pending_review applications'
);

-- Tidying lapsed holds is about reservations; a pending_review loan has no hold to lapse.
select is(
  public.expire_lapsed_reservations('c0140001-0000-0000-0000-000000000001'),
  0,
  'expiring lapsed reservations leaves pending_review applications alone'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"e0140001-0000-0000-0000-000000000004","role":"authenticated"}',
  true
);

select is(
  (select count(*)::int from public.loans where status = 'pending_review'),
  0,
  'an officer at another cooperative sees none of them'
);

select throws_ok(
  format(
    $$ select * from public.decide_loan_application(%L, 'approve', 'Not mine to decide') $$,
    (select loan_id from over_result)
  ),
  '42501',
  null,
  'and cannot decide one'
);

-- ---------------------------------------------------------------------------
-- Approving needs a reason, and then it counts
-- ---------------------------------------------------------------------------

select set_config(
  'request.jwt.claims',
  '{"sub":"e0140001-0000-0000-0000-000000000003","role":"authenticated"}',
  true
);

select throws_ok(
  format(
    $$ select * from public.decide_loan_application(%L, 'approve') $$,
    (select loan_id from over_result)
  ),
  '22023',
  null,
  'approving a pending_review application without a reason is refused'
);

create temp table approved on commit drop as
select * from public.decide_loan_application(
  (select loan_id from over_result), 'approve', 'Committee approved; guarantor on file.');

select is((select status from approved), 'active', 'with a reason, it is approved into an active loan');

select is(
  (select available_before from approved),
  33250::numeric,
  'available before is measured without the pending_review loan, which was never in committed'
);

select is((select was_over_cap from approved), true, 'and the decision records that it was over the limit');

select is(
  (select available from public.capacity_for_membership('b0140001-0000-0000-0000-000000000001')),
  0::numeric,
  'once active it counts: ₦50,000 reserved plus ₦100,000 active leaves nothing of ₦83,250'
);

select is(
  (select note from public.audit_log
    where target_id = (select loan_id from over_result) and action = 'approve_loan'),
  'Committee approved; guarantor on file.',
  'the reason is kept in the audit log'
);

select is(
  (select old_value ->> 'status' from public.audit_log
    where target_id = (select loan_id from over_result) and action = 'approve_loan'),
  'pending_review',
  'and the log records that it was approved from pending_review'
);

-- ---------------------------------------------------------------------------
-- Rejecting one tells the member the truth: nothing was held, so nothing is "released"
-- ---------------------------------------------------------------------------

select is(
  (select status from public.decide_loan_application(
     (select loan_id from unassessed_result), 'reject')),
  'rejected',
  'a pending_review application can be turned down'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"e0140001-0000-0000-0000-000000000002","role":"authenticated"}',
  true
);

select is(
  (select count(*)::int from public.notifications
    where category = 'loan_decision' and message not like '%released%'),
  1,
  'and the member''s notification does not claim a hold was released'
);

reset role;

select * from finish();

rollback;
