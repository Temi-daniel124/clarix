-- Clarix, migration 030: somewhere to keep an application that is above the member's limit.
--
-- DECISIONS.md D040, BUILD-PLAN 0.1, EDGE-CASES E05 and E06.
--
-- Until now `submit_loan_application` returned without inserting anything when the monthly
-- repayment was above what the member had left, while the screen told the member that the
-- cooperative had their application. Nothing was stored, so nobody ever saw it.
--
-- This migration is the additive half: a new status and two columns. Nothing reads them yet, and
-- nothing about an existing row changes. The behaviour that writes them is migration 031.
--
-- Split in two because Postgres will not let a new enum value be used in the same transaction that
-- adds it ("unsafe use of new value"), and migration 031's constraint and SQL-language function both
-- name 'pending_review'.

alter type public.loan_status add value if not exists 'pending_review' after 'reserved';

alter table public.loans
  add column if not exists over_capacity boolean not null default false,
  add column if not exists shortfall_at_submission numeric(14, 2);

comment on column public.loans.over_capacity is
  'True when the monthly repayment was above the member''s available amount (or they had no limit yet) at the moment they applied. Such a loan is stored as pending_review and holds nothing (D040).';

comment on column public.loans.shortfall_at_submission is
  'Monthly repayment minus what the member had available, at the moment they applied. Null for an application that fitted. Kept as it was then; the live figure is recomputed on every read.';
