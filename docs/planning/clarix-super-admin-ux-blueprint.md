# Clarix, Super Admin Role: Screen-by-Screen Wireframe & User Flow

> ## R2 header (22 November 2026): read this before any section below
>
> The R1 text below stays as the record of what was built; where this header and the body disagree,
> **this header wins** over the body. The 14 governing
> documents listed in `AGENT.md` rank above this blueprint, with `docs/DECISIONS.md` highest; build
> every screen here with `DESIGN_SYSTEM.md`'s exact tokens. Light theme only,
> Figtree, pills, no eyebrows. The platform console reads like calm infrastructure: no chatty titles
> ("Here's how Clarix looks today" goes), no marketing tone.
>
> | Section | Status in R2 | Replacement |
> |---|---|---|
> | 4.1 Platform Dashboard | **Superseded** | "Platform home (R2)" below |
> | 5.1 Directory | Adds columns Plan (Trial day N / Paid / Grace / Read-only) and Active members; filters by those | BUILD-PLAN 6.9 |
> | 5.2 Detail | Adds Billing tab (trial, invoices, record payment, extend trial with a reason) | `clarix-billing-blueprint.md` §4 |
> | 5.3 Create Cooperative | Institution is **optional**; adds short name, Member ID label/pattern/required; starts the 60-day trial on activation (D034, D041) | BUILD-PLAN 3.1, 9.2 |
> | 6.1 Deduction Policy | **Changed:** becomes institution default repayment policies; cooperatives set their own within them (D035) | BUILD-PLAN 3.1 |
> | New: Document verification | Look up a statement's verification code | documents blueprint §4.4 |
> | Copy | Remove "Everyone across FMC Abeokuta", FMC placeholders, "employees" → "members" | BUILD-PLAN 3.2 |
>
> ### Platform home (R2), replaces 4.1
>
> - **Header:** "Platform" title, bell.
> - **Hero:** "Active cooperatives", rolling figure, with a one-line split "3 on trial · 2 paid · 0
>   read-only".
> - **Stat row:** Members (active this month, the billing unit), Invites pending, Access requests open.
> - **Needs you (max 3):** a trial ending within 14 days, an unpaid invoice past due, an access request to
>   activate, an admin invitation not taken up for 7+ days.
> - Recent activity moves entirely to Audit log.

*Textual UX blueprint for the Super Admin role only. Companion to `clarix-design-system.md`, `clarix-mvp-spec.md`, and the Employee, Cooperative Admin, and Cooperative Officer blueprints. No diagrams, every layout is described in words, in the order the platform operator encounters it.*

---

## How to read this document

Each screen below covers five things: its purpose, its layout, its content and interface elements, its interactions and calls to action, and where it leads. The Super Admin role is deliberately the smallest and plainest of the four described across this set of documents, and that's a design decision, not an oversight: this role operates the Clarix platform itself, not any cooperative's financial affairs, and it has no standing access to member savings, loans, or salary detail by default: a boundary the design system states explicitly ("administrative power and financial-data visibility are deliberately separated") and this document holds to on every screen. Where a screen needs to touch financial data at all: the one deliberate exception, an explicit support-access flow. That exception is itself visible, logged, and time-boxed, never a quiet backdoor. Mobile and desktop share the same screens; because this role is used far less often and typically from a desk rather than on the move, the mobile experience matters less here than for any other role, but it still gets a complete, honest treatment rather than a stripped-down afterthought.

---

## Part 1, First Contact and Authentication

### 1.1 Platform Account Provisioning (no public entry point)

**Purpose:** Establish the very first Super Admin account: the one belonging to Clarix's operator (you, running this platform for FMC Abeokuta), before any cooperative exists on the system at all.

**How this actually happens:** There is deliberately no signup form anywhere in Clarix that leads to this role, and no invite link either, since at the moment this account is created there's no existing Super Admin to send one. The first Super Admin account is provisioned directly during deployment setup: a one-time seed step (a script or a manual database entry made once, by whoever is standing up the platform) rather than a screen inside the product. Once that seed account exists, it behaves exactly like any other account from that point forward, and every *additional* Super Admin (if the operator ever wants a second one: a co-founder, a support engineer) is added through the in-app Manage Platform Admins screen (8.1) by an existing Super Admin, not through this same seeding process again.

