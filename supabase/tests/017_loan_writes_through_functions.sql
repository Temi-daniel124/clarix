-- Clarix pgTAP suite 017, every change to a loan goes through a function (BUILD-PLAN 0.6).
--
-- Runs ONLY on the GitHub Actions hosted runner (DECISIONS.md D015).
--
-- Accept when: an admin and an officer with can_approve_loans cannot `update` a loan row directly
-- (status, monthly repayment or expiry), nor insert or delete one, while the functions that do
-- write loans still work: submit_loan_application, decide_loan_application, complete_loan,
-- expire_lapsed_reservations and record_existing_loan.

create extension if not exists pgtap with schema extensions;

begin;

select plan(24);

-- ---------------------------------------------------------------------------
-- The schema: no write policy, no write privilege
-- ---------------------------------------------------------------------------

select is(
  (select count(*)::int from pg_policies
    where schemaname = 'public' and tablename = 'loans' and cmd in ('INSERT', 'UPDATE', 'DELETE', 'ALL')),
  0,
  'loans has no insert, update or delete policy for anybody'
);

select ok(
  not has_table_privilege('authenticated', 'public.loans', 'INSERT')
  and not has_table_privilege('authenticated', 'public.loans', 'UPDATE')
  and not has_table_privilege('authenticated', 'public.loans', 'DELETE'),
  'and a signed-in account holds no write privilege on it, so a direct write is refused, not silently ignored'
);

select ok(
  has_table_privilege('authenticated', 'public.loans', 'SELECT'),
  'reading is untouched'
);

-- ---------------------------------------------------------------------------
-- Fixtures: a member (cap 83,250), their cooperative's admin, and an officer who may decide loans.
-- One reserved loan, one active loan, one lapsed reservation.
-- ---------------------------------------------------------------------------

insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
                        created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
