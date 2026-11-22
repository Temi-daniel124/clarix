# DESIGN_SYSTEM.md, Clarix

**This is a non-negotiable build contract, not a style suggestion.** The client has repeatedly
and explicitly required that Clarix never read as AI-generated, generic, or templated, on any
screen, frontend or backend-facing admin surface alike. Every UI-producing task is pixel-level
work: exact tokens, exact spacing, exact motion, exact icon set, every time. "Functionally
correct but visually approximate" is an incomplete task. A full, narrative-form screen-by-screen
specification for every role lives under `docs/planning/clarix-design-system.md` (the original)
and the four `*-ux-blueprint.md` files, read the relevant one before building any specific
screen. Where those older documents and the Adire spec
(`docs/superpowers/specs/2026-11-21-clarix-adire-design-system-design.md`, amended by spec §11.9)
disagree, the Adire spec wins. This file is the condensed, always-applicable rulebook that sits on
top of them all.

## Emotional target

Premium, calm, trustworthy, quietly confident. *My financial information is organized,
understandable, and under control.* Not a generic AI-SaaS dashboard (centered white card on a
purple gradient blob, floating 3D shapes, stock photo of people in suits shaking hands). Not
"crypto/fintech bro" (neon gradients, aggressive glow, everything a card with a shadow).

**The filter for every decision:** does this serve understanding a number correctly, or is it
decoration for its own sake? Clarix's entire value proposition is "we tell you the truth about
your deduction capacity": the design performs that promise, it doesn't just state it in copy.

## The signature motif, Clarix's ownable visual identity (the single most important rule here)

**The deduction-capacity meter, rendered with rolling digits, appears everywhere a number matters
, consistently, never just on one hero screen.** Available capacity on the employee dashboard.
Available-vs-requested on the loan eligibility screen. The KPI cards on the cooperative admin
dashboard. The app's own splash/loading state, as a small ring filling.

- **Rolling Number** for every financial figure that updates: savings balance, loan balance,
  available capacity. `font-variant-numeric: tabular-nums` so digits don't jitter in width as they
  roll.
- **A meter bar**: a horizontal fill, `used` in a neutral tone and `available` in emerald, or the
  reverse in red/amber when a request would exceed it.

Nowhere else in the app may a *second* way of visualizing "a number relative to a limit" appear.
One motif, reused deliberately, everywhere. That repetition is what makes the product feel
designed rather than decorated.

## Design tokens: the Adire light system

The token tables that used to live here (the Inter type scale, the dark-mode column, the single
`0 4px 20px` shadow, the 16/14/20 card radii, the 22-damping spring) are retired. The source of
truth is now the **Adire design spec**,
`docs/superpowers/specs/2026-11-21-clarix-adire-design-system-design.md`, and its exact values
live as tokens in `src/app/globals.css`. Use the token, never the raw value, and never a value
that is in neither place. In short:

- **Colour (spec §2, D033).** Light theme only: porcelain `#F5F6FB` ground, white surfaces,
  `indigo-night` for big figures and the wordmark, `indigo-600` for committed money, links and
  focus, `emerald-500` for the primary action *and* "still available", `ochre-500` for reserved /
  this request, `red-600` for over the limit. Emerald text on a light ground is always
  `emerald-700`, never `emerald-500`. There is no dark mode and no dark surface outside the
  sidebars still waiting on plans 2 to 6.
- **Type (spec §3, D034).** Mona Sans wide cut (`font-display`) for display, section titles and
  big figures; Figtree for everything else; `tabular-nums` on every amount. Use the `type-*`
  utilities in `globals.css`. The landing H1 is 72px on desktop (D040). Never below 12px.
- **Shape and elevation (spec §4, D035, D040).** Buttons and chips are pills. Radii: pill, sheet
  28, feature 24, card 20, group 16, input 14, tag 10, plus the board's frame 32 and paper 10.
  Elevation is `flat`, `raised` and `primary-float` (primary button only), plus the named board
  shadows `frame`, `sheet`, `segment` and the `field` rings. Nothing inline.
- **Buttons (spec §5).** Primary, secondary, tertiary, destructive, icon, from `buttonVariants`.
  **One primary per view**: no screenful may hold two. The marketing nav's call to action is
  secondary. `scripts/visual/check-marketing.mjs` enforces this on the public pages.
- **Motion (spec §7).** One standard spring, `springStandard` in `src/lib/motion.ts`
  (stiffness 260, damping 24, mass 0.9), with the heavier rolling-digit spring kept for
  `RollingNumber`. Under `prefers-reduced-motion` every spring becomes a short fade, the hero
  carousel stays on its first photo, and scroll-linked 3D is off.

