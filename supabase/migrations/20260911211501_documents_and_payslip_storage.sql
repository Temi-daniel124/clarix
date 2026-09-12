-- Clarix — migration 004: the `documents` table and the private payslip bucket.
--
-- Adds the last piece of schema employee onboarding needs (docs/DATA-MODEL.md § documents), the
-- `users.salary_source_doc_id` link that DATA-MODEL describes but migration 001 could not create
-- yet because `documents` did not exist, and the Storage bucket the payslip upload writes to.
--
-- RLS ships in this migration, as always.
--
-- A payslip is the most sensitive artefact in the product: it carries a named individual's
-- salary and their IPPIS number. SECURITY.md scopes access to the uploading employee, so the
-- policies below are deliberately narrower than anything else in the schema — cooperative staff
-- have NO access to these rows or these files, not even for members of their own cooperative.
-- The eligibility figures they are entitled to see come from `users.salary_gross` and the loan
-- ledger, never from the document itself. Super Admin likewise has no standing access; a support
-- case would have to go through the access_grants flow, which is not built yet.

create type public.document_type as enum ('payslip');
create type public.document_review_status as enum ('pending_review', 'confirmed', 'corrected');

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,

  type public.document_type not null default 'payslip',

  -- Storage object path inside the private `payslips` bucket, never a public URL.
  -- Always '<user_id>/<uuid>.<ext>', which is what the storage policies below key on.
  storage_path text not null,
  original_filename text,
  mime_type text,
  byte_size integer check (byte_size is null or byte_size > 0),

  -- Raw extraction output, before a human confirms it. Null until an extraction path exists
  -- (DECISIONS.md D006: salary figures only, never a classification of deduction lines).
  extracted_fields jsonb,

  review_status public.document_review_status not null default 'pending_review',

  -- The pay period the payslip covers, as confirmed by the employee. Kept as text because a
  -- payslip states a month, not a date range worth modelling.
  pay_period text,

  uploaded_at timestamptz not null default now(),
  reviewed_at timestamptz,

  constraint documents_storage_path_unique unique (storage_path)
);

create index documents_user_id_idx on public.documents (user_id);
create index documents_user_status_idx on public.documents (user_id, review_status);

comment on table public.documents is
  'Uploaded payslips. Readable only by the employee who uploaded them — never by cooperative staff and never by Super Admin (SECURITY.md).';

-- The salary figure's provenance. DATA-MODEL.md lists this on `users`; it could not be added in
-- migration 001 because it references a table created here.
alter table public.users
  add column salary_source_doc_id uuid references public.documents (id) on delete set null;

comment on column public.users.salary_source_doc_id is
  'The confirmed payslip a salary figure came from, so "Extracted from your payslip" stays traceable.';

-- ---------------------------------------------------------------------------
-- Row-Level Security — own rows only, in every direction
-- ---------------------------------------------------------------------------

alter table public.documents enable row level security;

create policy documents_select_own
  on public.documents for select to authenticated
  using (user_id = auth.uid());

create policy documents_insert_own
  on public.documents for insert to authenticated
  with check (user_id = auth.uid());

-- The employee confirms or corrects the figures read off their own payslip.
create policy documents_update_own
  on public.documents for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Re-uploading replaces a payslip, so an employee may remove their own.
create policy documents_delete_own
  on public.documents for delete to authenticated
  using (user_id = auth.uid());

grant select, insert, update, delete on public.documents to authenticated;
revoke all on public.documents from anon;

-- ---------------------------------------------------------------------------
-- Storage: the private payslip bucket
--
-- `public = false`, so there is no guessable URL and every read goes through a signed URL or an
-- authenticated request that these policies authorise (SECURITY.md).
--
-- Every policy keys on the first path segment being the requesting user's id, which is why
-- documents.storage_path is required to be '<user_id>/<file>'. An employee therefore cannot
-- read, overwrite or delete another employee's payslip even by guessing an object name.
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'payslips',
  'payslips',
  false,
  10485760, -- 10 MB; a payslip that exceeds this is a scan worth rejecting client-side first.
  array[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
on conflict (id) do nothing;

create policy payslips_insert_own
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'payslips'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy payslips_select_own
  on storage.objects for select to authenticated
  using (
    bucket_id = 'payslips'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy payslips_update_own
  on storage.objects for update to authenticated
  using (
    bucket_id = 'payslips'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy payslips_delete_own
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'payslips'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
