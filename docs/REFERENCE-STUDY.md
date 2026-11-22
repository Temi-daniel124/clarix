# REFERENCE-STUDY.md, Clarix

What was observed on 22 November 2026, and what Clarix takes from it. Three parts: the live app
walked as every demo role (§1), the eight reference sites the owner chose (§2), and the Watermelon UI
components the owner supplied, with how each is used and how its icons convert to lucide (§3).
Observations are facts with the screen they came from; rules derived from them live in
`DESIGN_SYSTEM.md` and the blueprints.

Screenshots were taken at 1440×900 and 390×844 with Playwright and are not committed (they show demo
data). Re-take them the same way when needed (`docs/DEVELOPMENT-WORKFLOW.md` §5).

---

## 1. The live app (`clarix-3w5i.vercel.app`, R1, commit `d1c3a0a`)

### Public pages

| Page | What is there | Problems to fix |
|---|---|---|
| Landing | Dark navy hero, headline "One employee. Several cooperatives. One salary.", a centred eligibility card ("ELIGIBILITY CHECK", "AVAILABLE CAPACITY ₦29,250", Committed ₦54,000, Monthly cap ₦83,250), "Get started", "Free for FMC Abeokuta staff during the pilot"; three columns (What you see / What your cooperative sees / What stays private); a "FOR COOPERATIVES" text block; FAQ (including "Is Clarix connected to IPPIS?"); final CTA; footer "Built for the staff cooperatives of Federal Medical Centre, Abeokuta" | Salary-only and employer-bound headline (owner called it discriminatory); uppercase eyebrows; the card is the only visual; no imagery; theme toggle in the nav; text-heavy "For cooperatives" paragraph (the rolling digits are correctly `aria-hidden` with an `sr-only` value; keep that) |
| Sign in / Sign up | Navy left panel repeating the eligibility card, which shows **"0 cooperatives"** and a full ₦83,250 available (reads as broken), FMC copy, "Reading salary basis from the confirmed payslip"; right: form, underlined indigo links, emerald button with 12px radius | Not pills; the panel's empty card undercuts trust; FMC copy; the consent line says "salary figure and staff ID" |
| Privacy | Long-form notice, NDPA 2023 | Written for FMC staff and IPPIS numbers; must generalise (BUILD-PLAN 3.2) |

### Member (Adebayo)

- **Home:** "Good afternoon, Adebayo." with an "A" grey letter tile and "Federal Medical Centre,
  Abeokuta · 214508" under it; a tinted panel "ACROSS EVERY COOPERATIVE / Current as of 15 March at
  21:55" (it is November) holding four KPI tiles each with an icon tile (Total savings ₦594,000 with a
  sparkline, Active loans 3, Monthly deductions ₦60,975 "No history yet", Available capacity
  ₦100,863); an "INSIGHTS" horizontal strip; a "one more cooperative you have not joined" card. On a
  390px phone the floating tab bar **sits on top of the Insights strip**.
