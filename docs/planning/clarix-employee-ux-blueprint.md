# Clarix, Employee/User Role: Screen-by-Screen Wireframe & User Flow

> ## R2 header (22 November 2026): read this before any section below
>
> This blueprint is now the **Member** blueprint. The R1 text below stays as the record of what was
> built; where this header and the body disagree, **this header wins** (then `DESIGN_SYSTEM.md`, then
> `docs/DECISIONS.md` over both).
>
> **Global changes to every section:** "employee" reads "member"; "salary" reads "income"; "payslip"
> reads "proof of income (payslip or bank statement)"; "employee ID / IPPIS number" reads "Member ID"
> with the label each cooperative sets; every FMC, hospital and IPPIS mention is removed from copy
> (D034). Light theme only, Figtree, pill buttons (D037, D038, D045). No uppercase eyebrows anywhere.
>
> | Section | Status in R2 | Replacement |
> |---|---|---|
> | 1.1 Landing | **Superseded** | `clarix-public-site-blueprint.md` §2 |
> | 1.3 Sign Up, 1.4 Log In | **Superseded (layout and copy)**; flows unchanged | `clarix-public-site-blueprint.md` §4 |
> | 2.1 Welcome Tour | Kept, max 3 slides, skippable, no FMC copy | public-site blueprint §5 |
> | 2.2 Employee ID Entry | **Changed:** optional unless the cooperative requires it; asked *after* choosing a cooperative, with that cooperative's label and pattern | public-site blueprint §5, D034 |
> | 2.3 Payslip Upload, 2.4 Review | **Changed:** one optional "Proof of income" step offering payslip, bank statement (3–6 months) or "I'll add it later"; skipping never blocks home | `clarix-documents-blueprint.md` §5, D035 |
> | 2.5 Join a Cooperative | Moved earlier: second step of onboarding | public-site blueprint §5 |
> | 3 Navigation | **Changed:** floating pill tab bar, four destinations (Home, Cooperatives, Loans, More); desktop light sidebar | `DESIGN_SYSTEM.md` §5.5 |
> | 4.1 Dashboard / Home | **Superseded** | "Member home (R2)" below |
> | 4.2 My Cooperatives | Kept; now also holds the insights and the "join another cooperative" prompt removed from home; each row opens a cooperative sheet | BUILD-PLAN 6.1 |
> | 5.2 Savings Statement | Kept on screen; adds "Download PDF" (watermarked) and a combined statement | documents blueprint §4 |
> | 5.3 Loan Detail | **Changed:** opens as a sheet with the state timeline Applied → Capacity held (or "Sent for review") → Approved → Repaying → Closed | BUILD-PLAN 6.2 |
> | 5.5 Loan Application | **Changed:** over-limit "Submit anyway" stores the application as `pending_review` and the confirmation says nothing is held (D040). Amount by range slider + rolling number; tenure stepper; one pinned primary | BUILD-PLAN 0.1, 6.2 |
> | 6.2 Profile / Settings | Grouped list; adds "Proof of income" (evidence list, age, add new) and "Other monthly repayments" (EDGE-CASES E16); theme setting removed | BUILD-PLAN 6.3, 7.x |
>
> ### Member home (R2), replaces 4.1
>
> - **Header (56px):** initials avatar, "Hi, Adebayo" (`heading`), bell with unread dot. No organisation
>   line, no member ID under the name.
> - **Hero card:** label "Available to borrow"; the figure as a rolling `hero-figure`; the meter
>   (committed vs available) under it; one line "of ₦161,838 monthly repayment limit" (or "Using the
>   lowest limit of your cooperatives", D035.4; or a `Declared` chip). One primary button "Apply for a
>   loan". If not assessed: the figure reads "Not assessed yet", the meter is an empty track, the
>   button becomes "Add proof of income" and a tertiary "Apply anyway" link remains (D040).
> - **Stat row (one group, three stats, hairline separated):** Savings (total across cooperatives),
>   Loans (count and outstanding), This month (repayments due). Each opens a sheet with the
>   per-cooperative breakdown and one action.
> - **Needs you (max 3):** e.g. "Ikeja Traders decided your application", "March statement is ready",
>   "Your proof of income is 13 months old". "See all" goes to Notifications. Hidden when empty (no
>   empty-state card on home).
> - **Highlights (optional, D046):** up to three swipeable cards from the member's cooperatives
>   (announcement, new loan product, statement ready). Only when real.
> - Nothing else. "Current as of" becomes a `small` line under the hero only when data is older than
>   24 hours ("Updated 3 days ago").
>
> **Acceptance:** fits a 360×800 phone without scrolling except Highlights; tab bar never covers it;
> every figure matches the Cooperatives and Loans screens.

*Textual UX blueprint for the Employee/User role only. Companion to `clarix-design-system.md` (tokens, components, motion) and `clarix-mvp-spec.md` (data model, permissions). No diagrams, every layout is described in words, in the order a real employee encounters it.*

---

## How to read this document

Each screen below covers five things: its purpose (why it exists), its layout (how space is organized, described top to bottom), its content and interface elements (what's actually on it), its interactions and calls to action (what the user can do and what happens next), and where it leads (which screen comes after which action). Screens are ordered the way a real employee would actually move through them, first contact, onboarding, then the ongoing home base they return to. Mobile and desktop share the same screens and the same information; only density and navigation chrome differ, and that difference is called out per screen rather than described twice.

---

## Part 1, First Contact and Authentication

### 1.1 Landing Page (pre-authentication, marketing)

**Purpose:** Give a first-time visitor, most likely someone who heard about Clarix from a cooperative head or a colleague, enough understanding of what the product does to decide whether to create an account. This is the only screen in the entire employee journey where marketing language and a little visual warmth are appropriate; everything after this point is functional.

**Layout:** A dark navy full-width header area contains a simple top bar (Clarix wordmark on the left, three or four text links, How it works, For cooperatives, FAQ, and a "Sign in" button on the right, collapsing to a hamburger menu on mobile). Below the top bar, a centered headline states the actual problem Clarix solves in plain language, a supporting line names the mechanism (cooperatives, salary deductions, one shared limit), and beneath that sits a small live preview of the product itself: not an illustration but an actual working miniature of the eligibility check animating on a loop (a number rolling into place, a meter filling, a result appearing). A single primary button, "Get started," sits below that preview. Scrolling down reveals three short sections, each a heading and one sentence, explaining what an employee sees, what a cooperative sees, and how privacy is preserved between cooperatives. A short FAQ accordion follows, and the page ends with a simple footer repeating the "Get started" call to action.

**Interactions:** "Get started" and "Sign in" are the only two paths off this page. There is no scroll-triggered animation beyond the looping preview. Nothing distracts from the two buttons that actually matter.

**Leads to:** "Get started" → Sign Up (1.3). "Sign in" → Log In (1.4).

### 1.2 PWA Install Prompt

**Purpose:** Encourage the employee to add Clarix to their home screen so it behaves like an installed app rather than a browser tab, without interrupting anything they're trying to do.

**Layout and behavior:** This is not a dedicated screen but a small, dismissible banner that appears once, near the top or bottom of the Dashboard (6.1), never on the landing page or during onboarding, when the employee hasn't yet seen enough value to want it installed. On a supported mobile browser it triggers the native "Add to Home Screen" prompt; on desktop it triggers the browser's native install icon in the address bar, paired with a one-line in-app nudge ("Install Clarix for quicker access"). Dismissing it hides it for that session and it does not reappear aggressively, asked once per week at most until installed or permanently dismissed.

### 1.3 Sign Up

**Purpose:** Let a new employee create their one Clarix account: the account that will later hold memberships across however many cooperatives they join.

**Layout:** On desktop, a two-panel screen: the left panel is dark navy with a subtler, slower version of the landing page's live meter animation and a short reassuring line ("Built for FMC Abeokuta's staff cooperatives"); the right panel holds the form, vertically centered. On mobile, no left panel: just the Clarix logo, a short welcome line, and the form, with generous top spacing so the form doesn't feel cramped against the status bar.

**Content and elements:** A short stacked form, email or phone number, and a password field with a visible strength indicator, using the short, sequential input pattern (one field settles into place, the next appears) rather than a long static form, since only two fields are being asked for here. Below the form, a single line: "Already have an account? Sign in," linking to Log In. A checkbox or short line of text confirms acceptance of how their data will be used (plain language, not a wall of legal text, with a link to a fuller privacy notice for anyone who wants it).

**Interactions:** The primary button reads "Create account" and is disabled until both fields are validly filled. On success, the employee is taken directly into the account-verification step, not back to the landing page.

**Leads to:** Verify Contact (1.5).

### 1.4 Log In

**Purpose:** Let a returning employee (or an invited Cooperative Admin/Officer setting up their staff access for the first time, see the note below) get back into their account.

**Layout:** Same two-panel/no-panel split as Sign Up, but with only two fields, identifier and password, and no strength indicator, since this isn't account creation.

**Content and elements:** Email/phone field, password field, a "Forgot password?" link beneath it, a primary "Sign in" button, and a secondary line ("New to Clarix? Create an account") for anyone who lands here by mistake.

**A note on invited Admins/Officers:** when a Cooperative Admin or Officer follows their email invite link, they land on a close variant of this same screen, pre-filled, non-editable email, and a "Set your password" label instead of "Sign in," since they're completing an invited account rather than logging into an existing one. This document covers the Employee/User role in depth; that invite path exists so the same login surface serves everyone without a separate design.

**Interactions:** "Forgot password?" leads to a simple two-step reset (enter email → check email for a reset link → set new password on a screen identical in shape to Sign Up's password field). Successful login always lands on the Dashboard (6.1) for a returning user: the onboarding sequence only appears for genuinely new accounts.

**Leads to:** Dashboard (6.1) for returning users; Welcome Tour (2.1) only the very first time a brand-new account successfully verifies.

---

## Part 2, Onboarding (first-time employees only)

### 2.1 Welcome Tour

**Purpose:** Set expectations before asking the employee to hand over their employee ID and payslip: a short, skippable orientation so the upcoming steps make sense rather than feeling like an interrogation.

**Layout:** A full-screen, three-slide sequence with a small dot indicator at the bottom showing progress, swipeable on mobile and advanced by a "Next" button on both platforms. Each slide is mostly whitespace: a short headline, one supporting sentence, and a small supporting icon or a tiny looping animation of the relevant concept, never a large photo.

**Content across the three slides:** Slide one explains that the employee will see every cooperative they belong to in one place. Slide two explains the core value in one sentence. That Clarix checks, before a loan is approved, whether it actually fits what's left of their salary. Slide three states plainly that each cooperative only ever sees its own records, and that this is by design.

**Interactions:** "Skip" is available on every slide for anyone who just wants to get started; the final slide's button reads "Get started" instead of "Next."

**Leads to:** Employee ID Entry (2.2).

### 2.2 Employee ID Entry

**Purpose:** Capture the employee's organization ID (IPPIS number, for this pilot): the identifier that ties their Clarix account to the correct employer record and lets cooperatives find them.

**Layout:** A single-focus screen: a short instructional line at the top ("Enter your IPPIS number, you'll find this on your payslip"), one large input field centered on the screen, and a persistent step indicator near the top (e.g., a thin progress bar or "Step 2 of 4") so the employee always knows how much is left.

**Content and elements:** One numeric input field, formatted and validated against the six-digit pattern in real time (the field visually confirms as soon as six valid digits are entered, rather than waiting for a form submission to show an error). A small helper line beneath the field shows where on a payslip this number appears.

**Interactions:** The primary "Continue" button is disabled until the input passes validation. An invalid or already-registered ID shows an inline error immediately below the field, in the danger token color, with plain language explaining what's wrong (e.g., "This ID is already linked to an account, try signing in instead").

**Leads to:** Payslip Upload (2.3).

### 2.3 Payslip Upload

**Purpose:** Get the employee's gross (and net) salary into Clarix: the one piece of data the eligibility calculation needs from the employee side, since Clarix has no payroll connection of its own.

**Layout:** Centered, generous whitespace, a large dashed-border drop zone as the dominant element, with a short instructional line above it ("Upload your most recent payslip") and an even smaller line beneath explaining accepted formats (PDF, JPG, PNG, or a Word document).

**Content and elements:** The drop zone itself doubles as a tap target on mobile, opening the device's native file picker or camera. Once a file is selected, it's replaced by a small file-preview chip (filename, thumbnail if it's an image) with a "Replace" option, and the primary button changes from disabled to "Process payslip."

**Interactions:** Tapping "Process payslip" triggers the multi-step processing animation: the same run-through-the-steps pattern used for cooperative spreadsheet imports, but employee-facing and shorter: "Reading document" → "Extracting details" → "Almost done," each with a small icon change, taking a few seconds. This is honest about the fact that something real is happening rather than an indefinite spinner.

**Leads to:** Review Extracted Salary (2.4).

### 2.4 Review Extracted Salary

**Purpose:** Let the employee confirm or correct whatever Clarix read off their payslip before it's saved: the human checkpoint that keeps a misread figure from silently entering the system.

**Layout:** A short list of labeled fields, each shown as a row with the field name on the left and the extracted value on the right, styled in the large, confident financial-figure typography rather than plain form text. This is meant to read like a receipt being confirmed, not a form being filled in.

**Content and elements:** Employee ID (already known, shown for confirmation), Gross Salary, Net Salary, and the pay period the payslip covers. A small caption beneath the list reads "Extracted from your payslip": a deliberate, permanent label, not a one-time disclaimer, so the employee is never confused later about where these numbers came from. Each row has a small pencil/edit icon that turns that row into an editable field in place, without leaving the screen.

**Interactions:** A single primary button, "Confirm and continue," saves the figures (edited or not) against the account. If nothing was extracted at all (a failed read), the screen instead shows all fields blank and editable with a short explanation ("We couldn't read this automatically, please enter the figures manually"), so a failed extraction degrades gracefully into manual entry rather than blocking onboarding.

**Leads to:** Join a Cooperative (2.5).

### 2.5 Join a Cooperative

**Purpose:** Get the employee into at least one cooperative before they land on an otherwise-empty dashboard, and introduce the discovery browsing experience they'll return to later.

**Layout:** A simple browsable list, one cooperative per row/card: name, a one-line description, and a "membership requirements" tag if relevant. A search field sits above the list for anyone who knows which cooperative they're looking for.

**Content and elements:** Each cooperative row shows just enough to decide whether to tap in, name, short description, member count if the cooperative has chosen to display it. Tapping a row opens the full Cooperative Discovery Profile (4.2) described later, which is where the actual "Apply to join" action lives; this screen is the browsing layer, not the decision layer.

**Interactions:** A "Skip for now" link is available and honest: an employee can finish onboarding without joining anything yet, landing on a dashboard that gently prompts them to join a cooperative rather than blocking them from entering the app at all.

**Leads to:** Dashboard (6.1), whether or not a cooperative was joined.

---

## Part 3, Navigation Structure

Before describing the ongoing screens, it's worth stating plainly how the employee moves between them, since this is the frame every later screen sits inside.

**On mobile,** a bottom tab bar, persistent across every authenticated screen, holds four destinations: Home (the Dashboard), Cooperatives (the My Cooperatives list and, from there, Discovery), Loans (a cross-cooperative view of everything borrowed, described in Part 5), and More (Notifications, Profile/Settings, and Help, tucked behind one entry point so the bottom bar doesn't get crowded past four items). The active tab is visually distinguished by a filled icon and label; the others are outlined and muted.

**On desktop,** the same four areas appear as a persistent left sidebar instead of a bottom bar, with the addition of direct entries for Notifications and Profile as their own sidebar rows (desktop has the width to spare, so "More" doesn't need to exist there. It only exists on mobile as a space-saving device). The sidebar sits beside the main content area rather than the content occupying the full width, and clicking a sidebar item updates the content pane without a full page reload.

**Both platforms** share the same underlying four functional areas, Home, Cooperatives, Loans, Account (Notifications/Profile/Help), expressed as a bottom bar in one case and a sidebar in the other, never as two different information architectures.

---

## Part 4, Home Base

### 4.1 (also 6.1) Dashboard / Home

**Purpose:** The screen an employee returns to most often: a single, honest snapshot of where they stand across every cooperative they belong to, answering "what's my situation right now" in one glance without requiring them to visit each cooperative separately.

**Layout:** A short personal greeting at the top ("Good morning, [name]"). Below it, a row of KPI cards, Total Savings, Active Loans, Monthly Deductions, Available Capacity, displayed using the tap-to-expand card pattern: collapsed, all four sit in a compact row (or a 2×2 grid on narrow mobile widths); tapping any one expands it into a larger detail view with the rolling-number figure and, for Available Capacity specifically, the meter bar showing used versus available. The other three cards shrink to make room rather than disappearing, so the employee can tap between them without leaving the dashboard. Below the KPI row, a short "Clarix Insights" strip: two or three small, swipeable text-led cards ("Your savings grew ₦40,000 this month," "You're 73% through your Cooperative A loan"), never autoplaying, never a large photo. Below that, if the employee has joined fewer cooperatives than exist at their organization, a quiet, dismissible prompt suggests browsing Discovery; this never appears as an aggressive banner.

**Interactions:** Tapping a KPI card expands it in place. Tapping an Insights card navigates to whatever it references (a savings card leads to that cooperative's detail screen; a loan-milestone card leads to that loan's detail screen). There is no separate "refresh" action, figures are current as of the last confirmed record, and a small, unobtrusive timestamp near the KPI row states when the data was last updated, consistent with the "data freshness is a first-class concept" principle established earlier.

**Leads to:** Cooperative Detail (5.2) via an Insights card or the My Cooperatives tab; Loan Detail (5.4) via a loan-related Insights card or the Loans tab; Discovery (4.3) via the join-a-cooperative prompt.

### 4.2 My Cooperatives (list / switcher)

**Purpose:** The browsing and selection layer for the cooperatives an employee has already joined: the entry point into any single cooperative's detail.

**Layout:** On mobile, tapping the "Cooperatives" tab opens a simple vertical list, one row per joined cooperative, each showing the cooperative's name, its savings balance, and a small loan-status indicator if a loan is active there. On desktop, the same list can render as a compact switcher, either a dropdown in the sidebar or a horizontal pill-tab row at the top of the content pane, since desktop has room to keep the list visible alongside whichever cooperative is currently selected, rather than requiring a full navigation away and back.

**Interactions:** Tapping any row opens that cooperative's Detail screen. A small "+" or "Discover more" entry at the end of the list leads to Discovery (4.3), keeping the two related actions (view what I have, find what I don't) physically close together.

**Leads to:** Cooperative Detail (5.2); Discovery (4.3).

### 4.3 Discovery (browsing unjoined cooperatives)

**Purpose:** Let an employee explore cooperatives they haven't joined yet: the "marketplace-like" browsing layer described in the earlier strategy work, deliberately limited to public information only.

**Layout:** A search field at the top, followed by a card grid (two columns on mobile, three or four on desktop), each card showing a cooperative's name, a short description, and a "requirements" tag if one exists, visually similar to My Cooperatives' rows but distinguished by a small "Not joined" label and a slightly different accent to avoid any confusion between the two lists.

**Content and elements:** Only public-facing information appears here: no financial data, since none exists yet for a non-member, and no other members' information ever. Cards may show a cooperative-supplied logo or accent color, one of the few places in the app where a little visual variety is intentionally allowed, since this is a decision-making screen rather than a data-reading one.

**Interactions:** Tapping any card opens its full Discovery Profile (4.4).

**Leads to:** Cooperative Discovery Profile (4.4).

### 4.4 Cooperative Discovery Profile

**Purpose:** Give an employee everything they need to decide whether to join a specific cooperative, and let them act on that decision.

**Layout:** A header area with the cooperative's name and logo/accent if supplied, followed by its full description, a "Benefits and packages" section (savings plans offered, loan products and their minimum-savings requirements, described in plain terms, e.g., "loans require 35% of the requested amount already saved"), and a "Requirements to join" section.

**Interactions:** A single primary button, "Apply to join," sits prominently near the top and is repeated at the bottom of the page for anyone who scrolls through the full detail first. Tapping it either completes the join immediately (if the cooperative allows open joining) or submits a request pending that cooperative's approval, with the button changing to a disabled "Request sent" state and a short confirmation message.

**Leads to:** Back to My Cooperatives (4.2), now showing the new cooperative (once approved, or immediately if open joining); or Dashboard (6.1) via the persistent navigation.

---

## Part 5, Cooperative and Loan Detail

### 5.1 Cooperative Detail (a joined cooperative)

**Purpose:** The full picture of the employee's standing at one specific cooperative: the screen that answers "how am I doing here" once they've selected a cooperative from My Cooperatives.

**Layout:** A header repeating the cooperative's name, followed by two prominent figures side by side (or stacked on narrow mobile widths), Savings Balance and Loan Balance, each in the large financial-figure typography with a rolling-number treatment. Below that, a "Monthly contribution" line and, if a loan is active, a compact summary of it (balance remaining, next repayment date) that acts as an entry point rather than showing full loan detail here. A row of quick actions follows, "View savings statement," "View loan," "Apply for a loan" (only shown if the employee doesn't already have a loan at this cooperative that would block a new one under its rules), and beneath that, a simple reverse-chronological activity list (contributions recorded, repayments recorded), each row a date, a short label, and an amount.

**Interactions:** Tapping the loan summary opens Loan Detail (5.4) scoped to this cooperative. Tapping "Apply for a loan" opens the Loan Application flow (5.5). The activity list is read-only, employees view their own transaction history here but never edit it, consistent with Clarix recording rather than executing transactions.

**Leads to:** Loan Detail (5.4); Loan Application (5.5); Savings Statement (5.3).

### 5.2 Savings Statement

**Purpose:** A focused, printable-feeling record of contributions to one cooperative, for an employee who wants the detail behind the summary figure.

**Layout:** A simple table (or stacked list on mobile), date, description, amount, running balance, with a date-range filter at the top and no other distractions.

**Interactions:** Nothing to input here; this is a read-only record. A small "Download" or "Share" affordance is reasonable as a later addition but isn't essential to the MVP.

**Leads to:** Back to Cooperative Detail (5.1).

### 5.3 (also 5.4 in earlier numbering) Loan Detail

**Purpose:** The full picture of one active loan, balance, terms, and repayment history, scoped to a single cooperative, since loans are never combined across cooperatives in the employee's own detailed view (only the aggregate capacity figure on the Dashboard crosses cooperative lines).

**Layout:** A large remaining-balance figure at the top in the rolling-number treatment, with the original loan amount shown smaller just beneath it for context. A horizontal meter shows repayment progress (e.g., 73% repaid) using the same visual language as the deduction-capacity meter elsewhere, since both are fundamentally "progress against a total" and should look related. Below that, two labeled figures, Monthly repayment and Next repayment date, and beneath those, a reverse-chronological repayment history list.

**Interactions:** This screen is read-only from the employee's side (repayments are recorded by cooperative staff, not initiated by the employee in-app, consistent with Clarix not being a payment system). No action buttons beyond navigation.

**Leads to:** Back to Cooperative Detail (5.1) or, via the Loans tab, to the cross-cooperative Loans overview (5.5).

### 5.4 Loans (cross-cooperative overview)

**Purpose:** The Loans tab's landing screen: a single list of every active loan the employee holds, across every cooperative, answering "what do I owe, in total, and where" without requiring a trip through My Cooperatives first.

**Layout:** A short header restating the same Monthly Deductions and Available Capacity figures shown on the Dashboard (deliberately repeated here, since an employee arriving via this tab shouldn't have to backtrack to Home to see them), followed by a list of loan cards, one per active loan, each labeled with the cooperative it belongs to, the remaining balance, and the next repayment date.

**Interactions:** Tapping any card opens that loan's Loan Detail (5.3). A "New loan application" button is available if the employee wants to start a request without first navigating into a specific cooperative. It opens a cooperative-selection step ahead of the Loan Application flow below, for anyone who belongs to more than one cooperative and hasn't already chosen one.

**Leads to:** Loan Detail (5.3); Loan Application (5.5).

### 5.5 Loan Application

**Purpose:** The screen where the product's core promise is delivered directly to the employee: a live, honest answer about whether a loan they want actually fits, before they commit to requesting it.

**Layout:** A step-like single screen (not a multi-page wizard, since only two real inputs are needed) built around the slider-and-meter pattern. At the top, the cooperative this application is for. Below that, a labeled amount picker: a horizontal slider with the rolling-number readout above it, bounded by that cooperative's loan product minimum and maximum, and a labeled tenure picker using the increment/decrement stepper for number of months. As both are adjusted, a live comparison panel updates beneath them: Current monthly deductions, Available capacity, Requested deduction (calculated from the amount and tenure chosen), and a clear result: an "Eligible" state in the success color with the resulting remaining headroom, or a "May exceed your available capacity" warning in the amber/danger color naming the exact shortfall, updating in real time as the employee adjusts the sliders rather than only appearing after submission.

**Interactions:** The primary "Submit application" button is enabled regardless of the eligibility result. Clarix informs, it doesn't gatekeep; the actual approval decision belongs to the cooperative. If the live check shows the request exceeds capacity, the button's label changes to something honest like "Submit anyway" rather than silently allowing an unlabeled submission, so the employee is never surprised later. Submitting shows a brief confirmation state and returns the employee to the relevant Cooperative Detail (5.1) or Loans overview (5.5) with the new application visible in a "Pending" state.

**Leads to:** Cooperative Detail (5.1) or Loans overview (5.4), with a pending application now visible there.

---

## Part 6, Account, Notifications, and Support

### 6.1 Notifications

**Purpose:** A single place to see anything that needs the employee's attention, loan status changes, salary re-verification requests, new cooperative packages, without relying on email for everything.

**Layout:** A simple reverse-chronological list, each row a small category icon, a short message, and a relative timestamp. Unread items are marked with a small dot rather than a loud badge count, consistent with the earlier "small purposeful, not alarming" motion and notification principle.

**Interactions:** Tapping a notification navigates directly to whatever it concerns (a loan-approved notification opens that Loan Detail screen; a salary-reverification notification opens Profile Settings' payslip section). A "Mark all as read" action sits at the top for anyone clearing a backlog.

**Leads to:** Wherever the specific notification is about, Loan Detail (5.3), Cooperative Detail (5.1), or Profile Settings (6.2).

### 6.2 Profile / Settings

**Purpose:** Where an employee manages their own account, personal details, salary verification, security, and notification preferences, separate from anything cooperative-specific.

**Layout:** A short personal-info summary at the top (name, employee ID, organization) followed by a set of clearly labeled sections, each expandable or linking to its own sub-screen rather than one long scrolling form: "Personal information" (name, contact details, editable), "Salary information" (the currently confirmed Gross/Net figures, using the Reveal & Copy pattern since this is sensitive, with a "Re-upload payslip" action for anyone whose salary has changed since onboarding), "Security" (change password), and "Notification preferences" (simple toggles for which notification types the employee wants to receive).

**Interactions:** Each section's changes save independently rather than requiring one large "Save all" action at the bottom of a long form, smaller, immediate confirmations ("Personal information updated") rather than a single high-stakes submit. A "Log out" action sits at the very bottom, visually separated from everything else, in a muted rather than alarming style.

**Leads to:** Re-upload Payslip reopens a variant of the Payslip Upload/Review pair (2.3–2.4) scoped to updating rather than onboarding.

### 6.3 Help / Support

**Purpose:** A lightweight place for an employee to find answers or reach out, sized appropriately for a lean pilot rather than a full support desk.

**Layout:** A short FAQ accordion at the top, organized under a couple of plain-language categories ("About my savings and loans," "About my account"), followed by a simple contact option: an email link or a short in-app form that sends a message (via the same email infrastructure used for other notifications), rather than a live chat or ticketing system, which is out of scope for this stage.

**Interactions:** Tapping a FAQ question expands its answer in place. The contact form, if used, asks only for a short message and confirms submission with a brief acknowledgment: no elaborate ticket-tracking UI.

**Leads to:** Nowhere further. This is a terminal, low-traffic screen by design, reached from the mobile "More" menu or the desktop sidebar and returned from via the persistent navigation.

---

## Summary of the Full Employee Journey

First visit to the landing page, then Sign Up, Verify Contact, and the three-slide Welcome Tour. Then the four-step onboarding sequence, Employee ID, Payslip Upload, Review Extracted Salary, Join a Cooperative, arriving for the first time at the Dashboard. From the Dashboard, the employee's ongoing life in the app branches through four consistent areas reachable from the bottom tab bar or sidebar: Home (the Dashboard itself, with its expandable KPI cards and Insights strip), Cooperatives (the joined-cooperatives list, each leading to a Cooperative Detail screen with its own Savings Statement and Loan Detail sub-screens, plus Discovery for browsing and joining new ones), Loans (the cross-cooperative overview, and from there the Loan Application flow where the product's core value: a live, honest eligibility check, is delivered directly), and the account cluster reachable from mobile's "More" or desktop's direct sidebar entries, Notifications, Profile/Settings, and Help. Every screen in this journey uses the same signature visual language (the rolling-number figures, the used-versus-available meter) so that whether an employee is looking at their own dashboard or checking a specific loan, the same visual grammar tells them the same kind of truth about where they stand.
