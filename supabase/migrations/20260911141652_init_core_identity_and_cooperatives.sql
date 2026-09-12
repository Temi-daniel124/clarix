-- Clarix — migration 001: core identity and cooperative tables, with RLS.
--
-- Covers the first six tables of docs/DATA-MODEL.md: organizations, users, cooperatives,
-- cooperative_memberships, cooperative_staff_roles, platform_admins.
--
-- Every table here carries organization_id or cooperative_id, so per docs/DATA-MODEL.md
-- ("Migration discipline") and SECURITY.md, each one ships its RLS policies in THIS migration
-- rather than a follow-up. DECISIONS.md D011: RLS is the enforcement boundary, not the UI.
--
-- Seeds the single organizations row for Federal Medical Centre, Abeokuta (DECISIONS.md D019,
-- single-organization data model for v1) with the D007 deduction policy defaults.

-- ---------------------------------------------------------------------------
-- Enumerated types
-- ---------------------------------------------------------------------------

create type public.deduction_basis as enum ('gross', 'net');
create type public.cooperative_status as enum ('active', 'inactive');
create type public.membership_status as enum ('pending', 'active', 'suspended');
create type public.staff_role as enum ('admin', 'officer');
create type public.staff_role_status as enum ('invited', 'active', 'revoked');

-- ---------------------------------------------------------------------------
-- organizations
-- ---------------------------------------------------------------------------

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,

  -- Label and validation pattern for the employer's staff identifier. For FMC Abeokuta this is
  -- the IPPIS number, a six-digit numeric value (docs/planning/clarix-employee-ux-blueprint.md 2.2).
  employee_id_label text not null default 'IPPIS number',
  employee_id_pattern text not null default '^[0-9]{6}$',

  -- DECISIONS.md D007. Editable by Super Admin only; cooperatives inherit and cannot override.
  deduction_basis public.deduction_basis not null default 'gross',
  deduction_max_percentage numeric(5, 2) not null default 33.30
    check (deduction_max_percentage > 0 and deduction_max_percentage <= 100),

  -- DECISIONS.md D009: the org-wide default AND the ceiling a cooperative may only shorten.
  reservation_expiry_days_default integer not null default 7
    check (reservation_expiry_days_default between 1 and 90),

  created_at timestamptz not null default now()
);

comment on table public.organizations is
  'Employer hosting the cooperatives. v1 populates exactly one row (DECISIONS.md D019).';

-- ---------------------------------------------------------------------------
-- users
--
-- One row per Clarix account, keyed 1:1 to a Supabase Auth user (DECISIONS.md D010: one account
-- per email regardless of how many cooperatives the person touches). Credentials live in
-- auth.users, which is why docs/DATA-MODEL.md's illustrative `password_hash` column is absent
-- here -- see DECISIONS.md D021.
-- ---------------------------------------------------------------------------

create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  organization_id uuid not null references public.organizations (id) on delete restrict,

  -- Null until the employee completes the employee-ID step of onboarding (blueprint 2.2).
  employee_id text,
  name text,
  email text,
  phone text,

  -- Null until the payslip review step is confirmed (blueprint 2.4). Never parsed from
  -- deduction lines -- DECISIONS.md D006.
  salary_gross numeric(14, 2) check (salary_gross is null or salary_gross >= 0),
  salary_net numeric(14, 2) check (salary_net is null or salary_net >= 0),
  salary_verified_at timestamptz,

  created_at timestamptz not null default now(),

  constraint users_employee_id_unique_per_org unique (organization_id, employee_id),
  constraint users_contact_present check (email is not null or phone is not null)
);

create index users_organization_id_idx on public.users (organization_id);

comment on column public.users.employee_id is
  'IPPIS number for FMC Abeokuta. Unique within the organization; null until onboarding step 2.2.';

-- ---------------------------------------------------------------------------
-- platform_admins  (Super Admin is a platform-level flag, not a cooperative-scoped role)
-- ---------------------------------------------------------------------------

create table public.platform_admins (
  user_id uuid primary key references public.users (id) on delete cascade,
  granted_at timestamptz not null default now()
);

