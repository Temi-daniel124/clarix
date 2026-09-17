-- Clarix, migration 015: the naira sign in a decision notification.
--
-- Caught on screen while walking an approval end to end: the member's notification read
-- "approved your loan of 120,000". On a product whose entire subject is money, a figure without
-- its currency is a small dishonesty about what the reader is looking at. Same function, same
-- behaviour, one character where it belongs.

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
        v_cooperative_name || ' approved your loan of ₦' ||
        to_char(v_loan.requested_amount, 'FM999,999,999') || '. ₦' ||
        to_char(v_loan.monthly_repayment, 'FM999,999,999') ||
        ' a month is now being deducted.'
      else
        v_cooperative_name || ' could not approve your loan of ₦' ||
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
