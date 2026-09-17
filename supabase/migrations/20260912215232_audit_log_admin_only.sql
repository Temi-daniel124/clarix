-- Clarix, migration 018: the audit log is an admin's to read, not any staff member's.
--
-- The officer blueprint states the rule twice, and neither statement was true of the database
-- until now. Part 3: there is "no Audit Log anywhere in this role's navigation, because none of
-- those actions are available to an Officer regardless of how their individual permissions are
-- configured". 5.4: "Every entry writes to the audit log the same way regardless of which role
-- recorded it, even though only an Admin can later view that log."
--
-- `audit_log_select_staff` was written before officers had screens, when "staff of this
-- cooperative" and "this cooperative's admin" described the same set of people. They do not any
-- more: an officer's own recorded entries, and every decision their colleagues made, were
-- readable by anyone the admin made an officer.
--
-- Removing the screen from their navigation was never the boundary. This is.

drop policy if exists audit_log_select_staff on public.audit_log;

create policy audit_log_select_admin
  on public.audit_log for select to authenticated
  using (public.is_active_cooperative_admin(cooperative_id));

comment on table public.audit_log is
  'Who did what, to which record, at which cooperative (blueprint 8.3). Append-only by construction: there is no insert, update or delete policy, and rows arrive only from SECURITY DEFINER functions. Readable by that cooperative''s admin alone (migration 018).';