**What the person setting this up sees:** nothing in-app; this is infrastructure, not UX. It's included in this document only so the full lifecycle of the role is accounted for, and so it's clear that Log In (1.2) is genuinely the first *screen* a Super Admin ever encounters.

### 1.2 Log In

**Purpose and layout:** The same shared authentication surface used by every role in Clarix, email/phone, password, "Forgot password?", a single primary "Sign in" button. There is nothing role-specific about this screen's appearance; what happens after successful sign-in is what differs.

**Leads to:** Platform Dashboard (4.1). If this account also happens to hold an ordinary cooperative membership or staff role somewhere (uncommon, but not prevented by the data model), login still opens on the Platform Dashboard by default, since operating the platform is this account's primary purpose; reaching any other relationship it holds happens from Profile/Settings (9.2).

### 1.3 PWA Install Prompt

**Purpose and behavior:** The same dismissible, once-only banner used across every role. Worth noting plainly here: because this role is used less frequently and more often from a desk, installing it as a standalone app matters less than it does for an Employee checking their dashboard on the bus: the prompt still appears, on the same schedule, but nothing about this role's design assumes it will be used that way.

---

## Part 2, Orientation (first-time only)

### 2.1 Welcome to Clarix Platform Administration

**Purpose:** A single short screen, not a multi-slide tour. This role is used by the platform's own operator, who already understands the product deeply, so an extended orientation would be patronizing rather than helpful. Its only job is to state the one boundary that matters before anything else: this account manages cooperatives, not their members' money.

**Layout:** One centered panel, a short headline ("You're set up to run the Clarix platform"), and two or three plain sentences: what this role can do (create and manage cooperative accounts, set the organization-wide deduction policy, oversee platform activity), and, stated just as plainly, what it deliberately can't do by default (see any member's savings, loans, or salary detail. That requires an explicit, logged, time-limited access request, described later in this document). A single "Continue" button.

**Leads to:** Platform Dashboard (4.1).

---

## Part 3, Navigation Structure

**On mobile,** a bottom tab bar holds four destinations: Home (the Platform Dashboard), Cooperatives (the directory and creation flow), Policy (organization-wide settings), and More (Audit Log, Access Requests, Platform Admins, Notifications, Profile, and Help, tucked behind one entry point exactly as with every other role).

**On desktop,** a persistent left sidebar spreads the same territory into direct rows: Home, Cooperatives, Policy, Audit Log, Access Requests, and Platform Admins, with Notifications and Profile as their own rows at the bottom. Nothing here is nested behind a "Manage" submenu the way an Admin's configuration screens are. This role's entire scope is small enough that everything fits as a direct, visible entry, which is itself consistent with the "calm infrastructure, not a consumer app" design principle for this specific role.

**Both platforms** cover the same ground: platform oversight (Home, Audit Log), cooperative lifecycle management (Cooperatives), organization-wide rules (Policy), the one deliberate exception to the financial-data boundary (Access Requests), and account administration (Platform Admins, Profile). No screen anywhere in this role's navigation shows a specific member's savings balance, loan detail, or salary. That absence is the point.

---

## Part 4, Home Base

### 4.1 Platform Dashboard (Home)

**Purpose:** A single, honest snapshot of the platform's health, how many cooperatives exist, which are active, and whether anything needs the operator's attention, without ever surfacing a single member's financial detail, since none of that belongs at the platform level.

