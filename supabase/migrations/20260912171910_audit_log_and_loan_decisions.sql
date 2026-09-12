-- Clarix — migration 014: the audit log, and the first loan transition past `reserved`.
--
-- ---------------------------------------------------------------------------
-- Why the audit log is being built now rather than deferred
--
-- `docs/DATA-MODEL.md` has specified `audit_log` since the beginning and nothing had migrated it,
-- which was fine while nothing made a decision worth reviewing. Part 6 changes that. Blueprint
-- 6.2 requires a note when an admin approves over a flagged capacity shortfall, "since approving
-- over a flagged shortfall is exactly the kind of decision the audit log exists to make
-- reviewable later" — so the note field and the log are one feature, and building the field
-- without the log would mean asking somebody to justify a decision and then dropping what they
-- wrote on the floor. That is the one outcome worth ruling out.
--
-- Scoped to what Part 6 needs: actor, action, target, old and new value, and the note. Reading
-- it back — the Cooperative Audit Log screen (8.3) — stays deferred, because recording a
-- decision is urgent and reading the record is not.
--
-- One addition to the shape in DATA-MODEL.md: `cooperative_id`. Without it there is nothing to
-- scope an RLS policy on, and this table will eventually hold entries about members' money. The
-- column is what lets 8.3 be a cooperative's own log rather than everybody's.
--
-- ---------------------------------------------------------------------------
-- Why the decision is one function
--
-- Approving a loan is four writes that must not come apart: the loan's status, the audit entry,
-- the notification to the member, and — for an approval over the cap — the reason. Two of those
-- tables deliberately have no insert policy at all (`notifications` per D025, and `audit_log`
-- below), because neither is something a client should be able to write directly. A single
-- SECURITY DEFINER function is what makes the set atomic and keeps those tables closed.

create table public.audit_log (
  id uuid primary key default gen_random_uuid(),

  actor_user_id uuid references public.users (id) on delete set null,
  cooperative_id uuid references public.cooperatives (id) on delete cascade,

  -- Free text rather than an enum: the set of auditable actions grows with every screen, and a
  -- migration per new verb would be friction against recording MORE rather than less.
  action text not null check (length(trim(action)) > 0),

  target_table text not null,
  target_id uuid,

  old_value jsonb,
  new_value jsonb,

  -- The reason an admin gave, where a screen required one. Blueprint 6.2's over-cap approval is
  -- the first, and this is where what they wrote actually lands.
  note text,

  created_at timestamptz not null default now()
);

create index audit_log_cooperative_created_idx
  on public.audit_log (cooperative_id, created_at desc);

comment on table public.audit_log is
  'Append-only record of decisions worth reviewing later (docs/DATA-MODEL.md). Written only by SECURITY DEFINER functions — there is deliberately no insert, update or delete policy.';

alter table public.audit_log enable row level security;

-- A cooperative's own staff may read their own cooperative's entries, which is what the Audit Log
-- screen (8.3) will need. Nothing may write through the API: no insert policy, no update policy,
-- no delete policy. Append-only means append-only, including for the people it is about.
create policy audit_log_select_staff
  on public.audit_log for select to authenticated
  using (public.is_active_staff(cooperative_id));

grant select on public.audit_log to authenticated;
revoke all on public.audit_log from anon;

-- ---------------------------------------------------------------------------
-- decide_loan_application() — approve or reject, and record what that meant
--
-- SECURITY.md, "Elevated database privileges". It writes to `notifications` and `audit_log`,
-- neither of which accepts a client write by design, and it reads the member's cross-cooperative
-- committed total to decide whether this is an over-cap approval — the same D003 exception the
-- capacity functions already carry.
--
-- What keeps it narrow: it refuses unless the caller is active staff at THIS loan's cooperative
-- and either an admin or an officer whose permissions include approving loans; it acts only on a
-- loan that is still `reserved`; it returns a verdict and figures, never another cooperative's
-- rows; and it refuses an over-cap approval that arrives without a reason, so the note the
-- screen asks for is enforced by the database rather than by the form.
-- ---------------------------------------------------------------------------

create or replace function public.decide_loan_application(
  target_loan_id uuid,
  decision text,
  note text default null
)
returns table (
  status text,
  was_over_cap boolean,
  monthly_repayment numeric,
  available_before numeric
)
language plpgsql
security definer
set search_path = public, pg_temp
as $fn$
declare
  v_caller uuid := auth.uid();
  v_loan public.loans;
  v_membership public.cooperative_memberships;
  v_member_name text;
  v_cooperative_name text;
  v_cap numeric;
  v_committed numeric;
  v_available_before numeric;
  v_over boolean;
  v_can_approve boolean;
  v_note text := nullif(trim(coalesce(note, '')), '');
  v_new_status public.loan_status;
