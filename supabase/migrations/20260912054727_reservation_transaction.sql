-- Clarix — migration 007: the capacity calculation and the reservation transaction.
--
-- This is the mechanism the product exists for (DECISIONS.md D003, D008; docs/DATA-MODEL.md
-- § "Eligibility & reservation — how it actually runs").
--
-- Two functions:
--
--   capacity_for_user()      Step 1 and Step 2 — read-only, safe to call repeatedly, drives the
--                            dashboard figures and the live preview on the application screen.
--   submit_loan_application() Step 3 — the one write path, serialised by an advisory lock.
--
-- ---------------------------------------------------------------------------
-- Why both are SECURITY DEFINER
--
-- Committed obligations have to be summed across EVERY cooperative the employee belongs to.
-- Per-cooperative RLS on `loans` correctly refuses exactly that: it scopes a staff member to
-- their own cooperative's rows, and it must keep doing so. The cross-cooperative total is
-- DECISIONS.md D003's deliberate, narrow exception — the minimum necessary figure, and the only
-- thing that ever crosses between cooperatives.
--
-- These functions are the enforcement of that rule rather than a way around it. They return an
-- AGGREGATE and a verdict: a single summed monthly figure, a cap, a remainder. They never return
-- another cooperative's identity, its savings balances, its loan rows, or anything attributable
-- to a particular cooperative. A caller learns what they are owed in total, never by whom.
--
-- Both verify the caller's identity from auth.uid() and refuse to act on a membership that does
-- not belong to them, so an employee can only ever reserve through their own record. Listed in
-- SECURITY.md alongside is_active_staff() and is_platform_admin().
-- ---------------------------------------------------------------------------

/**
 * Step 1 and Step 2: what is this employee's capacity, and does a hypothetical repayment fit?
 *
 * Read-only and side-effect free, which is what makes the lookup available at any time rather
 * than only during a submission (DECISIONS.md D003).
 *
 * `proposed_monthly_repayment` defaults to zero, in which case this is just Step 1.
 */
create or replace function public.capacity_for_user(
  proposed_monthly_repayment numeric default 0
)
returns table (
  cap numeric,
  committed numeric,
  available numeric,
  proposed numeric,
  eligible boolean,
  shortfall numeric,
  headroom numeric
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $fn$
declare
  caller uuid := auth.uid();
  basis numeric;
  max_pct numeric;
  v_cap numeric;
  v_committed numeric;
  v_available numeric;
  v_proposed numeric := round(greatest(coalesce(proposed_monthly_repayment, 0), 0), 2);
begin
  if caller is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  -- The salary basis the organization configures, and its maximum percentage (D007).
  select
    case o.deduction_basis when 'gross' then u.salary_gross else u.salary_net end,
    o.deduction_max_percentage
    into basis, max_pct
    from public.users u
    join public.organizations o on o.id = u.organization_id
   where u.id = caller;

  v_cap := round(coalesce(greatest(basis, 0), 0) * coalesce(max_pct, 0) / 100, 2);

  -- Every reserved or active monthly repayment this person holds, across every cooperative.
  -- A reservation whose window has lapsed is not counted: see the note in migration 006 on why
  -- expiry is read as authoritative rather than waiting for the sweeper job to flip the status.
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

  return query
  select
    v_cap,
    round(v_committed, 2),
    v_available,
    v_proposed,
    v_proposed <= v_available,
    case when v_proposed > v_available then round(v_proposed - v_available, 2) else 0::numeric end,
    case when v_proposed <= v_available then round(v_available - v_proposed, 2) else 0::numeric end;
end;
$fn$;

/**
 * Step 3: the reservation.
 *
 * Everything below happens in ONE transaction, which is the entire point. pg_advisory_xact_lock
 * only serialises callers inside a single transaction, so this cannot be assembled from
 * sequential client calls — a second submission arriving between the client's read and its write
 * would reserve against a figure that was already stale. That race is the exact failure the
 * product exists to close.
 *
 * The lock is keyed on the EMPLOYEE, not the cooperative: two different cooperatives submitting
 * for the same person are precisely the collision that matters, and they must queue behind each
 * other. Two submissions for different employees never contend.
 */
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
  reservation_expires_at timestamptz
)
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $fn$
declare
  caller uuid := auth.uid();
  v_cooperative_id uuid;
  v_organization_id uuid;
  basis numeric;
  max_pct numeric;
  v_cap numeric;
  v_committed numeric;
  v_available numeric;
  v_monthly numeric;
  v_expiry_days integer;
  v_expires timestamptz;
  v_loan_id uuid;
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

  -- The membership must belong to the caller and be active. This is what stops an employee
  -- reserving against an arbitrary membership_id: identity comes from auth.uid(), never from
  -- the argument.
  select m.cooperative_id, u.organization_id
    into v_cooperative_id, v_organization_id
    from public.cooperative_memberships m
    join public.users u on u.id = m.user_id
   where m.id = target_membership_id
     and m.user_id = caller
     and m.status = 'active';

  if v_cooperative_id is null then
    raise exception 'No active membership of yours matches that cooperative'
      using errcode = '42501';
  end if;

  -- Serialise every concurrent submission for THIS employee. Released automatically at commit
  -- or rollback, so a failed transaction can never strand the lock.
  perform pg_advisory_xact_lock(hashtextextended(caller::text, 0));

  -- Recompute inside the lock. A submission that queued behind another sees the reservation
  -- that one just made, which is the whole reason the recompute lives here and not in the client.
  select
    case o.deduction_basis when 'gross' then u.salary_gross else u.salary_net end,
    o.deduction_max_percentage
    into basis, max_pct
    from public.users u
    join public.organizations o on o.id = u.organization_id
   where u.id = caller;

  v_cap := round(coalesce(greatest(basis, 0), 0) * coalesce(max_pct, 0) / 100, 2);

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

  -- Interest is deliberately not modelled (DATA-MODEL.md; DECISIONS.md D018 keeps the
  -- eligibility figure auditable arithmetic), so the monthly repayment is the principal spread
  -- evenly across the tenure. A cooperative's own interest terms are free text on its product.
  v_monthly := round(requested_amount / tenure_months, 2);

  if v_monthly > v_available then
    -- Nothing is inserted and nothing is held. The caller is told exactly how far past the
    -- limit they are, and the screen decides what to do with that (blueprint 5.5 lets them
    -- submit anyway — but that is the cooperative's decision to record, not a reservation).
    return query select
      false,
      null::uuid,
      v_cap,
      round(v_committed, 2),
      v_available,
      v_monthly,
      round(v_monthly - v_available, 2),
      null::timestamptz;
    return;
  end if;

  -- D009: the cooperative may shorten the organization's window, never lengthen it. The
  -- cooperatives table enforces that at write time; LEAST is the belt to that braces.
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
    v_expires;
end;
$fn$;

-- Neither function is reachable without a session, and neither is callable by anon.
revoke execute on function public.capacity_for_user(numeric) from public, anon;
revoke execute on function public.submit_loan_application(uuid, numeric, integer, uuid)
  from public, anon;
grant execute on function public.capacity_for_user(numeric) to authenticated;
grant execute on function public.submit_loan_application(uuid, numeric, integer, uuid)
  to authenticated;
