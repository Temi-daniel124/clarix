-- Clarix, migration 009: users.notification_preferences.
--
-- DECISIONS.md D025, decision 2. Blueprint 6.2's Notification preferences section needs somewhere
-- to keep four toggles, and docs/DATA-MODEL.md has no preferences table.
--
-- A jsonb column rather than a table: there is exactly one preferences row per user, it is only
-- ever read as a whole, and it is read alongside the `users` row the Profile screen has already
-- loaded. A separate table would add a join and a second RLS policy to express a relationship
-- that is already one-to-one. It also inherits the `users` policies unchanged: a person can
-- read and update their own row and no one else's, so nothing new has to be reasoned about.
--
-- No new grant is needed: `authenticated` already holds UPDATE on public.users from migration
-- 003, and users_update_own already constrains it to the caller's own row.

alter table public.users
  add column notification_preferences jsonb not null default '{}'::jsonb;

-- Keys are the notification categories; values are booleans. The check keeps the column from
-- drifting into a general-purpose settings bag, which is exactly how a jsonb column stops being
-- reviewable.
alter table public.users
  add constraint users_notification_preferences_is_object
  check (jsonb_typeof(notification_preferences) = 'object');

comment on column public.users.notification_preferences is
  'Per-category delivery toggles (DECISIONS.md D025). A MISSING KEY MEANS OPTED IN: only an explicit false turns a category off, so a category added later is on by default for every existing account rather than silently off. A muted category is still recorded in public.notifications and still appears in the list. This governs delivery, never the record.';
