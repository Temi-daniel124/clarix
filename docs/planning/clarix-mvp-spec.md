# Clarix MVP Spec, FMC Abeokuta Pilot

*Feature list, role permissions, data model, and the eligibility/reservation logic. Companion to `clarix-strategic-analysis.md`.*

---

## Problem Statement

Employees at FMC Abeokuta belong to multiple staff cooperatives, each of which manages its own savings and loans in isolation. No cooperative can see what a member already owes another cooperative in the same hospital. When combined obligations exceed the legally/organizationally agreed deduction limit, the conflict surfaces at payroll time, too late for anyone to act on it, and a cooperative loses money or an employee is over-committed. Clarix moves that check to the moment of loan approval.

## Goals

- A cooperative can submit a loan application and receive a correct eligible/not-eligible answer, computed against the member's *actual* cross-cooperative obligations, without seeing any other cooperative's private records.
- Two cooperatives cannot simultaneously approve loans against the same slice of an employee's deduction headroom: the reservation mechanism must hold under real concurrent use, not just in theory.
- An employee opens one dashboard and sees correct totals across every cooperative they belong to, replacing "ask each treasurer separately."
- A cooperative admin can import their existing member roster (spreadsheet) without manually re-typing records.
- All committed FMC Abeokuta cooperatives are onboarded with real member data inside the pilot window.

## Non-Goals (v1)

- **No money movement.** Clarix never holds, deposits, or transfers funds. Savings and repayments are records of what the cooperative already does via payroll deduction, not transactions Clarix executes.
- **No payroll/IPPIS integration.** Salary and deduction figures come from employee-uploaded payslips and cooperative-entered records, never from a live payroll feed. Clarix has no relationship with FMC as an institution.
- **No external lender/loan-shark tracking.** No reliable, legal data source exists for this yet; out of scope until (if ever) a licensed integration is validated.
- **No native mobile app.** A well-built PWA is the entire mobile strategy for v1.
- **No multi-organization support.** Single-organization (FMC Abeokuta) data model for now; the schema shouldn't *preclude* multi-org later, but nothing in v1 builds toward it.
- **No AI/ML in the eligibility decision.** That calculation is deterministic arithmetic against an agreed policy, auditable, not a model output. AI's only job in v1 is optional, human-reviewed payslip field extraction.
- **No organization-level roles.** No HR admin, payroll officer, or auditor role. Clarix has exactly four roles, defined below.

## Roles (locked at four)

| Role | Scope |
|---|---|
| **Super Admin** | Operates the Clarix platform itself. Not a member of any cooperative's financial data by default. |
| **Cooperative Admin** | Head/owner of one cooperative. Full control of that cooperative. |
| **Cooperative Officer** | Day-to-day staff of one cooperative. Permissions are a subset of Admin's, configured by the Admin. |
| **User/Employee** | One Clarix account, with zero or more cooperative memberships. |

---

## User Stories

**Employee**
- As an employee, I want to upload my payslip during signup and have the system read my salary details, so I don't have to type them in manually.
- As an employee, I want to review and correct the extracted salary figures before they're saved, so a misread doesn't silently corrupt my record.
- As an employee, I want one dashboard showing my total savings, active loans, monthly deductions, and available deduction capacity across every cooperative I belong to.
- As an employee, I want to switch between my cooperatives (dropdown) and see each one's savings/loan detail separately.
- As an employee, I want to browse cooperatives I haven't joined and see their packages/benefits before deciding to join.
- As an employee, I want to see, before I submit a loan request, whether it's likely to fit my available capacity, so I'm not surprised by a rejection.

**Cooperative Officer**
- As an officer, I want to search a member by name or IPPIS number quickly, since that's most of my daily work.
- As an officer, I want to record a savings contribution or repayment against a member's account.
- As an officer, I want to submit a loan application on a member's behalf and immediately see whether it fits their cross-cooperative capacity.
- As an officer, I want to be blocked from changing loan rules or cooperative settings, since that's the Admin's job.

