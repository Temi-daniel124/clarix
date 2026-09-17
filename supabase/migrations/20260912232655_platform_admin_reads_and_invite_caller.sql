-- Clarix, migration 019: what a Super Admin may see, and one more legitimate caller for the
-- invitation function.
--
-- ---------------------------------------------------------------------------
-- 1. The reading problem this solves
--
-- A Super Admin can read `cooperatives`. That policy is open to every signed-in user, because
-- the discovery screens need it. They can read nothing else that the Platform Dashboard (4.1) and
-- Cooperative Management (Part 5) ask for: `cooperative_memberships` takes a staff permission,
-- `cooperative_staff_roles` and `staff_invitations` take being staff of that cooperative, and
-- another person's `users` row takes staffing a cooperative they belong to. A Super Admin is none
-- of those things anywhere, deliberately.
--
-- The tempting fix is a platform-admin escape hatch on each of those policies. That is exactly
-- what ROLES-AND-PERMISSIONS.md forbids: "Super Admin has no standing access to member financial
-- detail ... a hard requirement, not a convenience shortcut, even for debugging." A select policy
-- admitting platform admins to `cooperative_memberships` would hand this role every member's
-- savings balance, to render a number on a card.
--
-- So the access is shaped like the question instead of like the table. These functions return
-- counts, a cooperative's own facts, and the name and email of its **staff** Admin, never a row
-- of membership or financial data, never a member's name, never a balance. The Super Admin
-- blueprint draws its boundary around "any member's savings, loans, or salary detail"; a headcount
-- and the person you invited to run a cooperative are on the other side of that line.
--
-- Reaching actual member data stays where it belongs: the time-boxed, logged `access_grants` flow
-- (blueprint Part 7), which is not built yet and is not shortcut here.
--
-- ---------------------------------------------------------------------------
-- 2. Why SECURITY DEFINER, and why that is safe here
--
-- Same reasoning as every other elevated function in SECURITY.md. The caller must be able to
-- aggregate over rows they cannot read, so the function runs as its owner, and in exchange it
-- takes no arguments that could widen it, checks `is_platform_admin()` before doing anything, and
-- can only ever return the shape declared below. There is no row-returning variant, so there is
-- nothing to point at a member.

