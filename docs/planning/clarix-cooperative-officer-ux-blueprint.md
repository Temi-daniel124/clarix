# Clarix, Cooperative Officer Role: Screen-by-Screen Wireframe & User Flow

> ## R2 header (22 November 2026): read this before any section below
>
> The R1 text below stays as the record of what was built; where this header and the body disagree,
> **this header wins** over the body. The 14 governing
> documents listed in `AGENT.md` rank above this blueprint, with `docs/DECISIONS.md` highest; build
> every screen here with `DESIGN_SYSTEM.md`'s exact tokens. The same global
> changes as the admin blueprint's R2 header apply (Member wording, no FMC, light only, Figtree,
> pills, no eyebrows, no cooperative name in the title).
>
> | Section | Status in R2 | Replacement |
> |---|---|---|
> | 3 Navigation | Phone: Home, Members, Loans, More + centre "+" (opens Record a payment); desktop light sidebar | `DESIGN_SYSTEM.md` §5.5 |
> | 4.1 Officer Home | **Superseded** | "Officer home (R2)" below |
> | 5.x Members | Same as admin R2 (pinned search, member sheet), within the officer's permissions | BUILD-PLAN 6.4 |
> | 5.4 Record | Adds bulk monthly entry when the officer holds the record permission | BUILD-PLAN 6.7 |
> | 6.2 Submit Loan Application | **Never built in R1; build in R2.** Start from the member sheet → "Apply for this member"; same flow and meter as the member's own apply; the member is notified and sees it in their Loans; over-limit stored as `pending_review` (D040) | BUILD-PLAN 6.6 |
> | New permissions | `export` (records and statements) and `verify_income` join the default-deny toggles | `ROLES-AND-PERMISSIONS.md` |
>
> ### Officer home (R2), replaces 4.1
>
> - **Header:** "Hi, Chidi" + cooperative switcher chip + bell.
> - **Hero:** a large member search field (52px, `radius-pill`, autofocus on desktop only) with the five
>   most recently touched members as rows under it. This is the officer's real starting point.
> - **One stat line:** "Recorded today: 4 entries, ₦62,000" (opens today's entries sheet with Timed Undo
>   on each). When zero: "Nothing recorded today".
> - **Needs you (max 3):** applications the officer may decide, soonest hold expiry first. Hidden when
>   the officer cannot decide loans or nothing is waiting.
> - Removed: the "Your pending tasks" essay empty state and the "Today" two-number block.

*Textual UX blueprint for the Cooperative Officer role only. Companion to `clarix-design-system.md` (tokens, components, motion), `clarix-mvp-spec.md` (data model, permissions, reservation logic), `clarix-employee-ux-blueprint.md`, and `clarix-cooperative-admin-ux-blueprint.md`. No diagrams, every layout is described in words, in the order a real cooperative officer encounters it.*

---

## How to read this document

Each screen below covers five things: its purpose, its layout (top to bottom), its content and interface elements, its interactions and calls to action, and where it leads. The Officer role sits deliberately between Employee and Admin. It does the same day-to-day work an Admin does (finding members, recording contributions, handling loan applications) but holds none of the cooperative-wide configuration power (no loan-product settings, no officer management, no public profile editing, no audit log, no reconciliation, no reports). That makes most of an Officer's screens near-identical in shape to the equivalent Admin screens described in the companion document; rather than re-explain every layout from scratch, this document notes clearly where a screen is the same as the Admin's and calls out only what's actually different.

**One thing that shapes every screen below and is worth stating up front:** an Officer's exact capabilities are configured per person by their own cooperative's Admin. One officer might be allowed to only search members and record contributions, while another at the same cooperative can also submit and approve loan applications. Clarix's rule is default-deny: a permission not explicitly granted simply isn't usable, and the interface reflects that by not showing the control at all rather than showing a disabled, greyed-out button that would just invite confusion about why it doesn't work. Every screen description below assumes an Officer with a reasonably full set of permissions, and calls out explicitly which pieces disappear for an Officer who has a narrower set.

---

## Part 1, First Contact and Authentication

