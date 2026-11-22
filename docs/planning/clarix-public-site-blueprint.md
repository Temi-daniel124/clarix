# Clarix, Public Site, Sign In and Onboarding: Screen-by-Screen Blueprint (R2)

Replaces employee blueprint 1.1, 1.3, 1.4 and the layout of Part 2. Built in BUILD-PLAN Phase 5. Tokens,
components and motion are in `DESIGN_SYSTEM.md`; references in `docs/REFERENCE-STUDY.md` §2. Every
claim on these pages must be true of the product on the day it ships: **if a feature is not live, the
page does not mention it** (the rejected PR #22 advertised features that did not exist).

---

## 1. Global public-site frame

- **Canvas** `#F7F7F4`; max width 1200px; gutters 20 / 32px.
- **Navigation (adapt Watermelon `navigation-5`):** a floating pill bar, `surface` at 88% with
  `backdrop-filter: blur(12px)`, 1px hairline, `raised`, 64px tall, 16px from the top, max 1120px wide.
  Left: primary logo. Centre (desktop): How it works · For cooperatives · Pricing · FAQ, `body` 15px
  `ink-500`, active `ink-900`. Right: tertiary "Sign in" and primary "Get started" (44px pill). Over the
  hero photo it starts transparent with white text and gains the surface after 24px of scroll
  (`fadeQuick`). Phone: logo + "Sign in" + a menu button opening a full-height sheet with the links and
  a full-width primary.
- **Footer:** `navy-900` band with `radius-xl` top corners on desktop. Primary logo (white), one line
  "Clarix never holds, moves or deducts your money.", three link columns (Product: How it works,
  Pricing, For cooperatives; Company: Contact, Privacy, Terms; Get the app: "Install Clarix" with the
  PWA how-to), and `small` "© 2026 Clarix. Made in Nigeria." No social icons until accounts exist.
- **SEO:** each page sets `title` ("Clarix · Cooperative finance, clearly" on home; "Pricing · Clarix"),
  `description`, canonical from `NEXT_PUBLIC_SITE_URL`, OG image (D047).

## 2. Landing page (`/`)

Order of sections, top to bottom. Each section enters with `scrollReveal` (once).

### 2.1 Hero

- **Background media (D046):** a full-bleed carousel of 3 to 5 photos of Nigerian cooperative life,
  cross-fading every 6s (`heroCrossfade`) with a slow 1.04 → 1.0 scale on each slide, under the navy
  scrim. Desktop: the media sits in a `radius-xl` frame inset 16px from the viewport edges (Logistra
  and RealDom pattern), 88vh tall, min 640px. Phone: full-bleed, 92svh. Bottom-left inside the frame:
  progress ticks (one 24×3px bar per slide, the active one filling over 6s) and a 36px pause/play
  button (`Pause` / `Play` lucide), the Freight Africa pattern. Alternative: one muted, looping
  background video under 2.5MB, 8–12s, with a poster; same scrim; pause button. The owner picks
  photos or video in step 5.2; until then the hero uses a `navy-900` ground with a subtle ring pattern.
- **Shot list** (each must match its caption if the caption were shown): a cooperative meeting in a
  hall; a nurse in scrubs checking her phone; a trader at her stall counting cash into a passbook; a
  tailor or mechanic at work; two colleagues reviewing a ledger at a desk. Warm natural light, real
  Nigerian settings, no suits shaking hands, no laughing at laptops, no market photo beside banking
  copy without people saving. Licensed (Unsplash licence or commissioned); credits in
  `public/images/CREDITS.md`.
- **Copy (left aligned, max 640px, bottom third of the hero on desktop, centred on phone):**
  - Headline (`display`, white): **"Every cooperative you belong to. One clear picture."**
  - Subline (`body` 18px desktop / 16px phone, white 80%): "Clarix shows cooperatives and their members
    what a member can truly afford across every society they belong to, before a loan is approved,
    without any cooperative seeing another's records."
  - Actions: primary "Get started" (on-navy variant, 52px, with the 32px emerald arrow circle, the only
    place that pattern is used); tertiary white "See how it works" scrolling to 2.2.
  - Under them, `small` white 64%: "Free for 60 days. No card needed." (true only once Phase 9 ships;
    before that: "Free during early access.")
- **Overlapping product card (desktop ≥1024px):** a `surface` card, `radius-lg`, `raised`, 360px wide,
  overlapping the hero frame's bottom-right edge by 48px: the live meter preview ("Available to
  borrow ₦100,863 of ₦161,838", committed ₦60,975 across "3 cooperatives"), the digits rolling once
  on load, a slider beneath it the visitor can drag to see the meter react. Phone: the card sits under
  the hero, overlapping by 32px. Figures are illustrative and labelled "Example".

### 2.2 How it works (three steps)

Section title (`title`): "How it works". Three numbered steps (Payflux pattern) in a row on desktop, a
stack on phones. Each: a step number in a 32px `emerald-50` circle, a `heading`, one `body` line, and a
cropped **product fragment** (real Clarix UI, not an illustration) in a `radius-lg` frame:

1. "Join your cooperatives" · "One account, however many cooperatives you belong to." · fragment: the
   Cooperatives list with three logos.
2. "See what you can afford" · "Your limit counts repayments at every cooperative, not just one." ·
   fragment: the hero meter.
3. "Apply, and the cooperative decides" · "They see the same honest figure you do. Nothing else about
   your other cooperatives." · fragment: the loan state timeline (Applied → Capacity held → Approved).

On desktop the fragments tilt in from `rotateX(8deg)` to flat as they enter (perspective 1200px),
transform only. Reduced motion: flat.

### 2.3 For members / For cooperatives

Two `radius-xl` panels side by side (stacked on phones). Members panel on `surface`: heading "For
members", three short lines with lucide icons (`Wallet` savings everywhere in one place, `Gauge`
your real limit, `FileText` statements you can download) and a link "Create your account". Cooperatives
panel on `navy-900`: "For cooperatives", lines (`Users` import your members and loans from a
spreadsheet, `ShieldCheck` check every application against every cooperative, `Download` export your
books and issue statements) and a link "Talk to us". Only list what is live.

