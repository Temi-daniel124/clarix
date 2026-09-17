-- Clarix pgTAP suite 010: the Super Admin's boundary.
--
-- Runs ONLY on the GitHub Actions hosted runner (DECISIONS.md D015).
--
-- This role's whole design is an absence: administrative power over the platform, and no standing
-- sight of anybody's money. ROLES-AND-PERMISSIONS.md calls that "a hard requirement, not a
-- convenience shortcut, even for debugging", which makes it exactly the kind of claim that should
-- be a test rather than a comment.
--
-- Two things are pinned here. A platform admin can count what they are entitled to count and
-- cannot read the rows behind the counts. Nobody else can call the counting functions at all.

create extension if not exists pgtap with schema extensions;

begin;

select plan(11);

select has_function('public', 'platform_overview', 'platform_overview() exists');
select has_function('public', 'platform_cooperative_directory', 'platform_cooperative_directory() exists');

-- ---------------------------------------------------------------------------
-- Fixtures: a platform admin who staffs nothing, a cooperative with its own admin, and one
-- member holding savings: the data the Super Admin must be able to count and must not read.
-- ---------------------------------------------------------------------------

insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
                        created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
values
  ('f1111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'operator10@example.test', 'x', now(), now(), '{}', '{}'),
  ('f2222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'coopadmin10@example.test', 'x', now(), now(), '{}', '{}'),
  ('f3333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'member10@example.test', 'x', now(), now(), '{}', '{}');

update public.users set employee_id = '710001'
 where id = 'f3333333-3333-3333-3333-333333333333';

insert into public.platform_admins (user_id)
values ('f1111111-1111-1111-1111-111111111111');

insert into public.cooperatives (id, organization_id, name, status)
select 'ca111111-1111-1111-1111-111111111111', id, 'Platform Test Cooperative', 'active'
  from public.organizations;

insert into public.cooperative_staff_roles (user_id, cooperative_id, role, status, permissions)
values ('f2222222-2222-2222-2222-222222222222', 'ca111111-1111-1111-1111-111111111111',
        'admin', 'active', '{}'::jsonb);

insert into public.cooperative_memberships (id, user_id, cooperative_id, status, joined_at, savings_balance)
values ('cb111111-1111-1111-1111-111111111111', 'f3333333-3333-3333-3333-333333333333',
        'ca111111-1111-1111-1111-111111111111', 'active', now(), 0);

-- ---------------------------------------------------------------------------
-- The platform admin: counts yes, rows no
-- ---------------------------------------------------------------------------

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"f1111111-1111-1111-1111-111111111111","role":"authenticated"}',
  true
);

select is(
  (select member_count from public.platform_cooperative_directory()
    where id = 'ca111111-1111-1111-1111-111111111111'),
  1,
  'a platform admin counts a cooperative''s members'
);

select is(
  (select admin_email from public.platform_cooperative_directory()
    where id = 'ca111111-1111-1111-1111-111111111111'),
  'coopadmin10@example.test',
  'and sees who runs it, because that person is staff rather than a member'
);

-- The whole point. The count above was aggregated over a row this caller cannot read.
select is(
  (select count(*)::int from public.cooperative_memberships
    where cooperative_id = 'ca111111-1111-1111-1111-111111111111'),
  0,
  'and still cannot read a single membership row directly'
);

select is(
  (select count(*)::int from public.users
    where id = 'f3333333-3333-3333-3333-333333333333'),
  0,
  'nor the member''s own user row'
);

select is(
  (select count(*)::int from public.savings_transactions),
  0,
  'nor any savings entry anywhere'
);

select is(
  (select count(*)::int from public.loans),
  0,
  'nor any loan anywhere: no standing access to financial data is the whole role'
);

-- A count of employees is a count, and the signature cannot return anything else. The literal is
-- deliberate: asking `select count(*) from public.users` as this caller would return 0, because
-- RLS hides every row the function just counted. That gap between the two is the boundary working.
select is(
  (select employee_headcount from public.platform_overview()),
  1,
  'the organization-wide headcount is the real figure, arrived at without a list of people'
);

-- ---------------------------------------------------------------------------
-- Nobody else may call them
-- ---------------------------------------------------------------------------

select set_config(
  'request.jwt.claims',
  '{"sub":"f2222222-2222-2222-2222-222222222222","role":"authenticated"}',
  true
);

select throws_ok(
  'select * from public.platform_overview()',
  '42501',
  null,
  'a cooperative admin is refused the platform overview'
);

select throws_ok(
  'select * from public.platform_cooperative_directory()',
  '42501',
  null,
  'and the cooperative directory, even for the cooperative they run'
);

reset role;

select * from finish();

rollback;
