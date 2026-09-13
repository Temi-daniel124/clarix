-- Clarix — migration 021: the operator's note gets a table, because a column could not be scoped.
--
-- Migration 020 put `internal_note` on `cooperatives`, and that was wrong. `cooperatives` is read
-- by `cooperatives_select_authenticated`, which is `using (true)` — discovery needs the public
-- fields, so every signed-in user can read every column of that row. Postgres row-level security
-- cannot exclude one column, and column privileges are granted per database role rather than per
-- person, so there was no way to keep an operator's private note out of an employee's reach while
-- it lived there.
--
-- A note nobody else can read needs a row nobody else can read. One row per cooperative, one
-- policy, and the policy is the whole enforcement — same rule as everywhere else in this schema.

alter table public.cooperatives drop column if exists internal_note;

create table if not exists public.cooperative_internal_notes (
  cooperative_id uuid primary key references public.cooperatives (id) on delete cascade,
  note text not null,
  updated_by uuid references public.users (id) on delete set null,
  updated_at timestamptz not null default now()
);

comment on table public.cooperative_internal_notes is
  'The platform operator''s private note about a cooperative (super-admin blueprint 5.3) — e.g. which staff cooperative at FMC Abeokuta this corresponds to. Readable and writable by platform admins only; never shown to that cooperative''s own staff or to any member.';

alter table public.cooperative_internal_notes enable row level security;

create policy cooperative_internal_notes_platform_admin
  on public.cooperative_internal_notes for all to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

grant select, insert, update, delete on public.cooperative_internal_notes to authenticated;
revoke all on public.cooperative_internal_notes from anon;
