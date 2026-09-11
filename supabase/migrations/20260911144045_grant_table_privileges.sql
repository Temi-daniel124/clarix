-- Clarix — migration 003: table-level privileges for the `authenticated` role.
--
-- Found by an RLS isolation probe run against the live project immediately after 001: every
-- query from the app failed with "permission denied for table cooperative_memberships". RLS
-- policies decide WHICH ROWS a role may touch, but Postgres still requires a table-level GRANT
-- before the policy is ever consulted. The tables in 001 were created without one, so the anon
-- key — which is what every browser and server request uses — could read nothing at all.
--
-- Two rules shape what is granted below:
--
--   1. `anon` gets nothing. No unauthenticated request has any business reading a member's
--      data, a cooperative's profile or the organization's deduction policy. The landing page
--      and both auth screens make no database read whatsoever.
--
--   2. `authenticated` gets only the verbs that a policy in 001 actually allows. There is no
--      DELETE policy on organizations, users or cooperatives, so no DELETE is granted on them:
--      the grant list and the policy list are kept deliberately in step, so that reading one
--      tells you the truth about the other.
--
-- Row isolation itself is unchanged and still lives entirely in the policies (DECISIONS.md
-- D011, SECURITY.md).

revoke all on all tables in schema public from anon;

grant select                        on public.organizations           to authenticated;
grant insert, update                on public.organizations           to authenticated;

grant select, insert, update        on public.users                   to authenticated;

grant select                        on public.platform_admins         to authenticated;

grant select, insert, update        on public.cooperatives            to authenticated;

grant select, insert, update, delete on public.cooperative_memberships to authenticated;

grant select, insert, update, delete on public.cooperative_staff_roles to authenticated;
