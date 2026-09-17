-- Clarix, migration 023: platform-level audit events, and adding or removing a platform admin.
--
-- ---------------------------------------------------------------------------
-- 1. audit_log already holds a platform event; nothing could read or write one
--
-- `audit_log.cooperative_id` has been nullable since migration 014, so a row describing something
-- that belongs to no cooperative: a cooperative created, the organization's deduction policy
-- edited, a platform admin added, fits the existing table without a schema change. What was
-- missing was both ends of it: no policy could read such a row, because
-- `audit_log_select_admin` asks `is_active_cooperative_admin(cooperative_id)` and that is false
-- for NULL, and nothing could write one, because the table has no insert policy at all by design.
--
-- The read is deliberately narrow: a platform admin reads platform rows ONLY. They do not gain
-- sight of any cooperative's own entries, which stay with that cooperative's admin (migration
-- 018). Blueprint 7.1 asks for exactly this: a record "deliberately excluding any cooperative's
-- internal member-level activity", and it is also the same boundary the whole role rests on: a
-- Super Admin reading every loan decision on the platform would be standing access to financial
-- actions by another name.

create policy audit_log_select_platform
  on public.audit_log for select to authenticated
  using (cooperative_id is null and public.is_platform_admin());

-- ---------------------------------------------------------------------------
-- record_platform_event(): the only way a platform row is written
--
-- Elevated for the same reason `decide_loan_application` is: `audit_log` has no insert policy,
-- so every row in it arrives through a function that decided it was entitled to. This one refuses
-- anybody who is not a platform admin, and cannot write a cooperative-scoped row at all, it
-- hard-codes `cooperative_id` as NULL, so it can never be used to forge an entry into a
-- cooperative's own log.
-- ---------------------------------------------------------------------------

