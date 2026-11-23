-- Clarix, migration 032: a loan a member already owes when their cooperative joins Clarix.
--
-- DECISIONS.md D036, BUILD-PLAN 0.3, EDGE-CASES E08, documents blueprint §3.
--
-- A cooperative joins with a book of loans already running. Until now there was no way to enter
-- one, so every member's committed figure started at ₦0 and every limit was overstated, at this
-- cooperative and at every other one the member belongs to.
--
-- Purely additive: a new type, five new nullable or defaulted columns, one constraint that every
-- existing row already satisfies (they are all origin = 'clarix'), and one new function. Nothing
-- `main` reads or calls changes.
--
-- A pre-existing loan never passes through reservation. It is inserted directly as 'active' and,
-- because capacity_core() counts every active loan, it counts in committed the moment it is saved,
-- at every cooperative.

create type public.loan_origin as enum ('clarix', 'pre_existing');

alter table public.loans
  add column if not exists origin public.loan_origin not null default 'clarix',
  add column if not exists outstanding_balance_at_entry numeric(14, 2),
  add column if not exists started_on date,
  add column if not exists expected_end_date date,
  add column if not exists entered_by uuid references public.users (id) on delete set null;

comment on column public.loans.origin is
  'clarix: applied for and decided in Clarix. pre_existing: already running when it was entered by staff (D036); created active, never reserved.';
comment on column public.loans.outstanding_balance_at_entry is
  'pre_existing only: what was still owed on the day staff entered it. Repayments recorded afterwards come off this figure, not off the original amount.';
comment on column public.loans.started_on is
  'pre_existing only: the first day of the month the loan started.';
comment on column public.loans.expected_end_date is
  'pre_existing: the first day of the month the last repayment is expected. Required for pre_existing.';
comment on column public.loans.entered_by is
  'The staff member who keyed or imported a pre_existing loan.';

alter table public.loans
  add constraint loans_pre_existing_shape check (
    origin <> 'pre_existing'
    or (
      status in ('active', 'completed')
      and outstanding_balance_at_entry is not null
      and outstanding_balance_at_entry > 0
      and started_on is not null
      and expected_end_date is not null
      and expected_end_date >= started_on
    )
  );

-- ---------------------------------------------------------------------------
-- record_existing_loan()
-- ---------------------------------------------------------------------------

create or replace function public.record_existing_loan(
  target_membership_id uuid,
  outstanding_balance numeric,
  monthly_repayment numeric,
  start_month date,
  expected_end_month date,
  loan_product_id uuid default null,
  original_amount numeric default null,
  note text default null
)
returns table (
  loan_id uuid,
  cap numeric,
  committed_before numeric,
  committed_after numeric,
  available_before numeric,
  available_after numeric
)
language plpgsql
security definer
set search_path = public, pg_temp
as $fn$
declare
  v_caller uuid := auth.uid();
  v_membership public.cooperative_memberships;
  v_start date;
  v_end date;
  v_months integer;
  v_monthly numeric := round(monthly_repayment, 2);
  v_balance numeric := round(outstanding_balance, 2);
  v_original numeric := round(original_amount, 2);
  v_note text := nullif(trim(coalesce(note, '')), '');
  v_before record;
  v_after record;
  v_loan_id uuid;