### 1.1 Accept Invite / Set Password

**Purpose:** Activate the account of a cooperative's day-to-day staff member: an Officer never signs up on their own initiative any more than an Admin does, but the person inviting them is different.

**How they arrive:** Unlike a Cooperative Admin, whose invite comes from Clarix's Super Admin during a cooperative's paid onboarding, an Officer's invite is sent by their own cooperative's Admin, from inside that Admin's Officer Management screen (described in the companion Admin document). The mechanic on the receiving end is identical either way: a one-time link, delivered by email via Resend.

**Layout:** The same two-panel authentication shell used everywhere in Clarix, dark navy left panel with the quiet meter animation on desktop, logo-and-form only on mobile, with a short line naming both the cooperative and the person who invited them ("You've been invited to help manage [Cooperative Name] on Clarix"), so the Officer has immediate, plain confirmation of who asked them to be here and why. The form itself asks for nothing more than a password and its confirmation, since the invited email is fixed and shown read-only.

**Content and elements:** As with the Admin invite flow, if this email address already has a Clarix account under any other role or membership, the screen shortens to "Welcome back. This role has been added to your existing account" and skips straight to confirmation, since one email always resolves to one account no matter how many relationships it holds.

**Interactions:** A single primary button, "Activate account" (or "Add this role to my account" for the existing-account case).

**Leads to:** Welcome to Cooperative Officer (2.1), for a brand-new account; straight to the Officer Home screen (4.1) for an existing account that just added this role.

### 1.2 Log In (returning Officer)

**Purpose and layout:** Identical to every other role's Log In screen in Clarix. One shared surface, not a separate design per role.

**Leads to:** Officer Home (4.1). If this same account also holds an Admin role somewhere, or an ordinary membership, login still opens on the Officer's own home view by default; switching between an account's different relationships happens from Profile/Settings (8.2), described later, rather than at login.

### 1.3 PWA Install Prompt

**Purpose and behavior:** The same dismissible, appears-once-on-first-real-use banner used across every role, triggering the platform's native install flow.

---

## Part 2, Welcome / Orientation (first-time only)

### 2.1 Welcome to Cooperative Officer

**Purpose:** A short, honest orientation before the Officer is dropped into real member data, shorter than either the Employee's or the Admin's tour, since there's no setup wizard to prepare for here. An Officer's job starts immediately; this tour exists only to set expectations correctly.

**Layout:** The same full-screen, swipeable, dot-indicator slide pattern used for every role's first-run tour: two slides here rather than three, kept to whitespace and one short line each.

**Content across the two slides:** Slide one states plainly what this Officer can actually do at this cooperative, in one sentence tailored to their own granted permissions rather than a generic list ("You can search members, record contributions, and [submit loan applications / process loan applications], as set up by your cooperative's Admin. This can change, and you'll always see exactly what you're able to do, nothing hidden or half-shown"). Slide two explains the cross-cooperative check in the same one-sentence form used in the Admin's own tour: Clarix shows the minimum needed to judge a member's obligations elsewhere, never that other cooperative's private records, and this lookup is available any time, not just during a loan decision.

**Interactions:** "Get started" on the final slide; no "skip setup" language is needed here, since there's no setup to skip.

**Leads to:** Officer Home (4.1).

---

## Part 3, Navigation Structure

**On mobile,** a bottom tab bar, persistent across every authenticated Officer screen, holds four destinations: Home, Members, Loans, and More (Notifications, Profile/Settings, and Help, tucked behind one entry point, exactly as with the other two roles). If this Officer has been granted the member-import permission, an additional "Import members" entry appears inside More, conditionally, since most officers won't have this permission and shouldn't see a menu item for something they can't use.

**On desktop,** the same four areas appear as a persistent left sidebar with direct rows for Notifications and Profile, the same pattern used across every role. Notably absent from an Officer's sidebar, compared to an Admin's, is any "Manage cooperative" section, there's no Loan Products, no Officer Management, no Public Profile Editor, no Reconciliation, no Reports, and no Audit Log anywhere in this role's navigation, because none of those actions are available to an Officer regardless of how their individual permissions are configured. The import entry, when granted, appears as a direct sidebar row rather than buried in a submenu, since desktop has the room to be direct about the one extra thing this particular Officer can do.