**Layout:** A short greeting at the top ("Here's how Clarix looks today"). Below it, a KPI row using the same tap-to-expand card pattern used throughout Clarix, but scoped to platform-level, non-financial counts: Total Cooperatives, Active Cooperatives, Total Employees (organization-wide headcount, a count only, never a name list here), and Pending Invites (cooperative Admin invites sent but not yet accepted). Below the KPI row, an "Attention required" section in the same spirit as the Cooperative Admin's dashboard but platform-scoped: cooperative invites unaccepted for several days, and any open access requests awaiting this Super Admin's own decision (described in Part 7) if another Super Admin submitted one. Below that, a lighter "Recent platform activity" strip, short text-led entries like "Cooperative X activated," "Org deduction cap updated to 33%", pulled from the same events that populate the fuller Audit Log (7.1), giving a glance-level summary without needing to open the full log.

**Interactions:** Tapping a KPI card expands it in place. Tapping an "Attention required" item opens directly into what it concerns: an unaccepted invite opens that Cooperative's Detail screen (5.2); an open access request opens the Access Requests screen (7.2).

**Leads to:** Cooperative Directory (5.1); Policy Settings (6.1); Audit Log (7.1); Access Requests (7.2).

---

## Part 5, Cooperative Management

### 5.1 Cooperative Directory (list / browsing)

**Purpose:** The browsing and selection layer for every cooperative on the platform: the entry point into creating a new one or managing an existing one.

**Layout:** A search field at the top, followed by a simple table on desktop / stacked card list on mobile, one row per cooperative: name, status (Active/Inactive, shown as a clear colored badge), member count, and the name of its current Admin. A prominent "Create cooperative" action sits above the list, always visible rather than requiring a scroll.

**Interactions:** Tapping any row opens that Cooperative's Detail screen (5.2). A status filter (All / Active / Inactive) narrows the list for an operator managing a growing number of cooperatives over time.

**Leads to:** Cooperative Detail (5.2); Create Cooperative (5.3).

### 5.2 Cooperative Detail (platform view)

**Purpose:** The platform-level record of one specific cooperative, deliberately shallow on purpose, since anything deeper than status and contact information belongs to that cooperative's own Admin, not to the Super Admin.

**Layout:** A header with the cooperative's name and status badge, followed by a short set of read-only facts, date created, current Admin's name and email, member count, officer count, and, beneath that, a small "Deduction policy override" indicator showing whether this cooperative has set a shorter reservation-expiry override than the organization default (informational only; the Super Admin can see that an override exists without being shown or needing to edit the cooperative's internal loan-product settings, which remain that cooperative's own business).

**Interactions:** A single "Deactivate cooperative" (or "Reactivate," if currently inactive) action, using the Timed Undo Action pattern rather than an alarming confirm dialog, consistent with how Clarix handles every destructive administrative action platform-wide. A "Resend Admin invite" action appears if the current Admin invite is still unaccepted. There is deliberately no "view members" or "view loans" action anywhere on this screen, reaching any of that data requires the explicit Access Request flow described in Part 7, never a direct click from here.

**Leads to:** Back to the Cooperative Directory (5.1) after any change; Access Requests (7.2), only via the separate, explicit flow, never a direct link from this screen.

### 5.3 Create Cooperative

**Purpose:** Bring a new cooperative onto the platform: the very first step of that cooperative's own onboarding, which then continues, from the Admin's side, exactly as described in the companion Cooperative Admin document.

