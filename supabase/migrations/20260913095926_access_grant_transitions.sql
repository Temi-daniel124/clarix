-- Clarix, migration 026: everything that can happen to an access grant.
--
-- `access_grants` has no write policy, so these four functions are the complete list of ways a
-- row in it can come into being or change. That is the same construction as `audit_log`, for the
-- same reason: a table whose whole purpose is to be trustworthy cannot have a write path that
-- did not check anything.

-- ---------------------------------------------------------------------------
-- access_grant_state(): the effective status, right now
--
-- 'active' and 'expired' are never stored (D030). This is where they come from, and it is the
-- only place, so a screen and a policy can never disagree about whether a grant is live.
-- ---------------------------------------------------------------------------

create or replace function public.access_grant_state(g public.access_grants)
returns public.access_grant_status
language sql
immutable
as $fn$
  select case
    when g.status = 'revoked' then 'revoked'::public.access_grant_status
    when now() >= g.expires_at then 'expired'::public.access_grant_status
    when now() >= g.activates_at then 'active'::public.access_grant_status
    else 'pending'::public.access_grant_status
  end;
$fn$;

comment on function public.access_grant_state(public.access_grants) is
  'The effective status of a grant at this instant. Stored status only ever says pending or revoked; active and expired are arithmetic against now() (DECISIONS.md D030).';

-- ---------------------------------------------------------------------------
-- request_access_grant(), submit, notify, record. Never grants anything immediately.
-- ---------------------------------------------------------------------------

