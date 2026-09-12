-- Clarix pgTAP suite 001 — per-cooperative isolation.
--
-- Runs ONLY on the GitHub Actions hosted runner (.github/workflows/db-tests.yml), never on a
-- developer machine: DECISIONS.md D015 and docs/DEVELOPMENT-WORKFLOW.md §2–3.
--
-- This is the test for the single most important property in the product: an officer of
-- cooperative A must not be able to read or write cooperative B's rows, and the boundary must
-- hold in the database rather than in the UI (DECISIONS.md D011, SECURITY.md). It is the
-- structural answer to the "/member/1234 -> /member/1235" class of leak.

create extension if not exists pgtap with schema extensions;

begin;

select plan(17);

-- ---------------------------------------------------------------------------
-- Schema shape
-- ---------------------------------------------------------------------------

select has_table('public', 'organizations', 'organizations exists');
select has_table('public', 'users', 'users exists');
select has_table('public', 'cooperatives', 'cooperatives exists');
select has_table('public', 'cooperative_memberships', 'cooperative_memberships exists');
select has_table('public', 'cooperative_staff_roles', 'cooperative_staff_roles exists');
select has_table('public', 'platform_admins', 'platform_admins exists');

-- Every table carrying organization_id or cooperative_id must have RLS switched on. A table
-- that ships without it is the exact failure SECURITY.md forbids.
select is(
  (select count(*)::int from pg_tables where schemaname = 'public' and rowsecurity = false),
  0,
  'no public table is left without row-level security'
);

-- ---------------------------------------------------------------------------
-- Seed policy defaults (DECISIONS.md D007, D009, D019)
-- ---------------------------------------------------------------------------

select is(
  (select count(*)::int from public.organizations),
  1,
  'exactly one organization exists in v1'
);

select results_eq(
  $$ select deduction_basis::text, deduction_max_percentage, reservation_expiry_days_default
       from public.organizations $$,
  $$ values ('gross', 33.30::numeric, 7) $$,
  'FMC Abeokuta is seeded with the gross basis, the 33.3% cap and a 7-day reservation window'
);

-- ---------------------------------------------------------------------------
-- Fixtures: two cooperatives, one member each, one officer at cooperative A
-- ---------------------------------------------------------------------------

insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
                        created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
values
  ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'officer-a@example.test', 'x', now(), now(), '{}', '{}'),
  ('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'member-a@example.test', 'x', now(), now(), '{}', '{}'),
  ('33333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'member-b@example.test', 'x', now(), now(), '{}', '{}');

-- The public.users rows are created by the on_auth_user_created trigger, not by hand.
select is(
  (select count(*)::int from public.users),
  3,
  'signing up an auth user creates its matching public.users row automatically'
);

insert into public.cooperatives (id, organization_id, name)
select 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', id, 'Cooperative A' from public.organizations;

insert into public.cooperatives (id, organization_id, name)
select 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', id, 'Cooperative B' from public.organizations;

insert into public.cooperative_memberships (user_id, cooperative_id, status, savings_balance)
values
  ('22222222-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'active', 150000),
  ('33333333-3333-3333-3333-333333333333', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'active', 900000);

-- The officer is given the permission that lets them see members at all. Before migration 016
-- that was implied by being staff; it is now an explicit flag, default-deny (blueprint 7.2). The
-- subject of this suite is isolation BETWEEN cooperatives, so the officer needs to be permitted
-- to see their own cooperative's members for the isolation assertions to mean anything — an
-- officer who can see nothing proves nothing about boundaries.
insert into public.cooperative_staff_roles (user_id, cooperative_id, role, status, permissions)
values
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'officer',
   'active', '{"can_view_members": true, "can_record_savings": true}'::jsonb);

-- ---------------------------------------------------------------------------
-- Act as cooperative A's officer, exactly as the browser client does
-- ---------------------------------------------------------------------------

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}',
  true
);

select is(
  (select count(*)::int from public.cooperative_memberships),
  1,
  'an officer of cooperative A sees only cooperative A memberships'
);

select is(
  (select count(*)::int from public.cooperative_memberships
    where cooperative_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
  0,
  'cooperative B savings balances are invisible to cooperative A'
);

select is(
  (select count(*)::int from public.users),
  2,
  'an officer sees their own row and their own cooperative members, nobody else'
);

select is(
  (select count(*)::int from public.cooperative_staff_roles),
  1,
  'staff rows at another cooperative are invisible'
);

-- Discovery: the cooperative PROFILE is public to any signed-in employee (MVP-SCOPE.md P0 #11).
-- That is deliberate and is not a leak: it exposes no member data.
select is(
  (select count(*)::int from public.cooperatives),
  2,
  'cooperative public profiles remain visible for discovery'
);

-- The write side of the boundary, which matters as much as the read side.
update public.cooperative_memberships
   set savings_balance = 1
 where cooperative_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

reset role;

-- Checked after dropping back out of the authenticated role, because the officer cannot even
-- SELECT the row they just failed to update.
select is(
  (select savings_balance from public.cooperative_memberships
    where cooperative_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
  900000::numeric,
  'an officer of cooperative A cannot write to cooperative B rows'
);

-- ---------------------------------------------------------------------------
-- The unauthenticated role reaches nothing at all
-- ---------------------------------------------------------------------------

set local role anon;

select throws_ok(
  'select count(*) from public.cooperatives',
  '42501',
  null,
  'anon has no privilege on cooperative data'
);

reset role;

select * from finish();

rollback;
