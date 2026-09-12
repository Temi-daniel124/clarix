-- Clarix — migration 005: cooperative_loan_products.
--
-- docs/DATA-MODEL.md § cooperative_loan_products. Needed by the Cooperative Discovery Profile's
-- "Benefits and packages" section (employee blueprint 4.4), which describes a cooperative's loan
-- products and their minimum-savings requirements in plain terms.
--
-- This migration adds the table only. The eligibility and reservation logic that will eventually
-- read `min_savings_ratio` belongs to the loan slice (blueprint 5.5, DECISIONS.md D008) and is
-- deliberately not here.
--
-- RLS, as always, in the same migration.

create table public.cooperative_loan_products (
  id uuid primary key default gen_random_uuid(),
  cooperative_id uuid not null references public.cooperatives (id) on delete cascade,

  name text not null,

  -- The share of the requested amount a member must already hold in savings. Stored as a
  -- fraction (0.35), rendered as a percentage. Defaults are inherited from the cooperative's
  -- min_savings_ratio_default when a product does not override it — the application decides
  -- that, so the column stays required here and explicit per product.
  min_savings_ratio numeric(4, 3) not null
    check (min_savings_ratio > 0 and min_savings_ratio <= 1),

  max_tenure_months integer not null check (max_tenure_months between 1 and 120),

  -- Free text on purpose. DATA-MODEL.md is explicit that interest is "not modeled deeply in v1",
  -- and a half-modelled interest structure would invite the eligibility engine to start reading
  -- it, which DECISIONS.md D018 does not want.
  interest_terms text,

  -- Whether this product appears on the public discovery profile. A cooperative may run products
  -- it does not advertise.
  is_public boolean not null default true,

  created_at timestamptz not null default now(),

  constraint cooperative_loan_products_name_unique_per_coop unique (cooperative_id, name)
);

create index cooperative_loan_products_cooperative_id_idx
  on public.cooperative_loan_products (cooperative_id);

comment on table public.cooperative_loan_products is
  'Loan products a cooperative offers. The public ones appear on its discovery profile (blueprint 4.4).';

-- ---------------------------------------------------------------------------
-- Row-Level Security
--
-- Read access is deliberately wider than most of this schema, and that is safe: a loan product
-- describes what a cooperative offers, not what any member owes. It carries no member data at
-- all. Discovery would be pointless if an employee had to join a cooperative before they could
-- see what it lends (MVP-SCOPE.md P0 #11).
--
-- Write access stays with the cooperative's own active admin, matching every other
-- cooperative-owned setting.
-- ---------------------------------------------------------------------------

alter table public.cooperative_loan_products enable row level security;

create policy cooperative_loan_products_select_public
  on public.cooperative_loan_products for select to authenticated
  using (is_public);

-- Staff see their own cooperative's full catalogue, advertised or not.
create policy cooperative_loan_products_select_staff
  on public.cooperative_loan_products for select to authenticated
  using (public.is_active_staff(cooperative_id));

create policy cooperative_loan_products_insert_admin
  on public.cooperative_loan_products for insert to authenticated
  with check (public.is_active_cooperative_admin(cooperative_id));

create policy cooperative_loan_products_update_admin
  on public.cooperative_loan_products for update to authenticated
  using (public.is_active_cooperative_admin(cooperative_id))
  with check (public.is_active_cooperative_admin(cooperative_id));

create policy cooperative_loan_products_delete_admin
  on public.cooperative_loan_products for delete to authenticated
  using (public.is_active_cooperative_admin(cooperative_id));

grant select, insert, update, delete on public.cooperative_loan_products to authenticated;
revoke all on public.cooperative_loan_products from anon;