- **Cooperatives:** a list of four with savings; "Discover more cooperatives".
- **Loans:** meter card (Available ₦100,863, Committed ₦60,975, Monthly cap ₦161,838), "OPEN" and
  "SETTLED" eyebrows, loan cards ("₦345,000 left of ₦345,000, 0% repaid, next deduction expected 17
  October 2026", a date already past).
- **Apply:** "Which cooperative?" picker, then amount and tenure with the live meter. Works well; keep.
- **Profile:** "IPPIS number 214508" in the header; grouped sections; theme setting.

### Cooperative admin (Funmilayo)

- **Home:** the title "Good afternoon, Funmilayo, here is FMC Abeokuta Staff Multipurpose Cooperative
  Society today." wraps to two lines at 1440px and three on a phone; a tinted panel "THIS COOPERATIVE"
  with four tiles (**Members 8**, Savings held ₦910,000, Active loans 2, Waiting on you 0); "Attention
  required: omolara.shittu@… has not taken up their invitation, Invited 71 days ago"; "THIS MONTH"
  three paragraph cards all saying nothing happened. Dark navy sidebar with an Appearance toggle.
- **Members:** "15 members" (contradicts the 8 on home; the platform directory says 7). On a phone the
  tab bar covers a row mid-list. Desktop table is good: keep its density.
- **Loans:** "3 requests have been waiting past their hold … Move them out" above "Nothing is waiting on
  a decision": two statements that read as contradictory.
- **Reports:** three text cards, no export. **Import:** clean drop zone; keep the honesty line
  "Nothing is uploaded".

### Officer (Chidi)

- **Home:** "Good afternoon, Chidi, here's what's waiting at FMC Abeokuta Staff Multipurpose Cooperative
  Society", "Your pending tasks / Nothing is waiting on you" with a two-sentence explanation, "TODAY 0
  members recorded against / 0 applications received" (the label text is duplicated in the DOM).

### Super Admin

- **Home:** "Here's how Clarix looks today", tiles Cooperatives 5, Active 5, **Employees 15**, Invites
  pending 0, "Nothing needs you", "RECENT PLATFORM ACTIVITY" list, and an explanatory footer paragraph.
- **Cooperatives:** table with status, members, admin ("Nobody named yet" for four of five).

### What the live app gets right (keep)

The meter + rolling number motif; one icon set; the honest copy instinct ("Nothing is uploaded",
"Clarix never moves money"); the apply flow; the desktop members table; Timed Undo on decisions;
Lagos-time dates everywhere; the RLS-first architecture.

---

## 2. The eight reference sites

Measured from the rendered pages (fonts from computed styles, sizes at 1440px).

| Site | Type | H1 | Buttons | What Clarix takes | What Clarix avoids |
|---|---|---|---|---|---|
| Payflux (framer) | Fintech template | Stack Sans 64px / 400 | 8px radius | Numbered three-step "how it works" with a product fragment per step; phone mockup held in context | "Seamless", AI-flavoured copy, unverifiable stats |
| Clario (framer) | SaaS template | Manrope 64 / 500, −2.56px | Pill, 45px tall | Dashboard mockup in a slightly tilted frame (perspective on scroll); problem framed by contrast | Black theme, neon lime |
| Finora (framer) | Fintech app | Inter/Onest 64 / 600 | Pill 56px with a separate circular arrow button | Phone mockup with floating detail cards; stat cards with rolling numbers; realistic figures | Typo "COMMING"; a landscape photo unrelated to money |
| Freight Africa | Logistics, Nigerian | 68 / 800, −2.38px | Pill, 52px | **Hero photo carousel with progress ticks and a pause button**; an inline form card overlapping the hero's bottom edge; money shown as states a person can follow (Paid / Held safely, Loaded / Part released, Delivered / Balance released); 24px-rounded section bands | Weight 800 headlines (too loud for Clarix) |
| Japa 9ja | Travel finance, Nigerian | Sora | 6px radius | Honest plain copy ("Pay afterward"), FAQ that says what it does not do; a photo that matches the words | Small radii |
| Logistra (framer) | Logistics template | Inter Display 72 / 500 | Pill 48px | **Rounded photo hero card inset from the viewport**; pill nav group; glass info card on the photo; honest qualifiers next to claims | Template stock photography |
| Logiten (framer) | Logistics template | Bebas 120px | Pill + arrow circle | Numbered, scannable service cards | Oversized condensed display type, loudness |
| RealDom | Real estate, Nigerian | Plus Jakarta 68 / 800 | Pill | Search card overlapping the hero; **cost breakdown card ending in a bold total** (Agent fee ₦0 … Total ₦4,560,000) | Heavy weights |

**Cross-site conclusions** (folded into `DESIGN_SYSTEM.md` and the public-site blueprint): pill buttons
44–56px tall are the norm in the premium set; one big photo framed with a large radius beats busy
collages; a single overlapping card (form, search or product) is what makes a hero feel designed;
money reads best as a timeline of states and as a breakdown that ends in a total; Nigerian sites that
feel trustworthy (Japa, Freight Africa) use plain sentences and say what they do not do. Mobbin could
not be searched from the planning session (the connector needs a paid plan); bank-app conventions
(Moniepoint, Kuda, Mercury, Revolut, Apple Wallet: grouped lists, sheets with detents, one hero
balance) and Apple's Human Interface Guidelines (sheet detents, 44pt targets, grouped inset lists,
haptics) informed the app patterns.

---

## 3. Watermelon UI components (from the owner's brief)

Install with `npx shadcn@latest add <registry url>` only in the BUILD-PLAN step that needs it. Every
component is reskinned to `DESIGN_SYSTEM.md` tokens: replace hard-coded hexes (`#F4F4F4`, `#18181B`,
`#1C1C1E` …) with tokens, delete every `dark:` class, replace its own spring with `springStandard`
(most ship stiffness 240–300), and convert icons per the map below. Never leave demo copy.

