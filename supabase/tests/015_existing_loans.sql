-- Clarix pgTAP suite 015, a loan a member already owes (D036, BUILD-PLAN 0.3).
--
-- Runs ONLY on the GitHub Actions hosted runner (DECISIONS.md D015).
--
-- BUILD-PLAN 0.3's acceptance criteria: adding an existing loan immediately lowers the member's
-- available figure at every cooperative; RLS and permissions stop anyone outside that cooperative's
-- book-keepers from creating one; the committed sum includes it. EDGE-CASES E08.

create extension if not exists pgtap with schema extensions;

begin;

select plan(31);

-- ---------------------------------------------------------------------------
-- Schema
-- ---------------------------------------------------------------------------

select has_column('public', 'loans', 'origin', 'loans.origin exists');
select has_column('public', 'loans', 'outstanding_balance_at_entry', 'loans.outstanding_balance_at_entry exists');
select has_column('public', 'loans', 'expected_end_date', 'loans.expected_end_date exists');
select has_column('public', 'loans', 'entered_by', 'loans.entered_by exists');

-- ---------------------------------------------------------------------------
-- Fixtures: one member (cap 83,250) in two cooperatives, X and Y. At X: an admin, an officer who
-- may record, an officer who may not. At Y: an admin.
-- ---------------------------------------------------------------------------

insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
                        created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