**Cooperative Admin**
- As an admin, I want to import my cooperative's existing member roster from a spreadsheet during onboarding, so I don't re-enter hundreds of records by hand.
- As an admin, I want to approve or reject loan applications, seeing the eligibility result and the minimum necessary cross-cooperative context.
- As an admin, I want to configure my cooperative's own loan products (minimum savings ratio, interest, tenure limits) without needing Clarix support to change them.
- As an admin, I want to add and remove officers and control exactly what each officer can do.
- As an admin, I want a monthly view of expected vs. actually-received deductions, so a shortfall is visible instead of discovered by accident.
- As an admin, I want my cooperative's public profile (packages, benefits, requirements) visible to non-members, so employees can discover us before joining.

**Super Admin**
- As the Clarix operator, I want to create and activate/deactivate cooperative accounts on the platform.
- As the Clarix operator, I want to view platform-level health and activity without being able to casually browse any member's financial detail, administrative power and financial-data visibility are deliberately separated.
- As the Clarix operator, I want to set the organization-wide deduction policy default (basis and percentage) that cooperatives inherit, once FMC's cooperatives confirm what they've agreed to.

---

## Requirements

### Must-Have (P0)

1. **Auth & account**: single account per employee; email/phone + password; role assignment (Admin/Officer set by Super Admin or an existing Admin at onboarding).
2. **Cooperative onboarding via spreadsheet import**: upload CSV/XLSX; the system attempts automatic column matching against a synonym dictionary (e.g. "IPPIS"/"Staff No"/"Employee ID" all resolve to `employee_id`; "Savings"/"Contribution Balance" resolve to `savings_balance`), then presents a mapping screen where the admin confirms or manually remaps any column it couldn't resolve confidently. Flags duplicate rows (same `employee_id` twice) and duplicate columns (two columns mapped to the same field) before allowing commit. A downloadable blank template (CSV/XLSX with the canonical columns) is offered for cooperatives whose existing sheet is too irregular to map. Preview shows ready / needs review / invalid counts, and the admin can edit inline before anything is committed. Nothing is auto-implemented without an explicit confirm step.
3. **Employee onboarding**: signup, employee ID entry (validated against organization ID format), payslip upload (image/PDF), extracted-field review-and-confirm screen, join/apply to cooperative(s).
4. **Per-cooperative data isolation**: a cooperative's officers/admins see only their own members' full detail. Enforced server-side (see Data Model → RLS), not just hidden in the UI.
5. **Deduction policy engine**: configurable basis (gross/net) and percentage cap, set at organization level by Super Admin from FMC's actual agreed rule; cooperatives inherit it, not hard-coded.
6. **Cross-cooperative eligibility check**, given an employee, compute: salary basis, cap, existing active+reserved obligations across all cooperatives, available capacity, and eligible/not-eligible for a requested new loan amount + tenure. Available any time an officer/admin looks up their own member, not gated to a submission event.
7. **Capacity reservation**: submitting a loan application atomically reserves the requested monthly amount against the employee's available capacity, so a concurrent check by another cooperative sees the reduced number, not a stale one. See algorithm below.
8. **Loan lifecycle**: draft → submitted (reserved) → approved (active obligation) or rejected (reservation released) → completed. Reservation auto-expires (default 7 days, configurable) if never actioned, releasing the hold.
9. **Employee dashboard**: aggregate KPI cards (total savings, active loans, monthly deductions, available capacity) computed across the employee's own memberships only.
10. **Cooperative switcher**: dropdown/list on the employee side to view per-cooperative savings/loan detail.
11. **Cooperative discovery**: public profile (name, description, requirements, packages/benefits) visible to any employee, full member data visible only after joining.
12. **Officer permission toggles**: Admin can allow/restrict specific actions per officer (e.g., can-approve-loans vs. can-only-submit).
13. **Audit log**: every view/edit of financial data records who, what, when, and old→new value for edits.
14. **Payslip upload, salary basis only, not a deduction ledger.** Clarix reads the payslip to establish the employee's `salary_gross` (and `salary_net` for display), full stop. It does **not** attempt to parse or classify the itemized deduction lines on the payslip (see "Payslip Parsing Pipeline" below for why), every cooperative obligation Clarix uses in the eligibility formula comes from Clarix's own ledger (loans imported at onboarding or created on-platform going forward), never from reverse-engineering the payslip.

### Nice-to-Have (P1, fast follow after MVP proves out)

- Automated payslip field extraction via a vision-capable LLM API call (Claude/OpenAI), replacing pure manual entry, with the same confirm-before-save step retained.
- Notifications (email via Resend) to employee and cooperative admin when a request would breach capacity, or when a reservation is about to expire.
- Monthly reconciliation entry screen (expected vs. actually-received deduction, manually entered by cooperative admin).
- Richer reporting/export for cooperative admins.