## Icons

**`lucide-react` only.** No `react-icons`, no `@hugeicons/react`, no mixing. Mixed icon sets
(different stroke weights/corner styles) are one of the fastest, most visible ways an interface
reads as assembled-from-tutorials rather than designed.

## Component sourcing discipline

The approved Watermelon UI component curation (adopt/adapt/defer/reject, and exactly where each
one is used) lives in full in `docs/planning/clarix-design-system.md` §4. Two rules that apply
regardless of which component: (1) every adopted/adapted component gets reskinned to the tokens
above, never left in its demo colors/radii/icon set; (2) **never reuse the Testimonials-1
component's demo content**. It attributes fabricated product-endorsement quotes to real, named,
identifiable people using their real photos. That's a hard ethical line. Skip testimonials
entirely until real, consented quotes exist from real cooperative heads or members.

## PWA app-shell behavior

**Mobile:** bottom tab bar (four destinations per role, see the matching `*-ux-blueprint.md`),
standalone display mode, app icon, splash screen with the signature meter-ring motif animating on
load, not a static logo. Safe-area padding respected on every fixed element.

**Desktop:** persistent sidebar (240–260px). Multi-column layouts where mobile stacks (e.g. a
list + detail pane side-by-side on desktop, tabbed on mobile).

**Both:** the same tokens, the same components, adapted by layout density, never two separately
designed experiences.

## Concrete anti-generic-design checklist, run every finished screen against this before ACCEPT

**Avoid, specifically:**
- A centered white card floating on a purple-to-blue gradient background.
- A hero with overlapping 3D glass/blob shapes.
- A stock photo of diverse professionals smiling at a laptop, or any photograph showing
  something Clarix does not do, or people in a situation unrelated to cooperative money.
- A checkmark-bulleted feature list with no visual hierarchy between items.
- Every element wrapped in its own card-with-shadow ("card inside card inside card").
- An AI-generated-feeling gradient text effect on a headline, or any decorative gradient. The
  only gradients allowed are the photo scrim and the ring-pattern fade mask.
- A "Trusted by" logo row, an invented statistic or a partner logo with no actual relationship
  to the product.
- A fabricated testimonial (see Testimonials-1 note above).
- Any icon from a library other than `lucide-react`, anywhere.
- A second "number against a limit" visual pattern that isn't the rolling-number-plus-meter motif.
- Unstyled shadcn/Tailwind defaults left in place "temporarily", or an inline radius, shadow or
  colour that is not a named token.
- A primary action that looks like the actions around it, or two primaries in one screenful.
- Emerald-500 text on a white or porcelain ground (use `emerald-700`).
- From spec §6: four identical KPI tiles in a row; icons in tinted circles as decoration;
  left-border accent stripes; a sixth kind of surface beyond figure card, task card, list group,
  status chip and photo card; more than one figure card on a screen.
- From spec §12: a staff home that leads with totals instead of the queue of what is waiting;
  a bare total with no comparison or limit beside it; sections grouped by data type
  ("Receipts: 5") instead of by job ("Confirm receipts"); status shown by colour alone; an empty
  state that says "no data" instead of the next step.
- Motion that would make a cheap Android phone on 3G stutter or burn data.

**Do, specifically:**
- The signature meter-plus-rolling-number motif carried through every screen showing a number
  relative to a limit, with no exceptions.
- A hero visual (where one exists) that is a real, simplified working preview of the product,
  never an illustration of a metaphor for the product.
- One icon set, the two type families, the spec §2 palette, used with discipline.
- Motion tuned to feel like one physical object across the whole app: the one standard spring.
- On staff homes (spec §12): the queue first, with its age; one figure card with one meaning;
  a 12-column desktop grid with the queue in 8 and context in 4; a single column on mobile with
  the sticky primary at the bottom.
- Empty and loading states that explain what to do next, not "no data."
- Copy that names the actual mechanic (the cross-cooperative check, income evidence, receipts
  confirmed by staff) rather than generic SaaS language, and that never assumes one employer.

## Design review is part of ACCEPT, not optional polish

Per `docs/DEVELOPMENT-WORKFLOW.md`, no screen is considered ACCEPTed until it has been checked
against: (1) the matching section of its role's blueprint under `docs/planning/` for completeness
of elements and interactions, (2) the token values in this document, exactly, and (3) the
checklist immediately above. If time pressure makes any of these feel skippable, that is exactly
the situation this document exists to override.
