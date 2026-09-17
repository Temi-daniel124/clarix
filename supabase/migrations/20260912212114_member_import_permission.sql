-- Clarix, migration 017: the member-import permission.
--
-- The cooperative officer blueprint is the first document to require this. Part 3 says the
-- "Import members" entry appears in an officer's navigation only "if this Officer has been
-- granted the member-import permission", and 5.1 says the "Add member" action next to the search
-- field "only appears if this Officer has been granted the add/import permission".
--
-- Until now `member_roster_entries` was governed by `is_active_staff()` alone: being staff at a
-- cooperative was enough to write a roster entry, which means an officer granted nothing at all
-- could still import a spreadsheet of other people's IPPIS numbers and opening balances. That was
-- never visible while officers had no screens; it becomes a real hole the moment they do.
--
-- So `can_import_members` joins the three flags migration 016 made real, governed the same way
-- and for the same reason: a navigation entry that hides a control the database would still
-- accept is a decoration, not a boundary. Admins pass it implicitly, as they pass everything.
--
-- Reading the roster is deliberately left on `is_active_staff()`. A roster entry is what makes an
-- imported member appear on the member list at all, and an officer who may see members but not
-- import them still needs to see the ones who were imported.

drop policy if exists member_roster_entries_insert_staff on public.member_roster_entries;

create policy member_roster_entries_insert_staff
  on public.member_roster_entries for insert to authenticated
  with check (public.staff_has_permission(cooperative_id, 'can_import_members'));

drop policy if exists member_roster_entries_update_staff on public.member_roster_entries;

create policy member_roster_entries_update_staff
  on public.member_roster_entries for update to authenticated
  using (public.staff_has_permission(cooperative_id, 'can_import_members'))
  with check (public.staff_has_permission(cooperative_id, 'can_import_members'));

comment on table public.member_roster_entries is
  'A cooperative''s imported member roster (blueprint 2.4, DECISIONS.md D028). An entry becomes a cooperative_membership when that person joins Clarix, see the link_roster_entry trigger. Writing one takes the can_import_members permission (migration 017); reading one takes only being staff, since imported members appear on the member list.';
