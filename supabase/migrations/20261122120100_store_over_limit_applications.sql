-- Clarix, migration 031: an application above the member's limit is stored, never dropped.
--
-- DECISIONS.md D040, BUILD-PLAN 0.1, EDGE-CASES E05, E06 and E07.
--
-- Three functions change, and one constraint is added:
--
--   1. submit_loan_application: when the monthly repayment is above what the member has left (and
--      that includes a member with no limit yet, whose available amount is ₦0), it now INSERTS the
--      loan as 'pending_review', over_capacity = true, with the shortfall at that moment and no
--      reservation expiry. It holds nothing. The old "return without inserting" path is gone.
--      Signature and returned columns are unchanged: an over-limit call now comes back with
--      eligible = false AND a loan_id, which is how a caller tells "stored for review" apart.
--
--   2. decide_loan_application: staff may decide a 'pending_review' loan as well as a 'reserved'
--      one. Approving a pending_review loan always needs a written reason (DATA-MODEL.md, "R2
--      planned schema"), whether or not room has since opened up, and makes it 'active', from which
--      moment it counts. The "available before" figure no longer takes the loan back out of
--      committed unless the loan is actually in committed (an unexpired reservation).
--
--   3. payslip_under_review: the narrow window in which a decider may open the member's payslip
--      (D031) also covers an application waiting as pending_review.
--
-- What does NOT change: capacity_core() and the arithmetic inside submit_loan_application count
-- only 'active' and unexpired 'reserved' loans, so a pending_review loan is already excluded from
-- every committed figure, including the one computed inside the advisory lock (E07). pgTAP suite
-- 014 pins that down so it cannot drift.

-- ---------------------------------------------------------------------------
-- A pending_review loan never holds capacity, so it never carries an expiry, and it exists only
-- because it was over the limit.
-- ---------------------------------------------------------------------------

alter table public.loans
  add constraint loans_pending_review_holds_nothing check (
    status <> 'pending_review'
    or (over_capacity and reservation_expires_at is null)
  );

-- The staff queue reads pending_review loans by cooperative alongside reservations; the existing
-- (membership_id, status, reservation_expires_at) index already serves that lookup.

-- ---------------------------------------------------------------------------
-- 1. submit_loan_application
-- ---------------------------------------------------------------------------

create or replace function public.submit_loan_application(
  target_membership_id uuid,
  requested_amount numeric,
  tenure_months integer,
  loan_product_id uuid default null
)
returns table (
  eligible boolean,
  loan_id uuid,
  cap numeric,
  committed numeric,
  available numeric,
  monthly_repayment numeric,
  shortfall numeric,
  reservation_expires_at timestamptz,
  savings_required numeric,
  savings_shortfall numeric,
  meets_savings_ratio boolean
)
language plpgsql
security definer
set search_path = public, pg_temp
as $fn$
declare
  caller uuid := auth.uid();
  v_cooperative_id uuid;
  v_organization_id uuid;
  v_savings numeric;
  basis numeric;
  max_pct numeric;
  v_cap numeric;
  v_committed numeric;
  v_available numeric;
  v_monthly numeric;
  v_shortfall numeric;
  v_expiry_days integer;
  v_expires timestamptz;
  v_loan_id uuid;
  v_ratio numeric;
  v_max_tenure integer;
  v_required numeric := null;
  v_savings_short numeric := null;
  v_meets boolean := null;
begin
  if caller is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  if requested_amount is null or requested_amount <= 0 then
    raise exception 'Requested amount must be greater than zero' using errcode = '22023';
  end if;

  if tenure_months is null or tenure_months < 1 or tenure_months > 120 then
    raise exception 'Tenure must be between 1 and 120 months' using errcode = '22023';
  end if;

  select m.cooperative_id, u.organization_id, m.savings_balance
    into v_cooperative_id, v_organization_id, v_savings
    from public.cooperative_memberships m
    join public.users u on u.id = m.user_id
   where m.id = target_membership_id
     and m.user_id = caller
     and m.status = 'active';

  if v_cooperative_id is null then
    raise exception 'No active membership of yours matches that cooperative'
      using errcode = '42501';
  end if;

  if loan_product_id is not null then
    select p.min_savings_ratio, p.max_tenure_months
      into v_ratio, v_max_tenure
      from public.cooperative_loan_products p
     where p.id = loan_product_id
       and p.cooperative_id = v_cooperative_id;

    if v_ratio is null then
      raise exception 'That loan product does not belong to this cooperative'
        using errcode = '22023';
    end if;

    if tenure_months > v_max_tenure then
      raise exception 'That product allows at most % months', v_max_tenure
        using errcode = '22023';
    end if;

    v_required := round(requested_amount * v_ratio, 2);
    v_savings_short := round(greatest(v_required - coalesce(v_savings, 0), 0), 2);
    v_meets := v_savings_short <= 0;
  end if;

  perform pg_advisory_xact_lock(hashtextextended(caller::text, 0));

  select
    case o.deduction_basis when 'gross' then u.salary_gross else u.salary_net end,
    o.deduction_max_percentage
    into basis, max_pct
    from public.users u
    join public.organizations o on o.id = u.organization_id
   where u.id = caller;

  -- A member with no income on record has a cap of ₦0, which is what "Not assessed yet" means in
  -- arithmetic: every request is above it, so every request lands in pending_review (E06).
  v_cap := round(coalesce(greatest(basis, 0), 0) * coalesce(max_pct, 0) / 100, 2);

  -- Only what actually holds capacity. A pending_review loan is deliberately absent (D040, E07).
  select coalesce(sum(l.monthly_repayment), 0)
    into v_committed
    from public.loans l
    join public.cooperative_memberships m on m.id = l.membership_id
   where m.user_id = caller
     and (
       l.status = 'active'
       or (l.status = 'reserved' and l.reservation_expires_at > now())
     );

  v_available := round(greatest(v_cap - v_committed, 0), 2);

  v_monthly := round(requested_amount / tenure_months, 2);

  if v_monthly > v_available then
    -- Above the limit: stored for the cooperative to decide, holding nothing (D040).
    v_shortfall := round(v_monthly - v_available, 2);

    insert into public.loans (
      membership_id, loan_product_id, requested_amount, monthly_repayment, tenure_months,
      status, over_capacity, shortfall_at_submission
    )
    values (
      target_membership_id, loan_product_id, round(requested_amount, 2), v_monthly, tenure_months,
      'pending_review', true, v_shortfall
    )
    returning id into v_loan_id;

    return query select
      false,
      v_loan_id,
      v_cap,
      round(v_committed, 2),
      v_available,
      v_monthly,
      v_shortfall,
      null::timestamptz,
      v_required,
      v_savings_short,
      v_meets;
    return;
  end if;

  select least(coalesce(c.reservation_expiry_days_override, o.reservation_expiry_days_default),
               o.reservation_expiry_days_default)
    into v_expiry_days
    from public.cooperatives c
    join public.organizations o on o.id = c.organization_id
   where c.id = v_cooperative_id;

  v_expires := now() + make_interval(days => coalesce(v_expiry_days, 7));

  insert into public.loans (
    membership_id, loan_product_id, requested_amount, monthly_repayment, tenure_months,
    status, reserved_at, reservation_expires_at
  )
  values (
    target_membership_id, loan_product_id, round(requested_amount, 2), v_monthly, tenure_months,
    'reserved', now(), v_expires
  )
  returning id into v_loan_id;

  return query select
    true,
    v_loan_id,
    v_cap,
    round(v_committed, 2),
    v_available,
    v_monthly,
    0::numeric,
    v_expires,
    v_required,
    v_savings_short,
    v_meets;
end;
$fn$;

comment on function public.submit_loan_application(uuid, numeric, integer, uuid) is
  'Submits an application inside one locked transaction (D008). Within the limit: stored as reserved, holding capacity until it is decided or lapses. Above it, or with no limit yet: stored as pending_review with over_capacity and the shortfall, holding nothing (D040). Never returns without storing. Also reports the chosen product''s savings ratio; neither check blocks.';

revoke execute on function public.submit_loan_application(uuid, numeric, integer, uuid) from public, anon;
grant execute on function public.submit_loan_application(uuid, numeric, integer, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 2. decide_loan_application
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
  v_counted boolean;
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

  if v_loan.status not in ('reserved', 'pending_review') then
    raise exception 'This application has already been decided' using errcode = '22023';
  end if;

  -- The same lock the submission takes, so a decision and a submission for the same member cannot
  -- interleave and each read a committed figure the other is about to change.
  perform pg_advisory_xact_lock(hashtextextended(v_membership.user_id::text, 0));

  select c.cap, c.committed into v_cap, v_committed
    from public.capacity_core(v_membership.user_id) c;

  -- "What could they carry without this application". Take the loan back out of committed only
  -- when it is actually in there: an unexpired reservation. A pending_review loan never is.
  v_counted := v_loan.status = 'reserved'
               and v_loan.reservation_expires_at is not null
               and v_loan.reservation_expires_at > now();

  v_available_before := round(
    greatest(v_cap - (v_committed - case when v_counted then v_loan.monthly_repayment else 0 end), 0),
    2
  );
  v_over := v_loan.monthly_repayment > v_available_before;

  if decision = 'approve' and v_note is null and v_loan.status = 'pending_review' then
    raise exception 'This application was above the member''s limit when they sent it. Approving it requires a reason'
      using errcode = '22023';
  end if;

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
         reservation_expires_at = case when decision = 'reject' then null else reservation_expires_at end
   where id = target_loan_id;

  select u.name into v_member_name from public.users u where u.id = v_membership.user_id;
  select c.name into v_cooperative_name
    from public.cooperatives c where c.id = v_membership.cooperative_id;

  insert into public.notifications (user_id, category, message, target_url)
  values (
    v_membership.user_id,
    'loan_decision',
    case
      when decision = 'approve' then
        v_cooperative_name || ' approved your loan of ₦' ||
        to_char(v_loan.requested_amount, 'FM999,999,999') || '. ₦' ||
        to_char(v_loan.monthly_repayment, 'FM999,999,999') ||
        ' a month is now being deducted.'
      when v_loan.status = 'pending_review' then
        -- Nothing was ever held, so there is nothing to release, and saying so would be untrue.
        v_cooperative_name || ' could not approve your loan of ₦' ||
        to_char(v_loan.requested_amount, 'FM999,999,999') || '.'
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
    jsonb_build_object(
      'status', v_loan.status,
      'over_capacity', v_loan.over_capacity,
      'shortfall_at_submission', v_loan.shortfall_at_submission
    ),
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

comment on function public.decide_loan_application(uuid, text, text) is
  'Approves or rejects a reserved or pending_review application. Approving needs a written reason when the loan is over what the member has left, and always for a pending_review loan (D040). Takes the member''s advisory lock, notifies the member and writes the audit log.';

revoke execute on function public.decide_loan_application(uuid, text, text) from public, anon;
grant execute on function public.decide_loan_application(uuid, text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- 3. payslip_under_review: the D031 window also covers a pending_review application
-- ---------------------------------------------------------------------------

create or replace function public.payslip_under_review(document_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $fn$
  select exists (
    select 1
      from public.documents d
      join public.users u on u.salary_source_doc_id = d.id
      join public.cooperative_memberships m on m.user_id = u.id
      join public.loans l on l.membership_id = m.id
     where d.id = document_id
       and (
         (l.status = 'reserved'
           and l.reservation_expires_at is not null
           and l.reservation_expires_at > now())
         or l.status = 'pending_review'
       )
       and public.staff_has_permission(m.cooperative_id, 'can_approve_loans')
  );
$fn$;

comment on function public.payslip_under_review(uuid) is
  'Whether this document is the salary evidence behind an application the caller is currently entitled to decide: an unexpired reservation or a pending_review application (D031, D040).';

revoke execute on function public.payslip_under_review(uuid) from public, anon;
grant execute on function public.payslip_under_review(uuid) to authenticated;
