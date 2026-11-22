# Clarix, Documents and Records: Import, Existing Loans, Statements, Exports, Income Evidence (R2)

Built in BUILD-PLAN 0.3, Phase 7 and Phase 8. Decisions: D035, D036, D044. Schema: `docs/DATA-MODEL.md`
→ R2 planned schema. Cases: `docs/EDGE-CASES.md`. Every screen follows `DESIGN_SYSTEM.md`.

The principle: a cooperative must be able to bring its whole book in on day one and take it out any
day, and every document Clarix produces must be recognisably genuine.

---

## 1. Where these live

| Role | Entry point |
|---|---|
| Admin, officer (with permission) | Desktop sidebar → **Records** group: Import, Statements, Exports. Phone: More → Records. "+" sheet: Import, Add an existing loan |
| Member | Cooperatives → a cooperative → Statement; Profile → Proof of income; Profile → Statements |
| Super Admin | Platform → Verify a document |

## 2. Import v2 (BUILD-PLAN 8.2)

A four-step full-screen flow with a labelled stepper on desktop and the thin progress line on phones.
The file is still read **in the browser** and never uploaded (`SECURITY.md`); only confirmed rows are
sent, in chunks of 500, and the server re-validates every row with the same zod schema (E24).

1. **Choose file.** Drop zone (`radius-lg`, dashed `hairline-strong`, 160px tall), "CSV or Excel (.xlsx).
   Nothing is uploaded; Clarix reads it here." Two templates to download: "Members" and "Members with
   loans". Sheet picker when the workbook has several sheets (E22). Header row picker when row 1 is not
   the header.
2. **Match columns.** Each detected column on the left, the Clarix field on the right as a select,
   auto-matched from the synonym list (keep R1's list and its refusals, e.g. "Loan Balance" is never
   savings). Fields:
   - Member: name (required), member number, phone, email, joined date, savings balance.
   - Loan (optional, one per row or a second sheet): outstanding balance, monthly repayment, start
     month, expected end month, product name, original amount.
   Totals rows detected and excluded (E22). IDs read as text where mapped to member number (E21).
3. **Review.** Segments Ready / Needs review / Invalid with counts. Rows are editable inline. Warnings
   in one line each: "4 member numbers look shortened by Excel" (E21), "2 rows repeat the same member"
   (E25), "Monthly repayment is more than the outstanding balance" (row-level). A summary card that ends
   in a bold total: "212 members · ₦18,420,000 savings · 37 existing loans · ₦1,284,000 monthly
   repayments".
4. **Confirm.** `run-action-button` "Import 212 members and 37 loans". Progress by chunk; on finish a
   result sheet: imported, updated (member number already on the roster), skipped with a downloadable
   CSV of skipped rows and reasons. Audit-logged as one import event.

Limits: 5,000 rows (E23). Re-importing a corrected sheet updates by member number and never duplicates.
Imported loans are `origin = pre_existing` and count in committed at once (D036).

## 3. Add an existing loan, one at a time (BUILD-PLAN 0.3)

From the member sheet → Loans → "Add existing loan", or the "+" sheet. A sheet with: loan product
(optional select), outstanding balance (₦), monthly repayment (₦), start month, expected end month
(defaults to start + balance ÷ monthly, editable), original amount (optional), note. The meter at the
top of the sheet shows the member's available figure **before and after** ("₦100,863 → ₦72,363"). Primary
"Add loan". After saving, a Timed Undo toast for 10s. Until a cooperative has entered any existing
loans, the review screen for its applications shows a one-line amber note "Existing loans not entered
yet for this cooperative" (E08).

## 4. Statements (BUILD-PLAN 8.1, 8.3)

### 4.1 Member statement (per cooperative)