values
  ('e0170001-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'member17@example.test', 'x', now(), now(), '{}', '{}'),
  ('e0170001-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'admin17@example.test', 'x', now(), now(), '{}', '{}'),
  ('e0170001-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'approver17@example.test', 'x', now(), now(), '{}', '{}');

update public.users
   set salary_gross = 250000, salary_net = 180000, salary_verified_at = now()
 where id = 'e0170001-0000-0000-0000-000000000001';

insert into public.cooperatives (id, organization_id, name)
select 'c0170001-0000-0000-0000-000000000001', id, 'Locked Book Cooperative' from public.organizations;

insert into public.cooperative_staff_roles (user_id, cooperative_id, role, status, permissions)
values
  ('e0170001-0000-0000-0000-000000000002', 'c0170001-0000-0000-0000-000000000001', 'admin', 'active', '{}'::jsonb),
  ('e0170001-0000-0000-0000-000000000003', 'c0170001-0000-0000-0000-000000000001', 'officer', 'active',
   '{"can_view_members": true, "can_record_savings": true, "can_approve_loans": true}'::jsonb);

insert into public.cooperative_memberships (id, user_id, cooperative_id, status, joined_at)
values ('b0170001-0000-0000-0000-000000000001', 'e0170001-0000-0000-0000-000000000001',
        'c0170001-0000-0000-0000-000000000001', 'active', now());

insert into public.loans (id, membership_id, requested_amount, monthly_repayment, tenure_months,
                          status, reserved_at, reservation_expires_at, approved_at)
values
  ('d0170001-0000-0000-0000-000000000001', 'b0170001-0000-0000-0000-000000000001',
   120000, 10000, 12, 'reserved', now(), now() + interval '7 days', null),
  ('d0170001-0000-0000-0000-000000000002', 'b0170001-0000-0000-0000-000000000001',
   240000, 20000, 12, 'active', now() - interval '3 months', null, now() - interval '3 months'),
  ('d0170001-0000-0000-0000-000000000003', 'b0170001-0000-0000-0000-000000000001',
   60000, 5000, 12, 'reserved', now() - interval '20 days', now() - interval '13 days', null);

set local role authenticated;

-- ---------------------------------------------------------------------------
-- The admin cannot write a loan directly
-- ---------------------------------------------------------------------------

select set_config('request.jwt.claims',
  '{"sub":"e0170001-0000-0000-0000-000000000002","role":"authenticated"}', true);

select ok(
  (select count(*) from public.loans where membership_id = 'b0170001-0000-0000-0000-000000000001') = 3,
  'the admin still reads their cooperative''s loans'
);

select throws_ok(
  $$ update public.loans set status = 'active' where id = 'd0170001-0000-0000-0000-000000000001' $$,
  '42501', null, 'the admin cannot approve a loan by updating its status'
);
select throws_ok(
  $$ update public.loans set monthly_repayment = 1 where id = 'd0170001-0000-0000-0000-000000000002' $$,
  '42501', null, 'nor change a monthly repayment'
);
select throws_ok(
  $$ update public.loans set reservation_expires_at = now() + interval '90 days'
      where id = 'd0170001-0000-0000-0000-000000000001' $$,
  '42501', null, 'nor move a reservation''s expiry'
);
select throws_ok(
  $$ insert into public.loans (membership_id, requested_amount, monthly_repayment, tenure_months, status)
     values ('b0170001-0000-0000-0000-000000000001', 500000, 40000, 12, 'active') $$,
  '42501', null, 'nor insert an active loan around the functions'
);
select throws_ok(
  $$ delete from public.loans where id = 'd0170001-0000-0000-0000-000000000002' $$,
  '42501', null, 'nor delete one'
);

-- ---------------------------------------------------------------------------
-- Nor can an officer who may decide loans
-- ---------------------------------------------------------------------------

select set_config('request.jwt.claims',
  '{"sub":"e0170001-0000-0000-0000-000000000003","role":"authenticated"}', true);

select throws_ok(
  $$ update public.loans set status = 'rejected' where id = 'd0170001-0000-0000-0000-000000000001' $$,
  '42501', null, 'an officer with can_approve_loans cannot change a status directly'
);
select throws_ok(
  $$ update public.loans set monthly_repayment = 1 where id = 'd0170001-0000-0000-0000-000000000002' $$,
  '42501', null, 'nor a monthly repayment'
);
select throws_ok(
  $$ update public.loans set reservation_expires_at = now() + interval '90 days'
      where id = 'd0170001-0000-0000-0000-000000000001' $$,
  '42501', null, 'nor an expiry'
);
select throws_ok(
  $$ insert into public.loans (membership_id, requested_amount, monthly_repayment, tenure_months, status)
     values ('b0170001-0000-0000-0000-000000000001', 500000, 40000, 12, 'active') $$,
  '42501', null, 'nor insert a loan'
);

-- ---------------------------------------------------------------------------
-- Nor the member themselves
-- ---------------------------------------------------------------------------

select set_config('request.jwt.claims',
  '{"sub":"e0170001-0000-0000-0000-000000000001","role":"authenticated"}', true);

select throws_ok(
  $$ update public.loans set status = 'completed' where id = 'd0170001-0000-0000-0000-000000000002' $$,
  '42501', null, 'the member cannot mark their own loan repaid'
);

-- And nothing moved: every refused write left the rows exactly as they were.
select is(
  (select string_agg(status::text || ':' || monthly_repayment::text, ',' order by id)
     from public.loans where membership_id = 'b0170001-0000-0000-0000-000000000001'),
  'reserved:10000.00,active:20000.00,reserved:5000.00',
  'after every refused write, the loans are unchanged'
);

-- ---------------------------------------------------------------------------
-- The five functions still write loans
-- ---------------------------------------------------------------------------

-- submit_loan_application, as the member: ₦60,000 over 12 = ₦5,000 a month, which fits.
select is(
  (select eligible from public.submit_loan_application('b0170001-0000-0000-0000-000000000001', 60000, 12)),
  true,
  'submit_loan_application still stores and reserves'
);

select set_config('request.jwt.claims',
  '{"sub":"e0170001-0000-0000-0000-000000000003","role":"authenticated"}', true);

-- decide_loan_application, as the officer who may decide.
select is(
  (select status from public.decide_loan_application('d0170001-0000-0000-0000-000000000001', 'approve')),
  'active',
  'decide_loan_application still approves'
);
select is(
  (select status::text from public.loans where id = 'd0170001-0000-0000-0000-000000000001'),
  'active',
  'and the loan row really changed'
);

-- complete_loan
select is(
  (select completed from public.complete_loan('d0170001-0000-0000-0000-000000000002', 'Settled outside Clarix.')),
  true,
  'complete_loan still closes an active loan'
);
select is(
  (select status::text from public.loans where id = 'd0170001-0000-0000-0000-000000000002'),
  'completed',
  'and the row says so'
);

-- expire_lapsed_reservations
select is(
  public.expire_lapsed_reservations('c0170001-0000-0000-0000-000000000001'),
  1,
  'expire_lapsed_reservations still moves the lapsed hold'
);
select is(
  (select status::text from public.loans where id = 'd0170001-0000-0000-0000-000000000003'),
  'expired',
  'and the row says expired'
);

-- record_existing_loan, as the admin.
select set_config('request.jwt.claims',
  '{"sub":"e0170001-0000-0000-0000-000000000002","role":"authenticated"}', true);

select isnt(
  (select loan_id from public.record_existing_loan('b0170001-0000-0000-0000-000000000001', 100000, 10000,
     date '2026-01-01', date '2026-10-01')),
  null,
  'record_existing_loan still enters an existing loan'
);

select is(
  (select count(*)::int from public.audit_log
    where target_table = 'loans'
      and target_id in (select id from public.loans where membership_id = 'b0170001-0000-0000-0000-000000000001')),
  4,
  'and every one of the four staff changes left an audit entry'
);

reset role;

select * from finish();

rollback;
