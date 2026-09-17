-- Clarix, migration 016: officer permissions that actually bite, and monthly reconciliation.
--
-- ---------------------------------------------------------------------------
-- 1. Permissions stop being decoration
--
-- `cooperative_staff_roles.permissions` has been a jsonb column since migration 001 and
-- docs/DATA-MODEL.md has always described it as "boolean flags, meaningful only when
-- role='officer'". Until now exactly one flag meant anything: `can_approve_loans`, which
-- `decide_loan_application` checks. Everything else an officer could do was governed by
-- `is_active_staff()` alone, which asks whether they are staff, not what they are allowed to do.
--
-- Blueprint 7.2 asks for a panel of toggles that are "default-deny, meaning a permission not
-- explicitly switched on isn't usable by that officer at all". A toggle that changes a stored
-- value but not what the database permits would be the worst kind of security theatre. It would
-- read as a control and behave as a label. So the two policies those toggles govern are
-- rewritten here to check the flag.
--
-- An admin bypasses all of them: DATA-MODEL.md is explicit that "admins implicitly have full
-- cooperative permissions", and an admin who could lock themselves out of their own cooperative
-- by mis-tapping a switch would be a worse failure than any of this prevents.
--
-- There are no officers anywhere in the system yet, so default-deny costs nobody their access.
--
-- ---------------------------------------------------------------------------
-- 2. deduction_reconciliation
--
-- Specified in docs/DATA-MODEL.md from the beginning, never migrated, and needed by blueprint
-- 7.5: the screen whose whole purpose is "make a deduction shortfall visible on purpose rather
-- than discovered by accident". It is also, per the strategic plan, the number that eventually
-- makes the case for the paid plan, which is a poor thing to keep in a spreadsheet.

create or replace function public.staff_has_permission(
  target_cooperative_id uuid,
  permission_key text
)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $fn$
  select exists (
    select 1
      from public.cooperative_staff_roles r
     where r.user_id = auth.uid()
       and r.cooperative_id = target_cooperative_id
       and r.status = 'active'
       and (
         r.role = 'admin'
         or coalesce((r.permissions ->> permission_key)::boolean, false)
       )
  );
$fn$;

comment on function public.staff_has_permission(uuid, text) is
  'Whether the caller may do one specific thing at one cooperative. Admins pass everything (DATA-MODEL.md); an officer passes only what has been switched on for them. Used inside policies, so EXECUTE stays with authenticated for the same reason is_active_staff() does.';

revoke execute on function public.staff_has_permission(uuid, text) from public, anon;
grant execute on function public.staff_has_permission(uuid, text) to authenticated;

-- Seeing the member list is a permission, not a side effect of being staff.
drop policy if exists cooperative_memberships_select_staff on public.cooperative_memberships;

create policy cooperative_memberships_select_staff
  on public.cooperative_memberships for select to authenticated
  using (public.staff_has_permission(cooperative_id, 'can_view_members'));

-- So is recording what payroll delivered.
drop policy if exists savings_transactions_insert_staff on public.savings_transactions;

create policy savings_transactions_insert_staff
  on public.savings_transactions for insert to authenticated
  with check (
    exists (
      select 1 from public.cooperative_memberships m
       where m.id = savings_transactions.membership_id
         and public.staff_has_permission(m.cooperative_id, 'can_record_savings')
    )
  );

drop policy if exists savings_transactions_update_staff on public.savings_transactions;

create policy savings_transactions_update_staff
  on public.savings_transactions for update to authenticated
  using (
    exists (
      select 1 from public.cooperative_memberships m
       where m.id = savings_transactions.membership_id
         and public.staff_has_permission(m.cooperative_id, 'can_record_savings')
    )
  )
  with check (
    exists (
      select 1 from public.cooperative_memberships m
       where m.id = savings_transactions.membership_id
         and public.staff_has_permission(m.cooperative_id, 'can_record_savings')
    )
  );

-- ---------------------------------------------------------------------------
-- deduction_reconciliation
-- ---------------------------------------------------------------------------

create table public.deduction_reconciliation (
  id uuid primary key default gen_random_uuid(),
  membership_id uuid not null references public.cooperative_memberships (id) on delete cascade,

  -- 'YYYY-MM'. A month is the unit payroll actually works in, and storing it as text keeps the
  -- period an admin selected rather than a date that invites timezone arguments.
  period text not null check (period ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'),

  -- What Clarix expected payroll to deduct: the sum of this member's active monthly repayments
  -- at this cooperative when the row was entered. Stored rather than recomputed, because the
  -- point of the record is what was expected AT THE TIME.
  expected_amount numeric(14, 2) not null check (expected_amount >= 0),

  actual_amount_received numeric(14, 2) check (actual_amount_received >= 0),

  entered_by uuid references public.users (id) on delete set null,
  entered_at timestamptz not null default now(),

  constraint deduction_reconciliation_one_per_period unique (membership_id, period)
);

create index deduction_reconciliation_period_idx
  on public.deduction_reconciliation (period);

comment on table public.deduction_reconciliation is
  'Expected versus actually-received salary deductions, per member per month (blueprint 7.5, docs/DATA-MODEL.md). The shortfall is derived, expected minus actual, rather than stored, so it can never disagree with the two figures it comes from.';

alter table public.deduction_reconciliation enable row level security;

-- Scoped exactly like the memberships it describes: a cooperative's staff see their own rows.
-- Recording one is the same act as recording a contribution, so it takes the same permission.
create policy deduction_reconciliation_select_staff
  on public.deduction_reconciliation for select to authenticated
  using (
    exists (
      select 1 from public.cooperative_memberships m
       where m.id = deduction_reconciliation.membership_id
         and public.is_active_staff(m.cooperative_id)
    )
  );

-- The member sees their own months, which is what feeds the Deductions tab on their side.
create policy deduction_reconciliation_select_own
  on public.deduction_reconciliation for select to authenticated
  using (
    exists (
      select 1 from public.cooperative_memberships m
       where m.id = deduction_reconciliation.membership_id
         and m.user_id = auth.uid()
    )
  );

create policy deduction_reconciliation_write_staff
  on public.deduction_reconciliation for insert to authenticated
  with check (
    exists (
      select 1 from public.cooperative_memberships m
       where m.id = deduction_reconciliation.membership_id
         and public.staff_has_permission(m.cooperative_id, 'can_record_savings')
    )
  );

create policy deduction_reconciliation_update_staff
  on public.deduction_reconciliation for update to authenticated
  using (
    exists (
      select 1 from public.cooperative_memberships m
       where m.id = deduction_reconciliation.membership_id
         and public.staff_has_permission(m.cooperative_id, 'can_record_savings')
    )
  )
  with check (
    exists (
      select 1 from public.cooperative_memberships m
       where m.id = deduction_reconciliation.membership_id
         and public.staff_has_permission(m.cooperative_id, 'can_record_savings')
    )
  );

grant select, insert, update on public.deduction_reconciliation to authenticated;
revoke all on public.deduction_reconciliation from anon;