begin
  if v_caller is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  select * into v_membership
    from public.cooperative_memberships
   where id = target_membership_id;

  if v_membership.id is null then
    raise exception 'No such member' using errcode = '42501';
  end if;

  -- Entering a loan is keeping the cooperative's book, the same permission as recording a
  -- repayment (BUILD-PLAN 0.3). Admins pass implicitly.
  if not public.staff_has_permission(v_membership.cooperative_id, 'can_record_savings') then
    raise exception 'You do not have permission to record loans at this cooperative'
      using errcode = '42501';
  end if;

  if v_membership.status <> 'active' then
    raise exception 'Only an active member can have a loan recorded' using errcode = '22023';
  end if;

  if v_balance is null or v_balance <= 0 then
    raise exception 'The outstanding balance must be greater than zero' using errcode = '22023';
  end if;

  if v_monthly is null or v_monthly <= 0 then
    raise exception 'The monthly repayment must be greater than zero' using errcode = '22023';
  end if;

  if v_original is not null and v_original < v_balance then
    raise exception 'The original amount cannot be less than what is still owed' using errcode = '22023';
  end if;

  if start_month is null or expected_end_month is null then
    raise exception 'Both the start month and the expected end month are needed' using errcode = '22023';
  end if;

  v_start := date_trunc('month', start_month)::date;
  v_end := date_trunc('month', expected_end_month)::date;

  if v_start > date_trunc('month', now())::date then
    raise exception 'A loan already owed cannot start in a future month' using errcode = '22023';
  end if;

  if v_end < v_start then
    raise exception 'The expected end month is before the start month' using errcode = '22023';
  end if;

  v_months := (extract(year from age(v_end, v_start)) * 12 + extract(month from age(v_end, v_start)))::integer + 1;

  if v_months > 120 then
    raise exception 'A loan can run for at most 120 months' using errcode = '22023';
  end if;

  if loan_product_id is not null and not exists (
    select 1 from public.cooperative_loan_products p
     where p.id = loan_product_id and p.cooperative_id = v_membership.cooperative_id
  ) then
    raise exception 'That loan product does not belong to this cooperative' using errcode = '22023';
  end if;

  -- The same lock a submission and a decision take, so the before and after figures cannot be
  -- read across another write for the same member.
  perform pg_advisory_xact_lock(hashtextextended(v_membership.user_id::text, 0));

  select c.cap, c.committed, c.available into v_before
    from public.capacity_core(v_membership.user_id) c;

  insert into public.loans (
    membership_id, loan_product_id, requested_amount, monthly_repayment, tenure_months,
    status, approved_at, approved_by,
    origin, outstanding_balance_at_entry, started_on, expected_end_date, entered_by
  )
  values (
    target_membership_id, loan_product_id, coalesce(v_original, v_balance), v_monthly, v_months,
    'active', now(), v_caller,
    'pre_existing', v_balance, v_start, v_end, v_caller
  )
  returning id into v_loan_id;

  select c.cap, c.committed, c.available into v_after
    from public.capacity_core(v_membership.user_id) c;

  insert into public.audit_log (
    actor_user_id, cooperative_id, action, target_table, target_id, old_value, new_value, note
  )
  values (
    v_caller,
    v_membership.cooperative_id,
    'record_existing_loan',
    'loans',
    v_loan_id,
    jsonb_build_object('committed', v_before.committed, 'available', v_before.available),
    jsonb_build_object(
      'outstanding_balance', v_balance,
      'monthly_repayment', v_monthly,
      'original_amount', v_original,
      'started_on', v_start,
      'expected_end_date', v_end,
      'committed', v_after.committed,
      'available', v_after.available
    ),
    v_note
  );

  return query select
    v_loan_id, v_before.cap, v_before.committed, v_after.committed, v_before.available, v_after.available;
end;
$fn$;

comment on function public.record_existing_loan(uuid, numeric, numeric, date, date, uuid, numeric, text) is
  'Staff enter a loan a member already owes (D036, BUILD-PLAN 0.3). Needs can_record_savings at that cooperative. Inserted active with origin pre_existing, never reserved, so it counts in committed at every cooperative immediately. Audit-logged with the before and after figures.';

revoke execute on function public.record_existing_loan(uuid, numeric, numeric, date, date, uuid, numeric, text) from public, anon;
grant execute on function public.record_existing_loan(uuid, numeric, numeric, date, date, uuid, numeric, text) to authenticated;

-- ---------------------------------------------------------------------------
-- cooperative_has_existing_loans(): for the E08 note on the review screen
--
-- Staff can already read their cooperative's loans through RLS, so this adds no visibility; it
-- answers one yes/no question cheaply instead of making the screen fetch the whole book.
-- ---------------------------------------------------------------------------

create or replace function public.cooperative_has_existing_loans(target_cooperative_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $fn$
  select public.is_active_staff(target_cooperative_id)
     and exists (
       select 1
         from public.loans l
         join public.cooperative_memberships m on m.id = l.membership_id
        where m.cooperative_id = target_cooperative_id
          and l.origin = 'pre_existing'
     );
$fn$;

revoke execute on function public.cooperative_has_existing_loans(uuid) from public, anon;
grant execute on function public.cooperative_has_existing_loans(uuid) to authenticated;
