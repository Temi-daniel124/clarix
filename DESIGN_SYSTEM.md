# DESIGN_SYSTEM.md, Clarix (Release 2: "Calm Ledger")

**This is a build contract, not a style suggestion.** The owner's bar, in their words: Clarix must
feel like "a $5,000 to $10,000 project", never "AI slop", on every screen: public site, member app,
staff console and platform console alike. Every UI task is pixel-level work: exact tokens, exact
spacing, exact motion, one icon set. "Functionally correct but visually approximate" is an
unfinished task.

**Authority level: 14 of 14** (order in `AGENT.md`). `docs/DECISIONS.md` D013, D017, D037 to D039 and
D044 to D046 are the decisions behind this file. The 13 documents above it win on what they govern
(scope, data, roles, security); on how anything looks, moves or reads on screen, this file is the
exact rule, and it wins over every blueprint, `docs/BRAND.md`, `docs/REFERENCE-STUDY.md` and the
historical `docs/planning/clarix-design-system.md`.

Read with it, every time you touch UI:

| You are building | Also open |
|---|---|
| Any member screen | `docs/planning/clarix-employee-ux-blueprint.md` (now "member"; read its R2 header first) |
| Cooperative admin screens | `docs/planning/clarix-cooperative-admin-ux-blueprint.md` |
| Officer screens | `docs/planning/clarix-cooperative-officer-ux-blueprint.md` |
| Platform (Super Admin) screens | `docs/planning/clarix-super-admin-ux-blueprint.md` |
| Landing, sign in, sign up, onboarding, privacy | `docs/planning/clarix-public-site-blueprint.md` |
| Import, export, statements, income evidence | `docs/planning/clarix-documents-blueprint.md` |
| Trial, subscription, invoices | `docs/planning/clarix-billing-blueprint.md` |
| Logo, favicon, app icons, OG image | `docs/BRAND.md` |
| A component from Watermelon or a reference site | `docs/REFERENCE-STUDY.md` |

---

## 0. Pixel-perfect, and simple (the owner's two standing instructions)

**Pixel-perfect.** Every pixel, dot and state is specified work, not finish. Concretely:

- **Exact values only.** Every colour, size, radius, shadow, gap and duration comes from §4. No
  "close enough", no `mt-[13px]`, no colour picked by eye. If a value you need is missing, add it to
  §4 in the same PR and say why; never invent it inline.
- **The 4px grid.** Every margin, padding and gap is a multiple of 4 (2px only for hairline offsets
  and the 2px focus ring gap). Text sits on its line height; icons sit on the text's optical centre.
- **Alignment is checked, not assumed.** Left edges of a column line up to the pixel; numbers in a
  column use tabular figures and align right; an icon beside a label is vertically centred to the
  label, not the box.
- **Every state is designed.** Default, hover (desktop), pressed, focus-visible, disabled, loading,
  empty, error and success, for every interactive element. A state that was never looked at is a bug.
- **The small things count.** Truncation with an ellipsis instead of wrapping where a line must stay
  one line; no orphaned single word on a heading; no double spaces; ₦ always with thousands
  separators; consistent sentence case; no stray 1px borders from a library default; no layout shift
  when data arrives (skeletons reserve the final size).
- **Proved with screenshots.** At 360, 390, 1280 and 1440px, with reduced motion on, compared side by
  side with the blueprint before ACCEPT (§11, §12).

**Simple, like Apple's own components.** Take the restraint of Apple's Human Interface Guidelines as
the model, not their look: few elements, standard controls, generous space, one obvious action.

- Prefer the plain, familiar control: a grouped list row with a chevron, a sheet that rises from the
  bottom, a segmented control, a switch, a single text field per line. No custom widget where a
  standard one does the job.
- One idea per screen, one primary action per screen or sheet. If a screen needs explaining, it is
  too complicated; remove something before adding help text.
