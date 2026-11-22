# TOOLING-POLICY.md, Clarix

**Authority level: 3.** Defers to `DECISIONS.md` (D012, D013, D015, and for R2 D038, D042, D044). Lists what's already
approved and the bar for adding anything else. If it's not on the approved list and doesn't clear
the bar, don't add it without raising it first.

## Approved (already locked in by DECISIONS.md)

| Category | Choice | Notes |
|---|---|---|
| Framework | Next.js (App Router), React, TypeScript | `DECISIONS.md` D012 |
| Styling | Tailwind CSS | |
| Component base | shadcn/ui (base-ui) | Reskinned per `DESIGN_SYSTEM.md` tokens, never used with its default demo styling |
| Animation | Motion (`motion/react`, formerly Framer Motion) | One standard spring config, see `DESIGN_SYSTEM.md` |
| Icons | `lucide-react`, **the only icon library** | `DECISIONS.md` D013. Do not add `react-icons`, `@hugeicons/react`, or any other icon package. |
| Backend/DB/Auth/Storage | Supabase (single project: `Clarix`) | `DATA-MODEL.md`, `ARCHITECTURE.md` |
| Email | Resend | Invite links, notifications (P1) |
| Payslip OCR fallback | Claude or OpenAI API (whichever is chosen) | Server-only, never the eligibility decision itself, `DECISIONS.md` D018 |
| Hosting | Vercel (Hobby until first revenue, D049) | `ARCHITECTURE.md` |
| Typeface | Figtree via `next/font/google` (no npm package, self-hosted at build) | D038. Inter via `next/font` only as the tabular-figure fallback for money if Figtree fails the test |
| Schema management | Supabase CLI (`supabase link`, `db diff`, `db push`) | `DECISIONS.md` D015: no local Docker |
| DB testing | pgTAP, via GitHub Actions hosted runner | `DEVELOPMENT-WORKFLOW.md` |
| Validation | Zod (or an equivalent already-standard schema-validation library) | For form and API-boundary validation; pick one and use it everywhere, don't mix two |

## Pre-approved for R2 (add only when the BUILD-PLAN step that needs it starts)

| Need | Choice | Condition |
|---|---|---|
| Bottom-sheet drag gestures | `vaul` | Only if Base UI Dialog cannot give smooth drag-to-dismiss on iOS Safari (BUILD-PLAN 1.3). Reskinned to tokens |
| PDF generation (statements, reports, invoices) | `@react-pdf/renderer` first choice; `pdf-lib` if only stamping is needed | BUILD-PLAN 8.1. Must render a 2-page statement in under 3s on a Vercel Hobby function (10s limit); embeds Figtree TTF; record the choice as a new decision when added |
| XLSX writing for exports | `exceljs` or `write-excel-file` | BUILD-PLAN 8.4. Reading stays on the existing in-house reader unless 8.2 tests show it cannot handle real files; then raise it |
| PDF text extraction (payslips, statements) | `unpdf` or `pdfjs-dist` | BUILD-PLAN 7.3. Runs server-side; the file never leaves Clarix |
| Payments | Paystack (REST, no SDK needed) | **Provisional, D042.** Not before the owner confirms. Bills the cooperative's subscription only; it never touches members' money |
| E2E and screenshots | Playwright (already in the cloud environment) | For PR screenshots and smoke tests on the Preview; visual regression stays P1 |

## The bar for adding anything new

A new dependency is fine to add if **all** of the following hold:

1. **It doesn't duplicate an approved choice above.** No second icon library, no second animation
   library, no second component base, no second date/formatting utility once one is chosen.
2. **It doesn't require Docker or any local daemon on the development machine.** `DECISIONS.md`
   D015 is absolute, if a library's only local dev story assumes a running local service, it's
   disqualified regardless of how good it otherwise is.
3. **It fits inside the free-tier infrastructure constraints** (`ARCHITECTURE.md` → Scaling
   notes) or is the one already-budgeted paid AI API call. Nothing that adds a second paid
   service without that being raised and agreed first.
4. **It's actively maintained and widely used**: not an experimental or single-maintainer
   package for anything that touches auth, payments-adjacent logic (even though Clarix moves no
   money, the eligibility/reservation code is exactly this sensitive), or PII handling.
5. **It doesn't touch secrets, PII, or the eligibility calculation without a security read.** Any
   dependency that would see salary figures, IPPIS numbers, or payslip files in cleartext gets
   called out explicitly in `SECURITY.md` before it's added, not after.
6. **If it's a genuinely architecture-level choice** (a state-management library, a different
   ORM/query layer, a testing framework beyond what's listed in `DEVELOPMENT-WORKFLOW.md`), it
   gets a new entry in `DECISIONS.md` first. This file only tracks the bar, `DECISIONS.md` is
   where a new locked-in choice actually gets recorded.

## Explicitly rejected

- Any second icon library (see D013).
- Any local Docker-based dev database tooling (see D015).
- A native mobile framework (React Native, Flutter, etc.), `DECISIONS.md` D014, no native app in
  v1.
- Any payment or money-movement integration for **members' money** (savings, loans, repayments),
  `DECISIONS.md` D004. Clarix never moves members' money. The one exception is the cooperative's own
  subscription to Clarix (D041, D042), and only through the provider the owner confirms.
- `react-icons` (Watermelon snippets import it; convert to lucide, `docs/REFERENCE-STUDY.md` §3).
- Any display, serif or wide typeface (D038).
- A dark-mode or theme library (D037).
- Any AI/ML library or service used to *make* the eligibility decision, as opposed to the
  payslip-OCR fallback, `DECISIONS.md` D018.

## P1 candidates (not approved yet, worth revisiting after MVP)

- Playwright, for automated UI/visual-regression testing against the design system, useful once
  there's a stable enough UI surface to regression-test meaningfully.
- A background-job runner (if Vercel's own background-function support proves insufficient for
  the payslip-OCR fallback queue described in `ARCHITECTURE.md`).
