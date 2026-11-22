# Clarix, Cooperative Admin Role: Screen-by-Screen Wireframe & User Flow

> ## R2 header (22 November 2026): read this before any section below
>
> The R1 text below stays as the record of what was built; where this header and the body disagree,
> **this header wins** (then `DESIGN_SYSTEM.md`, then `docs/DECISIONS.md` over both).
>
> **Global changes:** "employee" reads "member"; "staff ID / IPPIS" reads the cooperative's Member ID
> label; no FMC wording (D034). Light theme only, Figtree, pill buttons. No uppercase eyebrows. The
> page title never contains the full cooperative name in a sentence; the name lives in the switcher
> chip (phone) or sidebar (desktop).
>
> | Section | Status in R2 | Replacement |
> |---|---|---|
> | 1.1, 1.2 | Restyled to the public-site auth layout | `clarix-public-site-blueprint.md` §4 |
> | 2.3 Loan Product & Policy | **Adds** the cooperative's repayment policy (basis, percentage, allow declared income, evidence age), capped by any institution policy (D035) | BUILD-PLAN 3.1 |
> | 2.4 Roster Import | **Changed:** import v2 with existing loans and more columns | `clarix-documents-blueprint.md` §2–3 |
> | 3 Navigation | **Changed:** phone tab bar Home, Members, Loans, More + centre "+"; desktop light sidebar with switcher and `Ctrl/⌘ K` | `DESIGN_SYSTEM.md` §5.5 |
> | 4.1 Dashboard | **Superseded** | "Admin home (R2)" below |
> | 5.1 Member list | **Changed:** search pinned; filters (On Clarix, Not yet joined, Has loans, Evidence missing); desktop table; row opens member panel | BUILD-PLAN 6.4 |
> | 5.2 Member profile | Becomes the member sheet/panel with tabs Overview, Savings, Loans, Activity; adds "Add existing loan" and "Verify income" | BUILD-PLAN 0.3, 6.4, 7.x |
> | 5.4 Record contribution | Adds **bulk monthly entry** (paste or upload the month's deductions list, review, confirm) and duplicate warning (E26) | BUILD-PLAN 6.7 |
> | 6.1 Queue | Segments Waiting / Above limit / Active / Closed / Lapsed; over-limit applications show "Above limit by ₦X" (D040) | BUILD-PLAN 6.5 |
> | 6.2 Review | Same meter the member sees; fixed bottom bar Approve / Decline; approve on an over-limit item asks for the reason in a sheet | BUILD-PLAN 6.5 |
> | New: apply on a member's behalf | Officer blueprint 6.2 applies to admins too | BUILD-PLAN 6.6 |
> | 7.6 Reports | **Changed:** report grid, each with date range and Export (CSV, XLSX, PDF) | documents blueprint §6 |
> | New: Statements | Bulk member statements for a month | documents blueprint §4 |
> | New: Billing | Trial status, plan, invoices | `clarix-billing-blueprint.md` §3 |
>
> ### Admin home (R2), replaces 4.1
>
> - **Header:** "Hi, Funmilayo" + cooperative switcher chip (short name) + bell.
> - **Hero card:** "Savings held", rolling `hero-figure`, change this month ("+₦86,000 this month" in
>   emerald, or "No entries yet this month" in `ink-500`). One secondary action "Record a payment".
> - **Stat row:** Members ("15 · 8 on Clarix"), Active loans (value outstanding), Waiting (applications;
>   amber when any is within 24h of hold expiry). Each opens its sheet.
> - **Needs you (max 3), in this priority:** an application whose hold lapses soonest; an over-limit
>   application; last month not reconciled; trial ending (from day 46); an invitation not taken up
>   (only if nothing above). One line each, chevron, opens the review sheet.
> - Setup checklist (until done) replaces Needs you as one compact card "3 of 5 set up" with the next
>   step as its action; it never pushes the hero below the fold.
> - Removed from home: "This month" paragraph cards, the tinted KPI panel, the install prompt (moves to
>   More).
> - "+" sheet: Record a payment, Add a member, Add an existing loan, Import, Apply for a member.

*Textual UX blueprint for the Cooperative Admin role only. Companion to `clarix-design-system.md` (tokens, components, motion), `clarix-mvp-spec.md` (data model, permissions, reservation logic), and `clarix-employee-ux-blueprint.md` (the Employee role, described separately). No diagrams, every layout is described in words, in the order a real cooperative head encounters it.*

---

## How to read this document

Each screen below covers five things: its purpose, its layout (top to bottom), its content and interface elements, its interactions and calls to action, and where it leads. A Cooperative Admin's journey looks structurally different from an Employee's from the very first screen: an Admin is invited into Clarix, not signed up off the street, so Part 1 covers that difference explicitly before the two roles' journeys converge on shared UI patterns (the same meter-and-rolling-number visual language, the same navigation shell) from the dashboard onward. Mobile and desktop share the same screens and the same information; only density and navigation chrome differ, and that's called out per screen rather than described twice.

---

## Part 1, First Contact and Authentication

### 1.1 Accept Invite / Set Password

**Purpose:** Let a cooperative's head or owner activate the Admin account that Clarix's Super Admin has already created for their cooperative: the very first thing a Cooperative Admin ever sees is not a public landing page, it's an email.

**How they arrive:** During a cooperative's paid onboarding, the Super Admin creates that cooperative's record on the platform and sends a one-time invite link by email (via Resend). The Admin's Clarix relationship starts by clicking that link, not by finding the product and signing up.

**Layout:** The same two-panel authentication shell used everywhere in Clarix, on desktop, a dark navy left panel with the quiet looping meter animation and a short line naming their cooperative by name ("Setting up [Cooperative Name] on Clarix"); on mobile, no left panel, just the logo and the form, generously spaced. The right panel/main content holds a short form: the invited email address, shown but not editable (it's the identity the invite was issued to, and changing it here would defeat the point of an invite), a "Set your password" field with a strength indicator, and a confirm-password field.

**Content and elements:** A one-line reminder above the form of who sent this and why ("You've been invited to manage [Cooperative Name] on Clarix"), so the Admin isn't confused about why they're being asked to create a password for a product they didn't sign up for. If this same email address already has a Clarix account, say, the person is also an employee-member somewhere, or already an officer at a different cooperative: the screen instead reads "Welcome back. This invite has been added to your existing account" and skips password creation entirely, going straight to a confirmation step, since one email always resolves to one account regardless of how many roles it holds.

**Interactions:** The primary button reads "Activate account" (or "Add this role to my account" for the existing-account case). A small "This wasn't meant for me" link is available for anyone who reached this screen by mistake, but there's no self-registration path visible anywhere on it. That door genuinely doesn't exist for this role, by design.

**Leads to:** Welcome to Cooperative Admin (2.1), for a brand-new account; straight to the Cooperative Dashboard (4.1) for an existing account that just added this role.

### 1.2 Log In (returning Admin)

**Purpose:** Let an Admin who has already activated their account get back in on a later visit.

**Layout:** Identical shell to the Employee role's Log In screen, email/phone, password, "Forgot password?", primary "Sign in" button. Clarix does not need a separate login surface per role; the same screen serves everyone, and what happens after sign-in (which dashboard, which navigation shell) is what actually differs.

**Interactions and leads to:** Successful login takes an Admin straight to the Cooperative Dashboard (4.1), never back through onboarding, which only ever runs once. If this account holds an Admin role at one cooperative and, say, an ordinary membership at another, the destination is still the Admin's Cooperative Dashboard by default, since managing a cooperative is the higher-stakes, more frequent task for someone in this role; the account-level switcher described in Part 3 is how they'd reach their other relationship instead.

### 1.3 PWA Install Prompt

**Purpose and behavior:** Identical mechanic to the Employee role: a small, dismissible banner appearing once on the Dashboard (4.1) after the Admin has had a chance to see real value, triggering the native install flow on whichever platform they're using, and not reappearing aggressively if dismissed.

---

## Part 2, Admin Setup (first-time only)

This sequence is genuinely different from the Employee onboarding flow described in the companion document, there's no employee ID, no payslip, no "join a cooperative," because being an Admin doesn't by itself make someone a savings-holding member anywhere. Instead, this is a short setup wizard for the cooperative itself.

### 2.1 Welcome to Cooperative Admin

**Purpose:** A brief, admin-specific orientation: three short slides, distinct from the Employee tour, so the setup steps that follow make sense before they're asked for.

**Layout:** Same full-screen, swipeable, dot-indicator slide pattern as the Employee tour, kept to whitespace and one short line per slide rather than dense text.

**Content across the three slides:** Slide one explains that the next few steps set up the cooperative's public profile, loan rules, and member list: the things Clarix needs before the cooperative can actually run on it. Slide two explains, in one sentence, the cross-cooperative check this Admin will rely on every time they review a loan: Clarix shows them the minimum they need to know about a member's obligations elsewhere, never that other cooperative's private records. Slide three states that officers can be added at any time, so nothing here has to be finished alone or all at once.

**Interactions:** "Skip setup for now" is available and honest, dropping the Admin straight onto a Dashboard that gently prompts them to finish the remaining setup steps rather than blocking entry: a cooperative with an incomplete profile or no imported members yet is still allowed to exist while the Admin works through the rest at their own pace.

**Leads to:** Cooperative Profile Setup (2.2).

### 2.2 Cooperative Profile Setup

**Purpose:** Capture the information that makes this cooperative findable and legible on the Employee-facing Discovery screens described in the companion document: the cooperative's own front door.

**Layout:** A single scrollable form, organized in clearly labeled sections rather than one long undifferentiated block: "Basic information" (cooperative name, pre-filled from what the Super Admin entered at account creation, editable; a short description), "Requirements to join" (plain-language eligibility rules, e.g. minimum length of service, department restrictions if any), and "Benefits and packages" (a short structured list of what the cooperative offers, savings plans, loan types at a glance, kept brief here, since the actual loan product mechanics are configured on their own screen next).

**Interactions:** Each section can be saved independently rather than requiring the whole form to be complete before moving on, consistent with the "smaller, immediate confirmations rather than one high-stakes submit" pattern used throughout Clarix. A live preview toggle shows exactly what an employee will see on the Discovery Profile screen, so the Admin isn't guessing at the public-facing result.

**Leads to:** Loan Product & Policy Configuration (2.3).

### 2.3 Loan Product & Policy Configuration

**Purpose:** Set up the cooperative's own loan rules: the minimum savings ratio, tenure limits, and interest terms that every future eligibility check and loan application will be measured against.

**Layout:** Uses the progressive-disclosure pattern specified in the design system, not the literal borrowed component, a Clarix-built equivalent. The basic settings are visible immediately and un-hidden: minimum savings ratio (e.g. "35% of the requested amount must already be saved": a labeled percentage input, since this cooperative's actual rule was confirmed to vary by cooperative), maximum tenure in months (a stepper), and whether this loan product is public on the Discovery screen. An "Advanced settings" toggle beneath that, collapsed by default, reveals interest structure and any asymmetric or tiered rules for cooperatives whose terms are more complex than the basic fields capture.

**Content and elements:** The screen supports more than one loan product per cooperative (e.g. a small emergency loan and a larger development loan with different ratios), presented as a short list with an "Add loan product" action at the top, each existing product opening this same configuration form pre-filled.

**Interactions:** Saving a product's settings shows an immediate confirmation and returns to the loan-products list. A clear warning appears (though never blocks the save) if a proposed minimum savings ratio or tenure sits well outside what other cooperatives on the platform have configured, since a wildly unusual setting is more likely a typo than a deliberate policy.

**Leads to:** Member Roster Import (2.4).

### 2.4 Member Roster Import

**Purpose:** Bring the cooperative's existing members into Clarix in bulk, exactly as specified in the MVP requirements, without re-typing hundreds of records by hand.

**Layout:** Centered, generous whitespace, a large dashed-border drop zone as the dominant element (identical visual language to the Employee's payslip-upload screen, since both are "give me a file" moments), accepting CSV or XLSX. A visible "Download a blank template" link sits above the drop zone for any cooperative whose existing sheet is too irregular to map cleanly: a safety valve rather than a requirement.

**Interactions: the import runs as a sequence, not a single upload-and-done action:**

1. **Uploading**, shown via the Run Action Button pattern (Reading file → Matching columns → Checking for duplicates → Ready for review), the same honest step-through animation used for payslip processing, because something real is happening at each stage and the Admin should be able to see that.
2. **Column-mapping review**, presented as a simple two-column table: the file's actual column headers on the left, Clarix's canonical fields on the right (Employee ID, Name, Savings Balance, and so on), with the system's best-guess match already filled in wherever the synonym dictionary resolved one confidently (e.g. "Staff No." matching to Employee ID), and a plain dropdown for the Admin to correct or fill in any field the system couldn't resolve on its own.
3. **Preview and validation**, a table of every row with a status badge per row, Ready, Needs review, or Invalid, plus duplicate rows (same Employee ID appearing twice) and duplicate columns (two source columns mapped to the same field) flagged clearly rather than silently resolved one way or the other. Any row can be corrected inline, in place, before anything is committed.
4. A running count at the top of this table ("482 ready, 6 need review, 2 invalid") lets the Admin see the shape of the whole import at a glance rather than scrolling to find out how bad it is.

**The final action** is a single, explicit "Import 482 members" button (or however many are ready), clearly separated from the rows still needing review. Nothing is auto-committed, and rows marked invalid are simply excluded rather than blocking the rows that are fine.

**Leads to:** Invite Officers (2.5), or directly to the Cooperative Dashboard (4.1) if the Admin chooses to handle officers later.

### 2.5 Invite Officers

**Purpose:** Optionally bring on the cooperative's day-to-day staff before going further, though this step is skippable and revisited constantly afterward from Officer Management (7.2), described later, so it isn't a blocking gate here.

**Layout:** A short list (empty, on first visit) with a single prominent "Invite an officer" action: a small form asking for the officer's name, email, and a starting permission preset (e.g. "Can submit and record only" vs. "Can also approve loans"), with the finer-grained permission toggles and the cosmetic title field (renaming "Cooperative Officer" to "Treasurer," "Secretary," or anything else) available from the fuller Officer Management screen rather than crammed into this first-run moment.

**Interactions:** "Send invite" triggers the same Resend-based email-invite mechanic used for the Admin's own onboarding. "Skip for now" is available and unpenalized.

**Leads to:** Cooperative Dashboard (4.1): the first time an Admin reaches the screen they'll return to most often.

---

## Part 3, Navigation Structure

**On mobile,** a bottom tab bar, persistent across every authenticated Admin screen, holds four destinations: Home (the Cooperative Dashboard), Members (search, list, and record actions), Loans (the applications queue and active-loans view), and More (Settings, loan products, officers, public profile, import, plus Reconciliation, Reports, Notifications, Profile, and Help, tucked behind one entry point so the bottom bar stays at four items, exactly as it does for the Employee role).

**On desktop,** the same functional territory spreads into a persistent left sidebar with more room to be direct: Home, Members, Loans, and a "Manage cooperative" section that expands into its own sub-items, Loan Products, Officers, Public Profile, Import Members, Reconciliation, Reports, plus standalone Notifications and Profile/Account rows at the bottom of the sidebar. Desktop's width means "More" doesn't need to exist as a catch-all the way it does on mobile; everything gets a direct, visible entry.

**Both platforms** share the same underlying territory: a Home base, a Members area, a Loans area, and a cluster of cooperative-management and account screens, expressed as a four-item bottom bar plus a "More" catch-all on mobile, and a fuller expandable sidebar on desktop. This mirrors the same principle used for the Employee role: one information architecture, two densities, never two different apps.

---

## Part 4, Home Base

### 4.1 Cooperative Dashboard (Home)

**Purpose:** The screen an Admin returns to constantly: a single, honest snapshot of the cooperative's health and anything that needs a decision right now, so the Admin never has to go hunting across several screens just to find out what's outstanding.

**Layout:** A short greeting at the top ("Good morning, here's [Cooperative Name] today"). Below it, a KPI row using the same tap-to-expand card pattern as the Employee dashboard, reskinned to admin-relevant figures: Total Members, Total Savings Held, Active Loans, and Pending Applications. Each collapsed into a compact row (or a 2×2 grid on narrow widths), tapping any one expanding it into the rolling-number detail view, the others shrinking to make room. Immediately below the KPI row sits an "Attention required" section. This is the Admin dashboard's defining feature, absent from the Employee side: a short list of items genuinely waiting on this Admin: loan applications not yet actioned (with how long they've been waiting, since a reservation that's about to expire is time-sensitive), members flagged during import as needing review, and any officer invite still unaccepted after several days. Below that, a lighter "This month" strip mirroring the Employee dashboard's Insights pattern but admin-facing: short text-led cards such as "14 new applications this month" or "Savings grew 6% across your members," swipeable, never autoplaying.

**Interactions:** Tapping a KPI card expands it in place, exactly as on the Employee dashboard. Tapping any "Attention required" item navigates directly to that item: a pending application opens straight into Loan Application Review (6.2), not into the general queue, so the Admin doesn't lose the context of why they clicked. A small, unobtrusive timestamp near the KPI row states when the figures were last confirmed, consistent with the "data freshness is a first-class concept" principle carried over from the Employee role.

**Leads to:** Member Search/List (5.1) via the Members tab; Loan Applications Queue (6.1) via the Loans tab or an "Attention required" item; Loan Application Review (6.2) directly from a specific flagged item.

---

## Part 5, Member Management

### 5.1 Member Search / List

**Purpose:** The screen an Officer or Admin uses most, day to day, finding a specific member quickly, since nearly every other action (recording a contribution, reviewing a loan, checking eligibility) starts here.

**Layout:** On desktop, the Command Search pattern is available as a persistent, always-visible search field at the top of the content pane (not hidden behind a keyboard shortcut, since this is used dozens of times a day and shouldn't require remembering a trigger key), opening a fast-filtering result list beneath it as the Admin types a name or Employee ID. Below or beside the search field, a full member list is visible even before searching: a simple table on desktop (Name, Employee ID, Savings Balance, Active Loan indicator) and a stacked card list on mobile, sortable by name or by join date.

**Interactions:** Typing narrows the list in real time; tapping any result or row opens that Member Profile (5.2). An "Add member" action sits near the search field for adding a single new member by hand (for the rare case of someone joining after the bulk import, rather than reopening the full import flow for one person): a short form (name, Employee ID, initial savings balance if any) rather than the multi-step import sequence.

**Leads to:** Member Profile (5.2); Add Member (a lightweight variant of this same screen, not modeled separately since it's just a short form).

### 5.2 Member Profile (staff view)

**Purpose:** The full picture of one member from the cooperative's side, savings, loans, deductions, and, critically, the cross-cooperative eligibility context needed to make a real lending decision without ever seeing another cooperative's private records.

**Layout:** A header repeating the member's name, Employee ID, and join date, followed by the Continuous Tabs pill switcher specified in the design system: **Overview**, **Savings**, **Loans**, **Deductions**. The Overview tab leads with the same two large rolling-number figures used throughout Clarix, Savings Balance and Total Active Loan Balance at this cooperative, and beneath them, the cross-cooperative eligibility panel: Salary basis, the organization's deduction cap, this member's combined committed obligations across every cooperative they belong to, and the resulting Available Capacity, rendered with the identical meter-and-rolling-number motif used on the Employee's own dashboard, deliberately the same visual, since both sides should be looking at the same honest number. This panel never lists which other cooperatives contribute to that combined figure, or what the member holds there, only the aggregate amount and the remaining headroom, exactly as the governance rule requires, and it's available any time this screen is opened, not gated to an active loan decision.

**Content on the other tabs:** Savings shows this cooperative's own contribution history (a reverse-chronological list, date/amount/running balance). Loans shows every loan this member holds at this specific cooperative, each opening into Loan Detail (6.4). Deductions shows the monthly reconciliation history described later, expected versus actually-received amounts for this member, month by month.

**Interactions:** A "Record contribution" and "Record repayment" action sit near the top of the Savings and Loans tabs respectively, opening the short recording screen described next. A "Start loan application" action, visible from the Overview tab, opens the Loan Application flow scoped to this member. Any destructive action available here (removing this member from the cooperative, for instance) uses the Timed Undo Action pattern: a brief, reversible confirmation rather than an alarming modal dialog, consistent with how Clarix handles every destructive admin action.

**Leads to:** Record Savings Contribution / Repayment (5.4); Loan Detail (6.4); Loan Application Review (6.2), when starting a new application on this member's behalf.

### 5.3 Add Member

**Purpose:** Handle the ordinary, low-drama case of one new person joining after the bulk import already ran, without making them go through the full multi-step import sequence for a single row.

**Layout:** A short single-screen form, name, Employee ID (validated against the organization's ID format in real time, exactly as on the Employee onboarding screen), and an optional starting savings balance if the member is transferring in with existing standing.

**Interactions:** A primary "Add member" button, disabled until the Employee ID passes validation, with an inline warning if that ID already exists elsewhere in the organization (since Employee IDs are unique organization-wide, not per cooperative).

**Leads to:** That new Member Profile (5.2).

### 5.4 Record Savings Contribution / Repayment

**Purpose:** Let staff record what payroll deduction has already delivered: a ledger entry, never a live transaction, consistent with Clarix never moving money itself.

**Layout:** A short focused form: amount, date, and a type selector (Contribution vs. Repayment, if reached from a context where either is possible), with the member's name and current balance shown read-only at the top for confirmation before submitting.

**Interactions:** A single "Record" button saves the entry and returns to the Member Profile, where the relevant balance updates immediately with the rolling-number animation: a small but deliberate piece of feedback that says "this was recorded," not just "the form closed." Every recording action writes to the audit log automatically (who, what, when, old-to-new value), invisibly to the Admin in the moment, surfaced later on the Audit Log screen (8.3) if ever needed.

**Leads to:** Back to Member Profile (5.2).

---

## Part 6, Loan Management

### 6.1 Loan Applications Queue

**Purpose:** A single worklist of every application waiting on this Admin's decision: the operational heart of the Admin's Loans tab, and the screen most "Attention required" dashboard items lead into.

**Layout:** A reverse-chronological (oldest-first, since these are waiting) list of application cards, each showing the member's name, requested amount and tenure, how long it's been waiting, and a small eligibility indicator: a compact version of the meter, showing at a glance whether this application currently sits within or beyond the member's available capacity, without requiring a tap to find out. Applications close to their reservation's expiry are visually flagged (a small amber marker), since an un-actioned reservation auto-releases after the configured expiry window and quietly disappearing is the wrong outcome for a request someone is actually waiting on.

**Interactions:** Tapping any card opens the full Loan Application Review (6.2). A Continuous Tabs switcher at the top separates Pending from a secondary Recently decided view, so approved/rejected history doesn't clutter the active worklist.

**Leads to:** Loan Application Review (6.2).

### 6.2 Loan Application Review / Eligibility Check

**Purpose:** The single most consequential screen in the Admin's day-to-day work, where the cross-cooperative eligibility answer is presented clearly enough to actually change a decision, and where that decision gets made.

**Layout:** A header identifying the member and the request (amount, tenure, monthly repayment implied by those two figures). Below it, the same live meter-and-rolling-number comparison used on the Employee's own application screen: Current monthly deductions, Available capacity, Requested deduction, and a clear result state, "Eligible" in the success color with the resulting headroom, or "Exceeds available capacity" in the warning/danger color naming the exact shortfall, computed from the same formula, deliberately the same visual result an employee would see previewing their own request, because both sides of this decision deserve to be looking at the same honest number. Beneath the eligibility result, this member's savings balance at this cooperative and the loan product's minimum-savings-ratio requirement are shown side by side, since eligibility against the deduction cap and eligibility against the cooperative's own savings-ratio rule are two separate checks and both matter to the decision.

**Interactions:** Two primary actions, "Approve" and "Reject," sit clearly separated (not stacked as a default/danger pair that could be mis-tapped), approving turns the reservation into an active obligation with no change to the underlying capacity math; rejecting releases the reservation immediately, freeing that capacity for the member's other pending or future requests. Both actions use the Timed Undo Action pattern rather than a plain confirm dialog, giving the Admin a brief window to reverse an accidental tap before the decision is final and notifications go out. If the eligibility result shows "Exceeds available capacity," approving is still possible. Clarix informs, it never gatekeeps a cooperative's own decision, but the Approve button's label changes to something honest like "Approve anyway," and a short required note field asks the Admin to record why, since approving over a flagged shortfall is exactly the kind of decision the audit log exists to make reviewable later.

**Leads to:** Back to the Loan Applications Queue (6.1), with this application now moved into the Recently decided view.

### 6.3 Active Loans (list)

**Purpose:** A working list of every loan currently active at this cooperative, distinct from the pending queue, for an Admin who wants to see what's actually outstanding rather than what's waiting on a decision.

**Layout:** A simple table on desktop / stacked cards on mobile, member name, remaining balance, monthly repayment, next expected date, sortable and searchable, reusing the same list-and-filter shape as Member Search rather than inventing a new pattern for what is structurally the same kind of screen.

**Interactions:** Tapping any row opens that Loan Detail (6.4).

**Leads to:** Loan Detail (6.4).

### 6.4 Loan Detail (admin view)

**Purpose:** The full record of one specific loan, for an Admin who needs to check its terms or repayment history rather than the member's whole profile.

**Layout:** The same large remaining-balance figure and repayment-progress meter used on the Employee's own Loan Detail screen (the two are deliberately visually identical, since it's the same loan seen from two sides), followed by the loan's terms (original amount, tenure, monthly repayment) and a reverse-chronological repayment history.

**Interactions:** A "Record repayment" action opens the short recording form (5.4) scoped to this loan. Unlike the Employee's read-only view of the same screen, the Admin's version also carries a small "View member profile" link back to the full Member Profile (5.2), since an Admin arriving here from the Active Loans list may want the wider context next.

**Leads to:** Member Profile (5.2); Record Savings Contribution / Repayment (5.4).

---

## Part 7, Cooperative Configuration

These screens are visited far less often than Members or Loans, which is exactly why they live behind "Manage cooperative" on desktop and inside "More" on mobile rather than occupying a primary tab slot.

### 7.1 Loan Products & Policy Settings

**Purpose and layout:** The same screen described during first-time setup (2.3), returned to whenever the cooperative's rules need to change: a list of existing loan products with an "Add loan product" action, each opening the progressive-disclosure configuration form (basic ratio/tenure settings visible immediately, interest and asymmetric rules behind an "Advanced" toggle).

**What's different on a return visit:** each product's list row now shows how many active loans currently use it, so an Admin can see the real-world impact before tightening or loosening a rule already in use.

**Leads to:** Back to this same list after saving; no further navigation beyond it.

### 7.2 Officer Management

**Purpose:** Add, remove, and precisely control what the cooperative's staff can do: the screen that makes the Admin/Officer permission split from the MVP spec actually operable day to day.

**Layout:** A list of current officers, each row showing their name, their cosmetic title (e.g. "Treasurer," set by this Admin and purely a display label. It never changes the underlying permission set), and their status (active / invited, not yet accepted). An "Invite an officer" action at the top opens the same short invite form described during setup (2.5).

**Interactions:** Tapping an officer's row opens a permission-editing panel: a clear list of toggle switches (can view members, can record contributions/repayments, can submit loan applications, can approve/reject loan applications, and so on), default-deny, meaning a permission not explicitly switched on isn't usable by that officer at all. The same panel holds the editable title field. Removing an officer's access uses the Timed Undo Action pattern rather than an alarming confirm dialog, consistent with every other destructive action in the admin surface, and revoking access here has no effect on any other role that same person might hold, as an officer somewhere else, or as an ordinary member of a third cooperative, since every one of those relationships is scoped independently to its own cooperative.

**Leads to:** Back to the officer list after any change is saved.

### 7.3 Public Profile Editor

**Purpose and layout:** The same screen introduced during setup (2.2), returned to whenever the cooperative's discovery-facing information needs updating, description, requirements, and benefits/packages, with the same live preview of exactly what an employee sees on the Discovery Profile screen.

**Leads to:** No further navigation beyond saving; this is a terminal configuration screen.

### 7.4 Member Roster Import (ongoing)

**Purpose and layout:** The same multi-step import sequence introduced during setup (2.4), upload, column-mapping review, duplicate/validation preview, explicit commit, reused whenever the cooperative needs to bring in another batch of members later (a departmental transfer, a delayed second cohort) rather than adding them one at a time through Add Member (5.3).

**Leads to:** The updated Member Search/List (5.1), showing the newly imported members alongside existing ones.

### 7.5 Monthly Reconciliation Entry

**Purpose:** Make a deduction shortfall visible on purpose rather than discovered by accident: the screen that answers "did we actually receive what we expected this month" for every member with an active loan or contribution.

**Layout:** A period selector at the top (defaulting to the current month), followed by a table, member name, expected amount, a manually entered "actual amount received" field, and the difference calculated automatically as soon as the actual figure is entered.

**Interactions:** Each row saves independently as it's filled in, rather than requiring the whole month to be entered in one sitting before anything is recorded. Rows with a shortfall are visually flagged once entered, giving the Admin a running, month-by-month picture of exactly where and how much is going missing: the evidence base the strategic plan calls out as the number that eventually makes the case for the paid recurring plan.

**Leads to:** No further navigation beyond entry; figures entered here immediately feed the Deductions tab on the relevant Member Profile screens (5.2).

### 7.6 Reports

**Purpose:** A lightweight reporting surface, noted here for completeness since it's specced as a near-term fast-follow (P1) rather than core to the initial MVP.

**Layout:** A short list of a few pre-built views (member growth over time, total savings held, reconciliation shortfall trend), each opening a simple chart-plus-table page rather than a configurable report-builder, matching the MVP's intentionally lean scope for this feature.

**Leads to:** No further navigation beyond viewing; export/download is a reasonable later addition, not essential at launch.

---

## Part 8, Account, Notifications, and Support

### 8.1 Notifications

**Purpose and layout:** Structurally identical to the Employee role's Notifications screen: a reverse-chronological list, small category icon, short message, relative timestamp, unread marked by a small dot rather than a loud badge, but admin-facing in content: a new loan application arriving, a reservation approaching its expiry, an officer invite accepted, a member flagged during import needing review.

**Interactions:** Tapping any notification navigates directly to what it concerns: an application notification opens straight into Loan Application Review (6.2); an officer-invite notification opens Officer Management (7.2). "Mark all as read" sits at the top.

**Leads to:** Wherever the specific notification is about.

### 8.2 Profile / Settings

**Purpose:** Where the Admin manages their own personal account, separate from anything cooperative-wide, which lives in Part 7 instead.

**Layout:** The same structure as the Employee's own Profile screen, personal information (name, contact details), security (change password), notification preferences, but without a salary/payslip section, since being an Admin doesn't require or imply being a beneficiary member anywhere. If this same account also holds an ordinary membership at some cooperative, a small "Switch to my member view" link appears here, taking the Admin into that other side of their account rather than requiring a separate login. One account, several independent relationships, exactly as the multi-role data model intends.

**Interactions:** Each section saves independently with its own small confirmation, consistent with the "no single high-stakes submit" pattern used throughout. "Log out" sits at the very bottom, visually separated and muted rather than alarming.

**Leads to:** No further navigation beyond its own sub-sections; "Switch to my member view," when present, leads to the Employee Dashboard described in the companion document.

### 8.3 Cooperative Audit Log

**Purpose:** A plain, searchable record of who did what and when, inside this cooperative only: the accountability layer that makes every sensitive action (a view, an edit, an approval, a removed member) reviewable after the fact, without needing to trust memory or goodwill alone.

**Layout:** A simple reverse-chronological table, timestamp, actor (which staff member), action, and target (which member or record), with a date-range and action-type filter above it. Entries that changed a value (an edited savings balance, for instance) show the old and new value side by side rather than just naming that a change occurred.

**Interactions:** This is a read-only record; nothing here can be edited or deleted, by design. A search field allows filtering to one specific member or one specific staff member's activity.

**Leads to:** No further navigation; this is a reference screen, consulted rather than acted from.

### 8.4 Help / Support

**Purpose and layout:** Structurally identical to the Employee role's Help/Support screen: a short FAQ accordion (organized here as "Managing members," "Loans and eligibility," "Cooperative settings" rather than the Employee version's categories) followed by a simple contact option (an email link or short in-app message form), sized for a lean pilot rather than a full support desk.

**Leads to:** Nowhere further: a terminal, low-traffic screen reached from mobile's "More" menu or the desktop sidebar.

---

## Summary of the Full Cooperative Admin Journey

An Admin's relationship with Clarix begins with an email invite rather than a signup form, landing on Accept Invite / Set Password, followed by a short admin-specific welcome tour and then a genuine setup sequence, cooperative profile, loan products and policy, a bulk member import, and optionally inviting officers, before ever reaching the screen they'll return to constantly afterward: the Cooperative Dashboard, with its KPI row and its defining "Attention required" feed of applications, flagged import rows, and pending invites. From there, the Admin's ongoing work spreads across three consistent areas reachable from the bottom tab bar or sidebar: Members (search, individual profiles with the same cross-cooperative eligibility panel an employee sees on their own dashboard, and the ability to record contributions and repayments), Loans (the applications queue, the eligibility-review-and-decide screen where the product's core promise is delivered to the person actually making the lending call, and the active-loans list), and a cluster of less-frequent cooperative-configuration screens, loan products, officer permissions, the public discovery profile, ongoing member imports, monthly reconciliation, and reports, reached through "Manage cooperative" on desktop or "More" on mobile, alongside the account cluster of Notifications, Profile/Settings, the cooperative's own Audit Log, and Help. Throughout, the same signature visual language used on the Employee side, rolling-number figures, the used-versus-available meter, carries over deliberately unchanged, so that whether a member or their cooperative's Admin is looking at a given number, both are seeing the same honest figure, rendered the same honest way.
