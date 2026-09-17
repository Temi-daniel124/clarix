-- Clarix, migration 010: what a cooperative admin needs to set a cooperative up.
--
-- DECISIONS.md D027 and D028, both written before this file per the PLAN step in
-- docs/DEVELOPMENT-WORKFLOW.md. Neither of these tables is in docs/DATA-MODEL.md, and the two
-- decision entries are what add them.
--
-- Two problems the cooperative admin blueprint (Part 2) runs into that the employee side never
-- did, and neither can be solved by a policy alone:
--
--   1. **Inviting somebody who may not have a Clarix account yet.** `cooperative_staff_roles`
--      requires a `user_id`, so it can only ever record an invitation to somebody who already
--      exists. An admin inviting an officer by email cannot even look that email up: no policy
--      lets one person read another's `users` row unless they already share a cooperative, and
--      widening that policy to make invitations work would mean widening it for everything else
--      too. Hence `staff_invitations`, keyed by email, plus two SECURITY DEFINER functions.
--
--   2. **Importing a roster of members who do not have accounts yet** (blueprint 2.4,
--      MVP-SCOPE.md P0 #2). A membership needs a `user_id`; a spreadsheet has an IPPIS number
--      and a savings balance. Hence `member_roster_entries`: what the cooperative knows about
--      its own members, which becomes a real membership the moment that person joins Clarix.
--
-- RLS, as always, in the same migration.

-- ---------------------------------------------------------------------------
-- staff_invitations: an invitation to an email address, not to an account
-- ---------------------------------------------------------------------------

create table public.staff_invitations (
  id uuid primary key default gen_random_uuid(),
  cooperative_id uuid not null references public.cooperatives (id) on delete cascade,

  -- Stored lowercased so that one address cannot be invited twice under different casing, and
  -- so the claim lookup is an equality match rather than a case-insensitive scan.
  email text not null check (email = lower(email) and position('@' in email) > 1),

  -- What they are being invited to be. Admin invitations exist here too: a cooperative's first
  -- admin is created by the Super Admin, but a second one is invited by the first.
  role public.staff_role not null,

  -- The permission preset from blueprint 2.5. Finer-grained toggles live on the staff role row
  -- itself once the invitation is claimed; this carries only what the inviting screen asked for.
  permissions jsonb not null default '{}'::jsonb
    check (jsonb_typeof(permissions) = 'object'),

  -- The cosmetic title a cooperative may use instead of "Officer", Treasurer, Secretary.
  title text,

  invited_by uuid references public.users (id) on delete set null,
  invited_at timestamptz not null default now(),

  -- Set when the invitation turns into a real cooperative_staff_roles row. Kept rather than
  -- deleted, so an admin can see that an invitation was taken up and when.
  claimed_at timestamptz,
  claimed_by uuid references public.users (id) on delete set null,

  constraint staff_invitations_one_open_per_email
    unique (cooperative_id, email, role)
);

create index staff_invitations_email_open_idx
  on public.staff_invitations (email) where claimed_at is null;

comment on table public.staff_invitations is
  'Officer/admin invitations addressed to an email that may not have a Clarix account yet (DECISIONS.md D027). Claimed into cooperative_staff_roles by public.claim_staff_invitations().';

alter table public.staff_invitations enable row level security;

-- Only the cooperative's own staff see its invitations, and only its admin may issue or cancel
-- one. The invitee deliberately has no read policy: they never need to browse invitations, and
-- the claim function below hands them exactly the one addressed to them.
create policy staff_invitations_select_staff
  on public.staff_invitations for select to authenticated
  using (public.is_active_staff(cooperative_id));

create policy staff_invitations_delete_admin
  on public.staff_invitations for delete to authenticated
  using (public.is_active_cooperative_admin(cooperative_id));

-- No insert or update policy: writing an invitation goes through public.invite_cooperative_staff()
-- below, which is what checks that the caller is this cooperative's admin AND resolves the email
-- to an existing account where there is one.

grant select, delete on public.staff_invitations to authenticated;
revoke all on public.staff_invitations from anon;

-- ---------------------------------------------------------------------------
-- member_roster_entries: the cooperative's own record of a member
-- ---------------------------------------------------------------------------

create table public.member_roster_entries (
  id uuid primary key default gen_random_uuid(),
  cooperative_id uuid not null references public.cooperatives (id) on delete cascade,

  -- The IPPIS number as it appeared in the cooperative's spreadsheet. This is the join key: it
  -- is what the cooperative knows about a person before that person has an account.
  employee_id text not null check (length(trim(employee_id)) > 0),

  name text,

  savings_balance numeric(14, 2) not null default 0
    check (savings_balance >= 0),

  -- Set when this entry becomes a real membership, either because the person already had an
  -- account at import time or because they joined afterwards.
  membership_id uuid references public.cooperative_memberships (id) on delete set null,
  linked_at timestamptz,

  imported_by uuid references public.users (id) on delete set null,
  imported_at timestamptz not null default now(),

  -- One row per person per cooperative. A second import of the same sheet updates rather than
  -- duplicates, which is what makes re-importing a corrected file safe.
  constraint member_roster_entries_one_per_employee
    unique (cooperative_id, employee_id)
);

create index member_roster_entries_unlinked_idx
  on public.member_roster_entries (employee_id) where membership_id is null;

comment on table public.member_roster_entries is
  'A cooperative''s imported member roster (blueprint 2.4, DECISIONS.md D028). An entry becomes a cooperative_membership when that person joins Clarix, see the link_roster_entry trigger.';

alter table public.member_roster_entries enable row level security;

-- A roster entry carries another person's IPPIS number and savings balance, so it is staff-only
-- and cooperative-scoped, exactly like the memberships it turns into. An employee never reads
-- this table: the trigger below acts on their behalf without showing them anything.
create policy member_roster_entries_select_staff
  on public.member_roster_entries for select to authenticated
  using (public.is_active_staff(cooperative_id));

create policy member_roster_entries_insert_staff
  on public.member_roster_entries for insert to authenticated
  with check (public.is_active_staff(cooperative_id));

create policy member_roster_entries_update_staff
  on public.member_roster_entries for update to authenticated
  using (public.is_active_staff(cooperative_id))
  with check (public.is_active_staff(cooperative_id));

create policy member_roster_entries_delete_admin
  on public.member_roster_entries for delete to authenticated
  using (public.is_active_cooperative_admin(cooperative_id));

grant select, insert, update, delete on public.member_roster_entries to authenticated;
revoke all on public.member_roster_entries from anon;

-- ---------------------------------------------------------------------------
-- invite_cooperative_staff(), issue an invitation by email
--
-- SECURITY.md, "Elevated database privileges". This needs to resolve an email address to an
-- account across the whole organization, which no RLS policy on `users` permits and none should:
-- `users_select_own_cooperative_members` deliberately limits an officer to people who already
-- belong to their cooperative, and an invitee by definition does not yet.
--
-- What keeps it narrow: it verifies the caller is this cooperative's active admin before doing
-- anything, it returns no part of the resolved user's record: only whether an account already
-- existed, and it writes nothing anywhere else.
-- ---------------------------------------------------------------------------

create or replace function public.invite_cooperative_staff(
  target_cooperative_id uuid,
  invite_email text,
  invite_role public.staff_role default 'officer',
  invite_permissions jsonb default '{}'::jsonb,
  invite_title text default null
)
returns table (
  invitation_id uuid,
  had_account boolean,
  already_staff boolean
)
language plpgsql
security definer
set search_path = public, pg_temp
as $fn$
declare
  v_caller uuid := auth.uid();
  v_email text := lower(trim(invite_email));
  v_user_id uuid;
  v_invitation_id uuid;
begin
  if v_caller is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;

  if not public.is_active_cooperative_admin(target_cooperative_id) then
    raise exception 'only this cooperative''s admin may invite staff' using errcode = '42501';
  end if;

  if v_email is null or position('@' in v_email) < 2 then
    raise exception 'a valid email address is required' using errcode = '22023';
  end if;

  select u.id into v_user_id from public.users u where lower(u.email) = v_email limit 1;

  if v_user_id is not null then
    -- The person already has an account, so the invitation can be the real thing: a staff role
    -- row sitting at 'invited' until they accept it. `cooperative_staff_roles` already carries
    -- the accept-your-own-invite policy from migration 001, so nothing else is needed.
    if exists (
      select 1 from public.cooperative_staff_roles r
       where r.user_id = v_user_id
         and r.cooperative_id = target_cooperative_id
         and r.role = invite_role
         and r.status <> 'revoked'
    ) then
      return query select null::uuid, true, true;
      return;
    end if;

    insert into public.cooperative_staff_roles
      (user_id, cooperative_id, role, status, permissions, title, granted_by)
    values
      (v_user_id, target_cooperative_id, invite_role, 'invited', invite_permissions,
       invite_title, v_caller);

    return query select null::uuid, true, false;
    return;
  end if;

  -- No account yet: hold the invitation against the email address until there is one.
  insert into public.staff_invitations
    (cooperative_id, email, role, permissions, title, invited_by)
  values
    (target_cooperative_id, v_email, invite_role, invite_permissions, invite_title, v_caller)
  on conflict (cooperative_id, email, role) do update
    set permissions = excluded.permissions,
        title = excluded.title,
        invited_by = excluded.invited_by,
        invited_at = now(),
        claimed_at = null,
        claimed_by = null
  returning id into v_invitation_id;

  return query select v_invitation_id, false, false;
end;
$fn$;

revoke execute on function public.invite_cooperative_staff(uuid, text, public.staff_role, jsonb, text) from public, anon;
grant execute on function public.invite_cooperative_staff(uuid, text, public.staff_role, jsonb, text) to authenticated;

-- ---------------------------------------------------------------------------
-- claim_staff_invitations(), turn invitations addressed to me into real roles
--
-- Also elevated, and for the mirror-image reason: the caller must be able to find the rows
-- addressed to their own email in `staff_invitations`, a table whose only select policy is
-- "staff of that cooperative", which they are not yet. It reads the caller's email from their
-- own `users` row rather than from an argument, so it can only ever claim invitations addressed
-- to the person calling it.
-- ---------------------------------------------------------------------------

create or replace function public.claim_staff_invitations()
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $fn$
declare
  v_caller uuid := auth.uid();
  v_email text;
  v_claimed integer := 0;
  v_invitation record;
begin
  if v_caller is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;

  select lower(u.email) into v_email from public.users u where u.id = v_caller;
  if v_email is null then
    return 0;
  end if;

  for v_invitation in
    select * from public.staff_invitations
     where email = v_email and claimed_at is null
     for update
  loop
    insert into public.cooperative_staff_roles
      (user_id, cooperative_id, role, status, permissions, title, granted_by)
    values
      (v_caller, v_invitation.cooperative_id, v_invitation.role, 'invited',
       v_invitation.permissions, v_invitation.title, v_invitation.invited_by)
    on conflict (user_id, cooperative_id, role) do nothing;

    update public.staff_invitations
       set claimed_at = now(), claimed_by = v_caller
     where id = v_invitation.id;

    v_claimed := v_claimed + 1;
  end loop;

  return v_claimed;
end;
$fn$;

revoke execute on function public.claim_staff_invitations() from public, anon;
grant execute on function public.claim_staff_invitations() to authenticated;

-- ---------------------------------------------------------------------------
-- link_roster_entry(): a membership meets the roster that was waiting for it
--
-- Runs as a trigger on `cooperative_memberships`, SECURITY DEFINER because the employee
-- inserting their own membership has no read access to `member_roster_entries` and must not
-- gain any: the roster carries other people's IPPIS numbers and balances.
--
-- What it does is narrow and mechanical: if this cooperative's roster holds an unlinked entry
-- whose employee_id matches the joining person's own, the two are linked, the savings balance
-- the cooperative already recorded is carried onto the membership, and the membership is
-- activated, because a cooperative that imported someone has already decided they are a member.
-- It reads only that one entry and returns nothing to the caller.
-- ---------------------------------------------------------------------------

create or replace function public.link_roster_entry()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $fn$
declare
  v_employee_id text;
  v_entry public.member_roster_entries;
begin
  select u.employee_id into v_employee_id from public.users u where u.id = new.user_id;
  if v_employee_id is null then
    return new;
  end if;

  select * into v_entry
    from public.member_roster_entries e
   where e.cooperative_id = new.cooperative_id
     and e.employee_id = v_employee_id
     and e.membership_id is null
   limit 1;

  if not found then
    return new;
  end if;

  new.status := 'active';
  new.joined_at := coalesce(new.joined_at, now());
  new.savings_balance := v_entry.savings_balance;

  return new;
end;
$fn$;

-- The second half, after the row exists and therefore has an id for the entry to point at. It
-- repeats the same lookup rather than passing state between the two triggers: the lookup is a
-- single indexed read, and a relay would be one more thing able to hold member data.
create or replace function public.apply_roster_link()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $fn$
declare
  v_employee_id text;
begin
  select u.employee_id into v_employee_id from public.users u where u.id = new.user_id;
  if v_employee_id is null then
    return null;
  end if;

  update public.member_roster_entries e
     set membership_id = new.id, linked_at = now()
   where e.cooperative_id = new.cooperative_id
     and e.employee_id = v_employee_id
     and e.membership_id is null;

  return null;
end;
$fn$;

create trigger cooperative_memberships_link_roster
  before insert on public.cooperative_memberships
  for each row execute function public.link_roster_entry();

create trigger cooperative_memberships_apply_roster_link
  after insert on public.cooperative_memberships
  for each row execute function public.apply_roster_link();

revoke execute on function public.link_roster_entry() from public, anon, authenticated;
revoke execute on function public.apply_roster_link() from public, anon, authenticated;
