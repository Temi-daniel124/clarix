-- Clarix pgTAP suite 004, notification privacy.
--
-- Runs ONLY on the GitHub Actions hosted runner (DECISIONS.md D015).
--
-- A notification is addressed to one person. DECISIONS.md D025 makes `notifications` the
-- narrowest table in the schema deliberately: no officer view, no admin view, no cooperative
-- scope, and no insert policy at all, because every row records something the system or a
-- cooperative did rather than something its recipient claims happened. This suite is what stops
-- any of that being quietly widened later.

create extension if not exists pgtap with schema extensions;

begin;

select plan(8);

select has_table('public', 'notifications', 'notifications exists');

select is(
  (select count(*)::int from pg_tables
    where schemaname = 'public' and tablename = 'notifications' and rowsecurity = false),
  0,
  'notifications has row-level security enabled'
);

-- The absence of an insert policy is the point, so it is asserted rather than assumed.
select is(
  (select count(*)::int from pg_policies
    where schemaname = 'public' and tablename = 'notifications' and cmd = 'INSERT'),
  0,
  'there is no insert policy: an employee cannot write their own notifications'
);

select is(
  (select count(*)::int from pg_policies
    where schemaname = 'public' and tablename = 'notifications' and cmd = 'DELETE'),
  0,
  'there is no delete policy: clearing a backlog marks rows read, it does not destroy the trail'
);

-- ---------------------------------------------------------------------------
-- Fixtures: two unrelated employees, one notification each
-- ---------------------------------------------------------------------------

insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
                        created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
values
  ('77777777-7777-7777-7777-777777777777', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'owner@example.test', 'x', now(), now(), '{}', '{}'),
  ('88888888-8888-8888-8888-888888888888', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'other@example.test', 'x', now(), now(), '{}', '{}');

insert into public.notifications (id, user_id, category, message, target_url)
values
  ('99999999-9999-9999-9999-999999999999', '77777777-7777-7777-7777-777777777777',
   'loan_decision', 'Your loan was approved.', '/loans'),
  ('aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '88888888-8888-8888-8888-888888888888',
   'membership_decision', 'Your application to join was accepted.', '/cooperatives');

-- ---------------------------------------------------------------------------
-- Each employee sees exactly their own
-- ---------------------------------------------------------------------------

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"77777777-7777-7777-7777-777777777777","role":"authenticated"}',
  true
);

select is(
  (select count(*)::int from public.notifications),
  1,
  'an employee sees their own notifications and only those'
);

select is(
  (select count(*)::int from public.notifications
    where id = 'aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  0,
  'another employee''s notification is not reachable, even by its own id'
);

-- "Mark all as read" is a bulk update with no user predicate in the query itself: the policy is
-- what scopes it. If that ever stopped being true, this is where it would show.
update public.notifications set read_at = now() where read_at is null;

select is(
  (select count(*)::int from public.notifications where read_at is not null),
  1,
  'mark-all-as-read marks the caller''s own row'
);

reset role;

select is(
  (select count(*)::int from public.notifications
    where id = 'aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa' and read_at is null),
  1,
  'and leaves the other employee''s notification untouched'
);

select * from finish();

rollback;