- Hierarchy comes from size, weight and space, not from boxes, colours or icons. Most text is
  `ink-900` or `ink-500`; colour is reserved for meaning (emerald good, amber attention, red stop).
- Motion explains where something came from or went. It never decorates. Nothing bounces for fun.
- When two designs both work, ship the one with fewer parts.

## 1. Emotional target and the one filter

Premium, calm, trustworthy, quietly confident. *My money across every cooperative is organised,
understandable and under control.* The app behaves like a well-kept passbook: quiet paper, exact
figures, nothing shouting.

**The filter for every decision:** does this help a person understand a number correctly and act
on it, or is it decoration? Clarix's promise is "we tell you the truth about what you can afford".
The design performs that promise.

It must behave like a **native app on a phone** (bottom tab bar, sheets, thumb-reach actions, no
hover-only affordances, no tiny links) and like a **native desktop app on a laptop** (sidebar,
keyboard shortcuts, side panels, dense tables where density helps). Same tokens, same components,
two layouts. Never a stretched phone layout on desktop or a squeezed desktop table on a phone.

## 2. Seven rules every screen follows

1. **One hero per screen.** Exactly one thing is biggest: a figure, a decision, or one action.
2. **Three levels of type, not five.** Figure, title, body. `Small` only for metadata. **No uppercase
   eyebrow labels anywhere** (no "ACROSS EVERY COOPERATIVE", "THIS MONTH", "INSIGHTS").
3. **Summary first, detail on request.** Home shows the state of things; tapping anything opens a
   bottom sheet (phone) or a right panel (desktop). People never lose their place (D039).
4. **Say it in one line.** Every empty state, error and helper fits one line plus one action.
   Explanations of how the system works live in Help, not on working screens.
5. **Borders, not boxes.** Group with spacing and hairlines. A card exists only when it can be
   tapped or holds one complete thing. Never card-inside-panel-inside-page.
6. **One motion language.** The same spring everywhere. Numbers roll, sheets rise, lists settle.
7. **Thumb-first.** Primary actions sit in the bottom third on phones, 52px tall, finishable
   one-handed. One primary action per screen or sheet (D045).

## 3. The signature motif (unchanged, refined)

**The used-vs-available meter, with rolling digits, appears everywhere a number is shown against a
limit, and nowhere is there a second way of drawing that relationship.**

- `RollingNumber` (`src/components/clarix/rolling-number.tsx`) for every money figure that can change:
  available to borrow, savings, loan balance, monthly repayments. Rolls on first view and on change,
  never on every revisit of the same value.
- `MeterBar` / `CapacityMeter`: a 8px (phone) / 10px (desktop) horizontal track, radius full.
  `committed` in `ink-300`, `available` in `emerald-500`. When a request would exceed the limit, the
  overflow segment is `red-500` and the figure turns red; when within 10% of the limit, the available
  segment is `amber-500`. A request being previewed that still fits draws in `ink-500` (it is about
  to join what is committed, so it sits in the same grey family, a step darker); only the part past
  the limit is red. All of this lives in `MeterBar` (`src/components/clarix/meter-bar.tsx`) and
  nowhere else (walkthrough 1.4d). Progress bars that are not a limit (repayment progress, setup
  steps, password strength) use its `neutral` track and keep the brand ink fill.
- Ring variant (the brand submark) only for the splash/loading state and the logo.
- **The naira sign** is set one step smaller and in `ink-500` beside the figure: `₦` 0.6em, weight 500.
  Kobo are never shown on screens (rounded to the naira); they are shown on PDFs and exports.
- A figure whose basis is unverified (declared income, D035) carries a small `Declared` chip beside it,
  never a different visual.

## 4. Tokens: use these exactly

Light theme only (D037). Tokens live in `src/app/globals.css` as `--clarix-*` custom properties mapped
into Tailwind 4's `@theme`. Delete every `dark:` variant, the dark token block, `ThemeScript` and
`ThemeToggle` in the Phase 1 foundation PR.

