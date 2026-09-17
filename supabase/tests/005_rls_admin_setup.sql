-- Clarix pgTAP suite 005, staff invitations and the imported member roster.
--
-- Runs ONLY on the GitHub Actions hosted runner (DECISIONS.md D015).
--
-- Two new tables, both carrying things that must not travel: an invitation says who a
-- cooperative is bringing in, and a roster entry carries another member's IPPIS number and
-- savings balance. The functions around them are SECURITY DEFINER (D027, D028, SECURITY.md), so
-- this suite exists to pin down what they refuse as much as what they do.

create extension if not exists pgtap with schema extensions;

begin;

select plan(12);

select has_table('public', 'staff_invitations', 'staff_invitations exists');
select has_table('public', 'member_roster_entries', 'member_roster_entries exists');

select is(
  (select count(*)::int from pg_tables
    where schemaname = 'public'
      and tablename in ('staff_invitations', 'member_roster_entries')
      and rowsecurity = false),
  0,
  'both new tables have row-level security enabled'
);

-- Writing an invitation goes through invite_cooperative_staff(), which is what checks the caller
-- is this cooperative's admin. A direct insert policy would bypass that check entirely.
select is(
  (select count(*)::int from pg_policies
    where schemaname = 'public' and tablename = 'staff_invitations' and cmd in ('INSERT', 'UPDATE')),
  0,
  'staff_invitations has no insert or update policy: writes go through the function'
);

-- ---------------------------------------------------------------------------
-- Fixtures: two cooperatives, an admin of the first, an outsider, and a member who has an
-- account but has not joined anything yet.
-- ---------------------------------------------------------------------------

insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
                        created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
values
  ('b1111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'coopadmin@example.test', 'x', now(), now(), '{}', '{}'),
  ('b2222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'outsider@example.test', 'x', now(), now(), '{}', '{}'),
  ('b3333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'joiner@example.test', 'x', now(), now(), '{}', '{}');

insert into public.cooperatives (id, organization_id, name)
select 'c1111111-1111-1111-1111-111111111111', id, 'Cooperative One' from public.organizations;

insert into public.cooperatives (id, organization_id, name)
select 'c2222222-2222-2222-2222-222222222222', id, 'Cooperative Two' from public.organizations;

insert into public.cooperative_staff_roles (user_id, cooperative_id, role, status)
values ('b1111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111',
        'admin', 'active');

-- The joiner's IPPIS number is what the roster will be waiting for.
update public.users set employee_id = '204901'
 where id = 'b3333333-3333-3333-3333-333333333333';

insert into public.member_roster_entries (cooperative_id, employee_id, name, savings_balance)
values ('c1111111-1111-1111-1111-111111111111', '204901', 'Imported Member', 90000);

-- ---------------------------------------------------------------------------
-- The admin can invite; an outsider cannot
-- ---------------------------------------------------------------------------

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"b1111111-1111-1111-1111-111111111111","role":"authenticated"}',
  true
);

select is(
  (select had_account from public.invite_cooperative_staff(
     'c1111111-1111-1111-1111-111111111111', 'newcomer@example.test')),
  false,
  'inviting an address with no Clarix account records an invitation rather than a role'
);

select is(
  (select count(*)::int from public.staff_invitations where email = 'newcomer@example.test'),
  1,
  'the invitation is stored against the email address'
);

-- Inviting somebody who does have an account skips the invitations table entirely and writes the
-- real thing, at 'invited'.
select is(
  (select had_account from public.invite_cooperative_staff(
     'c1111111-1111-1111-1111-111111111111', 'outsider@example.test')),
  true,
  'inviting an existing account writes a staff role directly'
);

select is(
  (select status::text from public.cooperative_staff_roles
    where user_id = 'b2222222-2222-2222-2222-222222222222'),
  'invited',
  'and that role starts as an invitation, not as access'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"b2222222-2222-2222-2222-222222222222","role":"authenticated"}',
  true
);

-- The outsider now holds an INVITED role at Cooperative One, which is not access to anything,
-- and they are nothing at all at Cooperative Two.
select throws_ok(
  $$ select * from public.invite_cooperative_staff('c2222222-2222-2222-2222-222222222222', 'anyone@example.test') $$,
  '42501',
  null,
  'somebody who is not a cooperative''s admin cannot invite staff to it'
);

select is(
  (select count(*)::int from public.member_roster_entries),
  0,
  'an unrelated account cannot read a cooperative''s imported roster'
);

-- ---------------------------------------------------------------------------
-- Joining a cooperative that already imported you
-- ---------------------------------------------------------------------------

select set_config(
  'request.jwt.claims',
  '{"sub":"b3333333-3333-3333-3333-333333333333","role":"authenticated"}',
  true
);

insert into public.cooperative_memberships (user_id, cooperative_id, status)
values ('b3333333-3333-3333-3333-333333333333', 'c1111111-1111-1111-1111-111111111111', 'pending');

-- The employee asked to join as 'pending' and the trigger recognised them from the roster, so
-- they are a member from the start, carrying the balance the cooperative had already recorded.
select results_eq(
  $$ select status::text, savings_balance from public.cooperative_memberships
      where user_id = 'b3333333-3333-3333-3333-333333333333' $$,
  $$ values ('active', 90000.00::numeric) $$,
  'joining a cooperative that imported you activates the membership and carries the balance'
);

reset role;

select is(
  (select count(*)::int from public.member_roster_entries
    where employee_id = '204901' and membership_id is not null),
  1,
  'and the roster entry is linked to the membership it became'
);

select * from finish();

rollback;
