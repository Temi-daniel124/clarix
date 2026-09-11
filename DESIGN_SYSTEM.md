# DESIGN_SYSTEM.md — Clarix

**This is a non-negotiable build contract, not a style suggestion.** The client has repeatedly
and explicitly required that Clarix never read as AI-generated, generic, or templated — on any
screen, frontend or backend-facing admin surface alike. Every UI-producing task is pixel-level
work: exact tokens, exact spacing, exact motion, exact icon set, every time. "Functionally
correct but visually approximate" is an incomplete task. A full, narrative-form screen-by-screen
specification for every role lives under `docs/planning/clarix-design-system.md` (the original)
and the four `*-ux-blueprint.md` files — read the relevant one before building any specific
screen. This file is the condensed, always-applicable rulebook that sits on top of those.

## Emotional target

Premium, calm, trustworthy, quietly confident. *My financial information is organized,
understandable, and under control.* Not a generic AI-SaaS dashboard (centered white card on a
purple gradient blob, floating 3D shapes, stock photo of people in suits shaking hands). Not
"crypto/fintech bro" (neon gradients, aggressive glow, everything a card with a shadow).

**The filter for every decision:** does this serve understanding a number correctly, or is it
decoration for its own sake? Clarix's entire value proposition is "we tell you the truth about
your deduction capacity" — the design performs that promise, it doesn't just state it in copy.

## The signature motif — Clarix's ownable visual identity (the single most important rule here)

**The deduction-capacity meter, rendered with rolling digits, appears everywhere a number matters
— consistently, never just on one hero screen.** Available capacity on the employee dashboard.
Available-vs-requested on the loan eligibility screen. The KPI cards on the cooperative admin
dashboard. The app's own splash/loading state, as a small ring filling.

- **Rolling Number** for every financial figure that updates: savings balance, loan balance,
  available capacity. `font-variant-numeric: tabular-nums` so digits don't jitter in width as they
  roll.
- **A meter bar** — a horizontal fill, `used` in a neutral tone and `available` in emerald, or the
  reverse in red/amber when a request would exceed it.

Nowhere else in the app may a *second* way of visualizing "a number relative to a limit" appear.
One motif, reused deliberately, everywhere — that repetition is what makes the product feel
designed rather than decorated.

## Design tokens — use these values exactly, never an invented or default one

### Color

| Token | Light | Dark |
|---|---|---|
| `background` | `#F6F8FB` | `#0B0B0E` |
| `surface` (cards) | `#FFFFFF` | `#151517` |
| `border` | `#E7EAF0` | `#2C2C30` |
| `text-primary` | `#111827` | `#F5F5F7` |
| `text-secondary` | `#667085` | `#9C9CA6` |
| `text-muted` | `#98A2B3` | `#6B6B75` |
| `brand-primary` (nav, headings, dark surfaces) | `#0B1220` | `#E5E7EB` |
| `brand-accent` (savings, positive, CTA) — emerald | `#16A57A` | `#34D399` |
| `brand-secondary` (info, links) — indigo | `#4F46E5` | `#818CF8` |
| `success` | `#16A57A` | `#34D399` |
| `warning` | `#F59E0B` | `#FBBF24` |
| `danger` | `#DC4A4A` | `#F87171` |

No other hue enters the palette, anywhere, on any screen.

### Typography

**Inter**, one family, loaded once. Numeric contexts (every KPI, every rolling number) use
`tabular-nums`.

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

### Spacing, radius, shadow

Spacing scale: `4, 8, 12, 16, 20, 24, 32, 40, 48, 64` — no arbitrary in-between values. Card
radius: `16px` desktop, `14px` mobile, `20px` for large feature cards. Shadow: one subtle
elevation, `0 4px 20px rgba(15,23,42,0.04)` in light mode — prefer a 1px `border` over a shadow
wherever both would otherwise stack; most cards need only the border.

### Motion

One standard spring, reused everywhere — never a different `stiffness`/`damping` per component:

```
const springStandard = { type: 'spring', stiffness: 260, damping: 22, mass: 0.9 };
```

Use it for card expand/collapse, tab pill movement, button state changes, bottom-sheet open.
Reserve a heavier variant (`stiffness: 140, damping: 20, mass: 1.4`) only for rolling-number digit
columns. Page transitions: 180–240ms fade + small horizontal shift, no spring. Respect
`prefers-reduced-motion` globally — every spring above becomes an instant/fade fallback.

## Icons

**`lucide-react` only.** No `react-icons`, no `@hugeicons/react`, no mixing. Mixed icon sets
(different stroke weights/corner styles) are one of the fastest, most visible ways an interface
reads as assembled-from-tutorials rather than designed.

## Component sourcing discipline

The approved Watermelon UI component curation (adopt/adapt/defer/reject, and exactly where each
one is used) lives in full in `docs/planning/clarix-design-system.md` §4. Two rules that apply
regardless of which component: (1) every adopted/adapted component gets reskinned to the tokens
above — never left in its demo colors/radii/icon set; (2) **never reuse the Testimonials-1
component's demo content** — it attributes fabricated product-endorsement quotes to real, named,
identifiable people using their real photos. That's a hard ethical line. Skip testimonials
entirely until real, consented quotes exist from real FMC Abeokuta cooperative heads or employees.

## PWA app-shell behavior

**Mobile:** bottom tab bar (four destinations per role — see the matching `*-ux-blueprint.md`),
standalone display mode, app icon, splash screen with the signature meter-ring motif animating on
load, not a static logo. Safe-area padding respected on every fixed element.

**Desktop:** persistent sidebar (240–260px). Multi-column layouts where mobile stacks (e.g. a
list + detail pane side-by-side on desktop, tabbed on mobile).

**Both:** the same tokens, the same components, adapted by layout density — never two separately
designed experiences.

## Concrete anti-generic-design checklist — run every finished screen against this before ACCEPT

**Avoid, specifically:**
- A centered white card floating on a purple-to-blue gradient background.
- A hero with overlapping 3D glass/blob shapes.
- A stock photo of diverse professionals smiling at a laptop.
- A checkmark-bulleted feature list with no visual hierarchy between items.
- Every element wrapped in its own card-with-shadow ("card inside card inside card").
- An AI-generated-feeling gradient text effect on a headline.
- A "Trusted by" logo row of companies with no actual relationship to the product.
- A fabricated testimonial (see Testimonials-1 note above).
- Any icon from a library other than `lucide-react`, anywhere.
- A second "number against a limit" visual pattern that isn't the rolling-number-plus-meter motif.
- Unstyled shadcn/Tailwind defaults left in place "temporarily."

**Do, specifically:**
- The signature meter-plus-rolling-number motif carried through every screen showing a number
  relative to a limit, with no exceptions.
- A hero visual (where one exists) that is a real, simplified working preview of the product,
  never an illustration of a metaphor for the product.
- One icon set, one font, the five-color palette above, used with discipline.
- Motion tuned to feel like one physical object across the whole app — the one standard spring.
- Empty and loading states that explain what to do next, not "no data."
- Copy that names the actual mechanic (cross-cooperative deduction coordination, IPPIS,
  cooperatives) rather than generic SaaS language.

## Design review is part of ACCEPT, not optional polish

Per `docs/DEVELOPMENT-WORKFLOW.md`, no screen is considered ACCEPTed until it has been checked
against: (1) the matching section of its role's blueprint under `docs/planning/` for completeness
of elements and interactions, (2) the token values in this document, exactly, and (3) the
checklist immediately above. If time pressure makes any of these feel skippable, that is exactly
the situation this document exists to override.