### 4.1 Colour

Two brand hues (navy and emerald) with tonal ramps, plus status hues. Indigo is **only** the focus
ring and inline link colour.

| Token | Value | Use |
|---|---|---|
| `canvas` | `#F7F7F4` | Page background (warm paper, not cool grey) |
| `surface` | `#FFFFFF` | Cards, sheets, inputs, table body |
| `surface-sunken` | `#F1F1EC` | Secondary button fill, segmented control track, skeletons |
| `hairline` | `#E8E8E3` | Every border and divider (1px) |
| `hairline-strong` | `#D9D9D2` | Input border at rest, table header rule |
| `ink-900` | `#0E1116` | Primary text, figures |
| `ink-500` | `#5C6370` | Secondary text, labels |
| `ink-400` | `#7D838D` | Placeholder text (meets 4.5:1 on `surface` at 15px+ only with weight 500; otherwise use `ink-500`) |
| `ink-300` | `#B9BDC3` | Committed segment of the meter, disabled icons |
| `navy-900` | `#0B1220` | Brand surface: landing hero band, auth side panel, PDF header, tab bar |
| `navy-800` | `#141C2E` | Hover/pressed on navy, tab bar active pill |
| `on-navy` | `#FFFFFF` / `rgba(255,255,255,0.64)` | Text on navy (primary / secondary) |
| `hairline-on-navy` | `rgba(255,255,255,0.12)` | Every border and divider on a navy ground (tab bar, auth panel). Added in BUILD-PLAN 1.1: `hairline` is invisible on navy, and nothing else covered it |
| `emerald-50` | `#ECF8F3` | Positive tint background, selected row |
| `emerald-100` | `#D3F0E4` | Chip background, meter track tint on navy |
| `emerald-500` | `#0F9F74` | Primary button, available segment, positive figures |
| `emerald-600` | `#0B8A64` | Primary hover |
| `emerald-700` | `#08704F` | Primary pressed, emerald text on white (AA at 13px) |
| `amber-50` / `amber-500` / `amber-700` | `#FDF5E6` / `#D98A04` / `#9A5F00` | Tight, waiting, trial ending |
| `red-50` / `red-500` / `red-700` | `#FCEDED` / `#D64545` / `#A82E2E` | Over limit, destructive, errors |
| `indigo-500` | `#4F46E5` | Focus ring (2px, 2px offset) and inline text links only |

No other hue enters the product. No gradients on text, buttons or cards. The only gradient allowed is
the photo scrim on the public hero (`linear-gradient(180deg, rgba(11,18,32,0.10) 0%, rgba(11,18,32,0.72) 100%)`).

### 4.2 Typography

**Figtree** bundled in the repository and loaded with `next/font/local` (D050), weights 400/500/600/700, `display: swap`, variable
`--font-figtree` (D038). Every money figure: `font-variant-numeric: tabular-nums`. First foundation
task: verify Figtree's tabular figures render as equal-width digits in Chrome, Safari and Android
Chrome; if not, money figures alone use Inter at the same sizes.

| Role | Phone | Desktop | Weight / tracking / line-height | Use |
|---|---|---|---|---|
| `hero-figure` | 40px | 56px | 600, -0.03em, 1.05 | The one lead number on a screen |
| `display` | 36px | 60px | 600, -0.03em, 1.05 | Landing and auth headline only |
| `title` | 22px | 28px | 600, -0.02em, 1.2 | Page and sheet titles |
| `heading` | 17px | 18px | 600, -0.01em, 1.3 | Section titles, card titles, list row primary |
| `body` | 15px | 16px | 400, 0, 1.5 | Everything people read |
| `small` | 13px | 13px | 500, 0, 1.4 | Labels, dates, metadata, chips. Sentence case, never uppercase |
| `tab-label` | 12px | 12px | 500, 0, 16px | The phone tab bar's labels only (D051). Nowhere else |

