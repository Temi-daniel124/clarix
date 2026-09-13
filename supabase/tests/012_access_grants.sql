-- Clarix pgTAP suite 012 — the access-grant exception.
--
-- Runs ONLY on the GitHub Actions hosted runner (DECISIONS.md D015).
--
-- SECURITY.md names five properties this flow must have and adds: "If this flow is ever
-- implemented without every one of the above properties, it is a security bug, not a shortcut."
-- This suite is that sentence turned into assertions — no access without a grant, access that
-- ends by itself, read-only while it lasts, the cooperative told the moment it is requested, and
-- every record opened written down.

create extension if not exists pgtap with schema extensions;

begin;

select plan(16);

select has_table('public', 'access_grants', 'access_grants exists');

select is(
  (select count(*)::int from pg_policies
    where schemaname = 'public' and tablename = 'access_grants'
      and cmd in ('INSERT', 'UPDATE', 'DELETE')),
  0,
  'access_grants has no insert, update or delete policy: every transition goes through a function'
);

-- ---------------------------------------------------------------------------
-- Fixtures: an operator, a cooperative with its own admin, and a member with money.
-- ---------------------------------------------------------------------------

insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
                        created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
values
  ('a1111111-bbbb-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'operator12@example.test', 'x', now(), now(), '{}', '{}'),
  ('a2222222-bbbb-2222-2222-222222222222', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'coopadmin12@example.test', 'x', now(), now(), '{}', '{}'),
  ('a3333333-bbbb-3333-3333-333333333333', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'member12@example.test', 'x', now(), now(), '{}', '{}');

insert into public.platform_admins (user_id)
values ('a1111111-bbbb-1111-1111-111111111111');

insert into public.cooperatives (id, organization_id, name)
select 'cd111111-bbbb-1111-1111-111111111111', id, 'Grant Test Cooperative'
  from public.organizations;

insert into public.cooperative_staff_roles (user_id, cooperative_id, role, status, permissions)
values ('a2222222-bbbb-2222-2222-222222222222', 'cd111111-bbbb-1111-1111-111111111111',
        'admin', 'active', '{}'::jsonb);

insert into public.cooperative_memberships (id, user_id, cooperative_id, status, joined_at)
values ('ce111111-bbbb-1111-1111-111111111111', 'a3333333-bbbb-3333-3333-333333333333',
        'cd111111-bbbb-1111-1111-111111111111', 'active', now());

insert into public.savings_transactions (membership_id, type, amount)
values ('ce111111-bbbb-1111-1111-111111111111', 'contribution', 50000);

-- ---------------------------------------------------------------------------
-- No grant, no access. Not a hidden menu — a refusal.
-- ---------------------------------------------------------------------------

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"a1111111-bbbb-1111-1111-111111111111","role":"authenticated"}',
  true
);

select is(
  (select count(*)::int from public.cooperative_memberships
    where cooperative_id = 'cd111111-bbbb-1111-1111-111111111111'),
  0,
  'a platform admin with no grant reads no membership at all'
);

select is(
  (select count(*)::int from public.savings_transactions),
  0,
  'and no savings entry'
);

select throws_ok(
  $$ select * from public.capacity_for_membership('ce111111-bbbb-1111-1111-111111111111') $$,
  '42501',
  null,
  'and cannot look up what that member can carry'
);

-- A reason that says nothing is refused before anything else happens.
select throws_ok(
  $$ select public.request_access_grant(
       'cd111111-bbbb-1111-1111-111111111111', 'checking') $$,
  '22023',
  null,
  'a request without a real reason is refused'
);

-- ---------------------------------------------------------------------------
-- A live grant opens the real rows, and nothing more
-- ---------------------------------------------------------------------------

select lives_ok(
  $$ select public.request_access_grant(
       'cd111111-bbbb-1111-1111-111111111111',
       'The cooperative reports a savings balance they cannot reconcile against their ledger.',
       'a3333333-bbbb-3333-3333-333333333333', 0, 24) $$,
  'a request with a real reason is accepted'
);

select is(
  (select count(*)::int from public.cooperative_memberships
    where cooperative_id = 'cd111111-bbbb-1111-1111-111111111111'),
  1,
  'and with the grant live, the real membership row is readable'
);

select is(
  (select count(*)::int from public.savings_transactions),
  1,
  'along with the savings entries behind the balance'
);

-- Blueprint 7.3's granular logging: opening a record writes its own row, carrying the reason.
select lives_ok(
  $$ select public.log_elevated_view(
       (select id from public.access_grants limit 1),
       'cooperative_memberships',
       'ce111111-bbbb-1111-1111-111111111111',
       'Opened the member profile') $$,
  'opening a record under a live grant writes its own log row'
);

-- Read-only, in the database. The interface removing the buttons is the cosmetic half.
select throws_ok(
  $$ insert into public.savings_transactions (membership_id, type, amount)
     values ('ce111111-bbbb-1111-1111-111111111111', 'contribution', 1000) $$,
  '42501',
  null,
  'but nothing can be written under a grant: it is read access, never write'
);

-- ---------------------------------------------------------------------------
-- The cooperative was told, the moment it was requested
-- ---------------------------------------------------------------------------

select set_config(
  'request.jwt.claims',
  '{"sub":"a2222222-bbbb-2222-2222-222222222222","role":"authenticated"}',
  true
);

select is(
  (select count(*)::int from public.notifications where category = 'access_request'),
  1,
  'the cooperative''s admin was notified when the request was submitted, not afterwards'
);

-- The log lands in THEIR audit log, which is the property that makes it accountability rather
-- than bookkeeping: the cooperative whose data was read is the one who can read about it.
select is(
  (select count(*)::int from public.audit_log where action = 'elevated_view'),
  1,
  'and the record that was opened is written into that cooperative''s own audit log'
);

-- ---------------------------------------------------------------------------
-- Expiry happens at read time, with nothing having to run
-- ---------------------------------------------------------------------------

reset role;

update public.access_grants
   set activates_at = now() - interval '30 hours',
       expires_at = now() - interval '6 hours';

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"a1111111-bbbb-1111-1111-111111111111","role":"authenticated"}',
  true
);

select is(
  (select count(*)::int from public.cooperative_memberships
    where cooperative_id = 'cd111111-bbbb-1111-1111-111111111111'),
  0,
  'once the window has passed the rows are gone again, with no sweep having run'
);

select is(
  (select public.access_grant_state(g)::text from public.access_grants g limit 1),
  'expired',
  'and the grant reads as expired although its stored status still says pending'
);

select throws_ok(
  $$ select public.log_elevated_view(
       (select id from public.access_grants limit 1), 'cooperative_memberships') $$,
  '42501',
  null,
  'a lapsed grant cannot even record a view, so the log can never claim one that was not permitted'
);

reset role;

select * from finish();

rollback;
