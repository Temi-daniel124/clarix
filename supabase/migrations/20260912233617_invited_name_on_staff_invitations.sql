-- Clarix — migration 022: remember who an invitation was addressed to, by name.
--
-- Super-admin blueprint 5.3 asks the create form for "the intended Admin's name and email
-- address", and 5.1 lists "the name of its current Admin" as a directory column. Those two only
-- meet if the name survives the invitation: until somebody accepts there is no `users` row to
-- read a name from, so a freshly created cooperative would show a blank Admin column for exactly
-- the period an operator is most likely to be looking at it.
--
-- Collecting a name on the form and discarding it would have been worse than not asking, because
-- the field would look like it did something.
--
-- It is not identity. The name on the account is whatever that person sets when they accept; this
-- is only what the operator wrote down, and the directory prefers the real account name the
-- moment one exists.
--
-- The directory function is recreated here rather than altered because it gains two output
-- columns, and Postgres will not change a function's row type in place.

alter table public.staff_invitations add column if not exists invited_name text;

comment on column public.staff_invitations.invited_name is
  'What the inviter called this person, kept so a pending invitation reads with a name rather than a bare address (super-admin blueprint 5.1). The account''s own name supersedes it on acceptance.';

drop function if exists public.platform_cooperative_directory();

create function public.platform_cooperative_directory()
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
  has_expiry_override boolean,
  internal_note text
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
    coalesce(admin_role.name, invite.invited_name),
    coalesce(admin_role.email, invite.email),
    admin_role.status,
    admin_role.invited_at,
    admin_role.accepted_at,
    invite.email,
    invite.invited_at,
    c.reservation_expiry_days_override is not null,
    note.note
  from public.cooperatives c
  left join lateral (
    select u.name, u.email, r.status::text as status, r.invited_at, r.accepted_at
      from public.cooperative_staff_roles r
      join public.users u on u.id = r.user_id
     where r.cooperative_id = c.id and r.role = 'admin' and r.status <> 'revoked'
     order by r.invited_at
     limit 1
  ) as admin_role on true
  left join lateral (
    select i.email, i.invited_at, i.invited_name
      from public.staff_invitations i
     where i.cooperative_id = c.id and i.role = 'admin' and i.claimed_at is null
     order by i.invited_at
     limit 1
  ) as invite on true
  left join public.cooperative_internal_notes note on note.cooperative_id = c.id
  order by c.created_at desc;
end;
$fn$;

comment on function public.platform_cooperative_directory() is
  'One row per cooperative for super-admin blueprint 5.1 and 5.2: counts, status, the staff Admin''s name, and the operator''s own private note. Carries no member identity and no financial figure — reaching those stays with the access_grants flow (Part 7).';

revoke execute on function public.platform_cooperative_directory() from public, anon;
grant execute on function public.platform_cooperative_directory() to authenticated;

create or replace function public.invite_cooperative_staff(
  target_cooperative_id uuid,
  invite_email text,
  invite_role public.staff_role default 'officer',
  invite_permissions jsonb default '{}'::jsonb,
  invite_title text default null,
  invite_name text default null
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
    (cooperative_id, email, role, permissions, title, invited_by, invited_name)
  values
    (target_cooperative_id, v_email, invite_role, invite_permissions, invite_title, v_caller,
     nullif(trim(coalesce(invite_name, '')), ''))
  on conflict (cooperative_id, email, role) do update
    set permissions = excluded.permissions,
        title = excluded.title,
        invited_by = excluded.invited_by,
        invited_name = coalesce(excluded.invited_name, staff_invitations.invited_name),
        invited_at = now(),
        claimed_at = null,
        claimed_by = null
  returning id into v_invitation_id;

  return query select v_invitation_id, false, false;
end;
$fn$;

comment on function public.invite_cooperative_staff(uuid, text, public.staff_role, jsonb, text, text) is
  'Issues a staff invitation as a database row (DECISIONS.md D027). Two legitimate callers: that cooperative''s own active admin (blueprint 7.2), and a platform admin creating a cooperative that has no admin yet (super-admin 5.3).';

drop function if exists public.invite_cooperative_staff(uuid, text, public.staff_role, jsonb, text);

revoke execute on function public.invite_cooperative_staff(uuid, text, public.staff_role, jsonb, text, text) from public, anon;
grant execute on function public.invite_cooperative_staff(uuid, text, public.staff_role, jsonb, text, text) to authenticated;
