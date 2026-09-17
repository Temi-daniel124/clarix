-- Clarix, migration 011: the roster link has to happen after the insert, not during it.
--
-- Found by pgTAP suite 005 on its first CI run, which is the first time anything exercised the
-- path an ordinary employee takes. Migration 010 set `new.status := 'active'` in a BEFORE INSERT
-- trigger so that somebody the cooperative had already imported would not sit as a pending
-- application. That works when staff do the inserting, and breaks when the employee does:
--
--   `cooperative_memberships_insert_own_pending` (migration 001) has
--   `with check (user_id = auth.uid() and status = 'pending')`, and a policy's WITH CHECK is
--   evaluated against the row AFTER BEFORE-triggers have had it. So the trigger rewrote the row
--   into exactly the shape the policy refuses, and an employee on a roster could not join at
--   all, "new row violates row-level security policy for table cooperative_memberships".
--
-- The live verification in the previous session missed it because the import inserts memberships
-- as staff, where `cooperative_memberships_insert_staff` permits any status.
--
-- The fix keeps the employee's insert exactly as the policy intends. It lands as `pending`,
-- written by them, about them, and moves activation into the AFTER trigger, where it belongs:
-- activating an imported member is a system action, not something the applicant asserted. The
-- trigger is SECURITY DEFINER and therefore runs as the table owner, so its update is not
-- subject to the same policy. Nothing about who may insert what has changed.

drop trigger if exists cooperative_memberships_link_roster on public.cooperative_memberships;
drop function if exists public.link_roster_entry();

create or replace function public.apply_roster_link()
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
    return null;
  end if;

  select * into v_entry
    from public.member_roster_entries e
   where e.cooperative_id = new.cooperative_id
     and e.employee_id = v_employee_id
     and e.membership_id is null
   limit 1;

  if not found then
    return null;
  end if;

  update public.member_roster_entries
     set membership_id = new.id, linked_at = now()
   where id = v_entry.id;

  -- The cooperative imported this person, so they are a member rather than an applicant. The
  -- savings balance comes off the roster entry rather than from anything the employee sent, so
  -- the two can never disagree about what was imported.
  update public.cooperative_memberships
     set status = 'active',
         joined_at = coalesce(joined_at, now()),
         savings_balance = v_entry.savings_balance
   where id = new.id
     and status <> 'active';

  return null;
end;
$fn$;

revoke execute on function public.apply_roster_link() from public, anon, authenticated;