comment on table public.platform_admins is
  'Super Admins. Deliberately grants NO standing access to cooperative member financial data (ROLES-AND-PERMISSIONS.md); that requires the separate, time-boxed access_grants flow.';

-- ---------------------------------------------------------------------------
-- cooperatives
-- ---------------------------------------------------------------------------

create table public.cooperatives (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete restrict,
  name text not null,

  -- Discovery-visible public fields (MVP-SCOPE.md P0 #11).
  description text,
  requirements text,

  status public.cooperative_status not null default 'active',

  min_savings_ratio_default numeric(4, 3) not null default 0.250
    check (min_savings_ratio_default > 0 and min_savings_ratio_default <= 1),

  -- DECISIONS.md D009: may only SHORTEN the org default, never lengthen it. Enforced at write
  -- time by the trigger below, since a CHECK constraint cannot reach the organizations row.
  reservation_expiry_days_override integer
    check (reservation_expiry_days_override is null or reservation_expiry_days_override >= 1),

  created_at timestamptz not null default now(),

  constraint cooperatives_name_unique_per_org unique (organization_id, name)
);

create index cooperatives_organization_id_idx on public.cooperatives (organization_id);

create or replace function public.enforce_reservation_expiry_ceiling()
returns trigger
language plpgsql
as $fn$
declare
  org_default integer;
begin
  if new.reservation_expiry_days_override is null then
    return new;
  end if;

  select o.reservation_expiry_days_default
    into org_default
    from public.organizations o
   where o.id = new.organization_id;

  if new.reservation_expiry_days_override > org_default then
    raise exception
      'reservation_expiry_days_override (%) may only be shorter than the organization default (%)',
      new.reservation_expiry_days_override, org_default
      using errcode = 'check_violation';
  end if;

  return new;
end;
$fn$;

create trigger cooperatives_reservation_expiry_ceiling
  before insert or update of reservation_expiry_days_override, organization_id
  on public.cooperatives
  for each row
  execute function public.enforce_reservation_expiry_ceiling();

-- ---------------------------------------------------------------------------
-- cooperative_memberships  (beneficiary / savings-holding relationship)
-- ---------------------------------------------------------------------------

create table public.cooperative_memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  cooperative_id uuid not null references public.cooperatives (id) on delete cascade,
  status public.membership_status not null default 'pending',
  savings_balance numeric(14, 2) not null default 0 check (savings_balance >= 0),
  joined_at timestamptz,
  created_at timestamptz not null default now(),

  constraint cooperative_memberships_user_coop_unique unique (user_id, cooperative_id)
);

create index cooperative_memberships_user_id_idx on public.cooperative_memberships (user_id);
create index cooperative_memberships_cooperative_id_idx
  on public.cooperative_memberships (cooperative_id);

comment on table public.cooperative_memberships is
  'Beneficiary membership. Deliberately separate from cooperative_staff_roles (DECISIONS.md D010).';

-- ---------------------------------------------------------------------------
-- cooperative_staff_roles  (admin / officer)
-- ---------------------------------------------------------------------------

create table public.cooperative_staff_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  cooperative_id uuid not null references public.cooperatives (id) on delete cascade,
  role public.staff_role not null,

  -- Cosmetic display label ('Treasurer', 'Secretary'). Never changes permissions.
  title text,

  -- Boolean flags, meaningful only when role = 'officer'; admins hold full cooperative
  -- permissions implicitly. Default-deny (ROLES-AND-PERMISSIONS.md).
  permissions jsonb not null default '{}'::jsonb,

  granted_by uuid references public.users (id) on delete set null,
  status public.staff_role_status not null default 'invited',
  invited_at timestamptz not null default now(),
  accepted_at timestamptz,

  constraint cooperative_staff_roles_unique unique (user_id, cooperative_id, role)
);

create index cooperative_staff_roles_user_id_idx on public.cooperative_staff_roles (user_id);
create index cooperative_staff_roles_cooperative_id_idx
  on public.cooperative_staff_roles (cooperative_id);
create index cooperative_staff_roles_active_lookup_idx
  on public.cooperative_staff_roles (user_id, cooperative_id, status);

