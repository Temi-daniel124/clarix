# Clarix, Trial, Subscription and Billing: Screen-by-Screen Blueprint (R2)

Built in BUILD-PLAN Phase 9 (and the price function before the pricing page in 5.3). Decisions: D041,
D042, D049. Schema: `docs/DATA-MODEL.md` → Billing. Cases: E18, E30 to E32. Pricing reasoning and
competitors: `docs/PRODUCT.md` → Competitors and position, Business model.

**The rule that shapes every screen:** billing must never make the cross-cooperative check less true
and never delete or hide a cooperative's records. Members never see billing at all, except one line if
their cooperative is read-only.

---

## 1. The numbers (one source)

`price_for(cooperative, period)` returns `{ activeMembers, unitPrice, subtotal, minimumApplied, total,
yearly }` and is the only place prices are computed: pricing page, billing screen, invoices.

- ₦150 × active members per month; total never below ₦5,000.
- Yearly = 10 × the monthly total at the time of purchase, for 12 months.
- Founding price lock: cooperatives activated within 12 months of R2 launch keep ₦150 for their first
  12 paid months (`subscriptions.founding_price_lock`).
- Institution bundle (Provisional): 10% off each cooperative when 3+ in one institution are paying.
- Active member (D041.1): at least one saving, repayment, loan or eligibility check recorded in the
  calendar month. Invoice on the 1st for the previous month (E32).
- Unit tests: 0 members → ₦5,000; 33 → ₦5,000 (minimum, ₦4,950 rounded up to minimum); 34 → ₦5,100;
  120 → ₦18,000; yearly 120 → ₦180,000.

## 2. The states (computed when read, `cooperative_access_state`)

| State | When | What changes |
|---|---|---|
| `trial` | Day 1 to 60 from activation | Nothing. Day 46 and 57: Needs-you item and banner for admins |
| `active` | Paid through the current period | Nothing |
| `grace` | Day 61 to 74, or 14 days after an unpaid invoice's due date | Admin banner (amber) on every staff screen: "Your trial has ended. Pay by 4 Feb to keep recording." with "Pay now" |
| `read_only` | After grace, unpaid | Every write RPC refuses with `COOPERATIVE_READ_ONLY`; staff screens show a red banner and hide write actions (not disabled, hidden); viewing and exporting still work; members can view and download their statements and see one line "New applications at this cooperative are paused"; **its active loans still count everywhere else** (D042, E18) |

Paying moves the cooperative to `active` instantly; nothing is lost.

## 3. Admin: Billing (Manage → Billing; phone More → Billing)

- **Hero card:** state chip (Trial · day 23 of 60 / Active / Grace / Read-only) and the next amount as a
  rolling figure: "₦18,000 due 1 Dec" with the breakdown row "120 active members × ₦150".
- **Plan:** Monthly or Yearly (Continuous Tabs) with the yearly saving shown; "Switch to yearly" is the
  primary action only when it saves money.
- **Invoices:** list rows (period, amount, status chip Paid / Open / Overdue), each opening a sheet with
  the invoice PDF (statement template, watermark, verification code) and how to pay: the bank account
  details for transfer and the reference to use (the invoice number). Paystack "Pay now" appears only
  after D042's provider is confirmed.
- **Active members this month:** a link opening a sheet that lists who counts and why (last activity),
  so the admin can check the bill.

## 4. Super Admin: billing tools (Cooperative detail → Billing tab)

- State, trial dates, plan, founding lock, invoice list.
- **Record a payment** (sheet): invoice, amount, method (Transfer / Paystack later), reference, paid at.
  Timed Undo after saving. Audit-logged at platform level (E31).
- **Extend trial** (sheet): days (Stepper, max 30) and a required reason. Audit-logged.
- **Void an invoice** with a reason.
- Platform home Needs-you: trials ending within 14 days, overdue invoices (BUILD-PLAN 4.4).

## 5. Notifications

In-app now; email once a domain is verified (D049): trial day 46 and 57, invoice issued, payment
recorded, entering grace, entering read-only, restored. To admins of that cooperative only.

## 6. FMC Abeokuta

Its five cooperatives keep the terms agreed for the MVP (D041.7). On launch of billing they are created
as `active` with a note, not put on a trial clock, until the owner sets their terms on the billing tab.
