-- Clarix pgTAP suite 002, payslip privacy.
--
-- Runs ONLY on the GitHub Actions hosted runner (DECISIONS.md D015).
--
-- A payslip carries a named individual's salary and their IPPIS number, which makes it the most
-- sensitive artefact in the product. It belongs to the employee who uploaded it.
--
-- There is exactly one exception, added deliberately in DECISIONS.md D031: while a member has an
-- application awaiting decision, staff of that cooperative who can decide it may open the payslip
-- the salary figure came from, because that figure is self-reported and was until then
-- uncheckable. This suite pins the exception as tightly as it pins the rule, which means asserting
-- all four of its edges:
--
--   * the power to decide loans alone opens nothing, without an application waiting,
--   * a reviewer with both can open it, and can only read it,
--   * an officer who may see members but not decide loans still cannot, and
--   * the same reviewer cannot once the application is decided.
--
-- That a platform operator never can, at any point, is checked live against the project rather
-- than here: this suite has no platform-admin fixture, and adding one to assert a negative that
-- `payslip_under_review()` cannot express for them would be testing the fixture.
--
-- Widening the old assertion would have tested that the door opens. What matters is the shape of
-- the doorway.

create extension if not exists pgtap with schema extensions;

begin;

select plan(14);

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
-- is about whether an officer who CAN see a member can also reach their payslip: the answer must
-- be no, so the officer has to be able to see the member for the test to be about anything.
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
-- The D031 exception, and its four edges
-- ---------------------------------------------------------------------------

reset role;

-- The officer gains the power to decide loans. On its own that changes nothing, because there is
-- no application to decide.
update public.cooperative_staff_roles
   set permissions = '{"can_view_members": true, "can_approve_loans": true}'::jsonb
 where user_id = '55555555-5555-5555-5555-555555555555';

-- The payslip has to be the salary evidence for the exception to apply at all.
update public.users
   set salary_source_doc_id = 'dddddddd-dddd-dddd-dddd-dddddddddddd'
 where id = '44444444-4444-4444-4444-444444444444';

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"55555555-5555-5555-5555-555555555555","role":"authenticated"}',
  true
);

select is(
  (select count(*)::int from public.documents),
  0,
  'the power to decide loans alone opens nothing: there has to be an application waiting'
);

-- Now there is one.
reset role;

insert into public.loans (id, membership_id, requested_amount, monthly_repayment, tenure_months,
                          status, reserved_at, reservation_expires_at)
select 'aaaaaaaa-cccc-cccc-cccc-cccccccccccc', m.id, 120000, 10000, 12,
       'reserved', now(), now() + interval '7 days'
  from public.cooperative_memberships m
 where m.user_id = '44444444-4444-4444-4444-444444444444'
   and m.cooperative_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc'
 limit 1;

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"55555555-5555-5555-5555-555555555555","role":"authenticated"}',
  true
);

select is(
  (select count(*)::int from public.documents),
  1,
  'with an application waiting, the reviewer can open the payslip the salary figure came from'
);

-- Reading is all it is. The member''s document is not the reviewer''s to change.
update public.documents
   set review_status = 'corrected'
 where id = 'dddddddd-dddd-dddd-dddd-dddddddddddd';

select is(
  (select review_status::text from public.documents
    where id = 'dddddddd-dddd-dddd-dddd-dddddddddddd'),
  'pending_review',
  'and can only read it: there is no write path for a reviewer, only a window to look'
);

-- An officer who may see members but not decide loans is back outside, which is the assertion
-- this suite started life making and which D031 deliberately left true.
reset role;

update public.cooperative_staff_roles
   set permissions = '{"can_view_members": true}'::jsonb
 where user_id = '55555555-5555-5555-5555-555555555555';

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"55555555-5555-5555-5555-555555555555","role":"authenticated"}',
  true
);

select is(
  (select count(*)::int from public.documents),
  0,
  'an officer who may see members but not decide loans still cannot, application or not'
);

-- And once the application is decided, the window closes with nothing having run.
reset role;

update public.cooperative_staff_roles
   set permissions = '{"can_view_members": true, "can_approve_loans": true}'::jsonb
 where user_id = '55555555-5555-5555-5555-555555555555';

update public.loans set status = 'rejected'
 where id = 'aaaaaaaa-cccc-cccc-cccc-cccccccccccc';

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"55555555-5555-5555-5555-555555555555","role":"authenticated"}',
  true
);

select is(
  (select count(*)::int from public.documents),
  0,
  'and the moment the application is decided the payslip is the member''s alone again'
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