Rules: 700 is used only for the wordmark and the landing `display` if Figtree 600 looks thin at 60px
on the owner's screen (decide in the landing PR, then write it here). At most three sizes visible in
one phone viewport. No italic, no outlined or gradient text, no letter-spaced capitals. Long-form
pages (privacy, terms, help) use `body` at 17px/1.65 in a 680px column.

### 4.3 Spacing and layout

4px grid: `4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 120`. Nothing in between.

| | Phone (<768px) | Tablet (768–1023px) | Desktop (≥1024px) |
|---|---|---|---|
| Screen gutter | 20px | 24px | 32px |
| Gap between sections | 32px | 40px | 48px |
| Gap inside a card | 16px | 20px | 20px |
| List row height | 64px (two-line) / 52px (one-line) | same | 56px / 48px |
| Max content width | full | full | 1120px (app), 1200px (public site), 680px (reading) |

Breakpoints: `sm 640`, `md 768`, `lg 1024`, `xl 1280`. Test every screen at **360×800** (cheap Android),
**390×844** (iPhone), **1280×800** and **1440×900**.

### 4.4 Radius (nested, so corners look concentric)

| Token | Value | Use |
|---|---|---|
| `radius-sm` | 10px | Inputs, chips, small icon buttons, table cell highlights |
| `radius-md` | 14px | Cards, list groups, toasts, dropdowns |
| `radius-lg` | 20px | Hero cards, dialogs, desktop side panel inner card, photo frames |
| `radius-xl` | 28px | Public-site section bands and the hero photo frame on desktop |
| `radius-sheet` | 24px top corners only | Bottom sheets |
| `radius-pill` | 9999px | **Every button** (D045), the tab bar, segmented controls, filter chips |

### 4.5 Elevation (three levels, and one named exception)

| Level | Value | Use |
|---|---|---|
| `flat` | 1px `hairline` border, no shadow | Default for cards and lists |
| `raised` | `0 12px 32px rgba(14,17,22,0.10)` + 1px `hairline` | Sheets, popovers, menus, the floating tab bar, the desktop side panel |
| `quick-action` | `0 8px 20px rgba(15,159,116,0.28)`, no grey shadow | The staff quick-action button on the phone tab bar only (D051). The one emerald shadow in the product |
| `pressed` | no shadow, `scale(0.98)` | Buttons and tappable cards while pressed |

Never stack a shadow on a card that already has a border unless it is `raised`. No coloured glows: the
`quick-action` shadow is the single exception, owner-chosen for one button (D051).

### 4.6 Motion (`src/lib/motion.ts` holds these; never declare another)

| Name | Value | Use |
|---|---|---|
| `springStandard` | stiffness 260, damping 22, mass 0.9 | Sheets, panel, tab pill, expand/collapse, button state |
| `springRollingDigit` | stiffness 140, damping 20, mass 1.4 | Rolling digits and meter fill only |
| `fadeQuick` | 160ms, ease `[0.22, 0.61, 0.36, 1]` | Hover, toasts, chips, page cross-fade |
| `pageTransition` | 220ms fade + 8px shift, same ease | Route changes |
| `scrollReveal` (public site only) | 480ms, ease `[0.16, 1, 0.3, 1]`, y 24px → 0, opacity 0 → 1, once | Sections entering the viewport |
| `heroCrossfade` (public site only) | 1200ms opacity, slide every 6s | Hero background carousel |

Animate `transform` and `opacity` only (D046). List stagger 20ms, capped at 6 rows.
`prefers-reduced-motion: reduce` turns every spring into an instant change, stops the hero carousel on
its first slide, pauses the background video and disables tilt and parallax.

## 5. Components (the house set)

Base UI primitives through shadcn, reskinned to these tokens. Never leave a shadcn or Watermelon
default (radius, colour, shadow, icon set) in place.

### 5.1 Buttons (D045)

