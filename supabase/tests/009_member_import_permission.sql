-- Clarix pgTAP suite 009 — the member-import permission (migration 017).
--
-- Runs ONLY on the GitHub Actions hosted runner (DECISIONS.md D015).
--
-- The officer blueprint hides the "Import members" entry from an officer who has not been granted
-- it. This suite is the evidence that hiding it is not the whole of the boundary: the same officer
-- typing the URL, or posting the form by hand, is refused by Postgres.

create extension if not exists pgtap with schema extensions;

begin;

select plan(6);

-- ---------------------------------------------------------------------------
-- Fixtures: one cooperative, its admin, and an officer allowed to do the day-to-day work but not
-- to write the roster — the most common shape this permission will actually take.
-- ---------------------------------------------------------------------------

insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
                        created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
values
  ('a1111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'admin9@example.test', 'x', now(), now(), '{}', '{}'),
  ('a2222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'officer9@example.test', 'x', now(), now(), '{}', '{}');

insert into public.cooperatives (id, organization_id, name)
select 'c9999999-9999-9999-9999-999999999999', id, 'Import Cooperative'
  from public.organizations;

insert into public.cooperative_staff_roles (user_id, cooperative_id, role, status, permissions)
values
  ('a1111111-1111-1111-1111-111111111111', 'c9999999-9999-9999-9999-999999999999',
   'admin', 'active', '{}'::jsonb),
  ('a2222222-2222-2222-2222-222222222222', 'c9999999-9999-9999-9999-999999999999',
   'officer', 'active',
   '{"can_view_members": true, "can_record_savings": true}'::jsonb);

-- ---------------------------------------------------------------------------
-- The admin imports somebody, which is what an officer's member list is made of
-- ---------------------------------------------------------------------------

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"a1111111-1111-1111-1111-111111111111","role":"authenticated"}',
  true
);

insert into public.member_roster_entries (cooperative_id, employee_id, name, savings_balance)
values ('c9999999-9999-9999-9999-999999999999', '900001', 'Imported Person', 0);

select is(
  (select count(*)::int from public.member_roster_entries
    where cooperative_id = 'c9999999-9999-9999-9999-999999999999'),
  1,
  'an admin imports a roster entry with no permissions set at all'
);

-- ---------------------------------------------------------------------------
-- The officer: allowed to see it, refused when writing one
-- ---------------------------------------------------------------------------

select set_config(
  'request.jwt.claims',
  '{"sub":"a2222222-2222-2222-2222-222222222222","role":"authenticated"}',
  true
);

select is(
  (select count(*)::int from public.member_roster_entries
    where cooperative_id = 'c9999999-9999-9999-9999-999999999999'),
  1,
  'an officer who may see members reads the imported roster, which is what their member list is made of'
);

select throws_ok(
  $$ insert into public.member_roster_entries (cooperative_id, employee_id, name)
     values ('c9999999-9999-9999-9999-999999999999', '900002', 'Should Not Land') $$,
  '42501',
  null,
  'but cannot add a member without the import permission — the hidden button is not the boundary'
);

-- An update is the other half of the same act: re-importing a corrected sheet rewrites rows.
update public.member_roster_entries
   set name = 'Renamed By Officer'
 where employee_id = '900001';

select is(
  (select name from public.member_roster_entries where employee_id = '900001'),
  'Imported Person',
  'and cannot rewrite one either: the update matches no row it is allowed to change'
);

-- ---------------------------------------------------------------------------
-- The admin switches it on, and exactly that changes
-- ---------------------------------------------------------------------------

select set_config(
  'request.jwt.claims',
  '{"sub":"a1111111-1111-1111-1111-111111111111","role":"authenticated"}',
  true
);

update public.cooperative_staff_roles
   set permissions = permissions || '{"can_import_members": true}'::jsonb
 where user_id = 'a2222222-2222-2222-2222-222222222222';

select set_config(
  'request.jwt.claims',
  '{"sub":"a2222222-2222-2222-2222-222222222222","role":"authenticated"}',
  true
);

insert into public.member_roster_entries (cooperative_id, employee_id, name)
values ('c9999999-9999-9999-9999-999999999999', '900002', 'Now Allowed');

select is(
  (select count(*)::int from public.member_roster_entries
    where cooperative_id = 'c9999999-9999-9999-9999-999999999999'),
  2,
  'with the permission granted, the same officer''s import lands'
);

-- Granting import grants import, and nothing adjacent to it. A delete refused by a USING clause
-- removes nothing rather than raising, so the row still being there is the assertion.
delete from public.member_roster_entries where employee_id = '900002';

select is(
  (select count(*)::int from public.member_roster_entries where employee_id = '900002'),
  1,
  'and still cannot delete a roster entry, which stayed an admin-only act'
);

reset role;

select * from finish();

rollback;
