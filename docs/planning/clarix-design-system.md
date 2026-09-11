# Clarix Design System & Screen Specification

*Companion to `clarix-strategic-analysis.md` and `clarix-mvp-spec.md`. Covers visual language, motion, the Watermelon UI component set, and a screen-by-screen build spec. **See `/DESIGN_SYSTEM.md` at the repo root for the condensed, always-applicable rulebook** — this file is preserved as the original, fuller planning artifact, including the component-by-component curation table referenced from there.*

---

## 0. A stack decision this locks in — confirm before building

The Watermelon components you pasted are React + Tailwind + shadcn/base-ui + Motion (the `motion/react` package, formerly Framer Motion). Adopting them commits Clarix to that stack (almost certainly Next.js, given Vercel deployment). That's a reasonable, well-supported choice for a PWA that needs to feel native — but it's a real decision, not a neutral one, so it's worth saying out loud rather than sliding into it component by component. If you're already building in Next.js, nothing changes; if you had something else in mind, say so now rather than after the third component is wired in.

**One hygiene fix before adopting anything:** the pasted snippets mix icon libraries — `lucide-react`, `react-icons` (fa6/hi/bs/tb/io5), and `@hugeicons/react`. Mixing icon sets is one of the fastest ways to make an app look like it was assembled from tutorials rather than designed — the stroke weights and corner styles don't match, and it's visible even if you can't name why. **Standardize on `lucide-react` alone** (it's already shadcn's default, most components already lean on it, and it has everything Clarix needs — bell, check, search, plus/minus, arrow, undo, QR, etc.). Swap the react-icons/hugeicons imports in whichever components you keep.

---

## 1. Design Principles (unchanged from the earlier direction, restated as the filter for everything below)

Premium, calm, trustworthy, quietly confident. Not a generic AI-SaaS dashboard (centered white card on a purple gradient blob, floating 3D shapes, stock photo of people in suits shaking hands). Not "crypto/fintech bro" (neon gradients, aggressive glow, everything a card with a shadow). The emotional target: *my financial information is organized, understandable, and under control.*

Every component decision below gets filtered through one question: **does this serve understanding a number correctly, or is it decoration for its own sake?** Clarix's entire value proposition is "we tell you the truth about your deduction capacity" — the design should visually *perform* that promise, not just state it in copy.

## 2. The Signature Motif — Clarix's ownable visual identity

This is the single most important design decision in this document, because it's what separates Clarix from "a generic fintech dashboard template" without adding a single unnecessary feature.

**The deduction-capacity meter, rendered with rolling digits, appears everywhere a number matters — consistently, not just on one hero screen.** Available capacity on the employee dashboard. Available-vs-requested on the loan eligibility screen. The KPI cards on the cooperative admin dashboard. Even the app's own splash/loading state, as a small ring filling. One recurring, physically consistent visual idea, built from two components already in the Watermelon set:

- **Rolling Number** (from `range-selection-slider.json` — the `RollingNumber` sub-component, used independently of the slider it ships with) for every financial figure that updates: savings balance, loan balance, available capacity. Numbers that visibly roll into place read as "this app takes your numbers seriously" — the opposite of a static digit that could be a screenshot.
- **A meter bar** (used inline in `range-selection-slider.json`'s track, and again conceptually in the "used vs. available" bar already specified in the strategic docs) — a simple horizontal fill, `used` in a neutral tone and `available` in emerald, or the reverse in red when a request would exceed it.

Nowhere else in the app should introduce a *second* way of visualizing "a number relative to a limit." One motif, reused deliberately, is what makes a product feel designed rather than decorated.

## 3. Design Tokens

### Color

Same palette direction agreed earlier, now finalized with dark-mode pairs (cheap to keep, since the components you're adopting already ship `dark:` classes — worth reconsidering dark mode from a firm "P2, don't build it" to "carry it through for free as you go," without spending extra design time perfecting it for launch).

| Token | Light | Dark |
|---|---|---|
| `background` | `#F6F8FB` | `#0B0B0E` |
| `surface` (cards) | `#FFFFFF` | `#151517` |
| `border` | `#E7EAF0` | `#2C2C30` |
| `text-primary` | `#111827` | `#F5F5F7` |
| `text-secondary` | `#667085` | `#9C9CA6` |
| `text-muted` | `#98A2B3` | `#6B6B75` |
| `brand-primary` (nav, headings, dark surfaces) | `#0B1220` | `#E5E7EB` |
| `brand-accent` (savings, positive, CTA) — **emerald** | `#16A57A` | `#34D399` |
| `brand-secondary` (info, links) — **indigo** | `#4F46E5` | `#818CF8` |
| `success` | `#16A57A` | `#34D399` |
| `warning` | `#F59E0B` | `#FBBF24` |
| `danger` | `#DC4A4A` | `#F87171` |

No other hue enters the palette. Every screen in section 6 uses only these tokens — that discipline is what "consistency over creativity" (from the design-system principles) actually buys you.

### Typography

**Inter**, one family, loaded once. Numeric contexts (every KPI, every rolling number) use `font-variant-numeric: tabular-nums` so digits don't jitter in width as they roll.

| Role | Size (desktop / mobile) | Weight |
|---|---|---|
| Display (landing hero) | 64px / 40px | 600 |
| Page title | 32px / 24px | 700 |
| Section heading | 20px / 18px | 600 |
| Card title | 16px / 16px | 600 |
| Body | 16px / 14px | 400 |
| Secondary text | 14px / 13px | 400 |
| Caption/metadata | 12px / 12px | 500 |
| Financial KPI figure | 36px / 28px | 700, tabular-nums |

### Spacing, Radius, Shadow

Spacing scale: `4, 8, 12, 16, 20, 24, 32, 40, 48, 64`. Card radius: `16px` desktop, `14px` mobile, `20px` for large feature cards (matches what several Watermelon components already use — `rounded-[28px]`/`rounded-[32px]` on their outer containers is slightly larger than this; when adapting them, pull those down to Clarix's 16–20px scale so borrowed components don't visually clash with native ones). Shadow: a single subtle elevation, `0 4px 20px rgba(15,23,42,0.04)` in light mode, and prefer a 1px `border` over a shadow wherever the two would otherwise stack — most cards should need only the border.

### Motion

Every spring in the app should feel like it came from the same physical object, not a grab-bag of tutorial defaults. Standardize on **one spring config**, reused everywhere instead of the different `stiffness`/`damping` values scattered across the pasted snippets:

```
const springStandard = { type: 'spring', stiffness: 260, damping: 22, mass: 0.9 };
```

Use it for: card expand/collapse, tab pill movement, button state changes, bottom-sheet open. Reserve a slightly heavier variant (`stiffness: 140, damping: 20, mass: 1.4`) only for the rolling-number digit columns, where a touch more weight reads as "counting something real" rather than "bouncing UI." Page transitions: 180–240ms fade + small horizontal shift, no spring. Respect `prefers-reduced-motion` globally — every spring above becomes an instant/fade fallback.

---

## 4. Watermelon Component Curation — adopt, adapt, or reject, and why

Twenty components were proposed. Adopting all of them regardless of fit is exactly the trap of looking "AI-generated" — a pile of impressive individual widgets with no reason each one is there. Here's the actual call on each, against real Clarix screens.

| Component | Verdict | Where it's used / why |
|---|---|---|
| **Run Action Button** | **Adopt, high value** | Exact fit for two real pipelines already in the spec: spreadsheet import (Importing → Matching columns → Flagging duplicates → Ready) and payslip processing (Reading payslip → Extracting fields → Ready for review). Reskin the step icons/colors to Clarix tokens; keep the mechanic as-is. |
| **Timed Undo Action** | **Adopt, high value** | Fits every destructive action already specced with an audit trail requirement: remove a member, reject a loan, revoke an officer's staff role, deactivate a cooperative. Gives a real 10-second undo instead of a scary confirm dialog — matches the "calm, not alarming" principle better than a modal would. |
| **Stepper** (rolling-digit +/-) | **Adopt** | Loan tenure (months) and similar small-integer inputs on the loan application form. Reskin the pill color to neutral/border tokens. |
| **Range Selection Slider** (+ its `RollingNumber`) | **Adopt, and split it** | Use `RollingNumber` standalone everywhere per the signature motif (section 2). Use the slider mechanic specifically for the loan-amount picker on the application screen (min/max bounded by the cooperative's loan product), reskinned to emerald/navy, not the demo's default black-and-white. |
| **Reveal & Copy** | **Adopt, strong fit** | Built for exactly this: showing a sensitive number masked by default with a deliberate reveal + copy action. Use it for IPPIS number, bank account number, and Pension PIN on the employee profile screen — reinforces "we don't casually expose your sensitive data," which is a real product value, not just a UI flourish. |
| **Command Search** | **Adopt for desktop** | Directly serves the already-specced "search a member fast" requirement for officers/admins. On mobile, trigger it by tapping the search field rather than a keyboard shortcut ("F" doesn't exist on a touchscreen) — same modal, different trigger. |
| **Continuous Tabs** (pill switcher) | **Adopt, versatile** | Member-profile tabs (Overview / Savings / Loans / Deductions), desktop cooperative switcher, and any Monthly/Yearly-style toggle. One component, reused across several screens — good design-system hygiene. |
| **Minimal Carousel** (expand-to-detail card grid) | **Adapt, reskin fully** | The *interaction* (tap a KPI card, others shrink into a row, tapped one expands with detail) is a genuinely good fit for the employee's multi-cooperative dashboard. The *default look* — bright purple/cyan/blue blocks — is precisely the "crypto wallet" aesthetic to avoid. Rebuild it in Clarix's navy/emerald/indigo tokens only, and only 3–4 semantic colors (one per KPI type: savings=emerald, loans=indigo, deductions=navy, capacity=amber-if-tight/emerald-if-healthy), never four arbitrary bright hues. |
| **Progressive Input Stack** | **Adapt, limited use** | The stacked-card advance is nice for a genuinely short 2–3 field sequence (e.g., email + password at signup) but wrong for payslip upload (needs a real dropzone) or employee-ID entry (needs inline validation feedback). Use only for the shortest steps; don't force every onboarding field through it. |
| **Split Button** | **Defer, P1** | Nice for "Add Member → Single / Import spreadsheet" or "New Loan → For myself / For a member," but not essential to the MVP's core loop. Fast-follow, not launch-blocking. |
| **Layered Progressive Disclosure** | **Reuse the pattern, not the component** | Its literal content (width/height/opacity/blur config) is irrelevant to Clarix. The *progressive disclosure* principle — show basic settings, reveal advanced ones only on request — is exactly right for a cooperative's loan-product configuration (min savings ratio and tenure up front; interest structure and asymmetric rules behind a toggle). Build a Clarix-specific version; don't import this one. |
| **Pricing Widget / Changeable Pricing Section** | **Defer to the paid-plan phase** | Both are strong, ready-made fits for when the recurring subscription packages get designed (per the business-model doc, that's a post-pilot decision) — reskin whichever one wins on content fit at that time, in emerald not orange. Not needed for the MVP. |
| **Morphing Button** | **Defer, low priority** | The expand-to-input pattern is charming but doesn't map cleanly onto a required Clarix flow yet. Possible future fit for a lightweight "quick add" action; not worth the build time now. |
| **Show QR** | **Defer, niche** | No clear MVP use case (no wallet address to share). Possible later use: a cooperative's public discovery page gets a shareable QR for a printed flyer. Shelve until that's an actual request. |
| **Slot Picker** (day/time scheduler) | **Reject** | Built for scheduling recurring time slots — nothing in Clarix schedules anything by day/hour. No adaptation makes sense here. |
| **Hero-31 / Hero-32** | **Adapt heavily, landing page only** | The animation choreography (staggered nav, word-by-word or blurred title rise, delayed CTA) is genuinely good and reusable — but the visual content (a stock photo of sunflowers, a generic "AI solutions" pitch, fake trusted-by logos for Vercel/Meta/Vue) must be entirely replaced. See section 6 for what actually goes there. |
| **Navigation-5** | **Adapt, simplify sharply** | The floating pill navbar look is good for the landing page. Its four-column mega-menu ("Solutions") is real over-engineering for a marketing site that has maybe four things to link to (How it works, For cooperatives, FAQ, Sign in) — cut the mega-menu entirely, keep the pill shape and mobile sheet. |
| **FAQ-2** | **Adapt** | Good structural fit for a landing-page FAQ and, later, an in-app help screen. Categories should be "For employees" / "For cooperatives," not the demo's generic dev/design split. |
| **Testimonials-1** | **Reject as-is — do not reuse its content, ever** | Important to say plainly: the demo content in this component attributes fabricated product quotes to real, named, identifiable people (Guillermo Rauch, Dan Abramov, Evan You, Lee Robinson, and others) using their real GitHub avatars. That's fabricated endorsement of a specific real person, not placeholder lorem ipsum — never ship that, in a demo or otherwise. The card-carousel *shape* is fine to reuse later, once FMC Abeokuta's pilot produces real, consented quotes from real cooperative heads or employees. Until then, skip testimonials on the landing page entirely rather than inventing anonymous ones — an unlaunched product with no testimonials section reads as more credible than one with vague, unverifiable quotes. |

---

## 5. PWA App-Shell Behavior

**Mobile:** bottom tab bar using the **Continuous Tabs** pill component, reskinned — four destinations for the employee app (Home, Cooperatives, Loans, More), matching what was already specced. Standalone display mode, app icon, splash screen with the signature meter-ring motif animating on load instead of a static logo. Safe-area padding respected on all fixed elements.

**Desktop:** persistent sidebar (240–260px), **Command Search** available both as a click target and (desktop only) the `F` shortcut from the original component. Multi-column layouts where mobile would stack — e.g. the member list + member detail can sit side-by-side on desktop, tabbed on mobile.

**Both:** the same design tokens, the same components, adapted by layout density rather than redesigned — per the earlier "three experience modes adapting, not three separate designs" principle.

---

## 6. Screen-by-Screen Specification

### Public / Marketing (outside the authenticated app)

**Landing page.** Built on the Hero-31/32 animation choreography, entirely re-skinned: Clarix Deep Navy background (not a stock photo), the nav pill from Navigation-5 (simplified, no mega-menu) reading Home / How it works / For cooperatives / Sign in. Hero copy: a real headline about the actual problem ("One employee. Several cooperatives. One salary." or similar — copy to be finalized, not a generic "AI-powered" claim), subhead naming the actual mechanic (cross-cooperative deduction coordination), and — this is the "flare without cliché" move — the hero's visual is not a stock photo or an abstract 3D shape, it's a **small, real, animated preview of the signature motif itself**: a mini eligibility check running live (a rolling number, a meter filling, a green "Eligible" result appearing), styled exactly like the real product. That's more persuasive than any illustration, because it's not a promise, it's a demo of the actual thing. No testimonials section (see section 4). FAQ-2 pattern for a short FAQ (For employees / For cooperatives). Single clear CTA: "Get started" → Employee signup, with a secondary "For cooperatives" link that explains the admin-invite model rather than offering self-signup (matching the onboarding-flow spec — cooperatives don't self-register).

**Welcome / product tour** (first screen after signup, before onboarding steps): three short slides introducing the concept — "See all your cooperatives in one place," "Know before you borrow," "Your data stays private, cooperative by cooperative" — text-led, small supporting icon or a tiny animated meter, never a large photo. This is where a light, tasteful illustration is appropriate; the authenticated dashboard afterward is not.

### Authentication

**Sign in / Sign up.** Desktop: split screen, left panel dark navy with a subtler version of the hero's live meter animation, right panel the actual form. Mobile: no marketing panel, just logo + form. One shared component for both roles that can reach this screen (employee self-signup; admin/officer via invite link land on a "set your password" variant of the same screen, pre-filled with their invited email, non-editable). Progressive Input Stack is acceptable here for the 2–3 fields (email, password) since it's genuinely short.

**Employee onboarding sequence** (post-signup, self-serve path only): step indicator (✓ Account created → Employee ID → Payslip → Review → Join a cooperative), one step per screen, Run Action Button powering the payslip-processing step exactly as specced in the MVP doc. The "Are these details correct?" review screen explicitly labels the figures "Extracted from your payslip" — never implies they came from a live payroll connection, per the earlier trust/transparency principle.

### Employee (User) screens

**Dashboard (home).** KPI row using the reskinned Minimal Carousel pattern: four cards (Total Savings, Active Loans, Monthly Deductions, Available Capacity), tap any to expand into the signature meter+rolling-number detail, others shrink into a row. A small "Clarix Insights" strip below — 2–3 short text-led cards (not a photo carousel), e.g. "Your savings grew ₦40,000 this month," "You're 73% through your Cooperative A loan" — swipeable on mobile, no autoplay (autoplaying content the user didn't ask to see is a small trust cost on a financial screen).

**My Cooperatives.** List/dropdown switcher (Continuous Tabs on desktop, bottom-sheet list on mobile per the earlier spec), each showing that cooperative's savings/loan/repayment detail only.

**Loan detail / apply for loan.** The Range Selection Slider (reskinned) for choosing the requested amount, Stepper for tenure, and the meter+eligibility-preview comparison exactly as described in the strategic docs ("Available ₦20,000 vs. Requested ₦35,000 — exceeds by ₦2,500"), computed live via the Step 2 preview formula from the MVP spec — no page reload, no separate "check eligibility" button, the number should visibly update as the slider moves.

**Profile.** Reveal & Copy for IPPIS number, bank account number, and Pension PIN.

**Discovery.** Cards for unjoined cooperatives (name, description, requirements, packages) — this is one of the few authenticated screens where a little more visual warmth (a cooperative's own logo/color if they supply one) is appropriate, since it's explicitly a "browse and decide" screen, not a "read my numbers correctly" screen.

### Cooperative Officer / Admin screens

**Member search.** Command Search pattern, adapted to a persistent search field at the top of the screen on both mobile and desktop rather than a keyboard-triggered modal (officers doing this dozens of times a day need zero friction).

**Member profile (staff view).** Continuous Tabs for Overview / Savings / Loans / Deductions. The cross-cooperative eligibility panel uses the same meter+rolling-number motif as the employee's own view, reinforcing that it's the same honest number from both sides.

**Loan application review / eligibility check.** Same meter comparison as the employee's apply screen — deliberately identical component, because both sides should see the same visual result, which is itself a trust signal.

**Destructive actions anywhere in the admin surface** (remove member, reject application, revoke an officer, deactivate a cooperative): Timed Undo Action, consistently, rather than a confirm dialog.

**Spreadsheet import.** Run Action Button through the matching/validation steps from the MVP spec, then the ready/needs-review/invalid preview table.

**Loan product / policy configuration.** The Layered-Progressive-Disclosure *pattern* (not the literal component): minimum savings ratio and tenure visible immediately; interest structure and any asymmetric rules behind an explicit "Advanced" toggle.

### Super Admin

Minimal by design, per the earlier boundary (no default access to financial detail): a plain list-and-status view of cooperatives (active/inactive), the org-wide deduction policy setting, and a platform-level activity log. None of the flourish above is warranted here — this is the one part of the product that should look like calm infrastructure, not a consumer app, because its job is oversight, not delight.

---

## 7. Concrete Anti-Generic-Design Checklist

Avoid, specifically: a centered white card floating on a purple-to-blue gradient background; a hero with three overlapping 3D glass/blob shapes; a stock photo of diverse professionals smiling at a laptop; a checkmark-bulleted feature list with no visual hierarchy between items; every single element wrapped in its own card-with-shadow (the "card inside card inside card" trap named in the earlier design critique); an AI-generated-feeling gradient text effect on the headline; a "Trusted by" logo row of companies that have no actual relationship with the product; a fabricated testimonial (see section 4's flag).

Do, specifically: the signature meter+rolling-number motif carried consistently through every screen that shows a number relative to a limit; a hero visual that is a real (if simplified) working preview of the product rather than an illustration of a metaphor for the product; one icon set, one font, a five-color palette used with discipline; motion that's tuned to feel like one physical object across the whole app rather than a different spring per component; empty and loading states that explain what to do next rather than saying "no data"; copy that names the actual mechanic (cross-cooperative deduction coordination, IPPIS, cooperatives) rather than generic SaaS language.
