-- Clarix pgTAP suite 007 — deciding a loan application.
--
-- Runs ONLY on the GitHub Actions hosted runner (DECISIONS.md D015).
--
-- The first transition past `reserved`, and the first writer for `notifications` and
-- `audit_log`. Three things need pinning down: who may decide, what a decision does to the
-- member's capacity, and that an over-cap approval cannot happen without a recorded reason.

create extension if not exists pgtap with schema extensions;

begin;

select plan(19);

select has_table('public', 'audit_log', 'audit_log exists');

select is(
  (select count(*)::int from pg_tables
    where schemaname = 'public' and tablename = 'audit_log' and rowsecurity = false),
  0,
  'audit_log has row-level security enabled'
);

-- Append-only means no client write path at all, for anybody.
select is(
  (select count(*)::int from pg_policies
    where schemaname = 'public' and tablename = 'audit_log'
      and cmd in ('INSERT', 'UPDATE', 'DELETE')),
  0,
  'audit_log has no insert, update or delete policy: only SECURITY DEFINER functions write to it'
);

-- ---------------------------------------------------------------------------
-- Fixtures: a cooperative with an admin and a record-only officer, a member on 250,000 gross
-- (a cap of 83,250), and a reserved application for 50,000 a month.
-- ---------------------------------------------------------------------------

insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
                        created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
values
  ('a1111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'decider@example.test', 'x', now(), now(), '{}', '{}'),
  ('a2222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'recorder@example.test', 'x', now(), now(), '{}', '{}'),
  ('a3333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'borrower6@example.test', 'x', now(), now(), '{}', '{}');

update public.users
   set salary_gross = 250000, salary_net = 180000, salary_verified_at = now()
 where id = 'a3333333-3333-3333-3333-333333333333';

insert into public.cooperatives (id, organization_id, name)
select 'c6666666-6666-6666-6666-666666666666', id, 'Deciding Cooperative'
  from public.organizations;

insert into public.cooperative_staff_roles (user_id, cooperative_id, role, status, permissions)
values
  ('a1111111-1111-1111-1111-111111111111', 'c6666666-6666-6666-6666-666666666666',
   'admin', 'active', '{}'::jsonb),
  ('a2222222-2222-2222-2222-222222222222', 'c6666666-6666-6666-6666-666666666666',
   'officer', 'active', '{"can_approve_loans": false}'::jsonb);

insert into public.cooperative_memberships (id, user_id, cooperative_id, status, joined_at)
values ('b6666666-6666-6666-6666-666666666666', 'a3333333-3333-3333-3333-333333333333',
        'c6666666-6666-6666-6666-666666666666', 'active', now());

insert into public.loans (id, membership_id, requested_amount, monthly_repayment, tenure_months,
                          status, reserved_at, reservation_expires_at)
values ('d6666666-6666-6666-6666-666666666666', 'b6666666-6666-6666-6666-666666666666',
        600000, 50000, 12, 'reserved', now(), now() + interval '7 days');

-- ---------------------------------------------------------------------------
-- Who may decide
-- ---------------------------------------------------------------------------

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"a2222222-2222-2222-2222-222222222222","role":"authenticated"}',
  true
);

select throws_ok(
  $$ select * from public.decide_loan_application('d6666666-6666-6666-6666-666666666666', 'approve') $$,
  '42501',
  null,
  'an officer without the approve permission cannot decide a loan'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"a3333333-3333-3333-3333-333333333333","role":"authenticated"}',
  true
);

select throws_ok(
  $$ select * from public.decide_loan_application('d6666666-6666-6666-6666-666666666666', 'approve') $$,
  '42501',
  null,
  'the member cannot approve their own application'
);

-- ---------------------------------------------------------------------------
-- Approving
-- ---------------------------------------------------------------------------

select set_config(
  'request.jwt.claims',
  '{"sub":"a1111111-1111-1111-1111-111111111111","role":"authenticated"}',
  true
);

select is(
  (select status from public.decide_loan_application(
     'd6666666-6666-6666-6666-666666666666', 'approve')),
  'active',
  'an admin approves a reservation into an active loan'
);

select is(
  (select status::text from public.loans where id = 'd6666666-6666-6666-6666-666666666666'),
  'active',
  'and the loan itself carries that status'
);