create or replace function public.record_platform_event(
  event_action text,
  event_target_table text,
  event_target_id uuid default null,
  event_old jsonb default null,
  event_new jsonb default null,
  event_note text default null
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $fn$
declare
  v_id uuid;
begin
  if not public.is_platform_admin() then
    raise exception 'only a platform admin may record a platform event' using errcode = '42501';
  end if;

  insert into public.audit_log
    (actor_user_id, cooperative_id, action, target_table, target_id, old_value, new_value, note)
  values
    (auth.uid(), null, event_action, event_target_table, event_target_id,
     event_old, event_new, event_note)
  returning id into v_id;

  return v_id;
end;
$fn$;

comment on function public.record_platform_event(text, text, uuid, jsonb, jsonb, text) is
  'Writes one platform-level audit row (super-admin blueprint 7.1). Elevated because audit_log has no insert policy; narrow because cooperative_id is hard-coded NULL, so it can never forge an entry into a cooperative''s own log.';

revoke execute on function public.record_platform_event(text, text, uuid, jsonb, jsonb, text) from public, anon;
grant execute on function public.record_platform_event(text, text, uuid, jsonb, jsonb, text) to authenticated;

-- ---------------------------------------------------------------------------
-- 2. Adding and removing a platform admin
--
-- `platform_admins` carries one policy, `platform_admins_select_own`, and no insert, update or
-- delete. That was right while the only account was seeded by hand, and it is what blueprint 8.1
-- now needs a way around.
--
-- Deliberately NOT `invite_cooperative_staff()`. A platform admin is not cooperative staff: the
-- row lives in a different table, is scoped to no cooperative, and grants a different thing. D027
-- says not to multiply invitation paths for the same act; this is a different act.
--
-- `list_platform_admins()` exists because `platform_admins_select_own` shows a caller only their
-- own row: a list of operators is not member data, but it is still not readable without help.
-- ---------------------------------------------------------------------------

create or replace function public.list_platform_admins()
returns table (
  user_id uuid,
  name text,
  email text,
  granted_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $fn$
begin
  if not public.is_platform_admin() then
    raise exception 'only a platform admin may list platform admins' using errcode = '42501';
  end if;

  return query
  select pa.user_id, u.name, u.email, pa.granted_at
    from public.platform_admins pa
    join public.users u on u.id = pa.user_id
   order by pa.granted_at;
end;
$fn$;

comment on function public.list_platform_admins() is
  'Who operates the platform (super-admin blueprint 8.1). Elevated because platform_admins_select_own shows a caller only their own row. Returns operators, never members.';

revoke execute on function public.list_platform_admins() from public, anon;
grant execute on function public.list_platform_admins() to authenticated;

-- ---------------------------------------------------------------------------
-- grant_platform_admin(), by email, against an account that already exists
--
-- Clarix cannot create an account for somebody (D021: Supabase Auth owns identity, and there is
-- no self-signup into this role). So this grants the flag to an address that already has a Clarix
-- account, and reports honestly when it does not rather than pretending an invitation is waiting.
-- ---------------------------------------------------------------------------

create or replace function public.grant_platform_admin(admin_email text)
returns table (granted boolean, reason text)
language plpgsql
security definer
set search_path = public, pg_temp
as $fn$
declare
  v_email text := lower(trim(admin_email));
  v_user_id uuid;
begin
  if not public.is_platform_admin() then
    raise exception 'only a platform admin may add a platform admin' using errcode = '42501';
  end if;

  if v_email is null or position('@' in v_email) < 2 then
    raise exception 'a valid email address is required' using errcode = '22023';
  end if;

  select u.id into v_user_id from public.users u where lower(u.email) = v_email limit 1;

  if v_user_id is null then
    return query select false, 'no_account';
    return;
  end if;

  if exists (select 1 from public.platform_admins pa where pa.user_id = v_user_id) then
    return query select false, 'already_admin';
    return;
  end if;

  insert into public.platform_admins (user_id) values (v_user_id);

  perform public.record_platform_event(
    'grant_platform_admin', 'platform_admins', v_user_id, null,
    jsonb_build_object('email', v_email), null
  );

  return query select true, 'granted';
end;
$fn$;

comment on function public.grant_platform_admin(text) is
  'Adds a platform admin by email (super-admin blueprint 8.1). Not invite_cooperative_staff(): a platform admin is not cooperative staff, and the row lives in a different table scoped to no cooperative.';

revoke execute on function public.grant_platform_admin(text) from public, anon;
grant execute on function public.grant_platform_admin(text) to authenticated;

-- ---------------------------------------------------------------------------
-- revoke_platform_admin(), and the self-removal safeguard, enforced here
--
-- Blueprint 8.1: "A Super Admin cannot remove their own account from this screen. That would
-- require a separate, deliberately harder-to-reach safeguard, avoiding the mistake of a single
-- operator locking themselves out entirely."
--
-- A hidden button is not a safeguard. The refusal lives in the function, so it holds however the
-- call is made.
-- ---------------------------------------------------------------------------

create or replace function public.revoke_platform_admin(target_user_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $fn$
declare
  v_email text;
begin
  if not public.is_platform_admin() then
    raise exception 'only a platform admin may remove a platform admin' using errcode = '42501';
  end if;

  if target_user_id = auth.uid() then
    raise exception 'a platform admin cannot remove their own access from this screen'
      using errcode = '42501';
  end if;

  select u.email into v_email from public.users u where u.id = target_user_id;

  delete from public.platform_admins where user_id = target_user_id;

  if not found then
    return false;
  end if;

  perform public.record_platform_event(
    'revoke_platform_admin', 'platform_admins', target_user_id,
    jsonb_build_object('email', v_email), null, null
  );

  return true;
end;
$fn$;

comment on function public.revoke_platform_admin(uuid) is
  'Removes a platform admin (super-admin blueprint 8.1). Refuses self-removal in the function rather than in the interface, so the safeguard holds however the call is made.';

revoke execute on function public.revoke_platform_admin(uuid) from public, anon;
grant execute on function public.revoke_platform_admin(uuid) to authenticated;
