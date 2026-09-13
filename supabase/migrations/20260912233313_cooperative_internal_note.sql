-- Clarix — migration 020: the Super Admin's internal note on a cooperative.
--
-- Super-admin blueprint 5.3 asks the create form for "a short internal note field (optional, for
-- the Super Admin's own reference — e.g. which staff cooperative this corresponds to at FMC
-- Abeokuta)". There was nowhere for it to go. `description` and `requirements` are the
-- cooperative's own public profile, written later by its admin and shown to employees browsing
-- for somewhere to join, so putting an operator's private note in either would publish it.
--
-- Superseded immediately by migration 021, which moves the note to its own table. Kept in the
-- history rather than rewritten because it was applied to the live project: a column on
-- `cooperatives` cannot be scoped, since `cooperatives_select_authenticated` is `using (true)`
-- and row-level security cannot hide one column from a row it has already allowed.

alter table public.cooperatives add column if not exists internal_note text;

comment on column public.cooperatives.internal_note is
  'The platform operator''s own note about this cooperative (super-admin blueprint 5.3). Never shown to members or to the cooperative''s own staff; not part of the public profile.';
