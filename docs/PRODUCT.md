# PRODUCT.md, Clarix

**Authority level: 2.** Defers to `DECISIONS.md` on anything that conflicts. This is the "why" and
"for whom". For "what to build" see `MVP-SCOPE.md` and `BUILD-PLAN.md`; for "who can do what" see
`ROLES-AND-PERMISSIONS.md`. Rewritten for Release 2 (22 November 2026, D034 to D042).

## The problem

Across Nigeria, people belong to more than one cooperative: a staff cooperative at work, a thrift
society in their trade, a multipurpose cooperative in their community, a church or mosque society.
Each cooperative approves loans on its own, with no view of what the member already owes at the
others. When the repayments are deducted from a salary, Nigerian labour law caps the total at
one-third of wages; when they come from a trader's or artisan's income, there is no cap at all, only
a person who has promised more than they earn.

Either way the problem shows up too late: at payroll, or when repayments stop. The cooperative loses
money and time chasing it, and the member ends up over-committed. A real FMC Abeokuta payslip showed
three separate cooperative deductions running against one employee, at 30.3% of gross pay and 58.1%
of net. That is the pattern Clarix exists to catch before the next loan is approved, wherever it
happens.

Today each cooperative also runs its books in spreadsheets, notebooks and WhatsApp. That is the
second problem Clarix solves, because the cross-cooperative check is only as good as the records
behind it.

## The product, in one sentence

Clarix gives every cooperative a member belongs to one honest answer, before a loan is approved, to
"can this member really afford another repayment?", computed across all of their cooperatives
without any of them seeing another's records, and it keeps the day-to-day books (members, savings,
loans, imports, exports, statements) that make that answer correct.

## Who it is for

- **The customer is the cooperative.** It pays (D041); its admin and officers use Clarix daily.
- **The member never pays** and gets one place to see every cooperative, savings, loans and what they
  can still afford.
- **An institution** (an employer such as FMC Abeokuta, a market association, a union) is optional
  context: it can set a default repayment policy its cooperatives inherit and lower, but it is not a
  user of Clarix and has no role (D001, D034).

**FMC Abeokuta is the first customer**, not the product's boundary. Its five staff cooperatives are
the pilot and the demo; nothing in the code or copy assumes them (D034).

## How it works, for a member

1. Create an account with an email (phone sign-in later, D022) and join or find each cooperative.
2. Optionally add proof of income: a payslip, 3 to 6 months of bank statements, or a declared figure
   marked as not verified (D035). Without any, everything works except that the limit reads
   "Not assessed yet".
3. See one home: available to borrow, savings, loans and this month's repayments across every
   cooperative.
4. Apply for a loan at any one cooperative, with the live meter showing what fits. An application
   above the limit is still sent; it just holds nothing and the cooperative decides (D040).

## How it works, for a cooperative

1. Onboarded by the Clarix team (self-signup comes once email works, `DECISIONS.md` → Open). Import
   the member list and existing loans from the spreadsheet it already keeps (D036).
2. Record contributions and repayments one by one or in bulk each month; reconcile what payroll or
   the bank actually delivered.
3. Every application arrives with the answer already worked out: the combined committed figure
   across all cooperatives, the member's limit, and room left. Only that combined figure ever crosses
   between cooperatives (D003).
4. Export the books (CSV, Excel, PDF) and issue watermarked member statements (D044).
5. 60 days free, then ₦150 per active member per month, ₦5,000 minimum (D041).

## Product principles

1. **The check is the core; the books serve it.** Clarix keeps the records a cooperative needs day to
   day, but every feature must make the cross-cooperative answer more correct or easier to act on
   (D036). It is not a general accounting package and never moves money (D004).
2. **Minimum necessary disclosure, always.** No screen or API exposes more cross-cooperative detail
   than the eligibility formula needs (D003).
3. **Informs, never gatekeeps.** A member can always apply and a cooperative can always approve above
   the limit with a written reason. Nothing is silently dropped (D040).
4. **Missing data degrades gracefully.** No income evidence, no staff ID, an odd spreadsheet: each
   becomes "Not assessed yet" or "needs review", never a crash, a block, or silence
   (`docs/EDGE-CASES.md`).
5. **The maths is boring on purpose.** Deterministic arithmetic, auditable, no model in the decision
   (D018).
6. **It must look like it can be trusted with money.** A premium, calm, light interface that behaves
   like a native app on a phone and a desktop (`DESIGN_SYSTEM.md`).

## Non-goals

No money movement and no deductions taken by Clarix. No payroll or IPPIS integration (D004). No
tracking of lenders outside Clarix (no legal, reliable source exists). No native app-store app (the
PWA installs). No AI in the eligibility decision. No institution-level roles (HR, payroll, auditor).

## The limit of what Clarix can see

Clarix coordinates across the cooperatives that are on Clarix. It cannot know about a loan taken
anywhere else.

If Cooperatives A and B are on Clarix and C is not, a member who borrows from C and then applies at
B is assessed against A and B only. Two things follow, and both are said plainly to any cooperative
considering joining:

- **The protection is real but partial, and it grows with adoption.** Every cooperative that joins
  makes the answer more complete for every other one.
- **A member or officer can declare other monthly repayments** (`docs/EDGE-CASES.md` E16), and they
  count. That narrows the gap; it does not close it.

Any claim that Clarix prevents over-borrowing, made without this qualification, is a claim the
product cannot support. The landing page must not make it.

## Competitors and position

Researched November 2026 (the owner holds the full pricing report; its conclusions are summarised here and in D041): CoopOS (₦100 per
member), JIBTECH (₦400 falling to ₦200 per member), TrustCoop (₦30,000 flat), Coopco (₦15,000 to
₦90,000 per month by tier), ProntoCoop, and the six reviewed in R1 (Coopify, ProbityCoop, Hyves,
Coopra, SODLAPP). All of them run one cooperative's books; **none checks a member's obligations
across cooperatives.** Clarix's position: the books at a fair per-member price, plus the one check no
one else can give, which gets better the more cooperatives join.

## Business model

Bill the cooperative only: ₦150 per active member per month, ₦5,000 minimum, yearly at 10× monthly,
60-day free trial, 14-day grace, then read-only (never deleted). Free tiers until the first
cooperative pays; at first revenue, paid hosting costs about ₦65,000 per month, so break-even is
about 450 active members across all cooperatives (D041, D042, D049).

## Success signals

- **The one that sells it:** loan applications the check flagged above the limit that the cooperative,
  by its own account, would otherwise have approved.
- Cooperatives that finish importing members and existing loans in their first week.
- Members who open Clarix again in their second month.
- Trial-to-paid conversion at day 60.