**Both platforms** share the same underlying territory as the Admin role minus its configuration layer, Home, Members, Loans, and an account cluster, expressed as a bottom bar plus "More" on mobile and a fuller sidebar on desktop, following the same one-architecture-two-densities principle used throughout Clarix.

---

## Part 4, Home Base

### 4.1 Officer Home

**Purpose:** The screen an Officer returns to constantly during a working day, built around the two things their job actually consists of: finding a member fast, and seeing what's currently waiting on them.

**Layout:** A short greeting at the top ("Good morning, here's what's waiting at [Cooperative Name]"). Immediately below it, higher up than on the Admin's dashboard, since this is genuinely the Officer's most common single action: a persistent, prominent search field, the same Command Search pattern described in the design system, always visible rather than requiring a tap to reveal. Below the search field, a "Your pending tasks" list: loan applications this Officer submitted that are still awaiting the Admin's decision (if the Officer doesn't hold approval permission), or the same "Attention required" style queue an Admin sees (if the Officer does hold approval permission): the list's content quietly adapts to what this specific person is actually responsible for, rather than showing tasks they have no ability to act on. Below that, a lighter "Today" strip: a small count of members recorded against today, applications submitted today: a simple activity summary rather than the fuller KPI row an Admin's dashboard carries, since cooperative-wide totals (total savings held, total membership count) are Admin-level information, not part of an Officer's daily job.

**Interactions:** Typing in the search field opens fast-filtering results beneath it, exactly as on the Admin's Member Search screen. Tapping a pending-task item opens directly into that item's detail (a submitted application opens Loan Application Review, 6.3), the same "don't lose the context of why they clicked" principle used on the Admin dashboard.

**Leads to:** Member Search/List (5.1); Loan Application Review (6.3), directly from a pending task.

---

## Part 5, Member Management

### 5.1 Member Search / List

**Purpose and layout:** Identical to the Admin's Member Search/List screen described in the companion document: the persistent Command Search field on desktop, the searchable stacked list on both platforms, sortable by name or join date. This screen looks and behaves the same for both roles because finding a member quickly is exactly as central to an Officer's job as it is to an Admin's.

**What's different:** the "Add member" action next to the search field only appears if this Officer has been granted the add/import permission; without it, this screen is purely a lookup tool, and that's a complete, honest state for it to be in rather than a lesser version of the Admin's screen.

**Leads to:** Member Profile (5.2); Add Member (5.3), only if permitted.

### 5.2 Member Profile (staff view)

**Purpose and layout:** The same Continuous Tabs structure as the Admin's Member Profile, Overview, Savings, Loans, Deductions, with the identical cross-cooperative eligibility panel (salary basis, deduction cap, combined committed obligations elsewhere, resulting available capacity, rendered with the same meter-and-rolling-number motif used everywhere in Clarix) available any time this screen is opened, exactly as it is for an Admin. This consistency is deliberate: the eligibility answer an Officer sees while helping a member is the same honest number an Admin or the member themself would see, never a lesser or delayed version of it.