### 2.4 What stays private (navy band)

Full-width `navy-900` band. Title "What crosses between cooperatives, and what never does". Two columns:
"Shared: one combined monthly repayment figure" vs "Never shared: savings, loan details, which
cooperatives, your documents". A small diagram: three cooperative chips feeding one meter. One line:
"Clarix never holds, moves or deducts your money."

### 2.5 Who it's for (photo band)

Three or four photos in `radius-lg` frames with a one-line caption each ("Staff cooperatives",
"Market and trade cooperatives", "Community and faith societies", "Artisan cooperatives"). Horizontal
scroll-snap on phones (Minimal Carousel). Gentle parallax on desktop (images move 8% slower than the
page). Only shipped with real, licensed photos.

### 2.6 Pricing teaser

"₦150 per active member a month. ₦5,000 minimum. Members never pay." with a link to `/pricing`. The
figures come from `price_for()` (BUILD-PLAN 9.1); until then this section is hidden.

### 2.7 FAQ (adapt `faq-2`)

Accordion, `heading` questions, one-paragraph answers, `Plus`/`Minus` icons:
- "Does Clarix take money from my salary or account?" No. It never holds, moves or deducts money.
- "Can one cooperative see what I owe another?" Only one combined monthly figure, never details.
- "I don't get a payslip. Can I still use Clarix?" Yes: bank statements, or a declared figure your
  cooperative can verify (only once Phase 7 ships; until then: "Yes. You can join and save; your
  cooperative decides on loans.").
- "Where does the repayment limit come from?" Each cooperative sets it; for salary deductions Nigerian
  labour law caps them at one-third of wages.
- "What if my cooperative isn't on Clarix?" Ask them to talk to us; you can still record other monthly
  repayments so your limit is honest.
- "How does a cooperative join?" Contact us; we set it up with you and import your records.

### 2.8 Final call to action

A `radius-xl` `emerald-50` band: "Know before you borrow." + primary "Get started" + tertiary "Talk
to us" (mailto until a domain exists, then a form).

## 3. Pricing (`/pricing`, BUILD-PLAN 5.3)

Adapt `changeable-pricing-section`: a member-count slider (20 to 2,000, default 120) with a rolling
monthly price, a Monthly / Yearly (2 months free) Continuous Tabs toggle, and a breakdown card that ends
in a bold total (RealDom pattern): "120 active members × ₦150 = ₦18,000 · Minimum ₦5,000 · **₦18,000 a
month**". One plan, everything included, a list of what is included (only live features). "60 days free,
then read-only if unpaid. We never delete your records." FAQ on billing. All numbers from `price_for()`.

## 4. Sign in, sign up, reset (BUILD-PLAN 5.4)

- **Desktop:** split. Left 44%: `navy-900` panel with `radius-xl` inset 16px, the primary white logo
  top-left, one line in `title` white ("Every cooperative you belong to. One clear picture."), and the
  slow meter ring animation (submark, 160px, the arc breathing between 62% and 70% over 6s;
  static under reduced motion). **No eligibility card with zeros** (the live panel shows "0
  cooperatives"). Right: the form centred in 400px.
- **Phone:** form only, logo above it, 20px gutters, primary full width pinned to the bottom of the
  first viewport.
- **Sign in:** "Welcome back" (`title`); Email; Password with show/hide (`Eye`/`EyeOff`); "Forgot
  password?" tertiary; primary "Sign in"; `small` "New to Clarix? Create an account". Errors inline,
  one line. Keep the existing `#identifier` and `#password` ids (tests use them).
- **Demo chips (D048):** only when `NEXT_PUBLIC_DEMO_MODE=true`: a row "Sign in as" with
  four secondary chips (Member, Cooperative admin, Officer, Platform) that fill and submit the form
  using server-side credentials. Never rendered in Production.
- **Sign up:** "Create your account"; Email; Password with a 4-segment strength meter (not a second
  meter motif: segments, labelled "Weak/Okay/Strong"); consent line "I agree Clarix stores my details
  and the income figures I add, and that each cooperative sees only its own records. Read the privacy
  notice."; primary "Create account". If email cannot be delivered (D049), the next screen says so and
  offers what works.
- **Invited staff:** same layout, email pre-filled and locked, "Set your password".

## 5. Onboarding (BUILD-PLAN 3.3 and 5.5)

Full-screen flow, tab bar hidden, top bar with back and a 2px emerald progress line. One question per
screen (adapt `progressive-input-stack`). Primary pinned at the bottom on phones.

1. **Welcome** (max 3 slides, skippable): "Your cooperatives in one place" · "Your real limit, across
   all of them" · "Nothing moves your money". Each slide a product fragment, not an illustration.
2. **Your name and phone** (+234 input).
3. **Your cooperatives:** search by name; results as list rows with logo and short description; "Join"
   sends the request. "I'll do this later" tertiary.
4. **Member ID** (only if a chosen cooperative requires it): that cooperative's label and pattern.
5. **Proof of income (optional):** three choice cards: "Upload a payslip", "Upload bank statements (3
   to 6 months)", "Tell us your monthly income (marked as not verified)", plus "Skip for now". See
   `clarix-documents-blueprint.md` §5.
6. **Done:** "You're set" with the member's home hero preview and primary "Go to home".

Nothing after step 3 can block reaching home (D035.5).

## 6. Privacy, terms, help (BUILD-PLAN 5.6)

Reading layout: 680px column, `body` 17/1.65, `title` headings, a sticky contents list on desktop
(≥1280px) to the left, "Last updated" date at the top. Privacy is rewritten for any cooperative under
NDPA 2023 (BUILD-PLAN 3.2). Terms include the subscription and read-only rules (D041, D042) once
billing exists.

## 7. Performance and motion budget

LCP under 2.5s on a mid Android over 4G: hero first image `priority`, AVIF, under 180KB at 1440px;
later slides lazy. No layout shift from the nav or the overlapping card (reserve their space). Only
`transform` and `opacity` animate. Lighthouse targets in BUILD-PLAN Phase 5.