### Future Considerations (P2, explicitly deferred, don't architect against)

- Multi-organization support.
- Licensed credit-bureau integration for external lender visibility.
- Native mobile app.
- Anomaly detection on deduction shortfalls once enough historical data exists.

---

## Payslip Parsing Pipeline (based on a real FMC Abeokuta payslip)

A real FMC Abeokuta IPPIS payslip was reviewed to ground this instead of guessing. Findings that change the build:

- **It's a system-generated PDF with real text, not a scanned image**, IPPIS payslips come out of Oracle E-Business Suite as text-based PDFs. That means direct PDF text extraction (a library, not a vision model) can pull exact figures for free when the employee uploads the original digital file. The pipeline should try this first: extract text → look for `Total Gross Earnings`, `Total Net Earnings`, `IPPIS Number`, `Employee Name` by label → if found with confidence, done, at zero API cost. Only fall back to a vision-capable LLM call (Claude/OpenAI, structured JSON output) when text extraction fails or returns nothing usable, i.e. the employee photographed a printed copy instead of uploading the digital PDF. Either path ends at the same human confirm-before-save screen from the original spec.
- **IPPIS number is confirmed 6 digits** on the real payslip (e.g. `509331`), matching what you said, validation pattern is a simple 6-digit numeric check, configurable at Super Admin level per organization for when Clarix ever serves an organization that doesn't use IPPIS.
- **The payslip already lists real cooperative deductions by name**. This specific payslip shows three separate line items ("CTSS FMCA MUSLIM COMM", "CTSS FMCA UNITED STAFF", "FMCA AL_AMANA MCS") alongside statutory ones (tax, pension, NHF, union dues). This confirms IPPIS already deducts for named FMC Abeokuta cooperative societies today, and that a single employee can carry several simultaneously: the exact scenario Clarix exists to coordinate.
- **This is why Clarix should not try to classify or parse those deduction lines at all.** Mixed in with statutory deductions (tax/pension/NHF, which are not subject to the 1/3 cap and must never be counted against it) are the cooperative-specific ones (which are). Teaching the system to reliably tell them apart from a payslip's free-text labels is a real classification problem with no clean payoff, because Clarix already has a better source of truth for "what does this employee currently owe cooperatives": its own loan ledger, populated by each cooperative's spreadsheet import at onboarding and by every loan created on-platform afterward. The payslip's only job is to supply the salary figure; the obligations side of the eligibility formula never touches it.
- **Evidence on gross vs. net basis:** on the reviewed payslip, the three cooperative deduction lines sum to ₦80,500 against a Gross Earnings figure of ₦265,690.75: 30.3%, comfortably under 33.3%. Against Net Earnings (₦138,450.67) the same ₦80,500 is 58.2%: a figure that couldn't be real if the 1/3 rule were being enforced against net pay, since IPPIS is actively running all three deductions. That's one data point, not a policy document, but it points toward **gross salary as the practical basis** and toward the cap applying only to the discretionary/cooperative portion of deductions, not statutory ones. Confirm this explicitly with the cooperative heads before setting `organizations.deduction_basis`, but default the build to `gross` on this evidence rather than guessing net.

---

## Screen-by-Screen Permission Matrix

| Screen / Action | Super Admin | Cooperative Admin | Cooperative Officer | Employee |
|---|---|---|---|---|
| Create/activate cooperative account | ✅ | ❌ | ❌ | ❌ |
| Set org-wide deduction policy default | ✅ | ❌ (view only) | ❌ | ❌ |
| View own cooperative's member list | ❌* | ✅ | ✅ | ❌ |
| Add/import members | ❌ | ✅ | Configurable | ❌ |
| View a member's full record (own coop) | ❌* | ✅ | ✅ | own record only |
| Run cross-cooperative eligibility check | ❌* | ✅ | ✅ | preview on own new loan only |
| Submit loan application (creates reservation) | ❌ | ✅ | Configurable | ❌ (employee requests; officer/admin submits) |
| Approve/reject loan | ❌ | ✅ | Configurable | ❌ |
| Configure cooperative's own loan products/savings ratio | ❌ | ✅ | ❌ | ❌ |
| Add/remove officers, set officer permissions | ❌ | ✅ | ❌ | ❌ |
| Edit cooperative public profile (discovery) | ❌ | ✅ | ❌ | ❌ |
| View employee dashboard (own data, all own cooperatives) | ❌ | ❌ | ❌ | ✅ |
| Browse cooperative discovery (public info only) | ✅ | ✅ | ✅ | ✅ |
| View audit log | platform-level events only | own cooperative's log | ❌ | ❌ |

