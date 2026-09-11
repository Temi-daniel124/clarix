# SECURITY.md — Clarix

Clarix handles salary figures, national payroll identifiers (IPPIS numbers), payslip images/PDFs,
and loan/savings records for real hospital staff. This document is the boundary list — it's short
on purpose; every rule here is a hard requirement, not guidance to weigh against convenience.

## The core boundary: RLS, not the UI

Per-cooperative data isolation is enforced entirely by Postgres Row-Level Security policies keyed
on `cooperative_staff_roles` (see `docs/DATA-MODEL.md`). **No feature may rely on a UI-side check
alone to protect financial data.** If a screen hides a link a user "shouldn't" follow, that's a
UX nicety, not security — the RLS policy underneath must independently refuse the request. Every
new table that carries `cooperative_id` or `organization_id` gets its RLS policy in the same
migration that creates the table.

## Supabase project isolation

- **Project:** `Clarix`, project ref: `<TO BE FILLED IN — updated once the project is created>`.
- This is a **new, standalone project** inside an existing Supabase organization that already
  contains one unrelated project. That unrelated project's database, storage, auth users, and API
  keys must never be queried, referenced, or connected to from this codebase, by any script,
  migration, or environment variable. If you are ever unsure which project a command targets,
  stop and confirm the project ref first.
- The Supabase **service-role key** (which bypasses RLS entirely) is server-only. It must never
  reach the browser bundle, never be prefixed `NEXT_PUBLIC_`, and its use should be limited to a
  small, explicitly enumerated set of trusted server-only code paths — enumerate them here as
  they're introduced, so this list stays a real audit trail rather than going stale:
  - *(none yet — add an entry the first time a service-role-key code path is written, naming the
    file and why RLS can't be used there instead)*

## Secrets

- No secret (Supabase keys, Resend API key, the AI payslip-OCR API key) is ever committed to the
  repository, in any form — not in code, not in a comment, not in a "temporary" config file, not
  in a commit message.
- `.env.local` is gitignored from the very first commit. Verify `.gitignore` includes it before
  the first `.env.local` is ever created locally.
- Production secrets live in Vercel's environment variable settings, entered through the Vercel
  dashboard/CLI directly — never pasted into a file that gets committed, even briefly.
- If a secret is ever accidentally committed, treat it as compromised: rotate it immediately
  (regenerate in Supabase/Resend/the AI provider's dashboard) rather than just removing it from a
  future commit — git history retains it either way.

## PII and sensitive data handling

- **Salary figures, IPPIS numbers, and uploaded payslip files are sensitive personal data** under
  the Nigeria Data Protection Act (NDPA) 2023 — handle them with a lawful basis (the employee's
  own signup/consent flow), and never expose more of them than a given screen's stated purpose
  requires.
- Uploaded payslips are stored in a **private** Supabase Storage bucket — never a public bucket,
  never a publicly-guessable URL. Access is mediated by a signed URL or an RLS-equivalent storage
  policy, scoped to the uploading employee (and, if ever needed for support, only through the
  Access Grant flow below).
- The cross-cooperative eligibility lookup exposes only the aggregate figures the formula needs
  (salary basis, combined committed obligations, resulting capacity) — **never** another
  cooperative's savings balance or any other cooperative's private member data. This is not a UX
  choice, it's the governing rule of the whole product (`docs/DECISIONS.md` D003) and must be
  enforced at the query level, not just by what the UI chooses to render.
- Payslip OCR: when the AI-fallback path is used, only the minimum content needed for extraction
  is sent to the API call, the response is treated as untrusted until a human confirms it
  (`docs/DECISIONS.md` D006), and no salary data is retained by that call path beyond what the
  API provider's own data-use terms allow — check those terms before enabling this path in
  production and note the outcome here.

## Super Admin's Access Grant exception

Super Admin has **no standing access** to any cooperative's member-level financial data — this is
enforced by RLS (Super Admin's role has no matching `cooperative_staff_roles` row anywhere) plus
application logic that never assumes otherwise. The one deliberate exception is the
`access_grants` flow (`docs/DATA-MODEL.md`, `docs/ROLES-AND-PERMISSIONS.md`):

- Every grant requires a non-generic, non-blank reason.
- The affected cooperative's Admin is notified the moment a request naming their cooperative is
  submitted.
- Grants are strictly time-boxed (short default window) and read-only — never write access.
- Every screen/record viewed under an active grant is logged individually, more granular than
  ordinary audit events.
- If this flow is ever implemented without every one of the above properties, it is a security
  bug, not a shortcut.

## Audit log

Every view or edit of financial data records who, what, when, and (for edits) old→new value
(`docs/DATA-MODEL.md` → `audit_log`). This table is append-only from the application's
perspective — no UPDATE or DELETE path should ever be exposed against it.

## Dependency security

See `docs/TOOLING-POLICY.md` §"The bar for adding anything new," item 5: anything that would see
salary figures, IPPIS numbers, or payslip files in cleartext gets called out here explicitly
before it's added — add an entry to the list below the first time such a dependency is
introduced.

- *(none yet)*

## Incident posture

If a security boundary described in this document is ever found to be violated in the deployed
app (an RLS gap, a leaked secret, financial data reachable without the intended check), treat it
as a stop-everything issue: fix the boundary first, rotate any exposed secret, then continue
other work — don't ship the fix alongside unrelated feature work where it could get lost in
review.