-- Capacity is unchanged by approval: the reservation already counted, and now the active loan
-- does. That is the point of reserving in the first place.
select is(
  (select available from public.capacity_for_membership('b6666666-6666-6666-6666-666666666666')),
  33250::numeric,
  'approving changes nothing about the member''s available capacity'
);

-- Asserted from the MEMBER's own session, because `notifications_select_own` deliberately hides
-- the row from everyone else — including the admin who caused it. Checking it as the admin
-- returned zero on the first CI run, which was the policy working rather than the write failing.
select set_config(
  'request.jwt.claims',
  '{"sub":"a3333333-3333-3333-3333-333333333333","role":"authenticated"}',
  true
);

select is(
  (select count(*)::int from public.notifications where category = 'loan_decision'),
  1,
  'the member is told, which is the first row anything has ever written to notifications'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"a1111111-1111-1111-1111-111111111111","role":"authenticated"}',
  true
);

select is(
  (select action from public.audit_log where target_id = 'd6666666-6666-6666-6666-666666666666'),
  'approve_loan',
  'and the decision is recorded in the audit log'
);

select throws_ok(
  $$ select * from public.decide_loan_application('d6666666-6666-6666-6666-666666666666', 'reject') $$,
  '22023',
  null,
  'a loan already decided cannot be decided again'
);

-- ---------------------------------------------------------------------------
-- Rejecting releases the hold immediately
-- ---------------------------------------------------------------------------

insert into public.loans (id, membership_id, requested_amount, monthly_repayment, tenure_months,
                          status, reserved_at, reservation_expires_at)
values ('d7777777-7777-7777-7777-777777777777', 'b6666666-6666-6666-6666-666666666666',
        120000, 10000, 12, 'reserved', now(), now() + interval '7 days');

select is(
  (select available from public.capacity_for_membership('b6666666-6666-6666-6666-666666666666')),
  23250::numeric,
  'a second reservation holds capacity while it waits'
);

select is(
  (select status from public.decide_loan_application(
     'd7777777-7777-7777-7777-777777777777', 'reject')),
  'rejected',
  'rejecting records the decision'
);

select is(
  (select available from public.capacity_for_membership('b6666666-6666-6666-6666-666666666666')),
  33250::numeric,
  'and releases that capacity immediately, freeing it for their other requests'
);

-- ---------------------------------------------------------------------------
-- An over-cap approval needs a reason, and the reason is kept
-- ---------------------------------------------------------------------------

insert into public.loans (id, membership_id, requested_amount, monthly_repayment, tenure_months,
                          status, reserved_at, reservation_expires_at)
values ('d8888888-8888-8888-8888-888888888888', 'b6666666-6666-6666-6666-666666666666',
        960000, 80000, 12, 'reserved', now(), now() + interval '7 days');

select throws_ok(
  $$ select * from public.decide_loan_application('d8888888-8888-8888-8888-888888888888', 'approve') $$,
  '22023',
  null,
  'approving beyond the member''s available capacity is refused without a reason'
);

select is(
  (select status from public.decide_loan_application(
     'd8888888-8888-8888-8888-888888888888', 'approve', 'Committee approved on 12 September.')),
  'active',
  'with a reason recorded, the cooperative''s own call goes through — Clarix informs, it does not gatekeep'
);

select is(
  (select note from public.audit_log
    where target_id = 'd8888888-8888-8888-8888-888888888888' and action = 'approve_loan'),
  'Committee approved on 12 September.',
  'and the reason is what lands in the audit log, which is the point of asking for it'
);

-- ---------------------------------------------------------------------------
-- The Cooperative Audit Log screen (blueprint 8.3) reads this table directly, so what it can
-- reach is worth pinning down as carefully as what writes to it.
-- ---------------------------------------------------------------------------

select is(
  (select count(*)::int from public.audit_log),
  3,
  'a cooperative''s own admin reads their own cooperative''s entries'
);

-- The member the entries are ABOUT is not staff, and the log is a staff record.
select set_config(
  'request.jwt.claims',
  '{"sub":"a3333333-3333-3333-3333-333333333333","role":"authenticated"}',
  true
);

select is(
  (select count(*)::int from public.audit_log),
  0,
  'and nobody outside that cooperative''s staff reads any of it, including the member concerned'
);

reset role;

select * from finish();

rollback;