*Super Admin does not have standing access to member financial detail; a support case requiring it should go through an explicit, logged access-grant step, not default visibility.

### Screens by role

**Employee:** Sign up → Verify contact → Employee ID → Payslip upload → Review extracted fields → Join cooperative(s) → Dashboard (home) → My Cooperatives (switcher) → Cooperative detail (savings, loan, repayment schedule) → Loan detail → Apply for loan (with live eligibility preview) → Discovery (browse unjoined cooperatives) → Notifications → Profile/settings.

**Cooperative Officer:** Home (search member + pending tasks) → Member search/list → Member profile → Record savings/repayment → Loan applications queue → Submit/process loan application → Eligibility check result.

**Cooperative Admin:** Everything Officer has, plus: Cooperative dashboard (KPIs + attention-required) → Import/migration → Loan product & policy settings → Officer management → Reconciliation entry → Cooperative public profile editor → Reports.

**Super Admin:** Platform dashboard (cooperative list, activation status) → Create/deactivate cooperative → Org-wide deduction policy setting → Platform audit log (platform events only) → Support/escalation view.

---

## Onboarding Flows (why they're not one screen)

Employees, Admins, and Officers reach Clarix through genuinely different doors, because they're different trust levels:

- **Employee, open self-service signup.** Anyone can create an account: email/phone → verify contact → enter employee ID → upload payslip → review extracted salary → browse/apply to cooperatives. No invitation needed, because joining a cooperative as a beneficiary is the low-risk, high-volume path this product depends on being frictionless.
- **Cooperative Admin, invited, never self-registered.** A cooperative's head doesn't sign up on their own initiative; the Super Admin creates the `cooperatives` row during that cooperative's onboarding (part of the paid engagement) and sends an email invite (via Resend) with a one-time link. Following it lets them set a password and drops them straight into an Admin-specific setup flow, cooperative profile, loan products, spreadsheet import, skipping the employee-style payslip/join flow entirely, since being an Admin doesn't by itself make them a beneficiary member anywhere.
- **Cooperative Officer, invited by their own Admin, not by Super Admin.** Same invite-link mechanic, triggered from inside the Cooperative Admin's own "manage officers" screen, landing the officer in a much shorter setup (accept invite, set password) since there's no cooperative-level configuration for them to do.
- **The important wrinkle:** if the person accepting an Admin or Officer invite already has a Clarix account (say, as an employee-member somewhere else, or an officer at a different cooperative), the invite links to their *existing* account rather than forcing a new signup. One email always resolves to one account. See below.

## Multi-Role Accounts (answering the "same person, multiple cooperatives" question directly)

One account per email, always: the system should never require or suggest a different email for a different cooperative. What varies is which relationships that one account holds, and they're independent per cooperative:

- A `cooperative_memberships` row (savings/loan-holding beneficiary) is separate from a `cooperative_staff_roles` row (admin or officer). A person can have either, both, or neither, at any given cooperative.
- The same user can hold `cooperative_staff_roles` rows at *multiple* cooperatives simultaneously, officer at Cooperative A and officer at Cooperative B is not a special case, it's just two rows in that table. Being an officer at B carries no permission at A; every check is scoped by `cooperative_id`.
- A person can be Admin of their own cooperative (their `cooperative_staff_roles.role = 'admin'` at C) while also being an Officer somewhere else (role='officer' at A) and an ordinary contributing member at a third (a `cooperative_memberships` row at D). All three coexist under one login.
- What the Admin at a cooperative controls is scoped to their own cooperative only: they can set an officer's display `title` (e.g. rename "Cooperative Officer" to "Treasurer" for that person, at that cooperative) and toggle that officer's permission flags, but only for staff roles granted at *their* cooperative. They have no visibility into or control over that same person's roles elsewhere.

## Scaling

