-- Clarix, migration 006: loans and savings_transactions.
--
-- docs/DATA-MODEL.md defines both shapes. These are the tables the product exists for: `loans`
-- holds the monthly obligations that the cross-cooperative capacity calculation sums, and
-- `savings_transactions` is the per-membership ledger behind the savings figure.
--
-- RLS ships in this migration, as always.
--
-- Two deliberate departures from DATA-MODEL.md, both recorded as DECISIONS.md D024:
--
--   1. `savings_transactions.type` gains a 'loan_repayment' value and the table gains a nullable
--      `loan_id`. DATA-MODEL.md defines no loan-repayment ledger at all, but blueprint 5.3 needs
--      a repayment history, and a repayment has to be attributable to a specific loan when a
--      member holds two at one cooperative. Putting it here keeps one ledger per membership
--      rather than inventing a second table the data model does not describe.
--
--   2. A reservation whose `reservation_expires_at` has passed is treated as NOT committed by
--      the capacity calculation, even while its status still reads 'reserved'. DATA-MODEL.md
--      expects a scheduled job to flip those to 'expired'; until that job exists, counting a
--      lapsed reservation against an employee's capacity would quietly deny them headroom they
--      actually have. Reading expiry as authoritative makes the figure correct with or without
--      the job.

create type public.loan_status as enum (
  'draft',
  'reserved',
  'active',
  'rejected',
  'completed',
  'expired'
);

create type public.savings_transaction_type as enum (
  'contribution',
  'withdrawal_record',
  'loan_repayment'
);

-- ---------------------------------------------------------------------------
-- loans
-- ---------------------------------------------------------------------------

create table public.loans (
  id uuid primary key default gen_random_uuid(),
  membership_id uuid not null references public.cooperative_memberships (id) on delete cascade,

  -- Nullable: a loan may be taken against a product, or on terms agreed directly.
  loan_product_id uuid references public.cooperative_loan_products (id) on delete set null,

  requested_amount numeric(14, 2) not null check (requested_amount > 0),

  -- The figure the whole product turns on: what leaves the employee's salary each month. The
  -- capacity calculation sums exactly this column across every cooperative.
  monthly_repayment numeric(14, 2) not null check (monthly_repayment > 0),

  tenure_months integer not null check (tenure_months between 1 and 120),

  status public.loan_status not null default 'draft',

  reserved_at timestamptz,
  reservation_expires_at timestamptz,
  approved_at timestamptz,
  approved_by uuid references public.users (id) on delete set null,
  rejected_at timestamptz,
  completed_at timestamptz,

  created_at timestamptz not null default now(),

  -- A reserved loan without an expiry would hold shared capacity forever, which is exactly what
  -- DECISIONS.md D009 exists to prevent.
  constraint loans_reserved_has_expiry check (
    status <> 'reserved' or (reserved_at is not null and reservation_expires_at is not null)
  )
);

create index loans_membership_id_idx on public.loans (membership_id);
create index loans_status_idx on public.loans (status);
-- The capacity query filters on status and expiry for one member's memberships; this supports it.
create index loans_commitment_lookup_idx
  on public.loans (membership_id, status, reservation_expires_at);

comment on table public.loans is
  'Loan applications and obligations. monthly_repayment is what the cross-cooperative capacity calculation sums (DECISIONS.md D003, D008).';

-- ---------------------------------------------------------------------------
-- savings_transactions
-- ---------------------------------------------------------------------------

create table public.savings_transactions (
  id uuid primary key default gen_random_uuid(),
  membership_id uuid not null references public.cooperative_memberships (id) on delete cascade,

  type public.savings_transaction_type not null,
  amount numeric(14, 2) not null check (amount > 0),

  -- Set only on 'loan_repayment' rows, so a repayment can be attributed to the loan it pays
  -- down even when a member holds more than one at the same cooperative.
  loan_id uuid references public.loans (id) on delete set null,

  description text,

  -- Clarix records what payroll already did; it never moves money (DECISIONS.md D004). Every
  -- row here is entered by cooperative staff, which is what `recorded_by` captures.
  recorded_by uuid references public.users (id) on delete set null,
  recorded_at timestamptz not null default now(),

  constraint savings_transactions_loan_only_on_repayment check (
    loan_id is null or type = 'loan_repayment'
  )
);

create index savings_transactions_membership_idx
  on public.savings_transactions (membership_id, recorded_at desc);
create index savings_transactions_loan_idx on public.savings_transactions (loan_id);

comment on table public.savings_transactions is
  'Per-membership ledger: contributions, recorded withdrawals, and loan repayments (DECISIONS.md D024).';

-- ---------------------------------------------------------------------------
-- Row-Level Security
--
-- An employee reads their own rows. Cooperative staff read and write the rows belonging to
-- their own cooperative, and nothing at another. Note what an employee CANNOT do: insert a loan
-- directly. Reserving capacity has to go through submit_loan_application(), because only that
-- function takes the advisory lock that makes the reservation safe under concurrency
-- (DECISIONS.md D008). Leaving out the insert policy is what forces that.
-- ---------------------------------------------------------------------------

alter table public.loans enable row level security;
alter table public.savings_transactions enable row level security;

create policy loans_select_own
  on public.loans for select to authenticated
  using (
    exists (
      select 1 from public.cooperative_memberships m
       where m.id = loans.membership_id and m.user_id = auth.uid()
    )
  );

create policy loans_select_staff
  on public.loans for select to authenticated
  using (
    exists (
      select 1 from public.cooperative_memberships m
       where m.id = loans.membership_id and public.is_active_staff(m.cooperative_id)
    )
  );

create policy loans_insert_staff
  on public.loans for insert to authenticated
  with check (
    exists (
      select 1 from public.cooperative_memberships m
       where m.id = loans.membership_id and public.is_active_staff(m.cooperative_id)
    )
  );

create policy loans_update_staff
  on public.loans for update to authenticated
  using (
    exists (
      select 1 from public.cooperative_memberships m
       where m.id = loans.membership_id and public.is_active_staff(m.cooperative_id)
    )
  )
  with check (
    exists (
      select 1 from public.cooperative_memberships m
       where m.id = loans.membership_id and public.is_active_staff(m.cooperative_id)
    )
  );

create policy savings_transactions_select_own
  on public.savings_transactions for select to authenticated
  using (
    exists (
      select 1 from public.cooperative_memberships m
       where m.id = savings_transactions.membership_id and m.user_id = auth.uid()
    )
  );

create policy savings_transactions_select_staff
  on public.savings_transactions for select to authenticated
  using (
    exists (
      select 1 from public.cooperative_memberships m
       where m.id = savings_transactions.membership_id
         and public.is_active_staff(m.cooperative_id)
    )
  );

create policy savings_transactions_insert_staff
  on public.savings_transactions for insert to authenticated
  with check (
    exists (
      select 1 from public.cooperative_memberships m
       where m.id = savings_transactions.membership_id
         and public.is_active_staff(m.cooperative_id)
    )
  );

create policy savings_transactions_update_staff
  on public.savings_transactions for update to authenticated
  using (
    exists (
      select 1 from public.cooperative_memberships m
       where m.id = savings_transactions.membership_id
         and public.is_active_staff(m.cooperative_id)
    )
  )
  with check (
    exists (
      select 1 from public.cooperative_memberships m
       where m.id = savings_transactions.membership_id
         and public.is_active_staff(m.cooperative_id)
    )
  );

grant select, insert, update on public.loans to authenticated;
grant select, insert, update on public.savings_transactions to authenticated;
revoke all on public.loans from anon;
revoke all on public.savings_transactions from anon;
