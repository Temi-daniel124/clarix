# PRODUCT.md, Clarix

**Authority level: 2.** Defers to `DECISIONS.md` on anything that conflicts. This is the "why" and
"for whom", for the "what to build," see `MVP-SCOPE.md`; for "who can do what," see
`ROLES-AND-PERMISSIONS.md`.

## The problem

Federal Medical Centre, Abeokuta (FMC Abeokuta) hosts multiple independent staff cooperatives.
Employees may join more than one. Each cooperative manages its own savings and loan approvals in
isolation, with no visibility into what a member already owes at another cooperative in the same
hospital. Nigerian law (Labour Act §5) caps total salary deductions at one-third of wages. Because
no cooperative can see the others' obligations, combined deductions can silently breach that cap
or exceed net pay outright. The conflict surfaces at payroll time, too late for anyone to act,
and either the cooperative loses money and time chasing it, or the employee ends up
over-committed. A real reviewed FMC Abeokuta IPPIS payslip confirms this is already happening: it
shows three separate named cooperative deductions running simultaneously against one employee.

Federal-level systems (IPPIS TPSMS/WACS) exist to consolidate third-party payroll deductions but
are currently criticized for opacity, validating that the underlying problem is real, while also
being a design lesson Clarix should not repeat.

## The product, in one sentence

Clarix is a cross-cooperative deduction coordination layer: given a member and a proposed loan, it
tells the cooperative, in real time, whether the member's *combined* obligations across every
cooperative they belong to still fit within the legally agreed deduction cap, before the
cooperative commits to a decision it can't safely undo at payroll time.

## Who it's for

The customer is the cooperative, not the hospital. FMC Abeokuta is the pilot host, engaged and
already agreed to a delivery price for the MVP. Clarix is not being built for, sold to, or
governed by FMC as an institution. See `DECISIONS.md` D002 and D005.

## Why now / why this works

- Validated against six real competing Nigerian cooperative-software products (Coopify, Coopco,
  ProbityCoop, Hyves, Coopra, SODLAPP), none offer cross-cooperative visibility, including the
  most IPPIS-aware of them (SODLAPP explicitly isolates data company-scoped).
- The governance rule that makes this legally and socially workable, automatic, minimum-
  disclosure, no single human gatekeeper, was directly negotiated and agreed by the FMC Abeokuta
  cooperative heads themselves (`DECISIONS.md` D003), not assumed by the product team.
- The engagement is already paid for the MVP; the go-to-market motion after delivery is a free
  "hook" month for all cooperatives/employees, followed by a paid recurring plan whose pricing is
  designed later, after real usage evidence exists (see `MVP-SCOPE.md` → Success Metrics).

## Product principles

1. **Coordinate, don't replace.** Clarix sits alongside each cooperative's own bookkeeping; it
   never becomes their accounting system and never touches money directly (`DECISIONS.md` D004).
2. **Minimum necessary disclosure, always.** No screen or API ever exposes more cross-cooperative
   detail than the eligibility formula needs (`DECISIONS.md` D003).
3. **Informs, never gatekeeps.** Clarix always allows a cooperative to submit or approve a request
   that exceeds computed capacity. It just makes that choice visible and requires the person
   making it to say why (see the "Submit/Approve anyway" pattern throughout the role blueprints).
4. **The math is boring on purpose.** Eligibility is deterministic arithmetic, not a model
   (`DECISIONS.md` D018), auditable is more valuable here than clever.
5. **Design must earn trust visually, not just functionally.** A financial-coordination product
   that looks like a generic AI-built dashboard undermines its own credibility. See
   `DESIGN_SYSTEM.md`.

## Non-goals (product-level; see `MVP-SCOPE.md` for the full P0/P1/P2 breakdown)

No money movement. No payroll/IPPIS integration. No external lender/loan-shark tracking (no
reliable, legal data source exists). No native mobile app. No multi-organization support in v1.
No AI/ML in the eligibility decision itself. No organization-level roles (HR, payroll, auditor).

## The limit of what Clarix can see

Clarix coordinates across the cooperatives that are on Clarix. It has no way of knowing about a
loan taken anywhere else.

If Cooperative A and Cooperative B are both on the platform and Cooperative C is not, a member who
borrows from C and then applies at B will be assessed by B against a picture that does not include
the loan from C. B will see the member's obligations at A and at B, add them correctly, and give an
honest answer to the wrong question. Nothing in the design hides this and nothing can fix it from
inside the product: there is no legal, reliable source for another cooperative's private loan book,
which is the same reason external lender tracking is a non-goal above.

Two things follow, and both should be said plainly to any cooperative considering joining:

- **The protection is real but partial, and it scales with adoption.** Every cooperative that joins
  makes the figure more complete for every other cooperative already on it. With one cooperative
  the deduction cap is only a solo check; the cross-cooperative answer that makes this product worth
  having only exists once several are in.
- **It is incomplete until they are all in.** An organization where most cooperatives have joined
  gets most of the benefit, not all of it, and the gap is exactly the cooperatives still outside.

This is written here rather than only in a pitch because it is a standing fact about how the system
works, not a talking point. Any claim that Clarix prevents over-borrowing, made without this
qualification, is a claim the product cannot support.

## Business model (context, not a spec to build against)

Paid MVP delivery (price already agreed with FMC Abeokuta cooperative heads) → free hook month
for all committed cooperatives and their employees → a paid recurring plan, designed and priced
after the hook month using real usage evidence, not before. Do not build pricing UI, plan tiers,
or billing logic against assumed numbers. That work is explicitly deferred (`DECISIONS.md` →
Open, not yet decided).

## Success signals (see `MVP-SCOPE.md` for the full metrics list)

The number that matters most: how many loan requests the eligibility check flagged as
not-eligible that a cooperative, left to its own visibility, would otherwise have approved. That
number is the evidence base for the paid-plan conversation, it's a product metric, not a vanity
one.
