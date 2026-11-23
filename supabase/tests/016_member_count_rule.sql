-- Clarix pgTAP suite 016, one member count everywhere (BUILD-PLAN 0.5, rule 1).
--
-- Runs ONLY on the GitHub Actions hosted runner (DECISIONS.md D015).
--
-- Members = active memberships + roster entries not yet on Clarix. The cooperative's own screens
-- compute it in the app (src/lib/home-figures.ts, unit-tested); the Platform reads it from
-- platform_cooperative_directory(), which is what this suite pins down: member_count counts only
-- active memberships, and roster_not_on_clarix_count counts only roster entries nobody has
-- claimed, so the two add up to the cooperative's own figure.

create extension if not exists pgtap with schema extensions;

begin;

select plan(5);

insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
                        created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
values
  ('e0160001-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'operator16@example.test', 'x', now(), now(), '{}', '{}'),
  ('e0160001-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'active16a@example.test', 'x', now(), now(), '{}', '{}'),
  ('e0160001-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'active16b@example.test', 'x', now(), now(), '{}', '{}'),
  ('e0160001-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'pending16@example.test', 'x', now(), now(), '{}', '{}'),
  ('e0160001-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'suspended16@example.test', 'x', now(), now(), '{}', '{}');

insert into public.platform_admins (user_id) values ('e0160001-0000-0000-0000-000000000001');

insert into public.cooperatives (id, organization_id, name, status)
select 'c0160001-0000-0000-0000-000000000001', id, 'Counting Cooperative', 'active'
  from public.organizations;

-- Two active members, one asking to join, one suspended.
insert into public.cooperative_memberships (id, user_id, cooperative_id, status, joined_at)
values
  ('b0160001-0000-0000-0000-000000000002', 'e0160001-0000-0000-0000-000000000002',
   'c0160001-0000-0000-0000-000000000001', 'active', now()),
  ('b0160001-0000-0000-0000-000000000003', 'e0160001-0000-0000-0000-000000000003',
   'c0160001-0000-0000-0000-000000000001', 'active', now()),
  ('b0160001-0000-0000-0000-000000000004', 'e0160001-0000-0000-0000-000000000004',
   'c0160001-0000-0000-0000-000000000001', 'pending', null),
  ('b0160001-0000-0000-0000-000000000005', 'e0160001-0000-0000-0000-000000000005',
   'c0160001-0000-0000-0000-000000000001', 'suspended', now());

-- Three roster entries nobody has claimed, and one already linked to an active member.
insert into public.member_roster_entries (cooperative_id, employee_id, name, membership_id)
values
  ('c0160001-0000-0000-0000-000000000001', 'R16-001', 'Roster One', null),
  ('c0160001-0000-0000-0000-000000000001', 'R16-002', 'Roster Two', null),
  ('c0160001-0000-0000-0000-000000000001', 'R16-003', 'Roster Three', null),
  ('c0160001-0000-0000-0000-000000000001', 'R16-004', 'Already Joined', 'b0160001-0000-0000-0000-000000000002');

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"e0160001-0000-0000-0000-000000000001","role":"authenticated"}', true);

select has_function('public', 'platform_cooperative_directory', 'platform_cooperative_directory() exists');

select is(
  (select member_count from public.platform_cooperative_directory()
    where id = 'c0160001-0000-0000-0000-000000000001'),
  2,
  'member_count counts active memberships only: not the pending application, not the suspended one'
);

select is(
  (select roster_not_on_clarix_count from public.platform_cooperative_directory()
    where id = 'c0160001-0000-0000-0000-000000000001'),
  3,
  'roster_not_on_clarix_count counts roster entries nobody has claimed, not the one already linked'
);

select is(
  (select member_count + roster_not_on_clarix_count from public.platform_cooperative_directory()
    where id = 'c0160001-0000-0000-0000-000000000001'),
  5,
  'so the Platform reads "5 members, 2 on Clarix", the same figure the cooperative''s own screens show'
);

-- The roster stays the cooperative's own: the operator gets the number, never the rows.
select is(
  (select count(*)::int from public.member_roster_entries
    where cooperative_id = 'c0160001-0000-0000-0000-000000000001'),
  0,
  'and still cannot read a single roster entry'
);

reset role;

select * from finish();

rollback;
