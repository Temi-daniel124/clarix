-- Clarix pgTAP suite 002 — payslip privacy.
--
-- Runs ONLY on the GitHub Actions hosted runner (DECISIONS.md D015).
--
-- A payslip carries a named individual's salary and their IPPIS number, which makes it the most
-- sensitive artefact in the product. SECURITY.md scopes it to the uploading employee and nobody
-- else — not cooperative staff of a cooperative that employee belongs to, and not Super Admin.
-- This suite is what stops that narrowing from being quietly widened later.

create extension if not exists pgtap with schema extensions;

begin;

select plan(9);

select has_table('public', 'documents', 'documents exists');

select is(
  (select count(*)::int from pg_tables
    where schemaname = 'public' and tablename = 'documents' and rowsecurity = false),
  0,
  'documents has row-level security enabled'
);

select is(
  (select (public::boolean)::int from storage.buckets where id = 'payslips'),
  0,
  'the payslips bucket is private, so there is no guessable URL'
);

-- ---------------------------------------------------------------------------
-- Fixtures: an employee with a payslip, and an officer at the cooperative they belong to
-- ---------------------------------------------------------------------------

insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
                        created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
values
  ('44444444-4444-4444-4444-444444444444', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'member@example.test', 'x', now(), now(), '{}', '{}'),
  ('55555555-5555-5555-5555-555555555555', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'officer@example.test', 'x', now(), now(), '{}', '{}'),
  ('66666666-6666-6666-6666-666666666666', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'stranger@example.test', 'x', now(), now(), '{}', '{}');

insert into public.cooperatives (id, organization_id, name)
select 'cccccccc-cccc-cccc-cccc-cccccccccccc', id, 'Cooperative C' from public.organizations;

insert into public.cooperative_memberships (user_id, cooperative_id, status)
values ('44444444-4444-4444-4444-444444444444', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'active');

-- Permitted to see members (migration 016 made that an explicit, default-deny flag). This suite
-- is about whether an officer who CAN see a member can also reach their payslip — the answer must
-- be no — so the officer has to be able to see the member for the test to be about anything.
insert into public.cooperative_staff_roles (user_id, cooperative_id, role, status, permissions)
values ('55555555-5555-5555-5555-555555555555', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'officer',
        'active', '{"can_view_members": true}'::jsonb);

insert into public.documents (id, user_id, type, storage_path, original_filename)
values (
  'dddddddd-dddd-dddd-dddd-dddddddddddd',
  '44444444-4444-4444-4444-444444444444',
  'payslip',
  '44444444-4444-4444-4444-444444444444/payslip.pdf',
  'payslip.pdf'
);

-- ---------------------------------------------------------------------------
-- The employee sees their own payslip
-- ---------------------------------------------------------------------------

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"44444444-4444-4444-4444-444444444444","role":"authenticated"}',
  true
);

select is(
  (select count(*)::int from public.documents),
  1,
  'an employee can read their own payslip'
);

-- ---------------------------------------------------------------------------
-- An officer at that employee's OWN cooperative cannot
-- ---------------------------------------------------------------------------

select set_config(
  'request.jwt.claims',
  '{"sub":"55555555-5555-5555-5555-555555555555","role":"authenticated"}',
  true
);

select is(
  (select count(*)::int from public.documents),
  0,
  'an officer cannot read the payslip of a member of their own cooperative'
);

-- The officer can still see that member's row, which is the point: the eligibility figures they
-- are entitled to live on `users`, and the document itself stays out of reach.
select is(
  (select count(*)::int from public.users where id = '44444444-4444-4444-4444-444444444444'),
  1,
  'the officer can still see the member record the eligibility figures live on'
);

-- ---------------------------------------------------------------------------
-- An unrelated employee cannot, and cannot write into someone else's row either
-- ---------------------------------------------------------------------------

select set_config(
  'request.jwt.claims',
  '{"sub":"66666666-6666-6666-6666-666666666666","role":"authenticated"}',
  true
);

select is(
  (select count(*)::int from public.documents),
  0,
  'an unrelated employee sees no payslips at all'
);

update public.documents
   set review_status = 'confirmed'
 where id = 'dddddddd-dddd-dddd-dddd-dddddddddddd';

reset role;

select is(
  (select review_status::text from public.documents
    where id = 'dddddddd-dddd-dddd-dddd-dddddddddddd'),
  'pending_review',
  'an unrelated employee cannot write to someone else''s payslip record'
);

-- ---------------------------------------------------------------------------
-- The unauthenticated role reaches nothing
-- ---------------------------------------------------------------------------

set local role anon;

select throws_ok(
  'select count(*) from public.documents',
  '42501',
  null,
  'anon has no privilege on payslip records'
);

reset role;

select * from finish();

rollback;