create or replace function public.request_access_grant(
  target_cooperative_id uuid,
  grant_reason text,
  target_member_user_id uuid default null,
  delay_minutes integer default 60,
  window_hours integer default 24
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $fn$
declare
  v_id uuid;
  v_activates timestamptz := now() + make_interval(mins => greatest(delay_minutes, 0));
  v_cooperative text;
  v_member_name text;
  v_admin record;
begin
  if not public.is_platform_admin() then
    raise exception 'only a platform admin may request access' using errcode = '42501';
  end if;

  if grant_reason is null or length(trim(grant_reason)) < 20 then
    raise exception 'a specific reason is required' using errcode = '22023';
  end if;

  select c.name into v_cooperative from public.cooperatives c where c.id = target_cooperative_id;
  if v_cooperative is null then
    raise exception 'no such cooperative' using errcode = '22023';
  end if;

  -- A grant narrowed to a member must name somebody that cooperative actually has.
  if target_member_user_id is not null then
    if not exists (
      select 1 from public.cooperative_memberships m
       where m.cooperative_id = target_cooperative_id
         and m.user_id = target_member_user_id
    ) then
      raise exception 'that person is not a member of that cooperative' using errcode = '22023';
    end if;

    select u.name into v_member_name from public.users u where u.id = target_member_user_id;
  end if;

  insert into public.access_grants
    (requested_by, cooperative_id, member_user_id, reason, activates_at, expires_at)
  values
    (auth.uid(), target_cooperative_id, target_member_user_id, trim(grant_reason),
     v_activates, v_activates + make_interval(hours => greatest(window_hours, 1)))
  returning id into v_id;

  -- SECURITY.md: "the affected cooperative's Admin is notified the moment a request naming their
  -- cooperative is submitted". Written here, in the same statement as the request, so there is no
  -- path that creates one without the other.
  for v_admin in
    select r.user_id
      from public.cooperative_staff_roles r
     where r.cooperative_id = target_cooperative_id
       and r.role = 'admin'
       and r.status = 'active'
  loop
    insert into public.notifications (user_id, category, message, target_url)
    values (
      v_admin.user_id,
      'access_request',
      format(
        'Clarix support has asked to look at %s records at %s, starting %s. Reason given: %s',
        coalesce(v_member_name || '''s', 'your cooperative''s'),
        v_cooperative,
        to_char(v_activates at time zone 'Africa/Lagos', 'HH12:MI am on DD Mon'),
        trim(grant_reason)
      ),
      '/admin/audit'
    );
  end loop;

  perform public.record_platform_event(
    'request_access', 'access_grants', v_id, null,
    jsonb_build_object(
      'cooperative', v_cooperative,
      'member', coalesce(v_member_name, 'the whole cooperative'),
      'activates_at', v_activates,
      'reason', trim(grant_reason)
    ),
    trim(grant_reason)
  );

  return v_id;
end;
$fn$;

comment on function public.request_access_grant(uuid, text, uuid, integer, integer) is
  'Submits an access request (super-admin blueprint 7.2). Never grants access immediately: the row activates after a delay (D030). Notifies the cooperative''s admins in the same statement, so no path can create one without the other.';

revoke execute on function public.request_access_grant(uuid, text, uuid, integer, integer) from public, anon;
grant execute on function public.request_access_grant(uuid, text, uuid, integer, integer) to authenticated;

-- ---------------------------------------------------------------------------
-- revoke_access_grant(): the requester ending it early
-- ---------------------------------------------------------------------------

create or replace function public.revoke_access_grant(grant_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $fn$
declare
  v_grant public.access_grants;
begin
  select * into v_grant from public.access_grants where id = grant_id;

  if v_grant.id is null then
    raise exception 'no such access request' using errcode = '22023';
  end if;

  -- Only the operator who asked may end it. A cooperative admin cannot revoke one, which is
  -- deliberate and is why the delay and the notification exist instead (D030).
  if v_grant.requested_by <> auth.uid() then
    raise exception 'only the requester may revoke their own access' using errcode = '42501';
  end if;

  if v_grant.status = 'revoked' then
    return false;
  end if;

  update public.access_grants
     set status = 'revoked', revoked_at = now()
   where id = grant_id;

  perform public.record_platform_event(
    'revoke_access', 'access_grants', grant_id,
    jsonb_build_object('status', 'active'),
    jsonb_build_object('status', 'revoked'),
    null
  );

  return true;
end;
$fn$;

comment on function public.revoke_access_grant(uuid) is
  'Ends a grant early, by the operator who requested it (super-admin blueprint 7.2).';

revoke execute on function public.revoke_access_grant(uuid) from public, anon;
grant execute on function public.revoke_access_grant(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- log_elevated_view(): the granular record, written into the COOPERATIVE's log
--
-- Blueprint 7.3: "Every screen view and specific record opened during an active grant is logged
-- individually, more granularly than ordinary platform events, precisely because this is the one
-- place financial detail crosses this role's boundary."
--
-- The row carries `cooperative_id`, which means it lands in that cooperative's own audit log and
-- its admin reads it there. That is the point. A log of who looked at your members' money that
-- only the looker can read would be a worse kind of nothing than no log at all.
--
-- It refuses to write unless the grant is live at that instant, so the log cannot record a view
-- that the policies would not have permitted.
-- ---------------------------------------------------------------------------

create or replace function public.log_elevated_view(
  grant_id uuid,
  viewed_table text,
  viewed_id uuid default null,
  detail text default null
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $fn$
declare
  v_grant public.access_grants;
begin
  select * into v_grant from public.access_grants where id = grant_id;

  if v_grant.id is null or v_grant.requested_by <> auth.uid() then
    raise exception 'no such access grant' using errcode = '42501';
  end if;

  if public.access_grant_state(v_grant) <> 'active' then
    raise exception 'that access grant is not active' using errcode = '42501';
  end if;

  insert into public.audit_log
    (actor_user_id, cooperative_id, action, target_table, target_id, new_value, note)
  values
    (auth.uid(), v_grant.cooperative_id, 'elevated_view', viewed_table, viewed_id,
     jsonb_build_object('grant_id', grant_id, 'detail', detail),
     v_grant.reason);
end;
$fn$;

comment on function public.log_elevated_view(uuid, text, uuid, text) is
  'Records one record viewed under an active grant, into the audit log of the cooperative whose data it was (super-admin blueprint 7.3). Refuses unless the grant is live at that instant.';

revoke execute on function public.log_elevated_view(uuid, text, uuid, text) from public, anon;
grant execute on function public.log_elevated_view(uuid, text, uuid, text) to authenticated;
