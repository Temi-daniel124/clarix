# Clarix redesign: the Adire design system and screen inventory

**Status:** draft for the owner's review. Nothing here is built until it is approved.
**Date:** 2026-11-21
**Supersedes, once approved:** `DESIGN_SYSTEM.md` (tokens, type, radius, motion, dark mode) and the
layout parts of the four `docs/planning/*-ux-blueprint.md` files. Decisions D002 and D019 are
replaced by new entries (see the last section).

---

## 1. Why this exists

Clarix is moving from one hospital's staff cooperatives (FMC Abeokuta) to **every kind of
cooperative in Nigeria**: staff, market and trader, thrift and credit, farmers, faith-based,
estate and alumni. It also changes what it is. It is no longer only a check that sits beside a
cooperative's books: **it becomes the cooperative's book of record**. Members, savings, loans,
repayments with receipts, statements, reports and exports all live in Clarix. The
cross-cooperative limit check stays as the one feature nobody else has.

The current interface is tidy but reads as a template. It uses one typeface, the same card with a
tinted icon everywhere, and dashboards that list data instead of telling people what to do. The
owner has asked for a product that feels premium, Nigerian and unmistakably designed. Every
person should reach their goal with as few taps as possible, and nobody should ever mistake a
secondary action for the main one.

**Chosen direction: B · Adire.** It is built on deep indigo, after adire, the resist-dyed cloth
Abeokuta's women dyers are known for. The logo's ring repeats like a dye stamp, and emerald means
"still available".

### Goals
- A visual system specific enough that any screen built from it looks like Clarix and nothing else.
- Every screen answers, in this order: *what needs me now, what is the state of things, what can I do next.*
- One primary action per view, impossible to miss. Everything else is visibly secondary.
- Behaves like an installed app on a phone and on a desktop, not like a website.
- Works for salaried and non-salaried members in the same cooperative.