**Technical (checked against current published limits, not assumed):** Supabase's free tier gives 500 MB database size, 1 GB file storage, 5 GB egress/month, and 50,000 monthly active users, with free projects paused after a week of inactivity ([supabase.com/pricing](https://supabase.com/pricing)). For one hospital's worth of cooperatives and employees, the database size is what to watch, text and numeric records stay small, but uploaded payslip images/PDFs count against the 1 GB storage cap first, likely within the pilot's first few hundred employees. Vercel's Hobby tier includes 4 CPU-hours of active compute per month and a 10-second default function timeout ([vercel.com/docs/limits](https://vercel.com/docs/limits)), fine for a PWA serving a few hundred concurrent users, tight if payslip extraction calls start running synchronously in a request (queue them as a background job instead, so a slow API call doesn't consume the request's timeout budget). None of this needs solving now. It needs *watching*: check Supabase/Vercel usage dashboards monthly, and treat "approaching a free-tier ceiling" as the trigger to move to Supabase Pro (~$25/month) or Vercel Pro, funded by the recurring plan once cooperatives start paying, not before.

**Product (why the schema doesn't need a rewrite to grow):** every table that matters is already scoped by `organization_id` or `cooperative_id`: a second organization (a different hospital, later) is one new row in `organizations` plus its own cooperatives, not a redesign. Row-level security policies are written against those same scope columns, so a second organization's data is automatically isolated from FMC Abeokuta's without new policy logic. This is deliberately future-ready plumbing, not a feature being built now. Nothing in the P0/P1 scope depends on a second organization existing, and none of it should be built until FMC Abeokuta's pilot proves out.

---

## Data Model

Written for Postgres/Supabase, since that's the chosen stack. Types are illustrative, not exhaustive DDL. **See `docs/DATA-MODEL.md` for the canonical, current version of this schema**. This copy is preserved here as the original planning artifact.

## Eligibility & Reservation, how it actually runs

**See `docs/DATA-MODEL.md` for the canonical, current version of this algorithm**. This copy is preserved here as the original planning artifact.

---

## Success Metrics

**Leading (check at end of week 1–2 of pilot):**
- % of committed cooperatives that complete spreadsheet import without unresolved row errors.
- Number of employees completing payslip upload + confirmation during onboarding.
- Number of eligibility checks run by officers/admins.

**Lagging (check at end of month 1, this is the number that sells the paid plan):**
- Count of loan requests flagged not-eligible that a cooperative, by their own account, would otherwise have approved without the check. This is the direct evidence of value prevented, and the number to bring back to the cooperative heads when activating payment.
- Cooperative heads' own willingness-to-pay response when the paid plan conversation opens.

## Open Questions

**Resolved this round:**
- Deduction cap confirmed at 33% (FMC operates under the standard government cap). Basis defaulted to `gross`, based on the real payslip evidence above, still worth a one-line written confirmation from the cooperative heads, but no longer blocking the build.
- IPPIS number confirmed 6 digits, validation pattern configurable at Super Admin level per organization.
- Spreadsheet import now specced with fuzzy column matching, manual remap, duplicate-row/column detection, and a downloadable template, handles varying cooperative formats without needing each cooperative's actual file in advance (though real sample files are still worth collecting to sanity-check the synonym dictionary before go-live).
- Reservation expiry: 7-day org-wide default, configurable at Super Admin level, with each cooperative able to set a shorter (never longer) override.
- Officer permissions: configurable per-officer by the cooperative's own Admin, default-deny (a permission not explicitly granted is not usable), with a cosmetic `title` field so cooperatives can call officers "Treasurer," "Secretary," etc. without creating new permission tiers.

**Still open:**
- **(Non-blocking, collect during cooperative onboarding)** Real sample spreadsheet from each committed cooperative, to validate the column-matching dictionary against actual formats rather than assumed ones.
- **(Non-blocking, confirm with cooperative heads before go-live)** Written sign-off that `deduction_basis = 'gross'` matches what they actually intend, since the payslip evidence is one data point, not a policy document.

## Timeline Considerations

No hard external deadline has been set. Suggested phasing: P0 list above is the MVP that gets delivered for the agreed payment; P1 (notifications, reconciliation entry, automated payslip extraction) is the "just wait, more is coming" fast-follow that keeps cooperatives and employees hooked through month one, ahead of the paid-plan conversation.
