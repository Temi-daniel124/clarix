-- Clarix pgTAP suite 006: the staff view of a member, and recording against them.
--
-- Runs ONLY on the GitHub Actions hosted runner (DECISIONS.md D015).
--
-- Covers migrations 012 and 013: the staff door onto the capacity calculation, the balance that
-- follows the ledger rather than being remembered separately, and the opening entry an imported
-- member arrives with.
--
-- The capacity function is the one that matters most here. `capacity_for_membership` reaches
-- across every cooperative a member belongs to, which is D003's deliberate exception, so what it
-- refuses is as much the point as what it returns.

create extension if not exists pgtap with schema extensions;

begin;

select plan(10);

-- ---------------------------------------------------------------------------
-- Fixtures: two cooperatives with different staff, one member of both, and a loan at each so the
-- committed figure is genuinely cross-cooperative.
-- ---------------------------------------------------------------------------

insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
                        created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
values
  ('d1111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'staffone@example.test', 'x', now(), now(), '{}', '{}'),
  ('d2222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'stafftwo@example.test', 'x', now(), now(), '{}', '{}'),
  ('d3333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'themember@example.test', 'x', now(), now(), '{}', '{}');

update public.users
   set salary_gross = 250000, salary_net = 180000, salary_verified_at = now(),
       employee_id = '204902'
 where id = 'd3333333-3333-3333-3333-333333333333';

insert into public.cooperatives (id, organization_id, name)
select 'e1111111-1111-1111-1111-111111111111', id, 'Cooperative One' from public.organizations;

insert into public.cooperatives (id, organization_id, name)
select 'e2222222-2222-2222-2222-222222222222', id, 'Cooperative Two' from public.organizations;

-- The officer is permitted to see members and record entries, which migration 016 made explicit
-- flags rather than something being staff implied. This suite is about what the STAFF DOOR onto
-- the capacity calculation returns and refuses, so the officer needs the permissions that get
-- them to the door at all.
insert into public.cooperative_staff_roles (user_id, cooperative_id, role, status, permissions)
values
  ('d1111111-1111-1111-1111-111111111111', 'e1111111-1111-1111-1111-111111111111',
   'officer', 'active', '{"can_view_members": true, "can_record_savings": true}'::jsonb),
  ('d2222222-2222-2222-2222-222222222222', 'e2222222-2222-2222-2222-222222222222',
   'admin', 'active', '{}'::jsonb);

insert into public.cooperative_memberships (id, user_id, cooperative_id, status, joined_at)
values
  ('f1111111-1111-1111-1111-111111111111', 'd3333333-3333-3333-3333-333333333333',
   'e1111111-1111-1111-1111-111111111111', 'active', now()),
  ('f2222222-2222-2222-2222-222222222222', 'd3333333-3333-3333-3333-333333333333',
   'e2222222-2222-2222-2222-222222222222', 'active', now());

-- 25,000 a month at one cooperative, 15,000 at the other: 40,000 committed in total, against a
-- cap of 33.3% of 250,000 = 83,250.
insert into public.loans (membership_id, requested_amount, monthly_repayment, tenure_months,
                          status, approved_at)
values
  ('f1111111-1111-1111-1111-111111111111', 300000, 25000, 12, 'active', now()),
  ('f2222222-2222-2222-2222-222222222222', 180000, 15000, 12, 'active', now());

-- ---------------------------------------------------------------------------
-- The staff door onto the capacity calculation
-- ---------------------------------------------------------------------------

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"d1111111-1111-1111-1111-111111111111","role":"authenticated"}',
  true
);

select is(
  (select cap from public.capacity_for_membership('f1111111-1111-1111-1111-111111111111')),
  83250::numeric,
  'an officer sees the member''s cap, computed the same way the member''s own dashboard does'
);

select is(
  (select committed from public.capacity_for_membership('f1111111-1111-1111-1111-111111111111')),
  40000::numeric,
  'and a committed figure that includes the loan held at the OTHER cooperative'
);

select is(
  (select available from public.capacity_for_membership('f1111111-1111-1111-1111-111111111111')),
  43250::numeric,
  'so what is left is the cross-cooperative remainder, not this cooperative''s own view'
);

-- The same officer has no business looking up a membership at a cooperative they do not staff,
-- even though the person is the same person.
select throws_ok(
  $$ select * from public.capacity_for_membership('f2222222-2222-2222-2222-222222222222') $$,
  '42501',
  null,
  'staff at one cooperative cannot look up a membership at another'
);

-- The employee's own door still works and still agrees with the staff door.
select set_config(
  'request.jwt.claims',
  '{"sub":"d3333333-3333-3333-3333-333333333333","role":"authenticated"}',
  true
);

select is(
  (select available from public.capacity_for_user()),
  43250::numeric,
  'the member''s own dashboard reports exactly the same remainder. One calculation, two doors'
);

-- ---------------------------------------------------------------------------
-- Recording against a member (blueprint 5.4), on the policies that already existed
-- ---------------------------------------------------------------------------

select set_config(
  'request.jwt.claims',
  '{"sub":"d1111111-1111-1111-1111-111111111111","role":"authenticated"}',
  true
);

insert into public.savings_transactions (membership_id, type, amount, description)
values ('f1111111-1111-1111-1111-111111111111', 'contribution', 20000, 'September deduction');

select is(
  (select savings_balance from public.cooperative_memberships
    where id = 'f1111111-1111-1111-1111-111111111111'),
  20000::numeric,
  'recording a contribution moves the balance without anybody writing the balance'
);

insert into public.savings_transactions (membership_id, type, amount)
values ('f1111111-1111-1111-1111-111111111111', 'withdrawal_record', 5000);

select is(
  (select savings_balance from public.cooperative_memberships
    where id = 'f1111111-1111-1111-1111-111111111111'),
  15000::numeric,
  'and a recorded withdrawal lowers it'
);

-- A repayment leaves the salary; it is not a withdrawal from savings (DECISIONS.md D024).
insert into public.savings_transactions (membership_id, type, amount, loan_id)
select 'f1111111-1111-1111-1111-111111111111', 'loan_repayment', 25000, id
  from public.loans where membership_id = 'f1111111-1111-1111-1111-111111111111';

select is(
  (select savings_balance from public.cooperative_memberships
    where id = 'f1111111-1111-1111-1111-111111111111'),
  15000::numeric,
  'a loan repayment moves the salary, not the savings balance'
);

-- The officer cannot record anything against the other cooperative's membership, which is the
-- pre-existing policy from migration 006 doing its job rather than anything added since.
select throws_ok(
  $$ insert into public.savings_transactions (membership_id, type, amount)
     values ('f2222222-2222-2222-2222-222222222222', 'contribution', 1000) $$,
  '42501',
  null,
  'staff cannot record an entry against a member of a cooperative they do not staff'
);

-- ---------------------------------------------------------------------------
-- An imported member arrives with their balance explained
-- ---------------------------------------------------------------------------

reset role;

insert into public.member_roster_entries (cooperative_id, employee_id, name, savings_balance)
values ('e1111111-1111-1111-1111-111111111111', '204903', 'Imported Member', 90000);

insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
                        created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
values ('d4444444-4444-4444-4444-444444444444', '00000000-0000-0000-0000-000000000000',
        'authenticated', 'authenticated', 'imported@example.test', 'x', now(), now(), '{}', '{}');

update public.users set employee_id = '204903'
 where id = 'd4444444-4444-4444-4444-444444444444';

insert into public.cooperative_memberships (id, user_id, cooperative_id, status)
values ('f3333333-3333-3333-3333-333333333333', 'd4444444-4444-4444-4444-444444444444',
        'e1111111-1111-1111-1111-111111111111', 'pending');

select results_eq(
  $$ select type::text, amount from public.savings_transactions
      where membership_id = 'f3333333-3333-3333-3333-333333333333' $$,
  $$ values ('contribution', 90000.00::numeric) $$,
  'the imported balance arrives as a ledger entry, so the statement explains where it came from'
);

select * from finish();

rollback;
