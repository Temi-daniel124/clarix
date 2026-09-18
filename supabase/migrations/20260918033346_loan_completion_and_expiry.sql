-- Clarix, migration 029: the two ends of the loan lifecycle nothing owned.
--
-- `loan_status` has carried 'completed' and 'expired' since migration 006, and until now nothing
-- could write either. A loan approved in 2025 is still 'active' after its last repayment, and a
-- reservation nobody decided is still 'reserved' months after its hold lapsed.
--
-- Only one of those two is an arithmetic problem, and it is worth being precise about which:
--
--   * A lapsed reservation already stops counting against capacity. `capacity_core()` counts a
--     reserved loan only while `reservation_expires_at > now()` (D024, expiry evaluated at read
--     time), so the member's limit has been correct all along. What is wrong is the record: the
--     applications queue shows a request as waiting when nobody can act on it any more.
--
--   * A repaid loan is different. An 'active' loan counts against capacity forever, because
--     nothing ever moves it on. A member who finished repaying a ₦600,000 loan two years ago is
--     still, as far as Clarix is concerned, committed to ₦27,500 a month. That is a real and
--     growing overstatement of what every cooperative sees.
--
-- So completion is the one that matters to the numbers, and expiry is the one that matters to the
-- record. Both get an explicit, audited transition here rather than a background job: this project
-- has no scheduler, and a sweep that runs on a timer nobody watches is a worse answer than one an
-- admin performs and the audit log remembers.

-- ---------------------------------------------------------------------------
-- complete_loan(): an active loan is repaid in full
-- ---------------------------------------------------------------------------

create or replace function public.complete_loan(
  target_loan_id uuid,
  note text default null
)
returns table (
  completed boolean,
  released_monthly numeric,
  repaid_total numeric,
  requested_amount numeric
)
language plpgsql
security definer
set search_path = public, pg_temp
as $fn$
declare
  v_loan public.loans;
  v_cooperative uuid;
  v_repaid numeric;
begin
  select l.* into v_loan from public.loans l where l.id = target_loan_id;

  if v_loan.id is null then
    raise exception 'No such loan' using errcode = '22023';
  end if;

  select m.cooperative_id into v_cooperative
    from public.cooperative_memberships m
   where m.id = v_loan.membership_id;

  -- Closing a loan changes what every other cooperative sees of this member's capacity, so it
  -- sits with the permission that decides loans rather than the one that records money.
  if not public.staff_has_permission(v_cooperative, 'can_approve_loans') then
    raise exception 'You do not have permission to close a loan at this cooperative'
      using errcode = '42501';
  end if;

  if v_loan.status <> 'active' then
    raise exception 'Only an active loan can be marked repaid in full' using errcode = '22023';
  end if;

  select coalesce(sum(t.amount), 0) into v_repaid
    from public.savings_transactions t
   where t.loan_id = target_loan_id
     and t.type = 'loan_repayment';

  update public.loans
     set status = 'completed', completed_at = now()
   where id = target_loan_id;

  -- What the audit entry records is the gap, if any, between what was recorded and what was
  -- borrowed. A cooperative may legitimately close a loan settled outside Clarix, and the log
  -- should show that this is what happened rather than implying the ledger added up.
  insert into public.audit_log
    (actor_user_id, cooperative_id, action, target_table, target_id, old_value, new_value, note)
  values
    (auth.uid(), v_cooperative, 'complete_loan', 'loans', target_loan_id,
     jsonb_build_object('status', 'active', 'monthly_repayment', v_loan.monthly_repayment),
     jsonb_build_object(
       'status', 'completed',
       'repaid_recorded', v_repaid,
       'requested_amount', v_loan.requested_amount,
       'shortfall_in_ledger', round(greatest(v_loan.requested_amount - v_repaid, 0), 2)
     ),
     note);

  return query select true, v_loan.monthly_repayment, round(v_repaid, 2), v_loan.requested_amount;
end;
$fn$;

comment on function public.complete_loan(uuid, text) is
  'Marks an active loan repaid in full, releasing its monthly repayment from the member''s cross-cooperative capacity (admin blueprint 6.4). Takes can_approve_loans, and records in the audit log how much was actually recorded against the loan, which may be less than it was for.';

revoke execute on function public.complete_loan(uuid, text) from public, anon;
grant execute on function public.complete_loan(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- expire_lapsed_reservations(): tidying requests whose hold ran out
--
-- Idempotent, and deliberately scoped to one cooperative: this is an admin tidying their own
-- queue, not a platform-wide job. It changes no capacity, because a lapsed reservation already
-- counted for nothing; it changes what the queue says.
-- ---------------------------------------------------------------------------

create or replace function public.expire_lapsed_reservations(target_cooperative_id uuid)
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $fn$
declare
  v_count integer := 0;
  v_loan record;
begin
  if not public.staff_has_permission(target_cooperative_id, 'can_approve_loans') then
    raise exception 'You do not have permission to act on applications at this cooperative'
      using errcode = '42501';
  end if;

  for v_loan in
    select l.id, l.monthly_repayment, l.reservation_expires_at
      from public.loans l
      join public.cooperative_memberships m on m.id = l.membership_id
     where m.cooperative_id = target_cooperative_id
       and l.status = 'reserved'
       and l.reservation_expires_at is not null
       and l.reservation_expires_at <= now()
  loop
    update public.loans set status = 'expired' where id = v_loan.id;

    insert into public.audit_log
      (actor_user_id, cooperative_id, action, target_table, target_id, old_value, new_value, note)
    values
      (auth.uid(), target_cooperative_id, 'expire_reservation', 'loans', v_loan.id,
       jsonb_build_object('status', 'reserved', 'expires_at', v_loan.reservation_expires_at),
       jsonb_build_object('status', 'expired'),
       'The hold lapsed before anybody decided.');

    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$fn$;

comment on function public.expire_lapsed_reservations(uuid) is
  'Moves this cooperative''s undecided reservations to expired once their hold has lapsed (admin blueprint 6.1). Changes no capacity: a lapsed reservation already stopped counting at read time (D024). It makes the queue tell the truth, and each one is logged.';

revoke execute on function public.expire_lapsed_reservations(uuid) from public, anon;
grant execute on function public.expire_lapsed_reservations(uuid) to authenticated;