**What's different:** the actions available at the bottom of each tab reflect this Officer's specific permissions. "Record contribution" and "Record repayment" appear if that permission is granted (a very common one, since it's core day-to-day work). "Start loan application" appears if the Officer can submit applications. Any destructive action available on the Admin's version of this screen, removing a member outright, for instance, simply never appears here, since that action isn't available to this role at all, regardless of individual configuration.

**Leads to:** Record Savings Contribution/Repayment (5.4); Loan Application flow (6.2), when starting a new application on a member's behalf.

### 5.3 Add Member (permission-dependent)

**Purpose and layout:** Identical to the Admin's Add Member screen, name, Employee ID with real-time format validation, optional starting savings balance, present only for an Officer whose Admin has explicitly granted this permission.

**Leads to:** That new Member Profile (5.2).

### 5.4 Record Savings Contribution / Repayment

**Purpose and layout:** Identical to the Admin's version of this screen: a short focused form (amount, date, type), the member's name and current balance shown read-only above it for confirmation, a single "Record" action, the balance updating immediately with the rolling-number animation on save. Every entry writes to the audit log the same way regardless of which role recorded it, even though only an Admin can later view that log.

**Leads to:** Back to Member Profile (5.2).

---

## Part 6, Loan Management

### 6.1 Loan Applications Queue (permission-dependent scope)

**Purpose:** A worklist of loan applications, scoped to what this Officer is actually responsible for.

**Layout:** For an Officer who can only submit applications (not approve them), this screen shows just the applications they themselves have submitted, each tagged with its current status, Pending, Approved, or Rejected, since their job ends at submission and the rest is the Admin's decision to track. For an Officer who has also been granted approval permission, this screen looks and behaves exactly like the Admin's full queue described in the companion document: every pending application at the cooperative, oldest-first, each with the compact eligibility indicator and an expiry warning marker for reservations running close to their deadline.

**Interactions:** Tapping any card opens Loan Application Review (6.3). A Continuous Tabs switcher separates Pending from Recently decided, exactly as on the Admin's version.

**Leads to:** Loan Application Review (6.3).

### 6.2 Submit Loan Application

**Purpose:** Let an Officer start a loan request on a member's behalf: the same live, honest eligibility preview an employee sees when applying for themselves, but initiated here by staff, typically for a member who came in and asked for help in person or by phone rather than applying through their own account.

**Layout:** A header naming the member this application is for (arrived at either from their Member Profile via "Start loan application," or from a standalone "New application" action on this screen that opens a member-search step first). Below that, the same amount-picker slider and tenure stepper used on the Employee's own application screen, and the same live comparison panel beneath them, current monthly deductions, available capacity, requested deduction, and a clear Eligible/Exceeds-capacity result, updating in real time as the amount or tenure is adjusted.

**Interactions:** A single "Submit application" button, enabled regardless of the eligibility result, exactly as on the Employee's version. Clarix informs, it doesn't gatekeep, and the final decision belongs to whoever at the cooperative holds approval permission. If the live check shows the request exceeds capacity, the button's label changes to "Submit anyway," the same honesty pattern used everywhere else in Clarix rather than a silent unlabeled submission.

**Leads to:** Loan Applications Queue (6.1), with the new application now visible there in a Pending state, or directly into Loan Application Review (6.3) if this Officer also holds approval permission and wants to act on it immediately.

### 6.3 Loan Application Review / Eligibility Check Result

**Purpose:** The same eligibility-review screen described in the Admin companion document, whose available actions change entirely depending on this Officer's permissions. This is the clearest single example in the whole app of the interface adapting to what a specific person is actually allowed to do.

**Layout, shared by both cases:** the same header naming the member and the requested terms, and the same live meter-and-rolling-number eligibility comparison (current deductions, available capacity, requested deduction, Eligible/Exceeds-capacity result) shown identically no matter who is looking at it, alongside the member's savings balance against the loan product's minimum-savings-ratio requirement.

**For an Officer without approval permission:** the screen ends there, as a read-only result: no Approve or Reject button exists at all, replaced by a plain status line ("Submitted, awaiting a decision from your cooperative's Admin"). This Officer's job on this screen is to see the same honest answer an Admin will see, not to act on it.

**For an Officer who has been granted approval permission:** the screen is functionally identical to the Admin's version, "Approve" and "Reject" buttons, each using the Timed Undo Action pattern for a brief reversible confirmation, and the same "Approve anyway" relabeling with a required note field if the request exceeds available capacity, since that accountability requirement applies to whoever makes the call, not only to an Admin specifically.

**Leads to:** Back to the Loan Applications Queue (6.1).

### 6.4 Active Loans (list) and Loan Detail

**Purpose and layout:** Identical in shape to the Admin's Active Loans list and Loan Detail screens: a searchable/sortable list of currently active loans, and a detail view with the large remaining-balance figure, repayment-progress meter, terms, and repayment history. Available to any Officer who can view member records at all, since checking on an existing loan is a normal part of helping a member, distinct from the higher-stakes ability to approve a new one.

**Interactions:** A "Record repayment" action appears on the detail screen if this Officer holds that permission; otherwise the screen is read-only, exactly like the Employee's own view of their loan.

**Leads to:** Member Profile (5.2).

---

## Part 7, Member Roster Import (permission-dependent)

**Purpose and layout:** For the minority of Officers whose Admin has granted the add/import permission, this is the identical multi-step sequence described in the Admin companion document, upload, automatic column-matching, a manual-remap step for anything unresolved, a duplicate-row/column check, a Ready/Needs-review/Invalid preview table, and an explicit final commit action. Nothing about the mechanic itself changes based on who's running it; only whether this screen exists in this Officer's navigation at all changes.

**Leads to:** The updated Member Search/List (5.1).

---

## Part 8, Account, Notifications, and Support

### 8.1 Notifications

**Purpose and layout:** The same reverse-chronological, small-icon, relative-timestamp list used across every role, scoped to what's relevant to an Officer: their own submitted applications changing status, a reservation they created approaching expiry, a new permission granted or changed by their Admin (worth surfacing explicitly, since a permission change directly affects what this person will see on their next visit to Member Profile or the Loans area).

**Interactions:** Tapping a notification opens directly into what it concerns. "Mark all as read" sits at the top.

**Leads to:** Wherever the notification is about.

### 8.2 Profile / Settings

**Purpose:** Where the Officer manages their own account, and: a detail specific to this role, sees a clear, plain-language summary of exactly what they're currently permitted to do.

**Layout:** The same personal-information, security, and notification-preference sections used across every role's own Profile screen, plus one Officer-specific addition near the top: a short, read-only "Your role at [Cooperative Name]" panel listing this person's title (as set by their Admin, "Treasurer," "Secretary," or simply "Cooperative Officer") and a plain-language list of what they're currently able to do here (e.g. "Search members and view profiles," "Record savings and repayments," "Submit loan applications", with anything not granted simply absent from the list, never shown crossed out or greyed, matching the same default-deny-and-don't-clutter principle used throughout this role's navigation). If this same account also holds a membership or another role elsewhere, a "Switch to my member view" (or equivalent) link appears here exactly as it does on the Admin's Profile screen.

**Interactions:** Each section saves independently with its own small confirmation. "Log out" sits at the very bottom, muted and visually separated.

**Leads to:** No further navigation beyond its own sub-sections; the account-switch link, when present, leads to the Employee Dashboard described in the companion document.

### 8.3 Help / Support

**Purpose and layout:** The same lightweight FAQ-plus-contact-form pattern used across every role, organized here under Officer-relevant categories ("Finding and helping members," "Submitting and checking loan applications"), sized for a lean pilot rather than a full support desk.

**Leads to:** Nowhere further: a terminal, low-traffic screen reached from mobile's "More" menu or the desktop sidebar.

---

## Summary of the Full Cooperative Officer Journey

Like an Admin, an Officer's relationship with Clarix begins with an email invite rather than a signup form, but this one arrives from their own cooperative's Admin rather than from Clarix's Super Admin, and it drops them straight into a two-slide orientation rather than any setup wizard, since there's no cooperative-level configuration for this role to do. From Officer Home: a screen built around an always-visible member search field and a task list that quietly adapts to whether this specific person can only submit work or also decide on it: the Officer's ongoing day moves through two consistent areas: Members (search, individual profiles carrying the same cross-cooperative eligibility panel every other role sees, and recording contributions and repayments, where permitted) and Loans (submitting applications with the same live, honest eligibility preview an employee sees applying for themselves, and, for the Officers granted it, reviewing and deciding on those applications with the exact same interface an Admin uses). A permission-dependent Import screen and a small, honest, read-only summary of "what you can currently do" on the Profile screen round out a role that is, by design, a lighter version of Admin rather than a separately reimagined one: same visual language, same underlying screens, narrowed by whatever this particular Officer has actually been trusted with.