create or replace function public.platform_overview()
returns table (
  total_cooperatives integer,
  active_cooperatives integer,
  employee_headcount integer,
  pending_invites integer
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $fn$
begin
  if not public.is_platform_admin() then
    raise exception 'only a platform admin may read the platform overview' using errcode = '42501';
  end if;

  return query
  select
    (select count(*)::integer from public.cooperatives),
    (select count(*)::integer from public.cooperatives where status = 'active'),
    -- Organization-wide headcount, and a count is all it can ever be: this returns one integer,
    -- so there is no version of this call that yields a directory of people.
    (select count(*)::integer from public.users where employee_id is not null),
    (select count(*)::integer from (
       select 1 from public.staff_invitations where claimed_at is null and role = 'admin'
       union all
       select 1 from public.cooperative_staff_roles where status = 'invited' and role = 'admin'
     ) as unaccepted);
end;
$fn$;

comment on function public.platform_overview() is
  'The four figures on the Platform Dashboard (super-admin blueprint 4.1). Counts only, never a name, a balance, or a row. Elevated because a Super Admin deliberately cannot read the tables being counted; see SECURITY.md.';

revoke execute on function public.platform_overview() from public, anon;
grant execute on function public.platform_overview() to authenticated;

-- ---------------------------------------------------------------------------
-- platform_cooperative_directory(): 5.1 and 5.2 in one read
--
-- One row per cooperative, carrying what the two screens are specified to show and nothing else.
-- `member_count` and `officer_count` are aggregates; `admin_name` and `admin_email` describe the
-- person invited to run the cooperative, who is staff rather than a member. No column here can
-- carry a member's identity or any financial figure.
-- ---------------------------------------------------------------------------

create or replace function public.platform_cooperative_directory()
returns table (
  id uuid,
  name text,
  status public.cooperative_status,
  created_at timestamptz,
  member_count integer,
  officer_count integer,
  admin_name text,
  admin_email text,
  admin_status text,
  admin_invited_at timestamptz,
  admin_accepted_at timestamptz,
  pending_invite_email text,
  pending_invite_sent_at timestamptz,
  has_expiry_override boolean
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $fn$
begin
  if not public.is_platform_admin() then
    raise exception 'only a platform admin may read the cooperative directory' using errcode = '42501';
  end if;

  return query
  select
    c.id,
    c.name,
    c.status,
    c.created_at,
    (select count(*)::integer from public.cooperative_memberships m
      where m.cooperative_id = c.id and m.status = 'active'),
    (select count(*)::integer from public.cooperative_staff_roles r
      where r.cooperative_id = c.id and r.role = 'officer' and r.status <> 'revoked'),
    admin_role.name,
    admin_role.email,
    admin_role.status,
    admin_role.invited_at,
    admin_role.accepted_at,
    invite.email,
    invite.invited_at,
    -- Informational only, per 5.2: the Super Admin sees THAT an override exists without being
    -- shown or able to edit the cooperative's own loan-product settings.
    c.reservation_expiry_days_override is not null
  from public.cooperatives c

  -- The cooperative's Admin, if one has been named yet. Earliest first, so a cooperative that
  -- somehow holds two reads as the one it was set up with.
  left join lateral (
    select u.name, u.email, r.status::text as status, r.invited_at, r.accepted_at
      from public.cooperative_staff_roles r
      join public.users u on u.id = r.user_id
     where r.cooperative_id = c.id and r.role = 'admin' and r.status <> 'revoked'
     order by r.invited_at
     limit 1
  ) as admin_role on true

  -- An invitation issued to an address that has no Clarix account yet holds no user row at all,
  -- so it is a separate lookup rather than a missing join.
  left join lateral (
    select i.email, i.invited_at
      from public.staff_invitations i
     where i.cooperative_id = c.id and i.role = 'admin' and i.claimed_at is null
     order by i.invited_at
     limit 1
  ) as invite on true

  order by c.created_at desc;
end;
$fn$;

comment on function public.platform_cooperative_directory() is
  'One row per cooperative for super-admin blueprint 5.1 and 5.2: counts, status, and the staff Admin''s name. Carries no member identity and no financial figure, reaching those stays with the access_grants flow (Part 7).';

revoke execute on function public.platform_cooperative_directory() from public, anon;
grant execute on function public.platform_cooperative_directory() to authenticated;

-- ---------------------------------------------------------------------------
-- 3. invite_cooperative_staff() gains a second legitimate caller
--
-- Blueprint 5.3 creates a cooperative and sends its Admin's invitation in one action, and
-- ROLES-AND-PERMISSIONS.md is explicit that this is how a Cooperative Admin comes to exist:
-- "Super Admin creates the cooperatives row ... and sends a one-time email invite via Resend."
--
-- The function already does exactly that. What it refused was the caller: it required
-- `is_active_cooperative_admin(target_cooperative_id)`, which a Super Admin creating a brand-new
-- cooperative can never satisfy, because the cooperative has no admin yet. That is the whole
-- point of the invitation.
--
-- The fix is one more legitimate caller, not a second invitation path. D027 settled that
-- invitations are database rows written by one narrow elevated function; two functions doing the
-- same thing would mean two places for the claim logic to drift apart. Everything else about the
-- function is unchanged, including that it can only ever write an invitation.
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

  -- Two legitimate callers: the cooperative's own admin inviting an officer (blueprint 7.2), and
  -- a platform admin naming the admin of a cooperative they just created (super-admin 5.3).
  if not (
    public.is_active_cooperative_admin(target_cooperative_id)
    or public.is_platform_admin()
  ) then
    raise exception 'only this cooperative''s admin or a platform admin may invite staff'
      using errcode = '42501';
  end if;

  if v_email is null or position('@' in v_email) < 2 then
    raise exception 'a valid email address is required' using errcode = '22023';
  end if;

  select u.id into v_user_id from public.users u where lower(u.email) = v_email limit 1;

  if v_user_id is not null then
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

comment on function public.invite_cooperative_staff(uuid, text, public.staff_role, jsonb, text) is
  'Issues a staff invitation as a database row (DECISIONS.md D027). Two legitimate callers: that cooperative''s own active admin, and a platform admin creating a cooperative that has no admin yet (migration 019).';