begin
  if v_caller is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  if decision not in ('approve', 'reject') then
    raise exception 'A decision is either approve or reject' using errcode = '22023';
  end if;

  select * into v_loan from public.loans where id = target_loan_id;
  if not found then
    raise exception 'No such loan' using errcode = '42501';
  end if;

  select * into v_membership
    from public.cooperative_memberships where id = v_loan.membership_id;

  if not public.is_active_staff(v_membership.cooperative_id) then
    raise exception 'Only this cooperative''s staff may decide this application'
      using errcode = '42501';
  end if;

  -- An officer decides loans only if their permissions say so; an admin always may. This is the
  -- one place the permission preset from blueprint 2.5 actually bites.
  select bool_or(
           r.role = 'admin'
           or coalesce((r.permissions ->> 'can_approve_loans')::boolean, false)
         )
    into v_can_approve
    from public.cooperative_staff_roles r
   where r.user_id = v_caller
     and r.cooperative_id = v_membership.cooperative_id
     and r.status = 'active';

  if not coalesce(v_can_approve, false) then
    raise exception 'This account may record and submit, but not decide loans'
      using errcode = '42501';
  end if;

  if v_loan.status <> 'reserved' then
    raise exception 'This application has already been decided' using errcode = '22023';
  end if;

  -- What the member could carry WITHOUT this application, which is the figure the reservation is
  -- measured against. The loan is already counted in `committed` because it is reserved, so it
  -- is taken back out here rather than double-counted.
  select c.cap, c.committed into v_cap, v_committed
    from public.capacity_core(v_membership.user_id) c;

  v_available_before := round(greatest(v_cap - (v_committed - v_loan.monthly_repayment), 0), 2);
  v_over := v_loan.monthly_repayment > v_available_before;

  if decision = 'approve' and v_over and v_note is null then
    raise exception 'Approving beyond the member''s available capacity requires a reason'
      using errcode = '22023';
  end if;

  v_new_status := case decision when 'approve' then 'active' else 'rejected' end;

  update public.loans
     set status = v_new_status,
         approved_at = case when decision = 'approve' then now() else approved_at end,
         approved_by = case when decision = 'approve' then v_caller else approved_by end,
         rejected_at = case when decision = 'reject' then now() else rejected_at end,
         -- Rejecting releases the hold immediately: a rejected loan counts towards nothing, so
         -- the member's capacity is free again the moment this commits.
         reservation_expires_at = case when decision = 'reject' then null else reservation_expires_at end
   where id = target_loan_id;

  select u.name into v_member_name from public.users u where u.id = v_membership.user_id;
  select c.name into v_cooperative_name
    from public.cooperatives c where c.id = v_membership.cooperative_id;

  -- The first real writer for `notifications`, which has sat honestly empty since D025 precisely
  -- because nothing had yet made a decision worth telling somebody about.
  insert into public.notifications (user_id, category, message, target_url)
  values (
    v_membership.user_id,
    'loan_decision',
    case decision
      when 'approve' then
        v_cooperative_name || ' approved your loan of ' ||
        to_char(v_loan.requested_amount, 'FM999,999,999') || '. ' ||
        to_char(v_loan.monthly_repayment, 'FM999,999,999') ||
        ' a month is now being deducted.'
      else
        v_cooperative_name || ' could not approve your loan of ' ||
        to_char(v_loan.requested_amount, 'FM999,999,999') ||
        '. The hold on your capacity has been released.'
    end,
    '/loans/' || target_loan_id::text
  );

  insert into public.audit_log (
    actor_user_id, cooperative_id, action, target_table, target_id, old_value, new_value, note
  )
  values (
    v_caller,
    v_membership.cooperative_id,
    case decision when 'approve' then 'approve_loan' else 'reject_loan' end,
    'loans',
    target_loan_id,
    jsonb_build_object('status', 'reserved'),
    jsonb_build_object(
      'status', v_new_status,
      'monthly_repayment', v_loan.monthly_repayment,
      'available_before', v_available_before,
      'over_cap', v_over
    ),
    v_note
  );

  return query select v_new_status::text, v_over, v_loan.monthly_repayment, v_available_before;
end;
$fn$;

revoke execute on function public.decide_loan_application(uuid, text, text) from public, anon;
grant execute on function public.decide_loan_application(uuid, text, text) to authenticated;
