# Clarix — Strategic Analysis: Cross-Cooperative Loan & Deduction Coordination Platform

*Prepared for: Joshua | Framework: Full strategic/competitive/product review | Date: September 2026*

---

## Executive Verdict

**BUILD WITH MODIFICATIONS.** The core problem is real, legally grounded, and currently unsolved by any product I could find — but the idea as described is scoped too wide for a ₦50,000 budget and a solo build. Narrow it to one function done well (a cross-cooperative loan/deduction registry + an employee dashboard), settle a data-governance question that isn't yet answered, and prove it manually with real cooperatives before writing the automation-heavy parts (OCR, multi-org scaling).

---

## Opportunity

Inside one organization, several independent staff cooperatives each run their own savings/loan books. None of them can see what a member owes the *other* cooperatives they've joined. Nigerian law caps total salary deductions at one-third of monthly wages. When two or more cooperatives approve loans independently, the combined repayment can breach that cap or exceed net pay, and someone — a cooperative, or the employee — loses out when payroll reconciles the deductions. The opportunity is a neutral coordination layer that lets a cooperative check, before approving a loan, what a prospective borrower already owes elsewhere in the same organization, and gives the employee one place to see their own standing across every cooperative they belong to.

## Core Problem

**VERIFIED FACT:** Nigeria's Labour Act, Section 5, caps total deductions from a worker's wages in any month at one-third of those wages, and requires that deductions be expressly authorized. ([jurist.ng](https://jurist.ng/labour_act/sec-5)) This is the hard constraint your whole product is built around, and it's real, not a company policy.

**VERIFIED FACT (that the underlying pain is real, not hypothetical):** The Nigerian government's own federal payroll system, IPPIS, rolled out a consolidation mechanism ("WACS") specifically because multiple third-party loan deductions were colliding on civil servants' salaries. Reporting on it describes exactly your failure mode at national scale: workers hit with deduction amounts they don't recognize, some denying they ever borrowed from the entity named, and take-home pay dropping below what payslips show. IPPIS's own response was that WACS exists to consolidate multiple loans and "remove them simultaneously" — an admission that the multi-lender collision problem is real enough to need a federal fix. ([fij.ng](https://fij.ng/article/more-civil-servants-complain-about-wacs-deduction-but-ippis-says-its-loan-management/), [fij.ng](https://fij.ng/article/ippis-lets-unknown-crevance-credit-deduct-non-existent-loan-from-civil-servants-salary/))

That's useful in two directions. It confirms this is a **painkiller, not a vitamin** — cooperatives lose money or get delayed payments (a direct financial/operational cost), and employees can be pushed into an unpayable position. But it's also a warning: the government's own attempt at a fix is currently experienced as opaque and untrustworthy. If your product repeats that mistake — silently reconciling deductions without the employee understanding why — you inherit WACS's trust problem instead of solving it.

Classified: this is a **risk-reduction + compliance-driven** problem for the cooperatives (avoiding financial loss and unlawful over-deduction), and a **cost-avoidance** problem for employees (avoiding a debt trap they didn't see coming).

## Ideal Customer

**Beachhead:** the cluster of staff cooperatives operating inside the one IPPIS-payroll organization you already have a contact in (your description — multiple cooperatives, IPPIS numbering, "just like departments in a school" — strongly suggests a federal hospital, university, or similar federal MDA, since IPPIS is the federal government's payroll system). This is a warm lead: a cooperative head already approached you and articulated the problem unprompted. That's real signal — don't spend energy chasing a colder market first.

Within that organization there are at least two distinct buyer/user roles:
- **Cooperative head/exco (economic buyer):** wants the "type an IPPIS number, see eligibility" tool. Their pain is operational risk (approving a loan that later can't be fully deducted) and manual effort (phoning around, or not checking at all).
- **Employee/member (end user, not the buyer):** wants one dashboard instead of asking each cooperative's treasurer separately.

The company/HR itself is explicitly **not** a customer here — you have no payroll access and the platform is scoped to cooperatives, not the employer. Keep it that way; adding the employer as a stakeholder later adds a procurement/IT-security layer you don't need yet.

## Why Now

Two real, current conditions make this worth doing now rather than later. First, the IPPIS/WACS rollout is actively generating public frustration and distrust right now, which primes cooperative leaders to want something they control and understand, instead of waiting on a government mechanism they don't trust. Second, Nigeria's Data Protection Act 2023 has made "how do you handle our members' salary and ID data" a live, current question cooperatives are more likely to ask than they were a few years ago — answering it well (consent, transparency, minimal disclosure) is a differentiator today in a way it might not have been five years ago. ([kpmg.com](https://kpmg.com/ng/en/home/insights/2023/09/the-nigeria-data-protection-act--2023.html))

## Current Alternatives

- **Manual/ad hoc (the actual status quo you described):** treasurers occasionally phoning each other, or — more commonly — nobody checking at all until IPPIS reconciles multiple deduction demands and something has to lose.
- **General cooperative management software** (see Competitive Landscape) — handles one cooperative's own books well, has no visibility into a member's obligations elsewhere.
- **IPPIS/WACS at the federal level** — exists, but is aimed at consolidating third-party lender deductions system-wide, is opaque to the workers it affects, and there's no evidence it lets an individual cooperative check eligibility *before* approving a loan. It's a different layer solving an adjacent version of your problem, badly.
- **Do nothing** — is the live default today, and it's the thing actually causing the losses and delays your contact described.

## Competitive Landscape

I checked the cooperative-software vendors that actually surface for this market in Nigeria: Coopify, Coopco, ProbityCoop, plus listings for CoopSolve, SmartTeller, SNS System, and Prolean. ([coopify.africa](https://coopify.africa/), [coopco.com.ng](https://coopco.com.ng/), [probitysoftware.com](https://probitysoftware.com/coop.html))

**What they do well:** mature single-cooperative operations — contribution automation, membership management, loan request/approval workflows, accounting (cash book, ledgers, trial balance), mobile apps, SMS alerts. Coopify claims 500+ cooperatives across Africa on its platform (vendor claim, not independently verified — treat as **strong inference of market existence**, not a verified figure).

**What none of them do, based on direct review of their own feature descriptions:** show a cooperative anything about a member's obligations at a *different* cooperative. Every one of them is built to run one cooperative's books in isolation. That absence, checked across three vendors' own marketing content, is the actual whitespace — nobody selling cooperative software in this market is selling the cross-cooperative view. This is not a crowded-market problem where you need to out-feature incumbents; it's a layer that doesn't exist yet.

**Where customers are forced to compromise today:** cooperatives that want the eligibility answer your contact described have no software option — they either don't check, or they rely on the employee's word.

## Customer Pain

Frequent and financially real, by the cooperative head's own account: cooperatives lose money or experience delayed deductions when combined obligations exceed what payroll can legally or practically remove. At the federal-system level, the WACS coverage shows the failure mode compounding into real hardship for employees (take-home pay below what's needed, confusion about what's even being deducted). Both sides of the transaction — lender and borrower — are harmed by the same blind spot.

## Switching Trigger

For the cooperative: *"Check this member's total obligations across every cooperative in this hospital before you approve, so you're never the cooperative that loses a deduction when IPPIS can't fit everyone under the 33% cap."*

For the employee: *"One dashboard, all your cooperatives, instead of asking four treasurers separately — and unlike the government's loan-consolidation system, you can see exactly why a deduction happened before it happens."* The explicit contrast with WACS's opacity is your actual switching argument against the nearest "solution" that exists — not against the cooperative software vendors, who aren't solving this problem at all.

## Proposed Advantage

A neutral, transparent, cross-cooperative registry that computes loan eligibility against the legal 1/3 cap using data every cooperative already has (their own members' balances) plus a shared minimal-disclosure view of what else a member owes — without giving any cooperative access to another cooperative's members' savings detail. Transparency to the employee is the deliberate opposite of WACS's biggest complaint.

## Product Strategy

**Table stakes:** member registration, per-cooperative savings/loan display, basic loan request workflow.
**Differentiator:** the cross-cooperative eligibility check itself — nobody else offers it.
**Delighter:** the employee-facing multi-cooperative dashboard (KPI cards, switchable by cooperative) — cheap to build, high visible value, and it's the thing that makes employees actively want the platform to exist rather than tolerate it.
**Defensible-if-it-works:** being the one place every cooperative in that institution actually relies on for the eligibility answer — durable only if adoption becomes near-complete (see Risks).

## AI/ML Strategy

**Where AI should NOT be used:** the eligibility decision itself. Whether a loan fits under the 1/3 cap is arithmetic against verified numbers (gross/net salary, existing repayment obligations). Making that a model output instead of a transparent, auditable rule would be the wrong kind of AI for a financial-compliance decision, and would repeat WACS's exact complaint — "nobody can explain why this number is what it is."

**Where AI genuinely could help, later:** reading uploaded payslip images/PDFs to populate salary fields. Real vendors exist for payslip OCR (Mindee, Affinda, Klippa, HyperVerge, arya.ai), but they're priced per document and built around templates — Nigerian payslip formats vary a lot by employer, so template OCR will misfire often. ([mindee.com](https://www.mindee.com/product/payslip-ocr-api), [affinda.com](https://www.affinda.com/documents/payslip/)) A general-purpose multimodal LLM API call ("read the gross pay, net pay, and deductions off this image and return them as fields") is more format-flexible and, at pilot volume, cheaper than committing to a dedicated OCR vendor contract. Either way: **don't build this for v1.** At one pilot company with a small member count, a human reading a payslip and typing three numbers is faster to ship, costs nothing, and is easier to audit than any OCR pipeline you'd build on ₦50,000. Automate it only once volume and revenue justify the API spend.

## Must-Have Features (v1, one-company pilot)

- Cooperative onboarding by spreadsheet import (roster + existing balances) — matches what you already described cooperatives being able to provide; needs no OCR.
- Employee record keyed to IPPIS number (or the org's staff-ID format).
- Strict per-cooperative data boundary: a cooperative sees only its own members' full savings and loan detail.
- The cross-cooperative check itself: given an ID, show *combined active repayment obligations* (amounts and schedules only — not full savings detail from other cooperatives) plus salary and the 1/3-cap math, so an authorized user can see "headroom available" and a flag on whether a requested loan fits.
- Employee dashboard: per-cooperative KPI cards (savings, active loan, next repayment date), switchable by dropdown — this only shows the employee their *own* data across their *own* memberships, so it doesn't conflict with the privacy rule.
- Manual salary entry with the payslip image/PDF attached as supporting evidence for human review, instead of automated extraction.
- Configurable minimum-savings-to-loan ratio per cooperative (25%/35%/50%, as you described it varies).

## Deferred Features

Automated payslip data extraction (LLM-vision based); breach/threshold alerts to employees and admins when a new request would exceed the cap; a formal consent/audit log; expansion to additional companies; any integration with a licensed credit bureau to catch non-cooperative digital-lender debt (see Legal, below — this one needs real validation, not assumption, before it's even a roadmap item).

## Features to Reject

Any in-app movement of money (deposits/withdrawals) — you were explicit this isn't the model, and it shouldn't be; it would turn this into a licensed financial product. Rebuilding general cooperative accounting (ledgers, trial balance, cash book) — Coopify/Coopco/ProbityCoop already do this well; competing there is a distraction from the one thing they don't do. Attempting to track informal loan-app/loan-shark debt right now — there's no reliable, legal data source for it at your stage, and you already flagged this as possibly overreach; agree, and shelve it rather than half-build it.

## Business Model

**UNKNOWN, and worth resolving before you build much more:** is the hospital/company paying you for this, or are you building speculatively hoping to sell it in afterward? That materially changes the urgency and the economics. Absent that answer, the most defensible model: cooperatives are the payer (not employees), because they're the ones with a quantifiable benefit (avoided losses from failed/delayed deductions). A likely path is a free or heavily discounted pilot with the first cooperative(s) to build trust and a case study, moving to a modest recurring fee once the tool has demonstrably prevented at least one real conflict.

## Pricing Hypothesis

**HYPOTHESIS, needs validation:** anchor below what a full cooperative-accounting SaaS charges (Coopify/ProbityCoop both price per member per month for their full system), since you're a complementary coordination layer, not a replacement — either a small flat monthly fee per cooperative, or a small per-member fee only on top of what a cooperative would otherwise lose to deduction conflicts. Don't set a number until you can show a cooperative a real avoided-loss figure from the pilot.

## Unit Economics

At pilot scale, this is almost entirely your time, not cash. Infrastructure for a PWA serving one company's cooperatives is free-tier viable (basic hosting, a free-tier database). The real future cost driver isn't compute, it's compliance: secure storage of salary/ID documents, and, if you automate extraction, per-document AI API costs. Don't let "we'll figure out margins at scale" hide the fact that document security is a real, non-optional cost once you're holding other people's salary slips — budget for it in behavior (careful handling) before you can budget for it in cash.

## ₦50,000 Lean Launch Plan

- Spend nothing on OCR/AI for now — manual entry only.
- Free-tier hosting/DB for the PWA (Vercel/Render/Supabase-class free tiers or similar) — ₦0.
- A cheap `.ng` or `.com` domain — roughly ₦5,000–15,000/year, well within budget.
- Reserve a portion for a CAC business name reservation if you plan to contract formally with the cooperative(s) — Nigerian business name registration is a low-cost, one-time step and matters if money or data-sharing agreements are involved.
- Keep the remainder as buffer for one small paid test batch of AI-based extraction once you know real document volume — don't commit to a vendor contract before that.
- Everything else — design, build, testing — is your own labor, which is the actual budget here.

## Go-To-Market

Founder-led, direct, and already warm: go back to the cooperative head who raised this, and use the conversation to also reach the *other* cooperative heads in the same institution — because the product's value is proportional to how many of that organization's cooperatives actually join. A registry that only two out of six cooperatives use still leaves the same blind spot for the other four. Sell the coordination story to all of them together, ideally with a written agreement on what each shares and who can see the combined view, before you build the aggregate-view feature at all. Only after this pilot has a real result (a prevented conflict, a time saved, a number) should you consider approaching a second IPPIS institution — not before.

## Legal & Compliance

I'm not a lawyer, and specifics here should be confirmed with someone who is before you go live with real employee data. What's established: the Labour Act's one-third cap is the legal anchor your eligibility logic is built on, and it's real. ([jurist.ng](https://jurist.ng/labour_act/sec-5)) Separately, the Nigeria Data Protection Act 2023 governs your handling of salary, ID, and loan data — this generally means you need a lawful basis (most likely consent), a privacy notice, reasonable security measures, and awareness of breach-notification obligations to the Nigeria Data Protection Commission; depending on scale, formal registration obligations may apply. ([kpmg.com](https://kpmg.com/ng/en/home/insights/2023/09/the-nigeria-data-protection-act--2023.html)) Cooperative societies themselves are typically registered and regulated at the state level in Nigeria under state cooperative law — worth confirming the specifics for this institution's state, since it may affect what the cooperative is even permitted to share about its members. Do not treat any of this as a substitute for actual legal review once real employee data is involved.

## Major Risks

**Adoption incompleteness** — probability medium-high, impact high: if not every cooperative in the organization joins, the exact problem you're solving persists for the ones that don't. Mitigate by pitching the coordination story to all cooperatives at once rather than one at a time.

**Governance/trust risk** — probability high if left unresolved, impact high: nobody has yet defined who is allowed to see the combined cross-cooperative view, and getting this wrong either breaches the privacy promise you made or recreates WACS's opacity complaint. Mitigate with a written data-sharing agreement, before onboarding real data, that limits the shared view to minimal fields (amounts/schedules, not full savings detail).

**Legal/compliance risk** — probability medium, impact high: mishandling salary and ID data under the NDPA is a real exposure. Mitigate with actual legal review before go-live.

**Data integrity risk** — probability medium, impact medium: manually entered or self-uploaded salary figures can be wrong or manipulated. Mitigate by cross-checking figures for the same employee across independently-entered cooperative records; a mismatch is itself a useful signal.

**Platform/second-order risk** — probability currently low but worth watching: if IPPIS/WACS becomes transparent and extends properly to cooperative loans (it already claims to consolidate third-party loans), a federal-level fix could eventually commoditize this. Right now that system is mistrusted and third-party-lender-focused, not cooperative-focused, so the window is open — but monitor it.

## Defensibility

Not the technology — spreadsheet import plus arithmetic against a legal cap is copyable by a competent developer in well under a year. If a moat forms, it's the trust relationship and adoption completeness within this specific institution (hard for a new entrant to replicate once every cooperative there already relies on you), and, over a longer horizon, an accumulating cross-cooperative repayment history per employee that a late entrant simply won't have. In 30 days a competitor could copy the interface. In 6 months they still can't copy the signed data-sharing relationships you'll have built. In 2 years, if this expands to other institutions, the accumulated dataset is the closest thing to a real advantage — contingent on actually reaching that scale.

## Validation Experiments

The most important one, ranked by impact and how cheap it is to run: **do the manual version first.** Before writing software, run this as a plain coordination exercise — a shared spreadsheet, or even you personally cross-checking two cooperatives' real (or de-identified test) rosters — to see whether the cooperatives will actually share the data and change a real approval decision because of it. This tests the hardest assumption (will cooperatives trust and use this at all) for close to zero cost, before any code is written. Second: confirm with the pilot cooperative(s), in writing, what "aggregate view" they're comfortable exposing — this resolves the governance risk before it becomes a product bug. Third, once the manual version works: test whether employees will reliably upload their own payslips, or whether cooperative-side bulk import has to remain the primary data path (my expectation, based on typical self-service adoption patterns, is that it will — treat this as a hypothesis to check, not an assumption to build around).

## Strategic Alternatives

**Option B (service-first) is genuinely worth doing before Option A (software-first).** Run the coordination function manually for the pilot institution — you, a spreadsheet, and direct conversations with each cooperative head — before investing build time in a PWA. It costs nothing, it directly tests the riskiest assumption (cooperative trust and behavior change), and if it fails, you've learned that cheaply instead of after building software nobody uses. Only once the manual version proves cooperatives will actually act on the eligibility answer does building the PWA become the right next move.

## What We Should NOT Build

In-app deposits/withdrawals or any money movement. A general ledger/accounting replacement for cooperatives that already have one. Loan-shark/informal-lender tracking, which has no reliable or legal data source available to you right now. Automated OCR before you've proven the manual workflow. Multi-company expansion before this one pilot has a real, provable result. A complex enterprise permissions system before the underlying governance question — who can see what, across cooperatives — has even been agreed with real cooperative leadership.

## 30-Day Action Plan

Return to the cooperative head who raised this and bring in as many of the other cooperative heads in the same institution as you can. Get a written (even informal) agreement on what each cooperative will share and exactly what the combined view will and won't show. Run the manual/spreadsheet version of the eligibility check with real or de-identified test data from at least two cooperatives, and see if it actually changes a decision. In parallel, sketch the PWA (spreadsheet import, employee dashboard, eligibility calculator) so it's ready to build once the manual version is validated. Get informal input from someone with NDPA familiarity on what consent and notice you'll need once real employee data is involved.

## 90-Day Strategy

If the manual pilot shows a real result — a conflict actually avoided, or a clear time/money saving the cooperative heads recognize — move the pricing conversation forward, replace the manual steps with the PWA, and bring the remaining cooperatives in that institution on board so the registry actually covers everyone. Only then start phasing in automated payslip extraction, and only funded by real revenue or a validated budget for it — not the ₦50,000 seed budget.

## Decision

**BUILD WITH MODIFICATIONS.**

The underlying opportunity is real and currently unaddressed by anything on the market — that part of your instinct is right. What needs to change before you commit real build time: narrow v1 to the registry-plus-eligibility-check-plus-employee-dashboard core (drop money movement, OCR, and loan-shark tracking from v1 entirely), resolve the cross-cooperative data-governance question in writing with real cooperative leadership before any aggregate data is shared, and validate the whole workflow manually with at least two cooperatives before investing further build time in the software. Do that, and this has a real shot; skip it, and you risk building a polished tool that repeats WACS's actual failure — a system nobody fully trusts because nobody agreed up front on what it's allowed to show.

---

## Addendum (post-engagement clarification)

Context that changed after the original analysis above: this is a **paid engagement**, not a speculative build. FMC Abeokuta cooperatives contacted the founder ~9 months ago, price for an MVP has already been agreed, most/all of FMC Abeokuta's cooperatives are committed, and the plan is MVP delivery → payment → a free "hook" month for cooperatives and employees → then a paid recurring plan (to be designed with real competitor/cost reasoning once usage data exists).

**Governance rule, now explicitly agreed by the cooperative heads (not by one designated person):** when Cooperative B evaluates a loan for a member who is also in Cooperative A, the system automatically computes and shows B only the minimum needed to decide — the member's current cross-cooperative loan obligations (amounts + repayment schedules), salary, remaining deduction headroom under the agreed cap, and an eligibility result for the new request. Cooperative A's savings balance and other member detail never cross over. This lookup is available **any time**, not gated to an active loan request — a cooperative can pull up its own member's full record, and the cross-cooperative eligibility slice, whenever needed.

**Role model — locked at four, no more:** Super Admin (Clarix platform owner), Cooperative Admin (head/owner of a cooperative), Cooperative Officer (day-to-day staff, permissions configurable by the Admin), User/Employee (belongs to one Clarix account, with memberships in one or more cooperatives). Explicitly no HR, payroll, organization-auditor, or organization-supervisor roles — Clarix has no relationship with FMC as an institution and no payroll access, by design, not by omission.

**Product reframing endorsed:** position this as a cross-cooperative deduction-coordination layer, not a cooperative-accounting replacement. Don't compete with existing single-cooperative software (Coopify, Coopco, ProbityCoop, Hyves, Coopra, SODLAPP — all verified real Nigerian products) on bookkeeping features; none of them, including SODLAPP (the most IPPIS-aware one, with staff-ID mapping but explicitly "company-scoped data isolation"), do cross-cooperative visibility. That remains the whitespace.

**Correction to the competitor list circulated alongside this analysis:** "Pamoja" is not a Nigerian product — it's a Kenyan SACCO loan-product name (Wakenya Pamoja Sacco, Ushuru Sacco); drop it from the list. "CoopManager" and its cited ₦200/member/month price could not be independently confirmed — treat as unverified, not a fact to quote to the client.

**Added to must-have scope (v1):** capacity reservation — when a cooperative submits a loan for approval, the system must reserve that amount against the member's available deduction headroom immediately, not just at final approval, so a second cooperative checking moments later sees the reduced, not stale, available capacity. Without this, two cooperatives can independently approve against the same headroom and recreate the exact conflict the product exists to prevent.

**Adopted, with a caveat:** a configurable deduction policy (salary basis, percentage cap, exclusions) instead of hard-coding one percentage/basis combination — get FMC's cooperatives' actual agreed rule in writing rather than assuming gross salary × 33.3%. Deduction reconciliation (expected vs. actual monthly deduction) is valuable but, absent payroll access, can only be fed by each cooperative manually reporting what they actually received — scope it as a manual-entry feature, not an automated integration.

**Rejected:** framing the organization/hospital as a future customer or platform sponsor. This directly contradicts the founder's explicit, repeated boundary — Clarix serves the cooperatives only, with no institutional relationship to FMC.

### Sources

- [Section 5 of the Nigerian Labour Act — jurist.ng](https://jurist.ng/labour_act/sec-5)
- [More Civil Servants Complain About WACS Deduction, But IPPIS Says Its Loan Management — fij.ng](https://fij.ng/article/more-civil-servants-complain-about-wacs-deduction-but-ippis-says-its-loan-management/)
- [IPPIS Lets Unknown Crevance Credit Deduct Non-Existent Loan From Civil Servant's Salary — fij.ng](https://fij.ng/article/ippis-lets-unknown-crevance-credit-deduct-non-existent-loan-from-civil-servants-salary/)
- [Coopify — Cooperative Management Software](https://coopify.africa/)
- [Coopco — Cooperative Management and Accounting Software](https://coopco.com.ng/)
- [ProbityCoop — Complete Cooperative Society Management System](https://probitysoftware.com/coop.html)
- [Payslip OCR API — Mindee](https://www.mindee.com/product/payslip-ocr-api)
- [AI Payslip Processing & Data Extraction Software — Affinda](https://www.affinda.com/documents/payslip/)
- [The Nigeria Data Protection Act, 2023 — KPMG](https://kpmg.com/ng/en/home/insights/2023/09/the-nigeria-data-protection-act--2023.html)
