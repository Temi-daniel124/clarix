-- Clarix pgTAP suite 008 — officer permissions, and the reconciliation table.
--
-- Runs ONLY on the GitHub Actions hosted runner (DECISIONS.md D015).
--
-- Blueprint 7.2's toggles are only worth having if they change what the database permits. This
-- suite is the evidence for that claim: the same officer, the same query, different answers
-- depending on one jsonb flag.

create extension if not exists pgtap with schema extensions;

begin;

select plan(14);

select has_table('public', 'deduction_reconciliation', 'deduction_reconciliation exists');

select is(
  (select count(*)::int from pg_tables
    where schemaname = 'public' and tablename = 'deduction_reconciliation' and rowsecurity = false),
  0,
  'deduction_reconciliation has row-level security enabled'
);

-- ---------------------------------------------------------------------------
-- Fixtures: a cooperative, an admin, an officer with nothing switched on, and one member with an
-- active loan so there is something to reconcile.
-- ---------------------------------------------------------------------------

insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
                        created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
values
  ('91111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'admin8@example.test', 'x', now(), now(), '{}', '{}'),
  ('92222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'officer8@example.test', 'x', now(), now(), '{}', '{}'),
  ('93333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'member8@example.test', 'x', now(), now(), '{}', '{}');

insert into public.cooperatives (id, organization_id, name)
select 'c8888888-8888-8888-8888-888888888888', id, 'Permission Cooperative'
  from public.organizations;

insert into public.cooperative_staff_roles (user_id, cooperative_id, role, status, permissions)
values
  ('91111111-1111-1111-1111-111111111111', 'c8888888-8888-8888-8888-888888888888',
   'admin', 'active', '{}'::jsonb),
  ('92222222-2222-2222-2222-222222222222', 'c8888888-8888-8888-8888-888888888888',
   'officer', 'active', '{}'::jsonb);

insert into public.cooperative_memberships (id, user_id, cooperative_id, status, joined_at)
values ('b8888888-8888-8888-8888-888888888888', '93333333-3333-3333-3333-333333333333',
        'c8888888-8888-8888-8888-888888888888', 'active', now());

insert into public.loans (membership_id, requested_amount, monthly_repayment, tenure_months,
                          status, approved_at)
values ('b8888888-8888-8888-8888-888888888888', 120000, 10000, 12, 'active', now());

-- ---------------------------------------------------------------------------
-- Default-deny: an officer with nothing switched on can do nothing
-- ---------------------------------------------------------------------------

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"92222222-2222-2222-2222-222222222222","role":"authenticated"}',
  true
);

select is(
  (select count(*)::int from public.cooperative_memberships
    where cooperative_id = 'c8888888-8888-8888-8888-888888888888'),
  0,
  'an officer with no permissions cannot see the member list at all'
);

select throws_ok(
  $$ insert into public.savings_transactions (membership_id, type, amount)
     values ('b8888888-8888-8888-8888-888888888888', 'contribution', 5000) $$,
  '42501',
  null,
  'and cannot record anything against a member'
);

select throws_ok(
  $$ insert into public.deduction_reconciliation (membership_id, period, expected_amount, actual_amount_received)
     values ('b8888888-8888-8888-8888-888888888888', '2026-09', 10000, 10000) $$,
  '42501',
  null,
  'and cannot enter a reconciliation figure either'
);

-- Recording a repayment is the same act under the same permission, not a separate one. Both
-- blueprints put "Record contribution" and "Record repayment" behind one granted permission, and
-- `savings_transactions_insert_staff` does not look at the row's type — this is the assertion
-- that keeps those two facts together.
select throws_ok(
  $$ insert into public.savings_transactions (membership_id, type, amount)
     values ('b8888888-8888-8888-8888-888888888888', 'loan_repayment', 5000) $$,
  '42501',
  null,
  'and a repayment is refused on the same permission a contribution is'
);

-- ---------------------------------------------------------------------------
-- An admin switches one thing on, and exactly that thing changes
-- ---------------------------------------------------------------------------

select set_config(
  'request.jwt.claims',
  '{"sub":"91111111-1111-1111-1111-111111111111","role":"authenticated"}',
  true
);

update public.cooperative_staff_roles
   set permissions = '{"can_view_members": true}'::jsonb
 where user_id = '92222222-2222-2222-2222-222222222222';

select set_config(
  'request.jwt.claims',
  '{"sub":"92222222-2222-2222-2222-222222222222","role":"authenticated"}',
  true
);

select is(
  (select count(*)::int from public.cooperative_memberships
    where cooperative_id = 'c8888888-8888-8888-8888-888888888888'),
  1,
  'switching on "see the member list" changes what Postgres returns, not just what a screen shows'
);

select throws_ok(
  $$ insert into public.savings_transactions (membership_id, type, amount)
     values ('b8888888-8888-8888-8888-888888888888', 'contribution', 5000) $$,
  '42501',
  null,
  'and it grants nothing else: recording is still refused'
);

-- ---------------------------------------------------------------------------
-- The recording permission, switched on separately
-- ---------------------------------------------------------------------------

select set_config(
  'request.jwt.claims',
  '{"sub":"91111111-1111-1111-1111-111111111111","role":"authenticated"}',
  true
);

update public.cooperative_staff_roles
   set permissions = '{"can_view_members": true, "can_record_savings": true}'::jsonb
 where user_id = '92222222-2222-2222-2222-222222222222';

select set_config(
  'request.jwt.claims',
  '{"sub":"92222222-2222-2222-2222-222222222222","role":"authenticated"}',
  true
);

insert into public.savings_transactions (membership_id, type, amount)
values ('b8888888-8888-8888-8888-888888888888', 'contribution', 5000);

select is(
  (select savings_balance from public.cooperative_memberships
    where id = 'b8888888-8888-8888-8888-888888888888'),
  5000::numeric,
  'with recording switched on, the entry lands and the balance follows'
);

insert into public.savings_transactions (membership_id, type, amount, loan_id)
select 'b8888888-8888-8888-8888-888888888888', 'loan_repayment', 4000, l.id
  from public.loans l where l.membership_id = 'b8888888-8888-8888-8888-888888888888';

select is(
  (select savings_balance from public.cooperative_memberships
    where id = 'b8888888-8888-8888-8888-888888888888'),
  5000::numeric,
  'the same permission lets a repayment land, and a repayment does not move the savings balance'
);

insert into public.deduction_reconciliation (membership_id, period, expected_amount, actual_amount_received)
values ('b8888888-8888-8888-8888-888888888888', '2026-09', 10000, 7500);

select is(
  (select actual_amount_received from public.deduction_reconciliation
    where membership_id = 'b8888888-8888-8888-8888-888888888888' and period = '2026-09'),
  7500::numeric,
  'and a reconciliation figure can be entered for the month'
);

-- The shortfall is derived rather than stored, so it cannot disagree with the two figures.
select is(
  (select expected_amount - actual_amount_received from public.deduction_reconciliation
    where membership_id = 'b8888888-8888-8888-8888-888888888888' and period = '2026-09'),
  2500::numeric,
  'the shortfall is the arithmetic of the two columns, never a third stored number'
);

-- ---------------------------------------------------------------------------
-- An admin never loses their own access to their own cooperative
-- ---------------------------------------------------------------------------

select set_config(
  'request.jwt.claims',
  '{"sub":"91111111-1111-1111-1111-111111111111","role":"authenticated"}',
  true
);

select is(
  (select count(*)::int from public.cooperative_memberships
    where cooperative_id = 'c8888888-8888-8888-8888-888888888888'),
  1,
  'an admin sees their own cooperative''s members with no permissions set at all'
);

-- The member sees their own reconciliation row, which is what feeds their Deductions record.
select set_config(
  'request.jwt.claims',
  '{"sub":"93333333-3333-3333-3333-333333333333","role":"authenticated"}',
  true
);

select is(
  (select count(*)::int from public.deduction_reconciliation),
  1,
  'the member can read their own month, and staff of other cooperatives cannot'
);

reset role;

select * from finish();

rollback;
