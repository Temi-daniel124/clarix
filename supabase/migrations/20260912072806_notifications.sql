-- Clarix — migration 008: notifications.
--
-- DECISIONS.md D025. This table is not in docs/DATA-MODEL.md; the decision entry is what adds
-- it, and was written before this file, per docs/DEVELOPMENT-WORKFLOW.md's PLAN step.
--
-- Blueprint 6.1 needs one place for anything that needs the employee's attention: a loan
-- decision, a membership decision, a new package from a cooperative they belong to, a request to
-- re-confirm their salary. Each row carries where it leads, so tapping a notification opens the
-- thing it is about rather than a list of everything.
--
-- Nothing in the employee blueprint writes a row here. Every writer belongs to the cooperative
-- admin/officer blueprint, which does not exist yet, so this table is genuinely empty in
-- practice and the screen says so. That is expected and stated in D025 — no rows are seeded to
-- make the screen look populated.
--
-- RLS, as always, in the same migration.

create type public.notification_category as enum (
  -- A cooperative approved or rejected a loan application.
  'loan_decision',
  -- A cooperative approved or rejected an application to join.
  'membership_decision',
  -- A cooperative the employee belongs to published a new loan product.
  'new_loan_product',
  -- The employee's confirmed salary is stale or disputed and needs a fresh payslip.
  'salary_reverification'
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,

  category public.notification_category not null,

  -- The whole message, already written for this one person. Deliberately not a template key
  -- plus parameters: a notification says what happened at the moment it happened, and it must
  -- keep saying that even if the wording of that event's template changes later.
  message text not null check (length(trim(message)) > 0),

  -- Where tapping it goes — an in-app path such as '/loans/<id>'. Nullable, because not every
  -- notification has somewhere useful to lead.
  target_url text check (target_url is null or target_url like '/%'),

  -- Null until read. A timestamp rather than a boolean, so "mark all as read" records when the
  -- backlog was cleared and not merely that it was.
  read_at timestamptz,

  created_at timestamptz not null default now()
);

-- The screen's only query: this user's rows, newest first. Unread-first ordering is done in the
-- application, so this one index serves both the list and the unread count.
create index notifications_user_created_idx
  on public.notifications (user_id, created_at desc);

comment on table public.notifications is
  'Per-employee notifications (blueprint 6.1, DECISIONS.md D025). Write path arrives with the cooperative admin/officer blueprint; there is deliberately no insert policy.';

-- ---------------------------------------------------------------------------
-- Row-Level Security
--
-- The narrowest policy set in the schema, and deliberately so: a notification is addressed to
-- one person. There is no officer view of it, no admin view of it, and no cooperative-scoped
-- read — unlike `users`, where an officer at the member's own cooperative can legitimately read
-- the eligibility figures. Nothing about a notification is anyone else's business.
--
-- There is no insert policy at all, which is the same shape `loans` uses. An employee cannot
-- write their own notifications: every row records something the system or a cooperative did,
-- so a self-written one would be a claim, not a record. No delete policy either — clearing a
-- backlog marks rows read rather than destroying the trail.
-- ---------------------------------------------------------------------------

alter table public.notifications enable row level security;

create policy notifications_select_own
  on public.notifications for select to authenticated
  using (user_id = auth.uid());

-- Update exists for exactly one purpose: setting read_at, including the bulk "mark all as read".
-- The USING and WITH CHECK clauses together stop a row being reassigned to another user.
create policy notifications_update_own
  on public.notifications for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

grant select, update on public.notifications to authenticated;
revoke all on public.notifications from anon;