values
  ('e0150001-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'owing-member@example.test', 'x', now(), now(), '{}', '{}'),
  ('e0150001-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'x-admin@example.test', 'x', now(), now(), '{}', '{}'),
  ('e0150001-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'x-recorder@example.test', 'x', now(), now(), '{}', '{}'),
  ('e0150001-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'x-viewer@example.test', 'x', now(), now(), '{}', '{}'),
  ('e0150001-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'y-admin@example.test', 'x', now(), now(), '{}', '{}');

update public.users
   set salary_gross = 250000, salary_net = 180000, salary_verified_at = now()
 where id = 'e0150001-0000-0000-0000-000000000001';

insert into public.cooperatives (id, organization_id, name)
select 'c0150001-0000-0000-0000-00000000000a', id, 'Cooperative X' from public.organizations;
insert into public.cooperatives (id, organization_id, name)
select 'c0150001-0000-0000-0000-00000000000b', id, 'Cooperative Y' from public.organizations;

insert into public.cooperative_staff_roles (user_id, cooperative_id, role, status, permissions)
values
  ('e0150001-0000-0000-0000-000000000002', 'c0150001-0000-0000-0000-00000000000a', 'admin', 'active', '{}'::jsonb),
  ('e0150001-0000-0000-0000-000000000003', 'c0150001-0000-0000-0000-00000000000a', 'officer', 'active',
   '{"can_view_members": true, "can_record_savings": true}'::jsonb),
  ('e0150001-0000-0000-0000-000000000004', 'c0150001-0000-0000-0000-00000000000a', 'officer', 'active',
   '{"can_view_members": true, "can_record_savings": false}'::jsonb),
  ('e0150001-0000-0000-0000-000000000005', 'c0150001-0000-0000-0000-00000000000b', 'admin', 'active', '{}'::jsonb);

insert into public.cooperative_memberships (id, user_id, cooperative_id, status, joined_at)
values
  ('b0150001-0000-0000-0000-00000000000a', 'e0150001-0000-0000-0000-000000000001',
   'c0150001-0000-0000-0000-00000000000a', 'active', now()),
  ('b0150001-0000-0000-0000-00000000000b', 'e0150001-0000-0000-0000-000000000001',
   'c0150001-0000-0000-0000-00000000000b', 'active', now());

insert into public.cooperative_loan_products (id, cooperative_id, name, min_savings_ratio, max_tenure_months)
values ('cb150001-0000-0000-0000-00000000000b', 'c0150001-0000-0000-0000-00000000000b', 'Y Loan', 0.10, 24);

-- The table refuses a half-described pre_existing loan, whoever writes it.
select throws_ok(
  $$ insert into public.loans (membership_id, requested_amount, monthly_repayment, tenure_months,
                               status, origin, outstanding_balance_at_entry, started_on)
     values ('b0150001-0000-0000-0000-00000000000a', 300000, 25000, 12,
             'active', 'pre_existing', 300000, '2025-06-01') $$,
  '23514',
  null,
  'a pre_existing loan without an expected end month is refused by the table'
);

set local role authenticated;

-- ---------------------------------------------------------------------------
-- Before: nothing entered yet
-- ---------------------------------------------------------------------------

select set_config('request.jwt.claims',
  '{"sub":"e0150001-0000-0000-0000-000000000002","role":"authenticated"}', true);

select is(
  public.cooperative_has_existing_loans('c0150001-0000-0000-0000-00000000000a'),
  false,
  'before anything is entered, the cooperative has no existing loans (E08 note shows)'
);

-- ---------------------------------------------------------------------------
-- The admin at X enters one
-- ---------------------------------------------------------------------------

create temp table entered on commit drop as
select * from public.record_existing_loan(
  'b0150001-0000-0000-0000-00000000000a', 300000, 25000,
  date '2025-06-14', date '2026-12-20', null, 450000, 'From the March ledger.');

select is((select available_before from entered), 83250::numeric, 'available before the entry is the whole cap');
select is((select available_after from entered), 58250::numeric, 'and after it, ₦25,000 a month less');
select is((select committed_after from entered), 25000::numeric, 'the committed sum includes the existing loan');

select is(
  (select status::text from public.loans where id = (select loan_id from entered)),
  'active',
  'it is stored active, straight away'
);
select is(
  (select origin::text from public.loans where id = (select loan_id from entered)),
  'pre_existing',
  'marked pre_existing'
);
select is(
  (select reservation_expires_at from public.loans where id = (select loan_id from entered)),
  null,
  'never reserved, so no expiry'
);
select is(
  (select tenure_months from public.loans where id = (select loan_id from entered)),
  19,
  'June 2025 to December 2026 is 19 monthly repayments'
);
select is(
  (select started_on from public.loans where id = (select loan_id from entered)),
  date '2025-06-01',
  'months are stored as their first day'
);
select is(
  (select requested_amount from public.loans where id = (select loan_id from entered)),
  450000::numeric,
  'the original amount is kept when given'
);
select is(
  (select entered_by from public.loans where id = (select loan_id from entered)),
  'e0150001-0000-0000-0000-000000000002'::uuid,
  'and who entered it'
);
select is(
  (select note from public.audit_log
    where target_id = (select loan_id from entered) and action = 'record_existing_loan'),
  'From the March ledger.',
  'the entry is audit-logged with its note'
);
select is(
  public.cooperative_has_existing_loans('c0150001-0000-0000-0000-00000000000a'),
  true,
  'and now the cooperative has existing loans entered'
);

-- ---------------------------------------------------------------------------
-- It counts at every cooperative, and for the member
-- ---------------------------------------------------------------------------

select set_config('request.jwt.claims',
  '{"sub":"e0150001-0000-0000-0000-000000000005","role":"authenticated"}', true);

select is(
  (select available from public.capacity_for_membership('b0150001-0000-0000-0000-00000000000b')),
  58250::numeric,
  'cooperative Y sees the lower available figure at once'
);
select is(
  (select count(*)::int from public.loans where origin = 'pre_existing'),
  0,
  'but cannot read cooperative X''s loan itself'
);
select is(
  public.cooperative_has_existing_loans('c0150001-0000-0000-0000-00000000000b'),
  false,
  'and cooperative Y has entered none of its own'
);

select set_config('request.jwt.claims',
  '{"sub":"e0150001-0000-0000-0000-000000000001","role":"authenticated"}', true);

select is((select available from public.capacity_for_user()), 58250::numeric, 'the member sees it too');

-- ---------------------------------------------------------------------------
-- Who may enter one
-- ---------------------------------------------------------------------------

select throws_ok(
  $$ select * from public.record_existing_loan('b0150001-0000-0000-0000-00000000000a', 100000, 10000,
       date '2026-01-01', date '2026-10-01') $$,
  '42501', null, 'the member cannot enter a loan against themselves'
);

select set_config('request.jwt.claims',
  '{"sub":"e0150001-0000-0000-0000-000000000005","role":"authenticated"}', true);

select throws_ok(
  $$ select * from public.record_existing_loan('b0150001-0000-0000-0000-00000000000a', 100000, 10000,
       date '2026-01-01', date '2026-10-01') $$,
  '42501', null, 'an admin at another cooperative cannot enter one at X'
);

select set_config('request.jwt.claims',
  '{"sub":"e0150001-0000-0000-0000-000000000004","role":"authenticated"}', true);

select throws_ok(
  $$ select * from public.record_existing_loan('b0150001-0000-0000-0000-00000000000a', 100000, 10000,
       date '2026-01-01', date '2026-10-01') $$,
  '42501', null, 'an officer at X without the record permission cannot'
);

select set_config('request.jwt.claims',
  '{"sub":"e0150001-0000-0000-0000-000000000003","role":"authenticated"}', true);

select is(
  (select available_after from public.record_existing_loan('b0150001-0000-0000-0000-00000000000a', 100000, 10000,
     date '2026-01-01', date '2026-10-01')),
  48250::numeric,
  'an officer at X with the record permission can, and it stacks on the first'
);

-- ---------------------------------------------------------------------------
-- What is refused
-- ---------------------------------------------------------------------------

select throws_ok(
  format($$ select * from public.record_existing_loan('b0150001-0000-0000-0000-00000000000a', 100000, 10000,
       %L::date, %L::date) $$,
       (date_trunc('month', now()) + interval '1 month')::date,
       (date_trunc('month', now()) + interval '6 month')::date),
  '22023', null, 'a start month in the future is refused'
);

select throws_ok(
  $$ select * from public.record_existing_loan('b0150001-0000-0000-0000-00000000000a', 100000, 10000,
       date '2026-05-01', date '2026-01-01') $$,
  '22023', null, 'an end month before the start month is refused'
);

select throws_ok(
  $$ select * from public.record_existing_loan('b0150001-0000-0000-0000-00000000000a', 100000, 10000,
       date '2026-01-01', date '2026-10-01', null, 50000) $$,
  '22023', null, 'an original amount below what is still owed is refused'
);

select throws_ok(
  $$ select * from public.record_existing_loan('b0150001-0000-0000-0000-00000000000a', 100000, 10000,
       date '2026-01-01', date '2026-10-01', 'cb150001-0000-0000-0000-00000000000b') $$,
  '22023', null, 'another cooperative''s loan product is refused'
);

-- ---------------------------------------------------------------------------
-- The next application is measured against it
-- ---------------------------------------------------------------------------

select set_config('request.jwt.claims',
  '{"sub":"e0150001-0000-0000-0000-000000000001","role":"authenticated"}', true);

select is(
  (select available from public.submit_loan_application('b0150001-0000-0000-0000-00000000000b', 120000, 12)),
  48250::numeric,
  'a new application at Y is measured against both existing loans entered at X'
);

reset role;

select * from finish();

rollback;