| Variant | Fill / text | Height phone / desktop | Padding | Notes |
|---|---|---|---|---|
| `primary` | `emerald-500` / white, hover `emerald-600`, pressed `emerald-700` + scale 0.98 | 52 / 44px | 24px / 20px horizontal | One per screen or sheet. Full width on phones when it ends a flow |
| `secondary` | `surface-sunken` / `ink-900`, hover `#EAEAE4` | 52 / 44px | same | The "other" action |
| `tertiary` | transparent / `ink-900`, underline on hover only | 44 / 36px | 12px | Text actions inside lists and sheets |
| `destructive` | `red-500` / white | 52 / 44px | same | Always behind Timed Undo or a sheet confirmation |
| `on-navy` | white / `navy-900` | 52 / 48px | same | Primary action on navy bands |
| `icon` | transparent, 40×40 hit area (44×44 on phones) | | | lucide icon 20px, `ink-500` |

All buttons: `radius-pill`, `heading`-size label at weight 600 (15px phone, 15px desktop), icon 18px
with 8px gap. Loading state: a 16px spinner replaces the leading icon inside the button and the label
stays; never a full-page loader. A button with an arrow uses lucide `ArrowRight` inside a 32px
`emerald-700` circle on the right (the Finora/Logiten pattern, used **only** for the landing primary
CTA, nowhere in the app). Disabled: 40% opacity, no hover.

### 5.2 Inputs

52px tall on phones, 44px desktop, `radius-sm`, `surface` fill, 1px `hairline-strong`, focus ring
`indigo-500` 2px with 2px offset. Label above in `small` `ink-500`; helper or error one line below.
Money inputs: `₦` prefix inside the field, `inputmode="numeric"`, thousands separators as you type,
tabular figures. Phone inputs default to `+234`. Never placeholder-as-label.

### 5.3 Cards and list groups

- **Hero card**: `surface`, `radius-lg`, `flat`, 20px (phone) / 24px (desktop) padding. Holds the one
  lead figure, its meter, one line of context and at most one action. On navy only on the landing page.
- **Stat**: not a card. A row of up to three stats separated by hairlines inside one `radius-md`
  group: label (`small`, `ink-500`), value (`heading` 20px tabular), optional change line. Tapping opens
  its breakdown sheet. Never four stats; never an icon tile on each one.
- **List group**: iOS-style grouped list. Rows separated by hairlines inset 16px; leading 40px
  avatar or logo, `heading` primary line, `small` secondary line, trailing value or chevron.
- **Needs you** item: list row with a 8px status dot (amber or red), a one-line title, a one-line
  reason, and a trailing chevron. At most three on a home screen; "See all" opens the full list.

### 5.4 Bottom sheet and side panel (the core R2 pattern, D039)

One component, `Sheet` (`src/components/ui/sheet.tsx`), built on Base UI Dialog in its Drawer form, which
adds swipe-to-dismiss and snap points to the same dialog (fall back to `vaul` only if drag gestures feel
wrong on iOS Safari, see `docs/TOOLING-POLICY.md`).

- **Phone:** rises from the bottom with `springStandard`; `radius-sheet`; 36×4px grab handle in `ink-300`
  10px from the top; detents at 50% and 92% of viewport height; drag down or tap the 40% black backdrop
  to close; the Android/browser back button closes it (push a history entry on open); safe-area
  padding at the bottom; content scrolls inside; the primary action is pinned in a footer bar.
- **Desktop (≥1024px):** the same content opens as a 440px panel from the right, full height, `raised`,
  with a close button (lucide `X`) and `Esc` to close. The page underneath stays interactive only when
  the panel is a filter; otherwise it dims to 24%.
- Used for: stat breakdowns, a loan, a member, a "Needs you" item, quick actions, filters and sort,
  confirmations with money attached, the cooperative switcher, statement preview.

### 5.5 App shell