-- ---------------------------------------------------------------------------
-- RLS helper functions
--
-- SECURITY DEFINER with a pinned search_path. These read cooperative_staff_roles from inside
-- policies that are themselves attached to cooperative_staff_roles, so they must bypass RLS to
-- avoid infinite policy recursion. They take no free-form input and return only booleans.
-- ---------------------------------------------------------------------------

create or replace function public.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $fn$
  select exists (
    select 1 from public.platform_admins pa where pa.user_id = auth.uid()
  );
$fn$;

create or replace function public.is_active_staff(target_cooperative_id uuid)
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
  );
$fn$;

create or replace function public.is_active_cooperative_admin(target_cooperative_id uuid)
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
       and r.role = 'admin'
       and r.status = 'active'
  );
$fn$;

revoke execute on function public.is_platform_admin() from public, anon;
revoke execute on function public.is_active_staff(uuid) from public, anon;
revoke execute on function public.is_active_cooperative_admin(uuid) from public, anon;
grant execute on function public.is_platform_admin() to authenticated;
grant execute on function public.is_active_staff(uuid) to authenticated;
grant execute on function public.is_active_cooperative_admin(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Row-Level Security
--
-- Every policy below targets the `authenticated` role only. Nothing in this migration is
-- readable by `anon` -- the landing page and auth screens need no database read at all.
-- ---------------------------------------------------------------------------

alter table public.organizations            enable row level security;
alter table public.users                    enable row level security;
alter table public.platform_admins          enable row level security;
alter table public.cooperatives             enable row level security;
alter table public.cooperative_memberships  enable row level security;
alter table public.cooperative_staff_roles  enable row level security;

-- organizations ---------------------------------------------------------------
-- Readable by any signed-in user: onboarding needs employee_id_pattern, and every eligibility
-- figure needs deduction_basis / deduction_max_percentage. Contains no member data.

create policy organizations_select_authenticated
  on public.organizations for select to authenticated
  using (true);

create policy organizations_update_platform_admin
  on public.organizations for update to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

create policy organizations_insert_platform_admin
  on public.organizations for insert to authenticated
  with check (public.is_platform_admin());

-- users -----------------------------------------------------------------------
-- A person always sees their own row. Cooperative staff see the rows of people who hold a
-- membership at THEIR cooperative, and nobody else's -- this is the structural fix for the
-- "/member/1234 -> /member/1235" leak (DECISIONS.md D011).
-- Super Admin is deliberately absent: no standing access to member financial data.

create policy users_select_own
  on public.users for select to authenticated
  using (id = auth.uid());

create policy users_select_own_cooperative_members
  on public.users for select to authenticated
  using (
    exists (
      select 1
        from public.cooperative_memberships m
       where m.user_id = public.users.id
         and public.is_active_staff(m.cooperative_id)
    )
  );

create policy users_insert_own
  on public.users for insert to authenticated
  with check (id = auth.uid());

create policy users_update_own
  on public.users for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- platform_admins -------------------------------------------------------------
-- Readable only by the Super Admin it describes. Membership of this table is granted
-- out-of-band (service role / SQL), never through the client API.

create policy platform_admins_select_own
  on public.platform_admins for select to authenticated
  using (user_id = auth.uid());

-- cooperatives ----------------------------------------------------------------
-- The public profile is discovery-visible to any signed-in employee (MVP-SCOPE.md P0 #11);
-- joining is what unlocks member data on the OTHER tables, not on this one.

create policy cooperatives_select_authenticated
  on public.cooperatives for select to authenticated
  using (true);

create policy cooperatives_insert_platform_admin
  on public.cooperatives for insert to authenticated
  with check (public.is_platform_admin());

create policy cooperatives_update_own_admin
  on public.cooperatives for update to authenticated
  using (public.is_active_cooperative_admin(id) or public.is_platform_admin())
  with check (public.is_active_cooperative_admin(id) or public.is_platform_admin());

-- cooperative_memberships -----------------------------------------------------

create policy cooperative_memberships_select_own
  on public.cooperative_memberships for select to authenticated
  using (user_id = auth.uid());

create policy cooperative_memberships_select_staff
  on public.cooperative_memberships for select to authenticated
  using (public.is_active_staff(cooperative_id));

-- An employee applies to join on their own behalf; the application lands as 'pending' and only
-- cooperative staff may move it onward.
create policy cooperative_memberships_insert_own_pending
  on public.cooperative_memberships for insert to authenticated
  with check (user_id = auth.uid() and status = 'pending');

create policy cooperative_memberships_insert_staff
  on public.cooperative_memberships for insert to authenticated
  with check (public.is_active_staff(cooperative_id));

create policy cooperative_memberships_update_staff
  on public.cooperative_memberships for update to authenticated
  using (public.is_active_staff(cooperative_id))
  with check (public.is_active_staff(cooperative_id));

create policy cooperative_memberships_delete_admin
  on public.cooperative_memberships for delete to authenticated
  using (public.is_active_cooperative_admin(cooperative_id));

-- cooperative_staff_roles -----------------------------------------------------
-- Holding an active role at cooperative A grants nothing at cooperative B: every check is
-- scoped by cooperative_id (ROLES-AND-PERMISSIONS.md, "Multi-role accounts").

create policy cooperative_staff_roles_select_own
  on public.cooperative_staff_roles for select to authenticated
  using (user_id = auth.uid());

create policy cooperative_staff_roles_select_same_cooperative
  on public.cooperative_staff_roles for select to authenticated
  using (public.is_active_staff(cooperative_id));

-- Super Admin seeds a cooperative's first Admin; that Admin then invites their own officers.
create policy cooperative_staff_roles_insert_admin
  on public.cooperative_staff_roles for insert to authenticated
  with check (
    public.is_platform_admin()
    or public.is_active_cooperative_admin(cooperative_id)
  );

create policy cooperative_staff_roles_update_admin
  on public.cooperative_staff_roles for update to authenticated
  using (
    public.is_platform_admin()
    or public.is_active_cooperative_admin(cooperative_id)
  )
  with check (
    public.is_platform_admin()
    or public.is_active_cooperative_admin(cooperative_id)
  );

-- An invited person accepts their own invitation, moving it 'invited' -> 'active'. They cannot
-- grant themselves a role that was never issued, because INSERT above is admin-only.
create policy cooperative_staff_roles_accept_own_invite
  on public.cooperative_staff_roles for update to authenticated
  using (user_id = auth.uid() and status = 'invited')
  with check (user_id = auth.uid() and status = 'active');

create policy cooperative_staff_roles_delete_admin
  on public.cooperative_staff_roles for delete to authenticated
  using (
    public.is_platform_admin()
    or public.is_active_cooperative_admin(cooperative_id)
  );

-- ---------------------------------------------------------------------------
-- Signup: create the public.users row alongside the auth.users row
--
-- Runs as a SECURITY DEFINER trigger rather than a service-role-key code path in the app, so
-- the account row cannot end up missing if the client aborts between the two writes, and so
-- SECURITY.md's service-role-key surface stays empty.
--
-- v1 has exactly one organization (DECISIONS.md D019), so new accounts attach to it directly.
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $fn$
declare
  default_org_id uuid;
begin
  select o.id into default_org_id
    from public.organizations o
   order by o.created_at asc
   limit 1;

  if default_org_id is null then
    raise exception 'No organizations row exists; cannot attach the new account to an employer.';
  end if;

  insert into public.users (id, organization_id, email, phone, name)
  values (
    new.id,
    default_org_id,
    new.email,
    new.phone,
    nullif(new.raw_user_meta_data ->> 'name', '')
  )
  on conflict (id) do nothing;

  return new;
end;
$fn$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_auth_user();

-- ---------------------------------------------------------------------------
-- Seed: the single v1 organization (DECISIONS.md D007, D009, D019)
-- ---------------------------------------------------------------------------

insert into public.organizations (
  name,
  employee_id_label,
  employee_id_pattern,
  deduction_basis,
  deduction_max_percentage,
  reservation_expiry_days_default
)
select
  'Federal Medical Centre, Abeokuta',
  'IPPIS number',
  '^[0-9]{6}$',
  'gross',
  33.30,
  7
where not exists (select 1 from public.organizations);
