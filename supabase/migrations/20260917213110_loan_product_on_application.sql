-- Clarix, migration 028: an application records which product it is for, and the savings rule
-- behind that product is actually checked.
--
-- `submit_loan_application` has taken a `loan_product_id` since migration 006 and has stored it
-- faithfully ever since. Nothing ever passed one. The apply screen (blueprint 5.5) had no product
-- picker, so every loan in the project carried a null product, and the reviewer's savings-ratio
-- panel (admin blueprint 7.3) had nothing to check against and said so. The cooperative's own
-- rule, the one thing on that screen that belongs to the cooperative rather than to the employer's
-- deduction cap, was never applied to a single application.
--
-- Two things were missing, and neither was the storage:
--
--   1. Nothing checked that the product named belonged to the cooperative being applied to. That
--      did not matter while the argument was always null; it matters the moment a client sends one.
--   2. The savings ratio was computed nowhere. The reviewer's panel derived it from the product
--      row at read time, which is right, but the member submitting never saw it and the function
--      never reported it, so "eligible" meant one of the two checks the admin blueprint calls for.
--
-- The ratio does NOT block. Blueprint 5.5 is explicit: "The primary Submit application button is
-- enabled regardless of the eligibility result. Clarix informs, it doesn't gatekeep; the actual
-- approval decision belongs to the cooperative." So a shortfall against the cooperative's savings
-- rule is reported to both sides and decided by the cooperative, exactly as a shortfall against
-- the deduction cap already is.

-- The return type gains three columns, so the old signature has to go first.
drop function if exists public.submit_loan_application(uuid, numeric, integer, uuid);

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
  -- The cooperative's own rule, reported alongside the employer's cap because the admin blueprint
  -- is explicit that they are "two separate checks and both matter to the decision".
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

  -- A product has to be one of THIS cooperative's. Applying to cooperative A under cooperative B's
  -- gentler savings ratio would be a way of borrowing against a rule nobody agreed to.
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

    -- Computed before the capacity branch below, so a request that fails on the cap still comes
    -- back carrying the savings answer rather than leaving one of the two checks unanswered.
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

  v_monthly := round(requested_amount / tenure_months, 2);

  if v_monthly > v_available then
    return query select
      false,
      null::uuid,
      v_cap,
      round(v_committed, 2),
      v_available,
      v_monthly,
      round(v_monthly - v_available, 2),
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

  -- Note what is NOT here: a savings shortfall does not stop the reservation. The capacity is
  -- genuinely held, the application reaches the cooperative, and the cooperative decides. That is
  -- the difference between informing and gatekeeping, and blueprint 5.5 asks for the former.
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
  'Submits an application and reserves capacity inside one locked transaction (DECISIONS.md D008). Reports two independent checks: the employer''s deduction cap, and the chosen product''s minimum savings ratio (admin blueprint 7.3). Neither blocks the submission; both are reported, and the cooperative decides (blueprint 5.5).';

revoke execute on function public.submit_loan_application(uuid, numeric, integer, uuid) from public, anon;
grant execute on function public.submit_loan_application(uuid, numeric, integer, uuid) to authenticated;