**Phone:**
- Top bar 56px: avatar (32px, initials on `emerald-100` with `emerald-700` text, never a grey letter
  tile) or cooperative logo; "Hi, Funmilayo" in `heading`; the cooperative switcher chip under it for
  staff (cooperative short name, chevron, opens the switcher sheet); bell on the right with an 8px
  unread dot. No theme toggle.
- **Floating pill tab bar**: `navy-900`, `radius-pill`, `raised`, 64px tall, 16px from the screen
  bottom plus safe area, max width 360px, centred. Equal slots, each an icon over its label (D051):
  four for members and the platform, five for cooperative staff, whose centre slot holds the raised
  quick action that opens the quick-action sheet. **Every scrollable screen reserves the bar's
  height in bottom padding**, 112px, or 120px where the quick action rises above the bar, so
  nothing is ever covered (the live app's member Insights strip and admin member list are covered
  today; see `docs/REFERENCE-STUDY.md`).
- Bottom sheets replace modals; full-screen flows (apply, import, onboarding) hide the tab bar and
  show a top bar with back and a thin progress line.

**Desktop:**
- 248px sidebar on `surface` (not navy) with a hairline right border: logo, the cooperative switcher
  (staff), a `Search` field that opens the command palette (`Ctrl/⌘ K`), grouped links (`small` group
  labels in sentence case, never uppercase), and the account menu pinned at the bottom. Collapsible to
  72px icons-only.
- Content area max 1120px, 32px gutters, page title row with the page's one primary action on the right.
- Tables where density helps (members, loans, audit log): 48px rows, sticky header, hairline rules,
  tabular numbers right-aligned, row click opens the side panel.

Built in BUILD-PLAN 1.4 as one `AppShell` for all four roles (`src/components/shell/`). Values the
lines above leave open:

| Part | Values |
|---|---|
| Breakpoint | Phone shell below 1024px (tablets included), sidebar from 1024px: the same line the Sheet switches at |
| Phone top bar | 56px, `canvas` fill, `hairline` bottom border, 20px left gutter (24px from 768px). Staff at more than one cooperative: the avatar, greeting and cooperative line together are one 48px button that opens the switcher sheet. Bell is the `icon` button; unread dot 8px `red-500` with a 2px `canvas` ring |
| Tab bar (D051) | 64px tall, 8px inner padding, border `hairline-on-navy`. Equal-width slots across the inner width (2 tabs, the centre action, 2 tabs for staff; 4 tabs otherwise), each tab filling its slot 48px tall, so every target is at least 44px. Icon 24px lucide, 1.75 stroke, `tab-label` below it, 2px gap, both centred in the slot. Active `on-navy` white, inactive `on-navy` 64%, the change on `fadeQuick`. At most three tabs plus More |
| Raised quick action (D051, refined 23 Nov 2026) | Staff only. A 56px `emerald-500` circle with a 4px `navy-900` border (the bar's own colour, inside the 56px), so circle and bar read as one shape; a white 24px lucide `Plus`, centred. Centred horizontally on the bar, it rises 20px above the bar's top edge and the other 36px overlap the bar. No ring. Its only shadow is `quick-action`; hover `emerald-600`, pressed `emerald-700` and `scale(0.96)` on `springStandard`. No label; `aria-label` "Quick actions". It opens the quick-action sheet. The empty centre slot under it keeps the four tabs evenly spaced |
| Bottom reserve | Plus the safe area. 112px for the bar alone: its 16px offset, its 64px height and a 32px gap. 120px where the quick action rises above it: 16px offset, 64px bar, the button's 20px rise and a 20px gap (at least 16px is required) |
| Quick actions | The "+" opens a sheet of 52px rows (20px `ink-500` icon, `body` label, chevron), only actions the role may take |
| Sidebar | Header 64px. Cooperative row 48px (32px initials mark on `emerald-100`, name and role in `small`). Search field 40px, `radius-sm`, `hairline-strong` border, `small` `ink-500` text and shortcut. Links 40px, `radius-sm`, 12px side padding, 20px icon, `body`; active `emerald-50` fill with `emerald-700` text and icon, hover `surface-sunken`. Group labels `small` `ink-500`, 24px above. Collapsed: 72px, icons centred, group labels become hairlines, the width changes at once (D046) |
| Account menu | Pinned 48px row (avatar, name, role). Menu 224px, `radius-md`, `raised`, 4px padding, 40px `small` items: Profile, Help, the view switch, Sign out. On phones these live on the More screen |
| Command palette | 560px wide, 96px from the top, `radius-lg`, `raised`, backdrop black 24%. 56px input row, 44px results grouped "Go to" and "Switch", `fadeQuick` in and out. Its input is the palette itself, so it draws no second focus ring of its own |
| Switching | The cooperative switcher remembers the choice in an httpOnly cookie that only chooses between the person's own active roles. "Switch to my member view" appears for staff with an active membership; members who also work at a cooperative get the way back |

### 5.6 Other house components

Segmented control (Continuous Tabs, pill track on `surface-sunken`, sliding white pill with
`springStandard`), filter chips, Timed Undo toast (bottom centre on phones above the tab bar, bottom
left on desktop), Stepper (onboarding and import progress as a thin 2px line on phones, labelled steps
on desktop), Reveal & Copy (member ID, verification codes, invite links), Command Search, Run Action
button (import confirm, bulk statement generation), Range Slider + Rolling Number (loan amount),
skeletons shaped like the real rows. Exact Watermelon mapping and the lucide swaps: `docs/REFERENCE-STUDY.md` §3.

Dimensions set in BUILD-PLAN 1.2 (`src/components/ui/`), where the sections above give none:

| Component | Values |
|---|---|
| Segmented control | Track `surface-sunken`, `radius-pill`, 4px padding, 4px between options. Option 44px tall on phones (the §10 touch target), 36px from 768px; 12px side padding on phones, 16px from 640px; `small` text, `ink-500` at rest, `ink-900` selected on a white pill. No shadow |
| Status chip (`Chip`) | 28px tall, 12px side padding, `radius-sm`, `small`, 16px icon with 8px gap. Tones: neutral `surface-sunken`/`ink-500`, positive `emerald-100`/`emerald-700`, attention `amber-50`/`amber-700`, stop `red-50`/`red-700` |
| Filter chip (`FilterChip`) | 36px tall, 16px side padding, `radius-pill`, `small`. Off: `surface` with a `hairline-strong` border, hover `surface-sunken`. On: `ink-900` fill, white text. Pressed `scale(0.98)` |
| Focus ring | One rule for every control: `:focus-visible` 2px solid `indigo-500`, 2px offset (`globals.css`). Components do not restyle it |

## 6. Icons

**`lucide-react` only** (D013), 1.75px stroke, 20px in lists and nav, 18px in buttons, 16px in chips.
Watermelon snippets that import `react-icons` must be converted (map in `docs/REFERENCE-STUDY.md` §3).
If an icon does not exist in lucide, say so and ask; never add another package.

## 7. Imagery (D046)

- **Public site:** hero background carousel (3 to 5 real photos of Nigerian cooperative life, cross-fade
  every 6s, with pause control and progress ticks, the Freight Africa pattern) or one faint, muted,
  looping background video under 2.5MB with a poster image. A navy scrim keeps text at 4.5:1. Photos
  sit in `radius-xl` frames on desktop with 16px inset from the viewport (the Logistra/RealDom framed
  hero), full-bleed on phones. Every image must match the words beside it. Credits in
  `public/images/CREDITS.md`. Images through `next/image`, AVIF/WebP, `sizes` set, hero `priority`.
- **In the app:** no stock photos. Cooperative logos or initials. The single exception is the member
  home **Highlights** strip (max 3 swipeable cards, Minimal Carousel) using the cooperative's own
  uploaded image or a brand pattern, shown only when there is something real.
- **Empty states:** a small line drawing made of the meter ring and lucide strokes, one line, one action.
- Never: abstract 3D shapes, glowing blobs, coins, suits shaking hands, people laughing at laptops,
  non-Nigerian settings, AI-generated people.

## 8. Writing (part of the design)

Short sentences, plain Nigerian English, `₦` with commas (`₦150,000`), dates as `14 Mar 2026`, times
in Africa/Lagos as `2:30 pm`. Word swaps (D034, D035): Employee → **Member**; Salary → **Income**;
Payslip → **Proof of income** (payslip or bank statement); one-third cap / deduction limit →
**Repayment limit**; Staff ID / IPPIS number → **Member ID** (the label each cooperative sets);
Available capacity → **Available to borrow** (member) / **Room left** (staff). Never "AI-powered",
"seamless", "revolutionary", "next-gen", "unlock", "empower". Say what Clarix does not do (never holds,
moves or deducts money) as plainly as what it does. No fabricated testimonials, logos or statistics.

## 9. Documents (D044)

PDFs use Figtree, A4, 20mm margins. Header: primary logo left, cooperative name and logo right, a
`navy-900` 4px rule. Title in `title` 22px, period and "Generated 22 Nov 2026, 2:30 pm" in `small`.
Body tables 11pt, tabular, every summary ends in a bold total row (RealDom pattern). Diagonal
watermark: the submark plus the cooperative name, `navy-900` at 6% opacity, rotated 30°, tiled.
Footer: page `n of N` and the verification code in a monospace-free Figtree 500. Spec:
`docs/planning/clarix-documents-blueprint.md`.

## 10. Accessibility (not optional)

Text contrast 4.5:1 (3:1 for 18px+ / 600). Touch targets 44×44 minimum. Focus ring visible on every
interactive element. Sheets trap focus and return it on close. Every rolling number has an
`aria-label` with the final value; the meter has `role="meter"` with `aria-valuenow/min/max`. Carousel
has pause/play and is not announced every slide. Forms announce errors with `aria-live="polite"`.

## 11. Anti-generic checklist: run every finished screen against this before ACCEPT

**Fail the screen if you see:**
- An uppercase tracked eyebrow label, anywhere.
- A greeting that names the full cooperative in a sentence or wraps to a second line on a 360px phone.
- More than one hero, more than three stats, or more than three "Needs you" items on a home screen.
- A paragraph explaining how Clarix works on a working screen.
- A card inside a tinted panel inside the page; an icon tile on every stat.
- A non-pill button, or two primary buttons in one view.
- Content hidden behind the floating tab bar at the bottom of any scroll.
- A `dark:` class, a theme toggle, or an Inter/Geist/system font on any text other than the D038 fallback.
- A gradient on text, a glow, a blob, a floating 3D shape, a stock photo inside the app.
- A second way of drawing "number against a limit".
- Any non-lucide icon.
- Stale or contradictory numbers on one screen (the live admin home says "Members 8" while Members
  lists 15; the member home says "Current as of 15 March" in November). Every figure has one source.
- A placeholder or demo string, a typo, or FMC/IPPIS/hospital wording in product copy (demo data is fine).
- Unstyled shadcn or Watermelon defaults.
- A value not on the 4px grid or not from §4; a misaligned edge; a state (hover, focus, disabled,
  loading, empty, error) that was never designed; layout shift as data loads.
- A custom control where a standard one (list row, sheet, switch, segmented control) would do.

**Pass requires:** the matching blueprint section built completely; tokens exact; checked at 360, 390,
1280 and 1440px; reduced-motion checked; keyboard path checked on desktop; the Preview deployment link
in the PR with phone and desktop screenshots.

## 12. Design review is part of ACCEPT

Per `docs/DEVELOPMENT-WORKFLOW.md`, no screen is accepted until it has been checked against (1) its
blueprint, (2) these tokens, (3) the checklist in §11, and (4) the owner has seen the Preview link.
If time pressure makes any of these feel skippable, that is exactly the situation this file exists to
override.