PDF, A4, Figtree. Header: Clarix primary logo left, the cooperative's logo and name right, a 4px
`navy-900` rule. Title "Member statement", member name, member number, period ("1 Jan 2026 to 31 Mar
2026"), "Generated 22 Nov 2026, 2:30 pm (Lagos)". Sections: Savings (opening balance, each entry with
date, description, amount, running balance, closing balance in bold); Loans (each loan: original
amount, repaid in period, outstanding, monthly repayment, status); a summary box ending in a bold total
row. Footer: "Page 1 of 3", the verification code ("Verify at clarix…/verify · 7K2M-9QXD-4T"), and
"Clarix records what your cooperative entered. It never holds or moves money." Watermark per D044 and
`docs/BRAND.md`. Kobo shown (two decimals) in PDFs.

### 4.2 Combined statement (member only)

The same template with one section per cooperative and a cover summary across all of them. Only the
member can generate it (it spans cooperatives); no staff role can (D003).

### 4.3 Loan statement

One loan: schedule (expected) vs recorded repayments, arrears if any, outstanding balance.

### 4.4 Generating and verifying

- Member: Cooperatives → cooperative → Statement → "Download PDF" opens a period sheet (This month,
  Last 3 months, This year, Custom range) → primary "Download". A preview sheet on phones with Download
  and Share (Web Share API with the file where supported).
- Staff (export permission): Records → Statements → choose month → "Generate for 212 members"
  (`run-action-button`); the browser requests them one by one (Hobby 10s limit) and zips them; progress
  "48 of 212". Each statement is also available from the member sheet.
- `/verify/[code]`: public page showing "Genuine Clarix document: Member statement, [Cooperative], 1 Jan
  to 31 Mar 2026, generated 22 Nov 2026" or "We can't find this code". No names, no figures.

## 5. Proof of income (BUILD-PLAN Phase 7, D035)

Member: Profile → Proof of income (also onboarding step 5 and the home "Add proof of income" action).

- **List** of evidence with source chip (Payslip / Bank statement / Declared), period, monthly figure,
  status (Verified, Not verified, Older than 12 months), and "Add new".
- **Payslip:** upload PDF or photo (10MB). For a PDF with a text layer, Clarix proposes gross and net
  from the labels ("Total Gross Earnings", "Total Net Earnings" and similar), ignoring watermark text
  interleaved in the layer, and asks which person when one file holds several payslips; the member
  confirms or edits each figure. A photo or scanned PDF goes straight to typing the figures. "Pay
  period" month picker.
- **Bank statements:** upload 3 to 6 consecutive months (PDF or CSV export from the bank). Clarix shows
  the monthly inflows it found per month; the member can mark lumps as one-off ("Loan from family",
  "Sold a car") and transfers between their own accounts; the average appears with the meter preview.
  Status is "Not verified" until staff confirm.
- **Declared:** one money input "Your usual monthly income", a one-line warning "Your cooperative may
  ask for proof before deciding a loan.", status "Declared, not verified". Only offered when at least
  one of the member's cooperatives allows declared income.
- **Staff verification** (approve or `verify_income` permission): in the application review panel and
  the member sheet, a "Verify income" action showing source, period and figure first, "View document"
  second (audit-logged, 60-second signed URL), then "Mark as verified" or "Ask for different proof"
  with a reason the member sees.
- **Ageing and sanity:** older than the cooperative's window shows "13 months old" in amber on review and
  asks the member to refresh (still counts, D035.7). A figure more than 3× the previous one asks the
  member to confirm and shows "Large change" to the reviewer (E10).

## 6. Exports (BUILD-PLAN 8.4)

Records → Exports, also the "Export" action on Members, Loans and each report.

| Export | Formats | Contents |
|---|---|---|
| Members and balances | CSV, XLSX, PDF | Name, member number, phone, joined, savings, loans outstanding, on Clarix yes/no |
| Loans book | CSV, XLSX, PDF | Every loan with origin, status, amounts, monthly repayment, dates |
| Savings ledger | CSV, XLSX | Every entry in the range |
| Member growth, Savings held, Deduction shortfall (R1 reports) | CSV, XLSX, PDF | As on screen, with the date range |
| Audit log | CSV | Admin only |

An export sheet: date range (Range Slider or month pickers), format (Continuous Tabs), primary
"Download". CSV/XLSX begin with three rows: cooperative name, period, generated at (D044). PDFs use the
statement template with the watermark. Every export is audit-logged (who, what, range, when).