| Component | Verdict | Where in Clarix | Notes |
|---|---|---|---|
| `run-action-button` | **Adopt** | Import confirm, bulk statement generation, "Generate invoices" | States: idle → running (inner spinner) → done (check) → error |
| `time-undo-action` | **Adopt** | Every destructive or reversible staff action (decline, delete entry, mark repaid) | Already used for decisions in R1; standardise on this one |
| `stepper` | **Adopt** | Loan tenure (months), bulk-entry quantity | Min/max from the loan product |
| `range-selection-slider` | **Adopt** with RollingNumber | Loan amount on Apply; report date range | Track uses the meter colours; thumb 28px |
| `reveal-copy` | **Adopt** | Member ID, verification codes, invite links (the working path while email is blocked, E27) | |
| `command-search` | **Adopt** | Desktop `Ctrl/⌘ K` (members, loans, actions); phone search sheet | |
| `continuous-tabs` | **Adopt** | Segmented controls (loan queue segments, member sheet tabs) | |
| `minimal-carousel` | **Adapt** | Member home Highlights strip (max 3, D046); public-site product fragments on phones | Remove its "more" menu |
| `progressive-input-stack` | **Adapt** | Onboarding (one question at a time), Create cooperative | Pair with the thin progress line |
| `layered-progressive-disclosure` | **Adapt** | Repayment policy settings (basis → percentage → advanced: allow declared, evidence age) | Uses `@hugeicons`; convert |
| `hero-32` / `hero-31` | **Adapt** | Landing hero structure (background media + headline + overlapping card) | Replace their background images with D046 photos; no "Sparkles/Workflow" feature chips |
| `navigation-5` | **Adapt** | Public-site floating pill nav | Remove theme toggle |
| `faq-2` | **Adapt** | Landing and pricing FAQ | |
| `pricing-widget` / `changeable-pricing-section` | **Adapt (Phase 5.3)** | Pricing page: member-count slider → monthly price from `price_for()` | Figures only from the one tested function; monthly/yearly toggle |
| `split-button` | **Defer** | Possibly "Export ▾" (CSV / XLSX / PDF) | A menu button may be enough |
| `morphing-button` | **Defer** | — | Decorative; revisit for the "+" quick action only if it earns it |
| `show-qr` | **Defer** | Possibly sharing a cooperative join link at meetings | P1 |
| `slot-picker` | **Reject** | — | Clarix has no scheduling |
| `testimonials-1` | **Reject** | — | Its demo attributes invented quotes to real, named people with their real photos. No testimonials until real, consented quotes exist |

### Icon conversion map (react-icons / hugeicons → lucide-react)

| Found in the snippets | Use |
|---|---|
| `FaBell` (fa6) | `Bell` |
| `HiBadgeCheck` (hi) | `BadgeCheck` |
| `IoCloseSharp` (io5) | `X` |
| `FaInbox` (fa6) | `Inbox` |
| `RiBubbleChartFill` (ri) | `ChartScatter` |
| `BsFileTextFill` (bs) | `FileText` |
| `BsSendFill` (bs) | `Send` |
| `BsTagFill` (bs) | `Tag` |
| `TbClockHour12Filled` (tb) | `Clock12` |
| `HiMinus` / `HiPlus` (hi) | `Minus` / `Plus` |
| `VscSparkleFilled` (vsc) | `Sparkle` (avoid sparkles as decoration in Clarix; prefer a meaningful icon) |
| `BsBookmarkStarFill` (bs) | `BookmarkCheck` |
| `FaCloud` (fa) | `Cloud` |
| `FaCheck` (fa6) | `Check` |
| `IoQrCodeOutline` (io5) | `QrCode` |
| `FaCopy` (fa) | `Copy` |
| `BsEyeFill` (bs) | `Eye` (and `EyeOff` for hide) |
| `FiPlus` / `FiMinus` (fi) | `Plus` / `Minus` |
| `FiLayout` / `FiCode` (fi) | `LayoutGrid` / `Code` |
| `ArrowRight04Icon` (hugeicons) | `ArrowRight` |
| `PlusSignIcon` (hugeicons) | `Plus` |

All names above were checked against `lucide-react@1.45.0` (the version in `package.json`). Check again after any upgrade against the installed version (`node_modules/lucide-react/dist/lucide-react.d.ts`)
before use; if one is missing, pick the nearest lucide icon and note it in the PR, never add a package.
Lucide icons are outline only: where a snippet used a filled icon for an active state, show the active
state with the container (filled pill) instead.
