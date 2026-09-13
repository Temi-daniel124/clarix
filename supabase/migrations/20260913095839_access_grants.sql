-- Clarix — migration 025: the access-grant exception.
--
-- This is the only place in Clarix where a Super Admin can see a member's savings, loans or
-- salary, and SECURITY.md states the contract it has to meet: a non-blank, non-generic reason;
-- the affected cooperative's admin notified the moment a request naming them is submitted;
-- strictly time-boxed; read-only, never write; and every record viewed logged individually.
-- "If this flow is ever implemented without every one of the above properties, it is a security
-- bug, not a shortcut."
--
-- D030 settles the two things the blueprint left open: a grant self-activates an hour after it is
-- submitted rather than waiting for an approval nobody is recorded as giving, and it lasts 24
-- hours from activation.

create type public.access_grant_status as enum ('pending', 'active', 'expired', 'revoked');

comment on type public.access_grant_status is
  'The four states docs/DATA-MODEL.md names. Only ''pending'' and ''revoked'' are ever stored: ''active'' and ''expired'' are functions of the clock and are computed at read time, the same way a loan reservation''s expiry is (DECISIONS.md D024, D030).';

create table public.access_grants (
  id uuid primary key default gen_random_uuid(),

  requested_by uuid not null references public.users (id) on delete cascade,
  cooperative_id uuid not null references public.cooperatives (id) on delete cascade,

  -- Narrows the grant to one member. Null means the cooperative's records as a whole, which is
  -- what a discrepancy nobody can localise actually needs.
  member_user_id uuid references public.users (id) on delete cascade,

  -- Required, and long enough that "checking" does not pass. Length is a poor proxy for
  -- "non-generic" and it is the only one a CHECK constraint can enforce; the real defence is that
  -- this sentence is shown to the cooperative whose data is about to be read, and kept forever.
  reason text not null check (length(trim(reason)) >= 20),

  status public.access_grant_status not null default 'pending',

  requested_at timestamptz not null default now(),
  -- The delay D030 describes. Not in docs/DATA-MODEL.md's original list because the flow it
  -- described had no delay to represent.
  activates_at timestamptz not null,
  expires_at timestamptz not null,
  revoked_at timestamptz,

  constraint access_grants_window_is_forward check (expires_at > activates_at)
);

create index access_grants_requester_idx on public.access_grants (requested_by, requested_at desc);
create index access_grants_cooperative_idx on public.access_grants (cooperative_id, requested_at desc);

comment on table public.access_grants is
  'The one deliberate, logged exception to a Super Admin having no standing access to member financial data (super-admin blueprint 7.2, SECURITY.md, DECISIONS.md D030). No client write path exists: every state transition goes through a SECURITY DEFINER function, exactly as with audit_log.';

alter table public.access_grants enable row level security;

-- Readable by the operator who asked, and by the admin of the cooperative it names — who has the
-- stronger claim of the two. Deliberately NOT readable by the member concerned: they would learn
-- their records had been examined without being able to tell whether it was routine, which is a
-- worse outcome than the cooperative being accountable for it.
create policy access_grants_select_requester
  on public.access_grants for select to authenticated
  using (requested_by = auth.uid());

create policy access_grants_select_cooperative_admin
  on public.access_grants for select to authenticated
  using (public.is_active_cooperative_admin(cooperative_id));

-- No insert, update or delete policy, for the same reason audit_log has none.
grant select on public.access_grants to authenticated;
revoke all on public.access_grants from anon;

-- ---------------------------------------------------------------------------
-- has_active_access_grant() — the whole boundary, evaluated at read time
--
-- Every policy this migration adds asks this one question, so there is exactly one definition of
-- what "currently allowed to look" means. Expiry is arithmetic against `now()` rather than a
-- stored flag, so a grant stops working the instant it lapses without anything having to run
-- (D024's rule, applied to the far more sensitive case).
-- ---------------------------------------------------------------------------

create or replace function public.has_active_access_grant(
  target_cooperative_id uuid,
  target_member uuid default null
)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $fn$
  select exists (
    select 1
      from public.access_grants g
     where g.requested_by = auth.uid()
       and g.cooperative_id = target_cooperative_id
       and g.status <> 'revoked'
       and now() >= g.activates_at
       and now() < g.expires_at
       and (g.member_user_id is null or g.member_user_id = target_member)
  );
$fn$;

comment on function public.has_active_access_grant(uuid, uuid) is
  'Whether the caller holds a grant that is live right now for this cooperative, and for this member if the grant was narrowed to one. Called from inside policies, so EXECUTE stays with authenticated as it does for is_active_staff().';

revoke execute on function public.has_active_access_grant(uuid, uuid) from public, anon;
grant execute on function public.has_active_access_grant(uuid, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- The reads a live grant opens — and nothing else
--
-- These are real select policies on the real tables, not another aggregate function. That is the
-- point of this whole mechanism: sometimes a row genuinely has to be looked at, and the honest
-- answer is to make that possible, visibly and briefly, rather than to invent a summary that
-- avoids the question.
--
-- There is no insert, update or delete policy here for anybody holding a grant, anywhere. The
-- view is read-only in the database, not in the interface.
-- ---------------------------------------------------------------------------

create policy cooperative_memberships_select_granted
  on public.cooperative_memberships for select to authenticated
  using (public.has_active_access_grant(cooperative_id, user_id));

create policy users_select_granted
  on public.users for select to authenticated
  using (
    exists (
      select 1 from public.cooperative_memberships m
       where m.user_id = public.users.id
         and public.has_active_access_grant(m.cooperative_id, m.user_id)
    )
  );

create policy savings_transactions_select_granted
  on public.savings_transactions for select to authenticated
  using (
    exists (
      select 1 from public.cooperative_memberships m
       where m.id = savings_transactions.membership_id
         and public.has_active_access_grant(m.cooperative_id, m.user_id)
    )
  );

create policy loans_select_granted
  on public.loans for select to authenticated
  using (
    exists (
      select 1 from public.cooperative_memberships m
       where m.id = loans.membership_id
         and public.has_active_access_grant(m.cooperative_id, m.user_id)
    )
  );

create policy deduction_reconciliation_select_granted
  on public.deduction_reconciliation for select to authenticated
  using (
    exists (
      select 1 from public.cooperative_memberships m
       where m.id = deduction_reconciliation.membership_id
         and public.has_active_access_grant(m.cooperative_id, m.user_id)
    )
  );

-- The eligibility panel is part of what blueprint 7.3 asks this view to show, and its staff door
-- refuses anybody who is not active staff. A live grant is the second legitimate caller.
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

  if not (
    public.is_active_staff(v_cooperative)
    or public.has_active_access_grant(v_cooperative, v_user)
  ) then
    raise exception 'Only this cooperative''s staff may look up this member' using errcode = '42501';
  end if;

  return query select * from public.capacity_core(v_user, proposed_monthly_repayment);
end;
$fn$;

revoke execute on function public.capacity_for_membership(uuid, numeric) from public, anon;
grant execute on function public.capacity_for_membership(uuid, numeric) to authenticated;
