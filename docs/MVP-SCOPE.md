# MVP-SCOPE.md — Clarix

**Authority level: 3.** Defers to `DECISIONS.md`. This is what gets built for the agreed MVP
payment — anything not listed under Must-Have is out of scope for this phase, full stop. If a
task during implementation seems to require something not listed here, stop and raise it rather
than quietly building it.

## Goals

- A cooperative can submit a loan application and get a correct eligible/not-eligible answer,
  computed against the member's *actual* cross-cooperative obligations, without seeing any other
  cooperative's private records.
- Two cooperatives cannot simultaneously approve loans against the same slice of an employee's
  deduction headroom — the reservation mechanism must hold under real concurrent use.
- An employee opens one dashboard and sees correct totals across every cooperative they belong to.
- A cooperative admin can import their existing member roster from a spreadsheet without manually
  re-typing records.
- All committed FMC Abeokuta cooperatives are onboarded with real member data inside the pilot
  window.

## Non-Goals (v1)

- No money movement — Clarix never holds, deposits, or transfers funds.
- No payroll/IPPIS integration.
- No external lender/loan-shark tracking.
- No native mobile app.
- No multi-organization support.
- No AI/ML in the eligibility decision.
- No organization-level roles (HR, payroll, auditor).

## Must-Have (P0) — the MVP

1. **Auth & account.** Single account per employee; email/phone + password; role assignment
   (Admin/Officer set by Super Admin or an existing Admin at onboarding).
2. **Cooperative onboarding via spreadsheet import.** Upload CSV/XLSX; automatic column matching
   against a synonym dictionary ("IPPIS"/"Staff No."/"Employee ID" → `employee_id`,
   "Savings"/"Contribution Balance" → `savings_balance`, etc.); a mapping screen to confirm or
   remap anything unresolved; duplicate-row and duplicate-column detection before commit; a
   downloadable blank template for irregular sheets; a Ready/Needs-review/Invalid preview with
   inline correction — nothing auto-committed without an explicit confirm.
3. **Employee onboarding.** Signup, employee ID entry (validated against the organization's ID
   format), payslip upload (image/PDF), extracted-field review-and-confirm screen, join/apply to
   cooperative(s).
4. **Per-cooperative data isolation**, enforced server-side via RLS (`DATA-MODEL.md`), not just
   hidden in the UI.
5. **Deduction policy engine** — configurable basis (gross/net) and percentage cap, set at
   organization level by Super Admin; cooperatives inherit it.
6. **Cross-cooperative eligibility check** — salary basis, cap, existing active+reserved
   obligations across all cooperatives, available capacity, eligible/not-eligible for a requested
   amount + tenure. Available any time, not gated to a submission event.
7. **Capacity reservation** — submitting a loan atomically reserves the requested monthly amount;
   see `DATA-MODEL.md` for the advisory-lock transaction.
8. **Loan lifecycle** — draft → submitted (reserved) → approved (active) or rejected (released) →
   completed. Reservation auto-expires (default 7 days, configurable) if never actioned.
9. **Employee dashboard** — aggregate KPI cards (total savings, active loans, monthly deductions,
   available capacity) across the employee's own memberships only.
10. **Cooperative switcher** — dropdown/list on the employee side for per-cooperative detail.
11. **Cooperative discovery** — public profile (name, description, requirements, packages/
    benefits) visible to any employee; full member data visible only after joining.
12. **Officer permission toggles** — Admin controls exactly what each officer can do, default-deny.
13. **Audit log** — every view/edit of financial data records who, what, when, old→new value.
14. **Payslip upload — salary basis only, not a deduction ledger.** See `DECISIONS.md` D006.

## Nice-to-Have (P1 — fast follow after MVP proves out)

- Automated payslip field extraction via the vision-capable LLM fallback (the confirm-before-save
  step is retained regardless).
- Email notifications (Resend) for a capacity breach or an expiring reservation.
- Monthly reconciliation entry screen (expected vs. actually-received deduction).
- Richer reporting/export for cooperative admins.

## Future Considerations (P2 — explicitly deferred, don't architect against)

- Multi-organization support.
- Licensed credit-bureau integration for external lender visibility.
- Native mobile app.
- Anomaly detection on deduction shortfalls once enough historical data exists.

## Success Metrics

**Leading (check end of pilot week 1–2):**
- % of committed cooperatives completing spreadsheet import without unresolved row errors.
- Number of employees completing payslip upload + confirmation during onboarding.
- Number of eligibility checks run by officers/admins.

**Lagging (check end of month 1 — this is the number that sells the paid plan):**
- Count of loan requests flagged not-eligible that a cooperative, by their own account, would
  otherwise have approved without the check.
- Cooperative heads' own willingness-to-pay response when the paid-plan conversation opens.

## Timeline

No hard external deadline. P0 above is the MVP that gets delivered for the agreed payment; P1 is
the "more is coming" fast-follow that keeps cooperatives and employees engaged through the free
hook month, ahead of the paid-plan conversation.

## Screens-by-role (pointer)

The full screen-by-screen build spec for each role lives under `docs/planning/`:
`clarix-employee-ux-blueprint.md`, `clarix-cooperative-admin-ux-blueprint.md`,
`clarix-cooperative-officer-ux-blueprint.md`, `clarix-super-admin-ux-blueprint.md`. Treat those
documents as the literal screen inventory for P0 — build every screen they describe; don't invent
additional ones without a reason traceable back to a P0 requirement above.
