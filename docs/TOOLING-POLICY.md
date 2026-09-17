# TOOLING-POLICY.md, Clarix

**Authority level: 3.** Defers to `DECISIONS.md` (D012, D013, D015). Lists what's already
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
| Hosting | Vercel | `ARCHITECTURE.md` |
| Schema management | Supabase CLI (`supabase link`, `db diff`, `db push`) | `DECISIONS.md` D015: no local Docker |
| DB testing | pgTAP, via GitHub Actions hosted runner | `DEVELOPMENT-WORKFLOW.md` |
| Validation | Zod (or an equivalent already-standard schema-validation library) | For form and API-boundary validation; pick one and use it everywhere, don't mix two |

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
- Any payment/money-movement SDK (Stripe, Paystack, Flutterwave, etc.), `DECISIONS.md` D004,
  Clarix never moves money.
- Any AI/ML library or service used to *make* the eligibility decision, as opposed to the
  payslip-OCR fallback, `DECISIONS.md` D018.

## P1 candidates (not approved yet, worth revisiting after MVP)

- Playwright, for automated UI/visual-regression testing against the design system, useful once
  there's a stable enough UI surface to regression-test meaningfully.
- A background-job runner (if Vercel's own background-function support proves insufficient for
  the payslip-OCR fallback queue described in `ARCHITECTURE.md`).
