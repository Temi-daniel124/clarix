-- Clarix, migration 033: one member count, everywhere (BUILD-PLAN 0.5, rule 1).
--
-- The live demo showed three different "members" figures for the same cooperative: 8 on the admin
-- home (every membership row, whatever its status), 15 on the Members list (memberships plus roster
-- entries) and 7 on the Platform directory (active memberships only). The rule is now defined once
-- (src/lib/home-figures.ts): members = active memberships + roster entries not yet on Clarix,
-- shown as "15 members, 8 on Clarix".
--
-- The cooperative's own screens compute it from rows they can already read. The Platform cannot
-- read a cooperative's roster (that is the cooperative's private list, SECURITY.md), so its
-- directory function returns the roster count as one more aggregate, beside member_count.
--
-- Not additive in the strict sense: adding a column to a function's result means dropping and
-- recreating it, which changes a function `main` calls. `main` reads the columns by name and
-- ignores the new one, but per D043 this still applies at merge. Body otherwise identical to
-- migration 20260912233617.

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
  internal_note text,
  roster_not_on_clarix_count integer
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
    note.note,
    -- BUILD-PLAN 0.5 rule 1: members = active memberships (member_count, above) + roster entries
    -- not yet on Clarix (this). The same two numbers the cooperative's own screens show.
    (select count(*)::integer from public.member_roster_entries e
      where e.cooperative_id = c.id and e.membership_id is null)
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
  'One row per cooperative for super-admin blueprint 5.1 and 5.2: counts (member_count is active memberships, roster_not_on_clarix_count the roster entries not yet on Clarix; members = the two added, BUILD-PLAN 0.5), status, the staff Admin''s name, and the operator''s own private note. Carries no member identity and no financial figure, reaching those stays with the access_grants flow (Part 7).';

revoke execute on function public.platform_cooperative_directory() from public, anon;
grant execute on function public.platform_cooperative_directory() to authenticated;
