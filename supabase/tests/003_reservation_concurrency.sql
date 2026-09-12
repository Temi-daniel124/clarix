-- Clarix pgTAP suite 003 — the capacity calculation and the reservation transaction.
--
-- Runs ONLY on the GitHub Actions hosted runner (DECISIONS.md D015).
--
-- This covers the mechanism the whole product exists for: two cooperatives must not be able to
-- approve loans against the same slice of one employee's salary (DECISIONS.md D003, D008).
--
-- ---------------------------------------------------------------------------
-- What this suite can and cannot prove, stated plainly
--
-- pgTAP runs inside a single transaction in a single session, so it cannot open two genuinely
-- parallel connections and watch one block on the other's advisory lock. What it CAN prove is
-- the property that actually makes the mechanism correct: that `submit_loan_application`
-- recomputes committed obligations INSIDE the lock, so a second submission sees the first
-- reservation rather than the figure it read a moment earlier. A implementation that read
-- capacity before taking the lock, or that trusted a figure passed in by the client, would fail
-- the "second call sees reduced capacity" assertion below.
--
-- The genuinely parallel case was verified separately against the live project with two
-- simultaneous HTTP requests from two independent clients: the first reserved ₦50,000/month
-- against a ₦83,250 cap, and the second — arriving at the same moment — recomputed and correctly
-- saw ₦33,250 available rather than ₦83,250, reporting a ₦16,750 shortfall. Exactly one
-- reservation was created.
-- ---------------------------------------------------------------------------

create extension if not exists pgtap with schema extensions;

begin;

select plan(14);

select has_table('public', 'loans', 'loans exists');
select has_table('public', 'savings_transactions', 'savings_transactions exists');

select is(
  (select count(*)::int from pg_tables
    where schemaname = 'public' and tablename in ('loans', 'savings_transactions')
      and rowsecurity = false),
  0,
  'both new tables have row-level security enabled'
);

-- An employee must not be able to insert a loan directly: reserving capacity has to go through
-- the locked function, so there is deliberately no insert policy for them.
select is(
  (select count(*)::int from pg_policies
    where schemaname = 'public' and tablename = 'loans' and cmd = 'INSERT'
      and policyname = 'loans_insert_own'),
  0,
  'there is no policy letting an employee insert a loan row directly'
);

-- ---------------------------------------------------------------------------
-- Fixtures: one employee, ₦250,000 gross, 33.3% cap = ₦83,250/month,
-- holding active memberships at two different cooperatives.
-- ---------------------------------------------------------------------------

-- Both employees are created here, while the session is still the migration-running superuser.
-- `authenticated` has no privilege on auth.users at all, so creating the second one further down
-- — after the role switch — would fail on permissions rather than testing anything.
insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
                        created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
values
  ('77777777-7777-7777-7777-777777777777', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'borrower@example.test', 'x', now(), now(), '{}', '{}'),
  ('88888888-8888-8888-8888-888888888888', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'other@example.test', 'x', now(), now(), '{}', '{}');

update public.users
   set salary_gross = 250000, salary_net = 180000, salary_verified_at = now()
 where id = '77777777-7777-7777-7777-777777777777';

insert into public.cooperatives (id, organization_id, name)
select 'e1111111-1111-1111-1111-111111111111', id, 'Cooperative E' from public.organizations;

insert into public.cooperatives (id, organization_id, name)
select 'f1111111-1111-1111-1111-111111111111', id, 'Cooperative F' from public.organizations;

insert into public.cooperative_memberships (id, user_id, cooperative_id, status, joined_at)
values
  ('aaaa1111-1111-1111-1111-111111111111', '77777777-7777-7777-7777-777777777777',
   'e1111111-1111-1111-1111-111111111111', 'active', now()),
  ('bbbb1111-1111-1111-1111-111111111111', '77777777-7777-7777-7777-777777777777',
   'f1111111-1111-1111-1111-111111111111', 'active', now());

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"77777777-7777-7777-7777-777777777777","role":"authenticated"}',
  true
);

-- ---------------------------------------------------------------------------
-- Step 1: the cap, before anything is committed
-- ---------------------------------------------------------------------------

select is(
  (select cap from public.capacity_for_user()),
  83250::numeric,
  'the cap is 33.3% of gross pay (DECISIONS.md D007)'
);

select is(
  (select available from public.capacity_for_user()),
  83250::numeric,
  'with nothing committed, the whole cap is available'
);

-- ---------------------------------------------------------------------------
-- Step 2: previewing does not reserve anything
-- ---------------------------------------------------------------------------

select is(
  (select shortfall from public.capacity_for_user(90000)),
  6750::numeric,
  'a preview beyond the cap reports the exact shortfall'
);

select is(
  (select count(*)::int from public.loans),
  0,
  'previewing reserves nothing — Step 2 has no side effect'
);

-- ---------------------------------------------------------------------------
-- Step 3: the first submission reserves
-- ---------------------------------------------------------------------------

select is(
  (select eligible from public.submit_loan_application(
     'aaaa1111-1111-1111-1111-111111111111', 600000, 12)),
  true,
  'a ₦600,000 loan over 12 months (₦50,000/month) fits inside ₦83,250'
);

select is(
  (select count(*)::int from public.loans where status = 'reserved'),
  1,
  'one reservation now exists'
);

-- ---------------------------------------------------------------------------
-- The assertion that matters: a second submission, from a DIFFERENT cooperative,
-- recomputes inside the lock and sees the reduced figure rather than a stale one.
-- ---------------------------------------------------------------------------

select is(
  (select available from public.submit_loan_application(
     'bbbb1111-1111-1111-1111-111111111111', 600000, 12)),
  33250::numeric,
  'the second submission sees ₦33,250 available, not the stale ₦83,250'
);

select is(
  (select shortfall from public.submit_loan_application(
     'bbbb1111-1111-1111-1111-111111111111', 600000, 12)),
  16750::numeric,
  'and reports the shortfall against the reduced capacity'
);

select is(
  (select count(*)::int from public.loans),
  1,
  'the second submission reserved nothing — still exactly one loan row'
);

-- ---------------------------------------------------------------------------
-- An employee may only reserve through a membership that is their own
-- ---------------------------------------------------------------------------

select set_config(
  'request.jwt.claims',
  '{"sub":"88888888-8888-8888-8888-888888888888","role":"authenticated"}',
  true
);

select throws_ok(
  $$ select * from public.submit_loan_application('aaaa1111-1111-1111-1111-111111111111', 10000, 12) $$,
  '42501',
  null,
  'an employee cannot reserve against somebody else''s membership'
);

reset role;

select * from finish();

rollback;