**Layout:** A short form: cooperative name, a short internal note field (optional, for the Super Admin's own reference, e.g. which staff cooperative this corresponds to at FMC Abeokuta), and the intended Admin's name and email address.

**Interactions:** A single "Create and send invite" button creates the cooperative's record in an inactive-until-accepted state and immediately sends the Admin invite email via Resend: the same invite mechanic the Cooperative Admin document describes receiving. A brief confirmation state follows, then a return to the directory with the new cooperative visible, tagged "Invite pending" until the Admin accepts.

**Leads to:** Cooperative Directory (5.1), with the new cooperative now listed.

---

## Part 6, Organization-Wide Policy Settings

### 6.1 Deduction Policy Settings

**Purpose:** The single most consequential screen a Super Admin touches, setting the organization-wide rule every cooperative's eligibility calculation inherits, once FMC Abeokuta's cooperative heads have confirmed what they've actually agreed to.

**Layout:** A short, clearly labeled form rather than a dense settings page, since only a few fields exist and each one matters enough to deserve its own visible weight: **Deduction basis** (a simple choice between Gross Salary and Net Salary, with a short explanatory line, grounded in the real payslip evidence reviewed during planning, clarifying which one the organization has actually confirmed), **Maximum deduction percentage** (a labeled percentage input, defaulting to the statutory 33.3% figure), **Employee ID format** (currently "6-digit numeric," editable in case Clarix ever serves an organization that isn't IPPIS-based), and **Default reservation expiry** (in days, the organization-wide default and ceiling that individual cooperatives may only shorten, never extend, at their own level).

**Interactions:** Each field shows its current value clearly before any edit, since changing the deduction cap or basis is not a cosmetic setting. It changes every cooperative's eligibility math platform-wide the moment it's saved. Saving a change to the deduction basis or percentage surfaces a plain, non-alarming but clear confirmation step ("This changes the eligibility calculation for every cooperative on the platform, confirm?") before committing, precisely because Clarix's whole value proposition rests on this number being right and changed deliberately, never by accident.

**Leads to:** No further navigation beyond saving; every change here is recorded automatically in the Platform Audit Log (7.1).

---

## Part 7, Access & Oversight

### 7.1 Platform Audit Log

**Purpose:** A plain, searchable record of platform-level events only, cooperative creation and status changes, organization-wide policy edits, Platform Admin additions or removals, and access-request activity, deliberately excluding any cooperative's internal member-level activity, which lives in that cooperative's own Audit Log, visible only to its own Admin, as described in the companion document.

**Layout:** A reverse-chronological table, timestamp, actor (which Super Admin), action, and target (which cooperative or setting), with a date-range and action-type filter above it. Entries that changed a value (the deduction percentage, for instance) show the old and new value side by side.

**Interactions:** Read-only, searchable, nothing editable or deletable, by design.

**Leads to:** No further navigation; a reference screen, consulted rather than acted from.

### 7.2 Access Requests

**Purpose:** The one deliberate, narrow exception to the platform's no-standing-access rule: a genuine support case (a cooperative reports a discrepancy they can't explain themselves, say) sometimes legitimately needs a Super Admin to look at specific member-level data. Rather than quietly allowing that by default, Clarix makes the exception itself visible, justified, and time-limited.

**Layout:** A list of past and current access requests, each showing who requested it, which cooperative and (if narrowed that far) which specific member it concerns, the stated reason, its status (Pending / Active / Expired / Revoked), and, for an active grant: the time remaining before it auto-expires. A "New access request" action at the top opens a short form: the cooperative in question, an optional specific member, and a required plain-text reason field that cannot be left blank or generic.

**Interactions:** Submitting a request does not immediately grant access, depending on how the organization wants this configured, it either self-grants with a short mandatory delay (giving the affected cooperative's Admin a window to see the pending request before it activates) or requires that Admin's explicit approval; either way, the affected cooperative's Admin is always notified the moment a request naming their cooperative is submitted, never after the fact. Once active, a grant is strictly time-boxed (a short default window, e.g. 24 hours) rather than open-ended, and can be manually revoked early by the requesting Super Admin.

**Leads to:** Elevated Access View (7.3), for the duration of an active grant.

### 7.3 Elevated Access View (temporary)

**Purpose:** What a Super Admin actually sees during an active, time-boxed access grant, deliberately built to look and feel different from every other screen in this role's normal experience, so it's never mistaken for standing access.

**Layout:** A persistent, non-dismissible banner across the top of the screen for the entire duration of the grant, amber/warning-toned, stating plainly "Temporary access active, [reason], expires in [time remaining]", above what is otherwise the same Member Profile layout an Admin or Officer would see (Overview/Savings/Loans/Deductions tabs, the same cross-cooperative eligibility panel), so the Super Admin is looking at real, correctly-rendered data, framed unmistakably as a temporary, justified exception rather than a normal part of this role's toolkit.

**Interactions:** Entirely read-only: no recording, editing, approving, or rejecting anything from this view, regardless of what a normal Admin or Officer could do on the equivalent screen, since the point of this access is to look, not to act. The view simply stops rendering the moment the grant expires, returning to the Access Requests screen (7.2) automatically. Every screen view and specific record opened during an active grant is logged individually, more granularly than ordinary platform events, precisely because this is the one place financial detail crosses this role's boundary.

**Leads to:** Automatically back to Access Requests (7.2) on expiry.

---

## Part 8, Platform Administration

### 8.1 Manage Platform Admins

**Purpose:** Add or remove people who hold this same Super Admin role, relevant once the platform has more than one operator (a co-founder, a support engineer), even though only one such account exists at launch.

**Layout:** A simple list of current Platform Admins, name, email, date added, with an "Invite a Platform Admin" action above it, opening a short form (name, email) that sends the same kind of one-time invite-link email used for every other invited role in Clarix.

**Interactions:** Removing a Platform Admin uses the Timed Undo Action pattern, consistent with every destructive action across every role in Clarix. A Super Admin cannot remove their own account from this screen. That would require a separate, deliberately harder-to-reach safeguard, avoiding the mistake of a single operator locking themselves out entirely.

**Leads to:** Back to this same list after any change.

---

## Part 9, Account, Notifications, and Support

### 9.1 Notifications

**Purpose and layout:** The same reverse-chronological, small-icon, relative-timestamp list used across every role, scoped to platform-level events: a cooperative invite accepted, an access request submitted or about to expire, a new Platform Admin invite accepted.

**Interactions:** Tapping a notification opens directly into what it concerns. "Mark all as read" sits at the top.

**Leads to:** Wherever the notification is about.

### 9.2 Profile / Settings

**Purpose and layout:** The same personal-information, security, and notification-preference structure used across every role's own Profile screen, name, contact details, password, notification toggles, with no salary or cooperative-membership section, since this role carries neither by default. If this account happens to also hold an ordinary membership or staff role elsewhere (an edge case the data model allows but nothing in this role's normal use assumes), the same "Switch to my [member/officer/admin] view" link used across the other roles' Profile screens appears here too.

**Interactions:** Each section saves independently. "Log out" sits at the bottom, muted and visually separated, as everywhere else in Clarix.

**Leads to:** No further navigation beyond its own sub-sections.

### 9.3 Help / Support

**Purpose:** Given who actually holds this role: the platform's own operator, not an end user needing hand-holding. This screen is less a support desk and more a quick-reference and escalation point.

**Layout:** A short set of plain-language reference notes rather than a full FAQ accordion ("How the deduction policy setting affects every cooperative," "How access requests work and why they're time-boxed," "How to deactivate a cooperative safely"), followed by a direct contact line for anything not covered, since at this stage of the product, the Super Admin is likely to be the same person who built it, and this screen exists mainly so the pattern is complete and ready to hand off to someone else later without a gap.

**Leads to:** Nowhere further: a terminal, low-traffic screen reached from mobile's "More" menu or the desktop sidebar.

---

## Summary of the Full Super Admin Journey

A Super Admin's account exists before the product does, in the sense that it's provisioned once during deployment rather than reached through any signup or invite screen, every subsequent visit begins at an ordinary Log In, followed the very first time by a single plain-spoken orientation screen stating the one boundary that shapes everything after it: this role runs the platform, not its members' money. From the Platform Dashboard, the operator's ongoing work spreads across a small, deliberately shallow set of areas, Cooperatives (creating new ones, checking status, deactivating when needed, never viewing member detail directly from here), Policy (the organization-wide deduction basis, cap, ID format, and reservation-expiry default that every cooperative inherits), and an oversight cluster (the platform-level Audit Log, and the one narrow, visible, time-boxed exception to the no-standing-access rule in Access Requests and its Elevated Access View). Platform Admins, Notifications, Profile, and Help round out an account cluster identical in spirit to every other role's. Nothing about this role's screens tries to be delightful or richly visual, per the design system's own instruction, this is the one part of Clarix meant to look and feel like calm infrastructure, because its job is oversight, and the absence of financial detail from nearly every screen in this document is not a limitation of the build, it's the feature.
