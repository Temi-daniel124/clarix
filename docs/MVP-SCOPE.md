# MVP-SCOPE.md, Clarix

**Authority level: 3.** Defers to `DECISIONS.md`. Release 1 (R1, the FMC MVP) is built and live.
This file now lists what Release 2 (R2) adds and what stays out. The order of work is
`docs/BUILD-PLAN.md`. If a task seems to need something not listed here, stop and raise it.

## R1: built and live (keep working; regressions are bugs)

Auth and accounts; cooperative onboarding by the Super Admin with admin invitations; roster import
(CSV/XLSX, synonym matching, preview, template); member onboarding; per-cooperative isolation by RLS;
deduction policy; the cross-cooperative eligibility check; capacity reservation with the advisory lock;
loan lifecycle with expiry; member dashboard and cooperative detail; cooperative discovery; officer
permission toggles; audit logs; payslip upload with typed figures; reconciliation screen; three
reports; Super Admin time-boxed access grants; PWA install and offline page.

Known R1 defects fixed in R2 Phase 0: over-limit applications not stored (D040); `npm ci` failing;
no way to enter existing loans; previews sharing the production database (D043); contradictory
counts and stale timestamps on home screens.

## R2 goals

- Any Nigerian cooperative, with or without an employer behind it, can use Clarix end to end (D034).
- A member with no payslip, no staff ID or irregular income can join, save and apply (D035, D040).
- A cooperative can bring its whole existing book (members and loans) in on day one (D036).
- A cooperative can export its records and give members watermarked statements (D036, D044).
- Every screen meets `DESIGN_SYSTEM.md`: light only, Figtree, summary homes with sheets (D037–D039).
- Clarix can charge a cooperative after a 60-day trial without ever deleting its data (D041, D042).

## R2 Must-Have (P0), in build order

1. **Phase 0 fixes** (BUILD-PLAN 0.1–0.5).
2. **Design foundation**: tokens, Figtree, light only, pill buttons, inputs, sheet and side panel, app
   shells with cooperative switcher and command search (1.1–1.4).
3. **Brand and SEO**: logo set, favicon and app icons, OG image, sitemap, robots, manifest (2.1–2.2).
4. **Generalisation**: institution optional, member ID per cooperative, repayment policy per
   cooperative, no FMC wording, onboarding without salary (3.1–3.3).
5. **Summary home screens** for all four roles (4.1–4.4).
6. **Public site** (landing with hero carousel or video, pricing, sign in/up, onboarding, legal) (5.x).
7. **Inner screens** restyled, plus staff applying for a member, bulk monthly entry, and staff
   notifications (6.x).
8. **Income evidence**: payslip, bank statements, declared; ageing; sanity bands (7.x).
9. **Books around the check**: import v2 with existing loans, PDF statements, exports, verification
   codes, auto-join with confirmation (8.x).
10. **Trial and billing**: trial clock, reminders, grace, read-only mode, manual payments, invoices
    (9.1–9.4).

## R2 Nice-to-Have (P1)

- Paystack checkout (9.5, after the owner confirms the provider).
- Email for invites, statements and reminders (needs the domain and a verified Resend sender).
- Cooperative self-signup from the public site (needs email).
- OCR or vision fallback for photographed payslips and statements (needs its own decision and a
  `SECURITY.md` update before a document leaves Clarix).
- Repayment schedules other than equal monthly.
- Playwright visual regression on the key screens.

## Future (P2, do not architect against)

Phone sign-in (paid SMS); licensed credit-bureau checks; payroll integration; native store apps;
anomaly detection on shortfalls; multi-currency.

## Non-goals (unchanged in spirit)

No money movement. No payroll/IPPIS integration. No lender tracking outside Clarix. No AI in the
eligibility decision. No institution-level roles. No member-paid plans.

## Success metrics

**Leading (first two weeks of each cooperative):** import completed with existing loans; share of
members with any income evidence; checks run per officer.

**Lagging (day 60):** over-limit applications the cooperative says it would otherwise have approved;
trial-to-paid conversion; members returning in month two.

## Screens by role (pointer)

`docs/planning/`: the four role blueprints (read each one's R2 header first), plus
`clarix-public-site-blueprint.md`, `clarix-documents-blueprint.md` and `clarix-billing-blueprint.md`.
Build every screen they describe; do not invent screens without a reason traceable to a P0 item above.
