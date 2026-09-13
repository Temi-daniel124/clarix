-- Clarix — migration 027: the payslip behind an application under review.
--
-- DECISIONS.md D031. Migration 004 scoped payslips to the uploading employee and nobody else, and
-- that was right for what it considered. What it did not consider is that the salary figure staff
-- decide against is **self-reported**: a member uploads a payslip, confirms the numbers, and those
-- numbers become everybody's eligibility arithmetic thereafter, with nothing in the system ever
-- comparing them to the document, because nothing in the system could see the document.
--
-- This opens the narrowest window that closes that gap. Three conditions, all required:
--
--   1. the member has an application still awaiting decision at that cooperative,
--   2. the caller can actually decide it (`can_approve_loans`; admins pass implicitly), and
--   3. the document is the one the member's salary figure actually came from.
--
-- Outside all three, nothing changes. An officer who may see members but not decide loans gains
-- nothing, which is the same default-deny rule the rest of their permissions follow, and the
-- moment the application is decided or lapses the window closes on its own.

create or replace function public.payslip_under_review(document_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $fn$
  select exists (
    select 1
      from public.documents d
      join public.users u on u.salary_source_doc_id = d.id
      join public.cooperative_memberships m on m.user_id = u.id
      join public.loans l on l.membership_id = m.id
     where d.id = document_id
       -- Awaiting a decision, and not lapsed. Expiry is evaluated here rather than stored, the
       -- same way it is everywhere else in this schema (D024).
       and l.status = 'reserved'
       and l.reservation_expires_at is not null
       and l.reservation_expires_at > now()
       and public.staff_has_permission(m.cooperative_id, 'can_approve_loans')
  );
$fn$;

comment on function public.payslip_under_review(uuid) is
  'Whether this document is the salary evidence behind an application the caller is currently entitled to decide (DECISIONS.md D031). The whole of the payslip-review boundary, so there is one definition of it rather than two that could drift.';

revoke execute on function public.payslip_under_review(uuid) from public, anon;
grant execute on function public.payslip_under_review(uuid) to authenticated;

-- The document row.
create policy documents_select_loan_review
  on public.documents for select to authenticated
  using (public.payslip_under_review(id));

-- And the file itself. Without this the reviewer would see a row describing a payslip they still
-- could not open, which is the worst of both: the metadata leaks and the check stays impossible.
create policy payslips_select_loan_review
  on storage.objects for select to authenticated
  using (
    bucket_id = 'payslips'
    and exists (
      select 1 from public.documents d
       where d.storage_path = storage.objects.name
         and public.payslip_under_review(d.id)
    )
  );

-- No insert, update or delete anywhere here. A reviewer may look at the evidence; they may not
-- alter it, replace it, or remove it. That is the member's own document throughout.

comment on table public.documents is
  'Uploaded payslips. The member''s own, with one narrow exception: while they have an application awaiting decision at a cooperative, staff there who can decide it may open the payslip the salary figure came from (DECISIONS.md D031, SECURITY.md).';
