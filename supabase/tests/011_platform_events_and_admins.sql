-- Clarix pgTAP suite 011 — platform events, and who may operate the platform.
--
-- Runs ONLY on the GitHub Actions hosted runner (DECISIONS.md D015).
--
-- Two claims from the super-admin blueprint are pinned here. The platform audit log and a
-- cooperative's own audit log are separate records that never leak into each other (7.1). And a
-- platform admin cannot remove their own access, "avoiding the mistake of a single operator
-- locking themselves out entirely" (8.1) — a safeguard that has to live in the database, since a
-- hidden button is not a safeguard.

create extension if not exists pgtap with schema extensions;

begin;

select plan(12);

-- ---------------------------------------------------------------------------
-- Fixtures: two platform operators, one cooperative with its own admin, and one cooperative-
-- scoped audit row that the operators must never see.
-- ---------------------------------------------------------------------------

insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
                        created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
values
  ('11111111-aaaa-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'operator11@example.test', 'x', now(), now(), '{}', '{}'),
  ('22222222-aaaa-2222-2222-222222222222', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'second11@example.test', 'x', now(), now(), '{}', '{}'),
  ('33333333-aaaa-3333-3333-333333333333', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'coopadmin11@example.test', 'x', now(), now(), '{}', '{}');

insert into public.platform_admins (user_id)
values ('11111111-aaaa-1111-1111-111111111111');

insert into public.cooperatives (id, organization_id, name)
select 'cc111111-aaaa-1111-1111-111111111111', id, 'Event Test Cooperative'
  from public.organizations;

insert into public.cooperative_staff_roles (user_id, cooperative_id, role, status, permissions)
values ('33333333-aaaa-3333-3333-333333333333', 'cc111111-aaaa-1111-1111-111111111111',
        'admin', 'active', '{}'::jsonb);

-- A cooperative's own entry, written as superuser because only SECURITY DEFINER functions write
-- to this table in the running application.
insert into public.audit_log (actor_user_id, cooperative_id, action, target_table, note)
values ('33333333-aaaa-3333-3333-333333333333', 'cc111111-aaaa-1111-1111-111111111111',
        'approve_loan', 'loans', 'belongs to the cooperative, not the platform');

-- ---------------------------------------------------------------------------
-- The operator writes a platform event and reads it back
-- ---------------------------------------------------------------------------

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"11111111-aaaa-1111-1111-111111111111","role":"authenticated"}',
  true
);

select lives_ok(
  $$ select public.record_platform_event(
       'update_deduction_policy', 'organizations', null,
       '{"deduction_max_percentage": 33.3}'::jsonb,
       '{"deduction_max_percentage": 30}'::jsonb, null) $$,
  'a platform admin records a platform event'
);

select is(
  (select count(*)::int from public.audit_log),
  1,
  'and reads their own platform rows'
);

-- The whole point of keeping the two logs apart.
select is(
  (select count(*)::int from public.audit_log
    where cooperative_id = 'cc111111-aaaa-1111-1111-111111111111'),
  0,
  'and cannot see a cooperative''s own entries, which belong to that cooperative''s admin'
);

-- ---------------------------------------------------------------------------
-- Adding and removing another operator
-- ---------------------------------------------------------------------------

select is(
  (select count(*)::int from public.list_platform_admins()),
  1,
  'one operator to start with'
);

select is(
  (select reason from public.grant_platform_admin('nobody11@example.test')),
  'no_account',
  'granting to an address with no Clarix account is refused honestly rather than silently queued'
);

select is(
  (select granted from public.grant_platform_admin('second11@example.test')),
  true,
  'granting to a real account works'
);

select is(
  (select count(*)::int from public.list_platform_admins()),
  2,
  'and the list grows'
);

select is(
  (select count(*)::int from public.audit_log where action = 'grant_platform_admin'),
  1,
  'and the grant recorded itself in the platform log'
);

-- The safeguard, in the database rather than the interface.
select throws_ok(
  $$ select public.revoke_platform_admin('11111111-aaaa-1111-1111-111111111111') $$,
  '42501',
  null,
  'a platform admin cannot remove their own access, however the call is made'
);

select is(
  (select public.revoke_platform_admin('22222222-aaaa-2222-2222-222222222222')),
  true,
  'but can remove somebody else'
);

-- ---------------------------------------------------------------------------
-- A cooperative admin is none of this
-- ---------------------------------------------------------------------------

select set_config(
  'request.jwt.claims',
  '{"sub":"33333333-aaaa-3333-3333-333333333333","role":"authenticated"}',
  true
);

select throws_ok(
  $$ select public.record_platform_event('forged', 'organizations') $$,
  '42501',
  null,
  'a cooperative admin cannot forge a platform event'
);

-- They see their own cooperative's row and none of the platform's.
select is(
  (select count(*)::int from public.audit_log where cooperative_id is null),
  0,
  'and reads no platform events at all, only their own cooperative''s'
);

reset role;

select * from finish();

rollback;
