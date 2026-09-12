-- Clarix — migration 002: close the two security-lint findings raised against migration 001.
--
-- Supabase's database linter flagged both of these immediately after 001 was applied; fixing
-- them here rather than editing 001 in place keeps migration history append-only, the same
-- discipline DECISIONS.md applies to itself.
--
-- 1. `enforce_reservation_expiry_ceiling` ran with a role-mutable search_path
--    (lint 0011_function_search_path_mutable). It is a trigger guarding the D009 reservation
--    ceiling, so it must resolve `public.organizations` the same way regardless of who writes
--    to the cooperatives table.
--
-- 2. `handle_new_auth_user` is a SECURITY DEFINER trigger function, but PostgreSQL grants
--    EXECUTE to PUBLIC by default, which PostgREST then exposes as a callable RPC endpoint
--    (lints 0028 / 0029). Nothing should ever invoke it directly — only the auth.users
--    trigger. Revoking EXECUTE from every client role removes the endpoint without affecting
--    the trigger, which runs as the function's owner.
--
-- The three `is_*` helper booleans remain executable by `authenticated` deliberately: RLS policy
-- expressions are evaluated with the querying role's privileges, so revoking EXECUTE there
-- would break every policy in 001. They accept no free-form input and return only a boolean
-- about the caller's own roles.

create or replace function public.enforce_reservation_expiry_ceiling()
returns trigger
language plpgsql
set search_path = public, pg_temp
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

revoke execute on function public.handle_new_auth_user() from public, anon, authenticated;
revoke execute on function public.enforce_reservation_expiry_ceiling() from public, anon, authenticated;