### Non-goals
- Dark mode. **Clarix is light-only** (owner's decision, 2026-11-21). Indigo appears as a brand
  surface inside the light theme (hero bands, the member's limit card, the mobile tab bar,
  statements); it is not a dark theme.
- Moving money. Clarix records payments that happen at the bank; it never holds or sends funds.
- Native iOS/Android apps. The PWA is the mobile strategy (D014 stands).

### Anti-goals (the work fails if any of these is true, even if everything works)
- A screen could pass for any other SaaS dashboard with the logo swapped.
- Rows of identical stat cards with an icon in a tinted circle.
- A photograph that shows something Clarix does not do, or a person in a situation that has
  nothing to do with cooperative money.
- An invented testimonial, statistic, partner logo or "trusted by" claim.
- A primary action that looks the same as the actions around it.
- Motion that makes a cheap Android phone on 3G stutter or burn data.

---

## 2. Colour (light theme only)

Colour carries meaning first and brand second. The same four meanings appear in the same colours
everywhere: committed money, money still available, something waiting, something over the limit.

| Token | Hex | Role |
|---|---|---|
| `indigo-night` | `#0B1033` | Brand surfaces: landing hero, the member's limit card, mobile tab bar, footer, statement header band |
| `indigo-900` | `#121A4D` | Secondary brand band (pricing, CTA band) |
| `indigo-600` | `#2F3DA6` | Brand on light grounds; **committed** money in meters; links; focus rings |
| `indigo-100` | `#EEF0FB` | Secondary-button fill, selected rows, soft chips |
| `emerald-500` | `#2BD19A` | **Primary action fill**; **still available** in meters; success on dark grounds |
| `emerald-700` | `#0E7A56` | Success and "fits" text on light grounds (4.5:1 on white) |
| `emerald-50` | `#DDF5EA` | Confirmed chips |
| `ochre-500` | `#E3A23B` | **Reserved / this request** in meters |
| `ochre-50` | `#FBEFD5` / text `#7A5410` | **Waiting**: receipt awaiting confirmation, pending application |
| `red-600` | `#B0322C` | **Over the limit**, destructive actions, errors |
| `red-50` | `#FBE4E2` | Error and over-limit backgrounds |
| `ink` | `#0E1230` | Body text, headings |
| `ink-2` | `#4A5078` | Secondary text |
| `muted` | `#5E6488` | Captions, labels (meets 4.5:1 on white and on porcelain) |
| `line` | `#E3E6F2` | Hairlines, card outlines |
| `porcelain` | `#F5F6FB` | App and page ground |
| `white` | `#FFFFFF` | Surfaces |

Rules:
- Emerald is the primary-action colour **and** the "available" colour on purpose. The thing you
  can do and the room you have share one colour.
- Never put emerald text on white; use `emerald-700`.
- No gradients as decoration. The only gradients allowed are the photo scrim (black to transparent,
  for legible text over images) and the ring-pattern fade mask.

## 3. Typography

Two families, both on Google Fonts, both with good naira-sign and tabular-figure support:

- **Mona Sans, wide cut** (`font-stretch: 118%`), weights 700–800, for display: hero headlines,
  section titles and big money figures.
- **Figtree**, weights 400/500/600/700, for everything else: UI, body, tables, labels, buttons.
- Tables, statements and any column of amounts use Figtree with `font-variant-numeric: tabular-nums`.

| Style | Desktop | Mobile | Family / weight | Use |
|---|---|---|---|---|
| Display | 84 / 0.96 / −0.045em | 44 / 1.0 | Mona Sans Wide 800 | Landing hero only |
| H1 | 54 / 1.0 / −0.04em | 34 / 1.05 | Mona Sans Wide 800 | Landing section titles, auth headlines |
| H2 | 32 / 1.1 / −0.03em | 26 / 1.1 | Mona Sans Wide 750 | Screen titles inside the app |
| Figure-XL | 46–64 | 40–46 | Mona Sans Wide 800, tabular | The one headline figure on a screen |
| H3 | 20 / 1.25 | 18 / 1.3 | Figtree 600 | Card titles, list section titles |
| Body-L | 18 / 1.55 | 17 / 1.5 | Figtree 400 | Landing paragraphs |
| Body | 15 / 1.5 | 15 / 1.45 | Figtree 400 | App text |
| Label | 13 / 1.3 | 13 / 1.3 | Figtree 600 | Field labels, section labels (sentence case, never all caps in the app) |
| Caption | 12.5 / 1.4 | 12.5 / 1.4 | Figtree 400–500 | Meta lines, timestamps |

Never below 12px. Uppercase only for the tiny tracked labels on documents (statements, exports),
never in the app.

## 4. Shape, spacing, elevation

- **Buttons and chips are pills** (`border-radius: 999px`), as the owner asked (at least 45px).
- Radius scale: pill `999` · sheet and modal `28` · feature card `24` · card `20` · list row group
  `16` · input `14` · small tag `10`.
- Spacing on a 4-point scale: 4, 8, 12, 16, 20, 24, 32, 40, 56, 72, 96, 120. Screen gutters: 20 on
  mobile, 32 on tablet, 40 on desktop. Content max width 1280.
- Elevation, three levels only:
  - `flat`: a hairline (`0 0 0 1px line`) for cards on porcelain.
  - `raised`: `0 1px 2px rgba(14,18,48,.06), 0 12px 32px -16px rgba(14,18,48,.22)` for floating
    cards, popovers and the sticky mobile action.
  - `primary-float`: `0 10px 24px -10px rgba(43,209,154,.55)`, only under the primary emerald
    button, so it reads as lifted off the page. No other button gets a shadow.

## 5. Buttons: the hierarchy that must never blur

| Level | Look | Height | When |
|---|---|---|---|
| **Primary** | Emerald fill, ink-dark text `#05281C`, pill, `primary-float` shadow | 52 mobile / 48 desktop | **One per view.** The thing the screen exists for: Record a repayment, Approve, Confirm receipt, Start free trial |
| Secondary | `indigo-100` fill, ink text, pill, no shadow | 48 / 44 | The sensible alternative: Ask a question, Send back, Download statement |
| Tertiary | Text only, `indigo-600`, underline on hover | 44 | See all, Edit, Cancel |
| Destructive | Red text on `red-50`; the action itself uses the timed-undo pattern (§8) | 48 / 44 | Remove member, reverse an entry |
| Icon button | 44×44 circle, white with hairline | 44 | Notifications, overflow menus |

On a dark indigo band the primary stays emerald and the secondary becomes a white hairline pill.
On mobile, a screen's primary action sits in a **sticky bottom bar** above the tab bar when the
screen scrolls, so it is always one thumb away.

## 6. Cards and surfaces

There are five kinds of surface, each with a job. A new screen may not invent a sixth.

1. **Figure card** (indigo-night ground, ring pattern faded in one corner): exactly one per screen,
   holding the single number that matters most there. Member: *what you can still take on*.
   Admin: *money waiting for your decision*. Super admin: *cooperatives on trial ending this
   week*. It always pairs the figure with the meter when the figure is measured against a limit
   (the signature motif, unchanged).
2. **Task card** (white, `raised`): something a person must act on, with its primary action
   inside the card. Receipt to confirm, loan to decide, invitation to accept.
3. **List group** (white, `flat`, rows separated by hairlines): records, such as members,
   transactions and products. Each row has one tap target and a clear status chip on the right.
4. **Status chip** (pill, tinted): Awaiting confirmation (ochre), Confirmed (emerald), Over limit
   (red), Draft (indigo-100). Status is never shown by colour alone; the word is always there.
5. **Photo card** (landing and empty states only): a real photograph with a bottom scrim and one
   line of copy.

Explicitly banned: four identical KPI tiles in a row; icons in tinted circles as decoration;
cards inside cards inside cards; left-border accent stripes.

## 7. Motion

Motion explains what changed and where things went. It is never decoration for its own sake.

- **One standard spring for all UI:** `{ type: 'spring', stiffness: 260, damping: 24, mass: 0.9 }`.
  Every Watermelon component is retuned to it. The rolling-number digits keep their heavier spring.
- **Page transitions behave like a native app.** On mobile, going deeper slides in from the right
  and back slides out (shared x-shift of 24px plus fade, 240ms). Switching tabs cross-fades. On
  desktop, content cross-fades in place while the sidebar stays still.
- **Sheets, not dialogs, on mobile.** Bottom sheets rise with the spring, can be dragged down to
  close, and the page behind scales to 96% (iOS style). Desktop uses centred dialogs.
- **Morphing actions:** a button that becomes the next step (Invite → email field, Run import →
  progress → Done) instead of opening something new. See §8.
- **Landing scroll:**
  - The hero's product composition sits on a 3D plane: `perspective: 1400px`, `rotateX` going
    from 14° to 0° as it scrolls into view, with a slight scale from 0.94 to 1, tied to scroll
    position.
  - Section content rises 24px and fades in once, the first time it enters the viewport. It is
    never hidden in the initial frame.
- **Hero background:**
  - A photo carousel of four art-directed images (§9). Each holds for 6s with a slow
    1.00→1.06 zoom, then cross-fades over 1.2s.
  - An indigo scrim keeps the headline readable. The first image is server-rendered and
    preloaded; the rest load after first paint.
  - A faint looping background video (muted, 8–12s, under 2 MB, AVIF poster) is allowed on
    desktop only, when `prefers-reduced-data` is not set and the connection is not `2g`/`3g`.
    Phones always get the carousel. This keeps the landing page fast on Nigerian mobile data.
- **Reduced motion:** every spring becomes a 120ms fade, the carousel stops on its first image,
  and scroll-linked 3D is disabled.

## 8. Components (Watermelon sources, adapted)

Watermelon components are adopted for their behaviour, then made Clarix's own: our tokens, our
spring, our copy. **Every icon is swapped to `lucide-react`** (CLAUDE.md rule 4 stands, so the
`react-icons` and `@hugeicons` imports in these sources are replaced). `@number-flow/react` is not
added; the existing `RollingNumber` is the product's only animated number. New dependencies allowed:
`qrcode.react` and `react-use-measure`.

| Watermelon block | Where it lives in Clarix | Changes |
|---|---|---|
| `morphing-button` | "Invite an officer" (button opens into an email field and sends in place); landing "Get trial reminders" | Lucide `Mail`; emerald when expanded |
| `run-action-button` | Roster import ("Reading file → Matching columns → Checking 248 rows → Done"); generating month-end statements; bulk-confirming receipts | Steps become real progress events, not a timer |
| `split-button` | Staff "New" button, which splits into **Member · Contribution · Loan · Payment** | Pill, one level only |
| `time-undo-action` | Remove member, reverse a ledger entry, cancel a loan application (10-second undo) | Red tokens; the record is only written when the countdown ends |
| `stepper` | Loan length in months on the application screen; number of instalments | Rolling digits reuse `RollingNumber` |
| `range-selection-slider` | Single-value version: loan amount, live against the limit meter. Two-handle version: report date and amount filters | Track colours follow the meter meanings |
| `progressive-input-stack` | Adding a member by hand (name → phone → email → repayment method); member onboarding questions | |
| `pricing-widget` / `changeable-pricing-section` | Billing screen (monthly vs yearly) and the public pricing page. Clarix has one plan, so the "plans" are **billing cycles plus a member-count estimator**, not invented tiers | Naira, ₦150 per active member, ₦5,000 minimum |
| `minimal-carousel` | Member home: "Your cooperatives" cards, tap to expand into that cooperative's balance and actions | Indigo/emerald/ochre cards, not arbitrary colours |
| `show-qr` | Cooperative join QR and link ("Scan to join Ikeja Traders Thrift") | Lucide `QrCode`, `Link` |
| `reveal-copy` | Member number, cooperative bank account details for repayments (shown masked, revealed and copied in one tap) | Replaces today's Reveal & Copy primitive |
| `command-search` | Staff app global search: members, loans, receipts, pages (`/` or ⌘K on desktop, a search tab on mobile) | |
| `continuous-tabs` | **Mobile bottom navigation** (floating indigo pill, active tab widens with its label) and segmented controls (e.g. Monthly / Yearly) | Indigo ground, emerald active pill |
| `layered-progressive-disclosure` | Loan product settings (basic → interest and fees → savings rules → advanced) | |
| `slot-picker` | Deferred: meeting and contribution schedule (P2) | |
| `hero-31` / `hero-32` | Landing hero structure and the staggered word-by-word entrance | Our carousel as the background (§7) |
| `navigation-5` | Marketing navigation pill and mobile sheet | Mega-menu cut down to one "Product" panel |
| `faq-2` | Landing and Help FAQ, by category (Members, Cooperatives, Money and security, Billing) | |
| `testimonials-1` | **Not used until there are real quotes** from real cooperatives, with their permission | |

## 9. Imagery

Photographs must show what Clarix actually does: people managing cooperative money, at the moment
it happens. Every image answers "what part of the product is this?"

Shot list (initially from licensed stock, replaced by a commissioned shoot of real members):
1. **The repayment:** a trader at her stall looking at a phone showing a successful bank transfer.
2. **The confirmation:** a treasurer at a desk with a laptop and a phone, checking a bank alert
   against a receipt.
3. **The meeting:** a cooperative's monthly meeting, a ledger book or phone on the table, members
   talking.
4. **The approval:** an executive approving a request on a phone, with a calm, decisive expression.
5. **The statement:** a member reading a printed or on-screen statement at home.

Rules: Nigerian people in Nigerian settings; hands and phones in frame where possible; no stock
handshakes, no laptops on beaches, no people laughing at salads. Every photo gets a credit line in
the page source. Screens shown on devices in photos are our real UI, composited in.

## 10. Behaving like an app (PWA)

- `display: standalone`, theme colour `#0B1033`, an indigo splash with the ring drawing itself once.
- **Mobile:** a floating bottom tab bar (continuous-tabs), safe-area insets respected, sticky
  primary action, bottom sheets, pull to refresh on lists, swipe back.
- **Desktop:** a persistent left sidebar (collapsible to icons), top bar with command search and
  notifications, keyboard shortcuts (`/` search, `n` new, `g h` home).
- Skeleton screens shaped like the real content, never a spinner on a blank page.
- Offline: the last-viewed screens are readable with a "You're offline, showing 9:40 figures" strip.
  Money figures are never served stale without that label.
- Install prompt: shown after the second visit or the first completed action, never on the landing page.

## 11. Screen inventory

Each screen lists its **one primary action**, then what it contains, in order of importance.

### 11.1 Marketing site (public)
- **Home.** Primary: *Start 60-day free trial.*
  1. Nav pill.
  2. Hero: headline, subline, two CTAs, then the carousel background with the 3D product
     composition (staff queue plus the member's phone).
  3. "Made for every kind of cooperative" band.
  4. A repayment from transfer to statement (three numbered steps).
  5. The cross-cooperative check explained with a live meter.
  6. Members' view.
  7. Exports and statements (a watermarked statement preview).
  8. Pricing with a member-count estimator.
  9. FAQ.
  10. Final CTA band, then the footer.
- **Pricing.** Primary: *Start free trial.* The estimator ("How many members save or repay each
  month?" → bill), what counts as active, the trial and grace period explained plainly, and FAQ.
- **For members.** Primary: *Find your cooperative.* What a member sees, how to join, that it is free.
- **Help centre / FAQ, Privacy, Terms, Contact.**

### 11.2 Getting in
- **Welcome (installed app first launch).** Three swipeable slides, each a real screen fragment,
  not an illustration. Then *Create an account* (primary) or *Sign in*.
- **Sign up.** Primary: *Continue.* The first question is the fork: **"I run or help run a
  cooperative"** or **"I'm a member"**. Then name, email, phone, password. A progressive input
  stack on mobile, one column on desktop.
- **Verify email.** Primary: *Open email app* (mobile) or *Resend*.
- **Sign in.** Primary: *Sign in.* Email or phone, password, "Forgot password".
  Desktop is a split screen: the form on the left, and a rotating photo from the shot list on
  the right with one line about what Clarix does.
- **Reset password.** Two short steps.

### 11.3 Cooperative onboarding (the person who runs it)
Primary throughout: *Continue.* A progress pill at the top. Every step except the first can be
skipped and finished later from a setup checklist on the home screen.
1. **Your cooperative:** name, type (staff / market / thrift / farmers / faith / estate / other),
   state, rough member count.
2. **How members repay:** by salary deduction, by paying in, or both. If salary deduction: the
   employer's name and the deduction cap (default 33.3% of gross).
3. **Your account details:** the bank account members pay into, shown to members with Reveal &
   Copy.
4. **Loan products:** start from a template ("Emergency loan, 3 months", "Asset loan, 12 months")
   or create one.
5. **Bring your members:** import from Excel or CSV (run-action progress), invite by link or QR,
   or start empty.
6. **Invite your team:** officers by email (morphing button).
7. **You're set:** the trial end date, stated once, calmly.

### 11.4 Member onboarding
1. **Find your cooperative:** search, open an invitation link, or scan a QR.
2. **Your details:** confirm the name and phone (pre-filled if the cooperative imported you).
3. **Your income** (needed for the limit):
   - Salaried: upload a payslip.
   - Not salaried: upload 3–6 months of bank statements.
   - A self-declared figure is allowed but marked "unverified" until a cooperative officer
     confirms it.
   - A clear sentence says who can see the document: only the officer reviewing a loan you apply for.
4. **How you repay:** salary deduction or paying in (the cooperative's default is pre-selected).
5. **Done:** "Your application is with Ikeja Traders Thrift". You can explore while you wait.

### 11.5 Member app
- **Home.** Primary: *Record a repayment.*
  1. The figure card (what you can still take on, with the meter, and the source of your limit).
  2. "Needs you" task cards (a repayment due in 3 days, a receipt sent back).
  3. Your cooperatives carousel.
  4. Recent activity with status chips.
- **Cooperatives → one cooperative.** Primary: *Record a repayment* (to this one). Savings
  balance, loan left, next due date, the account to pay into (Reveal & Copy), transactions and
  statement download.
- **Record a repayment (sheet).** Primary: *Send for confirmation.* Cooperative, which loan or
  savings, amount, date paid, receipt photo or PDF (camera or files), optional note. Afterwards
  it shows "Waiting for Ikeja Traders Thrift" with the expected time.
- **Loans.** Primary: *Apply for a loan.* Active loans with progress, applications with status.
- **Apply for a loan.** Primary: *Submit application.*
  1. The product.
  2. The amount (slider), live against the limit meter.
  3. The length (stepper).
  4. The monthly repayment.
  5. The reasons it fits, or plainly why it doesn't, with the largest amount that would.
- **Statements.** Primary: *Download statement.* A date range, the cooperative, PDF or Excel,
  watermarked.
- **Notifications, Profile** (income documents, repayment method, security), **Help.**

### 11.6 Cooperative officer (treasurer, secretary)
- **Home ("Today").** Primary: *Confirm next receipt.*
  1. The figure card: receipts and requests waiting, and the oldest one's age.
  2. The receipt queue (task cards: receipt image, amount, member, matching bank-alert fields;
     Confirm / Send back).
  3. Loan requests assigned to them.
  4. This month's collections against what is expected.
- **Receipts.** Primary: *Confirm.* Queue view and history, plus bulk confirm from a bank
  statement export (run-action).
- **Members.** Primary: *Add member* (split button). A searchable list showing status, repayment
  method and balance. Opens the member record.
- **Member record.** Primary depends on state (Approve membership / Record a payment). Profile,
  income evidence status, savings, loans, all transactions, statement download, the
  activity log.
- **Contributions.** Primary: *Record contributions.* One-by-one or bulk from a file.
- Notifications, Profile, Help.

### 11.7 Cooperative admin (chairman, president, exco)
Everything an officer has, plus:
- **Home.** Primary: *Review loan requests.*
  1. Figure card: money waiting for a decision.
  2. Decisions queue.
  3. A health strip: members active this month, savings held, loans out, repayments on time %.
  4. The setup checklist (until complete).
  5. Trial/billing line (only in the last 14 days of the trial).
- **Loan decision.** Primary: *Approve*; secondary: *Ask a question*; destructive: *Decline*
  (with reason).
  1. The member's full position across cooperatives (the meter).
  2. This cooperative's history with them.
  3. Income evidence (opens only during this review, D031).
  4. The product rules check.
- **Manage:** Loan products (layered disclosure), Public profile, Team and permissions, Import,
  Reconciliation, **Reports and exports** (savings register, loan book, arrears, monthly
  collections, AGM pack; PDF or Excel, watermarked), **Billing** (plan, invoices, estimator), Audit log.

### 11.8 Super admin (Clarix operations)
- **Home.** Primary: *Review access requests* (when any are waiting), otherwise none.
  1. Figure card: trials ending this week.
  2. Queue: access requests, cooperatives awaiting verification.
  3. Platform health: active cooperatives, active members, paid vs trial vs read-only.
- **Cooperatives** (directory with lifecycle state: trial / grace / read-only / paid), **Billing
  overview**, **Policy** (platform limits), **Access requests**, **Platform admins**, **Audit log**.

## 12. Dashboards: the rules that fix "looks AI-generated"

1. **Lead with the queue, not the totals.** The first thing on every staff home screen is what is
   waiting for this person, with its age. Totals come after.
2. **One figure card, one meaning.** The biggest thing on the screen is the one number this role
   cares about, with context ("₦1.2m waiting, oldest 2 days").
3. **Numbers always carry a comparison or a limit.** Never a bare total: "₦910,000 savings held,
   up ₦64,000 this month".
4. **Group by job, not by data type.** "Confirm receipts" is a section; "Receipts: 5" is not.
5. **Status in words plus colour.** Every chip carries its word.
6. **Empty states teach the next step.** "No receipts waiting. Members' repayments will appear
   here the moment they're sent. [Share your account details]".
7. **Desktop layout:** a 12-column grid, the queue in 8 columns and context in 4. **Mobile:** a
   single column, the queue first, the sticky primary action at the bottom.

## 13. Accessibility

Contrast 4.5:1 for text (every token pair above was chosen to pass), 44px minimum targets, real
buttons and links, visible focus (2px indigo-600 ring with offset), labels on every field, status
never conveyed by colour alone, and full keyboard operation on desktop.

## 14. Decisions this design asks for (to be written into `docs/DECISIONS.md` on approval)

- **D032:** Clarix is a cooperative management platform for any cooperative, replacing D002
  (coordination layer only) and D019 (single organisation).
- **D033:** Light theme only; dark-mode tokens are removed.
- **D034:** Type is Mona Sans Wide plus Figtree, replacing Inter.
- **D035:** Buttons and chips are pills; the radius scale in §4 replaces the 14/16/20 rule.
- **D036:** Watermelon components are adopted with lucide icons only; `qrcode.react` and
  `react-use-measure` are allowed dependencies.
- **D037:** Pricing is ₦150 per active member per month, ₦5,000 minimum, yearly billing with
  two months free, a 60-day trial, a 14-day grace period, then read-only (never a full lockout;
  viewing and export always work).
- **D038:** Members' income evidence may be a payslip, bank statements, or a self-declared figure
  marked unverified until an officer confirms it.

## 15. Left to the builder

Exact copy for empty states and errors, written in the voice above. Illustrations are not used.
The exact carousel images within the shot list. The split between server and client components.
Analytics events.

## 16. Open questions for the owner

1. The marketing site's dark indigo hero stays in a light-only product as a brand surface. Confirm
   that this matches what "light theme only" means to you.
2. Stock photos first, then a real shoot with FMC and one market cooperative's members. Is a shoot
   possible, and roughly when?
