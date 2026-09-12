-- Clarix — migration 012: what a cooperative's staff need to look after a member.
--
-- Two things Part 5 of the cooperative admin blueprint needs, and neither is a new table.
--
-- ---------------------------------------------------------------------------
-- 1. One capacity calculation, two doors
--
-- Member Profile (5.2) must show a member's cross-cooperative capacity — the same figure, drawn
-- the same way, as that member sees on their own dashboard. `capacity_for_user()` already
-- computes it, but derives the person from `auth.uid()`, so staff cannot use it for somebody
-- else.
--
-- Rather than write the arithmetic a second time and let the two drift, the calculation moves
-- into `capacity_core()` and both entry points call it: `capacity_for_user()` keeps its exact
-- signature and behaviour, and `capacity_for_membership()` is the staff door. There is still one
-- formula in this database, which is the whole point of DECISIONS.md D018 — both sides of a loan
-- decision must see the same number because it IS the same number.
--
-- `submit_loan_application()` deliberately still recomputes the committed total itself, inside
-- its advisory lock. That recomputation is the mechanism D008 rests on and pgTAP suite 003 pins
-- down; it is not duplication to be tidied away.
--
-- **What keeps the staff door narrow.** `capacity_for_membership()` refuses unless the caller is
-- active staff at the cooperative that membership belongs to, and it returns exactly what the
-- employee's own version returns: a cap, a summed monthly figure, a remainder, a verdict. Never
-- which cooperative an obligation is with, never another cooperative's savings, never a loan row.
-- That is D003's rule stated as a function signature.
--
-- ---------------------------------------------------------------------------
-- 2. The savings balance stops being remembered separately
--
-- `cooperative_memberships.savings_balance` and the `savings_transactions` ledger have until now
-- been two independent facts, kept in step by whoever wrote them. Record Savings (5.4) is the
-- first screen where staff write ledger rows routinely, so this is the moment that stops being
-- tenable: a balance that disagrees with the entries behind it is exactly the thing a member
-- would be right to distrust.
--
-- The trigger below makes the balance derived. A contribution raises it, a recorded withdrawal
-- lowers it, and a loan repayment moves neither — a repayment leaves the salary, it is not a
-- withdrawal from savings (DECISIONS.md D024).

create or replace function public.capacity_core(
  target_user uuid,
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
  basis numeric;
  max_pct numeric;
  v_cap numeric;
  v_committed numeric;
  v_available numeric;
  v_proposed numeric := round(greatest(coalesce(proposed_monthly_repayment, 0), 0), 2);
begin
  if target_user is null then
    raise exception 'No user to compute capacity for' using errcode = '22023';
  end if;

  select
    case o.deduction_basis when 'gross' then u.salary_gross else u.salary_net end,
    o.deduction_max_percentage
    into basis, max_pct
    from public.users u
    join public.organizations o on o.id = u.organization_id
   where u.id = target_user;

  v_cap := round(coalesce(greatest(basis, 0), 0) * coalesce(max_pct, 0) / 100, 2);

  select coalesce(sum(l.monthly_repayment), 0)
    into v_committed
    from public.loans l
    join public.cooperative_memberships m on m.id = l.membership_id
   where m.user_id = target_user
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

-- Not a door of its own: it takes a user id as an argument and checks nothing, so it must never
-- be callable from the API. The two wrappers below are SECURITY DEFINER and therefore run as the
-- owner, which is how they reach it.
revoke execute on function public.capacity_core(uuid, numeric) from public, anon, authenticated;

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
begin
  if caller is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  return query select * from public.capacity_core(caller, proposed_monthly_repayment);
end;
$fn$;

revoke execute on function public.capacity_for_user(numeric) from public, anon;
grant execute on function public.capacity_for_user(numeric) to authenticated;

create or replace function public.capacity_for_membership(
  target_membership_id uuid,
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
  v_user uuid;
  v_cooperative uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  select m.user_id, m.cooperative_id
    into v_user, v_cooperative
    from public.cooperative_memberships m
   where m.id = target_membership_id;

  if v_user is null then
    raise exception 'No such membership' using errcode = '42501';
  end if;

  -- The staff check is the whole boundary: a cooperative may look up the capacity of somebody
  -- who belongs to it, and nobody else's.
  if not public.is_active_staff(v_cooperative) then
    raise exception 'Only this cooperative''s staff may look up this member' using errcode = '42501';
  end if;

  return query select * from public.capacity_core(v_user, proposed_monthly_repayment);
end;
$fn$;

revoke execute on function public.capacity_for_membership(uuid, numeric) from public, anon;
grant execute on function public.capacity_for_membership(uuid, numeric) to authenticated;

-- ---------------------------------------------------------------------------
-- The savings balance follows the ledger
-- ---------------------------------------------------------------------------

create or replace function public.apply_savings_transaction()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $fn$
declare
  v_membership uuid := coalesce(new.membership_id, old.membership_id);
begin
  update public.cooperative_memberships m
     set savings_balance = greatest(
       coalesce((
         select sum(
           case t.type
             when 'contribution' then t.amount
             when 'withdrawal_record' then -t.amount
             else 0
           end
         )
         from public.savings_transactions t
        where t.membership_id = v_membership
       ), 0),
       0
     )
   where m.id = v_membership;

  return null;
end;
$fn$;

-- Recomputed from the ledger rather than added to the running total: an amount corrected after
-- the fact then leaves no residue, and the balance cannot drift from the entries behind it.
create trigger savings_transactions_apply_balance
  after insert or update or delete on public.savings_transactions
  for each row execute function public.apply_savings_transaction();

revoke execute on function public.apply_savings_transaction() from public, anon, authenticated;
