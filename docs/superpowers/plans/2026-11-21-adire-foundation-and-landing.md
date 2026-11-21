# Adire Foundation and Landing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Clarix's visual foundation with the approved Adire light system and ship the new public marketing site (home, pricing, for members, privacy) with the full logo set and SEO files, with no FMC-specific wording left on any public page.

**Architecture:** The design tokens in `src/app/globals.css` keep their existing `--clarix-*` names, so every existing screen restyles automatically, but they take the spec's light-only values. Dark mode and the theme toggle are removed. Shared primitives (button, chip, logo) are restyled in place. The marketing site is rebuilt from small server components under `src/components/marketing/`, with client components only where something moves: the hero carousel, the scroll tilt, the pricing estimator and the mobile nav. Pure logic (pricing, carousel timing, site URL) lives in `src/lib/` with unit tests.

**Tech Stack:**
- Next.js 16.3 App Router. Read `node_modules/next/dist/docs/` before using any Next API.
- React 19, Tailwind v4, base-ui, `motion` 13, `lucide-react`, Vitest 5.
- The pre-installed Playwright, for scripts only. Never run `playwright install`.

**Spec:** `docs/superpowers/specs/2026-11-21-clarix-adire-design-system-design.md` (sections 2–10, 11.1, 11.9 and 14). The canvas reference is https://claude.ai/artifact/EpN2uwZkXTKwzwLbZWBLe6, page "Round 2 · Adire, light", board "Landing page".

This is plan 1 of the redesign. Later plans are written after this one is approved and merged:

2. Getting in: auth, invites, onboarding, self sign-up and verification.
3. Many organisations and income evidence (schema).
4. The member app.
5. The staff apps (officer, admin) and receipts.
6. Super admin and billing.
7. Statements, reports and exports.

## Global Constraints

- **Branch and merging:** all work happens on branch `claude/vigilant-mendel-xlrugr`; push after every task. Never merge to `main`; the owner approves the pull request.
- **Commit identity:** must match the identity `CLAUDE.md` requires (user name `Temi-daniel124`). Check `git config user.name` and `git config user.email` against `CLAUDE.md` before the first commit.
- **Light theme only:** no `prefers-color-scheme: dark` rules, no `dark:` classes, and no dark surfaces (spec §1 non-goals, D033).
- **Colour tokens, exactly:**

  | Token | Value |
  |---|---|
  | indigo-night | `#0B1033` |
  | indigo-50 | `#F3F4FD` |
  | indigo-100 | `#EEF0FB` |
  | indigo-600 | `#2F3DA6` |
  | emerald-500 | `#2BD19A` |
  | emerald-700 | `#0E7A56` |
  | emerald-50 | `#DDF5EA` |
  | ochre-500 | `#E3A23B` |
  | ochre-50 | `#FBEFD5`, with text `#7A5410` |
  | red-600 | `#B0322C` |
  | red-50 | `#FBE4E2` |
  | ink | `#0E1230` |
  | ink-2 | `#4A5078` |
  | muted | `#5E6488` |
  | line | `#E3E6F2` |
  | porcelain | `#F5F6FB` |
  | white | `#FFFFFF` |

- **Fonts:** Mona Sans for display (the `wdth` axis, used at `font-stretch: 118%`, weights 700–800), and Figtree (400/500/600/700) for everything else. Amounts use `font-variant-numeric: tabular-nums`. Nothing is set below 12px.
- **Radius:** pill `999px` for every button and chip. Sheet 28, feature card 24, card 20, row group 16, input 14, tag 10.
- **Shadows, only these three:**
  - flat: `0 0 0 1px #E3E6F2`;
  - raised: `0 1px 2px rgba(14,18,48,.06), 0 12px 32px -16px rgba(14,18,48,.22)`;
  - primary-float: `0 10px 24px -10px rgba(43,209,154,.55)`, on the primary button only.
- **Motion:** one standard spring, `{ type: 'spring', stiffness: 260, damping: 24, mass: 0.9 }`. Rolling digits keep `{ stiffness: 140, damping: 20, mass: 1.4 }`.
- **Primary button:** emerald fill, text `#05281C`, pill, primary-float shadow, height 52 on mobile and 48 on desktop. One per view.
- **Icons:** `lucide-react` only. No `react-icons`, no `@hugeicons`, no `@number-flow/react`.
- **No invented proof:** no testimonials, no partner logos, no invented statistics, and no "trusted by" anywhere (spec §1 anti-goals).
- **Photos:** use the four carousel photos and the two section photos already chosen, and credit every one (see Task 8).
- **Pricing copy:** ₦150 per active member per month, ₦5,000 minimum, yearly billing gives two months free, a 60-day free trial, and members are always free.
- **Reduced motion (`prefers-reduced-motion`):** every spring becomes a 120ms fade, the carousel stays on its first image, and the scroll-linked tilt is off.
- **No database work:** never run `supabase start` or Docker, and make no database changes in this plan.
- **Test files:** import `describe`, `test`/`it`, `expect` and `vi` from `"vitest"` explicitly, as `src/lib/eligibility.test.ts` does (there is no globals config). The snippets below leave the import line out for brevity. Tests that use `vi.stubEnv` call `vi.unstubAllEnvs()` in `afterEach`.

## Review Focus

- **Reduced motion:** a visitor with `prefers-reduced-motion: reduce` sees the first hero photo only, with no tilt and no crossfade. Pinned in Task 7 (the `nextSlideIndex` and `carouselShouldRun` tests) and in Task 10's visual script.
- **Narrow phones (360px):** no horizontal scroll anywhere on `/`, `/pricing`, `/for-members` or `/privacy`. Pinned by the overflow assertion in Task 10's visual script.
- **Odd estimator input:** a blank, `0`, negative, decimal or `100000` member count must never produce a negative, `NaN` or below-minimum bill. Pinned in Task 6's tests.
- **A returning visitor who previously chose dark mode** (`localStorage["clarix.theme"] === "dark"`) must still get the light palette. Pinned in Task 2 (the `theme-script` test).
- **Existing app screens after the token swap:** `/login` and the authenticated shells must stay legible, with no white-on-white and no near-black panels. Pinned by the `/login` and `/privacy` screenshots and a contrast spot-check in Task 10. The full restyle of those screens is plans 2–6.

---

### Task 1: Record the decisions and repair the install

**Files:**
- Modify: `docs/DECISIONS.md`. Append D032–D039 verbatim from spec §14, and mark D002, D019 and the dark-mode half of D017 as superseded, with a pointer.
- Modify: `package-lock.json` (regenerated).
- Modify: `docs/PROJECT-STATE.md`. Add a "Redesign" section with:
  - the spec path;
  - the canvas URL;
  - the plan list above;
  - the Vercel project `clarix` at `https://clarix-orpin.vercel.app`.

**Interfaces:**
- Produces: decision numbers D032–D039 that later commit messages and code comments cite.

- [ ] **Step 1: Confirm the install fails as found**

Run: `rm -rf node_modules && npm ci`
Expected: FAIL (`npm ci` rejects the lockfile because it is out of sync with `package.json`).

- [ ] **Step 2: Regenerate the lockfile**

Run: `npm install` then `npm ci`
Expected: `npm ci` now succeeds, and `git diff --stat package.json` shows no change to `package.json`.

- [ ] **Step 3: Run the baseline checks**

Run: `npm test && npm run lint && npx tsc --noEmit && npm run build`
Expected: all pass. Record any lint warnings that already exist in the commit message, so later tasks aren't blamed for them.

- [ ] **Step 4: Append D032–D039 to `docs/DECISIONS.md`.** Give each the status "Locked" and the date 2026-11-21, use each decision's text exactly as spec §14 words it, and add "Supersedes:" lines to D002, D019 and D017 (dark mode only).

- [ ] **Step 5: Commit and push**

```bash
git add docs/DECISIONS.md docs/PROJECT-STATE.md package-lock.json
git commit -m "Record the redesign decisions and repair the lockfile so npm ci works"
git push -u origin claude/vigilant-mendel-xlrugr
```

---

### Task 2: Light-only tokens, type, radius, shadow and motion

**Files:**
- Modify: `src/app/globals.css`:
  - new palette values, plus new tokens;
  - remove both dark blocks and the `.dark` custom variant;
  - the radius scale, the three shadows, the type utilities and the reveal utility.
- Modify: `src/app/layout.tsx`: fonts, a single viewport `themeColor` of `#F5F6FB`, and metadata strings with no FMC wording. The full SEO metadata comes in Task 5.
- Modify: `src/lib/motion.ts`.
- Modify: `src/components/theme/theme-script.tsx`, keeping only the sidebar restore.
- Delete: `src/components/theme/theme-toggle.tsx` and every place it's used:
  - `landing-nav.tsx`, `app-nav.tsx`, `admin-nav.tsx`, `platform-nav.tsx`;
  - `admin/setup/layout.tsx`, `officer/layout.tsx`, `onboarding/layout.tsx`;
  - `platform/welcome/page.tsx`, `privacy/page.tsx`.
- Test: `src/lib/motion.test.ts` and `src/components/theme/theme-script.test.ts`.

**Interfaces:**
- Produces (CSS, used by every later task):
  - **Tailwind colours:** `porcelain`, `ink`, `ink-2`, `muted`, `line`, `indigo-night`, `indigo-50`, `indigo-100`, `indigo-600`, `emerald-500`, `emerald-700`, `emerald-50`, `ochre-500`, `ochre-50`, `ochre-ink` (`#7A5410`), `red-600`, `red-50` and `on-emerald` (`#05281C`).
  - **Existing aliases keep working, with new values:**

    | Alias | Now maps to |
    |---|---|
    | `background` | porcelain |
    | `surface` | white |
    | `border` | line |
    | `text` | ink |
    | `text-secondary` | ink-2 |
    | `text-muted` | muted |
    | `navy` | indigo-night |
    | `emerald` | emerald-500 |
    | `indigo` | indigo-600 |
    | `success` | emerald-700 |
    | `warning` | ochre-500 |
    | `danger` | red-600 |

  - **Radius utilities:** `rounded-pill`, `rounded-sheet`, `rounded-feature`, `rounded-card`, `rounded-group`, `rounded-input`, `rounded-tag`.
  - **Shadow utilities:** `shadow-flat`, `shadow-raised`, `shadow-primary-float`.
  - **Font variables:** `--font-display` (Mona Sans) and `--font-sans` (Figtree). The `font-display` utility sets the family plus `font-stretch: 118%`.
  - **Type utilities, with these exact sizes:**

    | Utility | Desktop / mobile | Line-height | Tracking | Face |
    |---|---|---|---|---|
    | `type-display` | 84 / 44 | 0.96 | −0.045em | display 800 |
    | `type-page-title` | 54 / 34 | 1.0 | −0.04em | display 800 |
    | `type-section` | 32 / 26 | 1.1 | −0.03em | display 750 |
    | `type-figure-xl` | 56 / 42 | 1.0 | −0.05em | display 800, tabular |
    | `type-card-title` | 20 / 18 | 1.25 | | Figtree 600 |
    | `type-body-lg` | 18 / 17 | 1.55 | | Figtree |
    | `type-body` | 15 / 15 | 1.5 | | Figtree |
    | `type-label` | 13 | 1.3 | | Figtree 600 |
    | `type-caption` | 12.5 | 1.4 | | Figtree |

    Keep `type-secondary`, `type-kpi`, `type-kpi-fit` and `tabular` as aliases so existing screens still compile.
  - **The `reveal` utility:** inside `@supports (animation-timeline: view())` only, a one-time 24px rise and fade driven by `animation-timeline: view(); animation-range: entry 0% entry 40%`. Outside that block the element is simply visible. It is disabled under reduced motion.
- Produces (TypeScript, in `src/lib/motion.ts`):
  - `springStandard: Transition` = `{ type: 'spring', stiffness: 260, damping: 24, mass: 0.9 }`;
  - `springRollingDigit`, unchanged;
  - `pageTransition: Transition` = `{ duration: 0.24, ease: [0.22, 0.61, 0.36, 1] }`, plus `PAGE_SHIFT_PX = 24`;
  - `reducedMotionTransition: Transition` = `{ duration: 0.12 }`.

- [ ] **Step 1: Write the failing tests**

```ts
// src/lib/motion.test.ts
import { springStandard, pageTransition, reducedMotionTransition, PAGE_SHIFT_PX } from "./motion";
test("standard spring matches the design system", () => {
  expect(springStandard).toEqual({ type: "spring", stiffness: 260, damping: 24, mass: 0.9 });
});
test("page transition is 240ms with a 24px shift", () => {
  expect(pageTransition.duration).toBe(0.24);
  expect(PAGE_SHIFT_PX).toBe(24);
});
test("reduced motion is a 120ms fade, not an instant cut", () => {
  expect(reducedMotionTransition).toEqual({ duration: 0.12 });
});

// src/components/theme/theme-script.test.ts
import { THEME_SCRIPT_SOURCE } from "./theme-script";
test("never applies a dark class, even for a saved dark choice", () => {
  expect(THEME_SCRIPT_SOURCE).not.toMatch(/['"]dark['"]/);
  expect(THEME_SCRIPT_SOURCE).toMatch(/rail-collapsed/);
});
test("clears a stale saved theme so old dark choices disappear", () => {
  expect(THEME_SCRIPT_SOURCE).toMatch(/removeItem\(["']clarix\.theme["']\)/);
});
```

- [ ] **Step 2: Run them to make sure they fail**

Run: `npx vitest run src/lib/motion.test.ts src/components/theme/theme-script.test.ts`
Expected: FAIL (damping is 22, duration is 0, and `THEME_SCRIPT_SOURCE` isn't exported).

- [ ] **Step 3: Update `motion.ts` and `theme-script.tsx`.** In `theme-script.tsx`, export the inline script as `THEME_SCRIPT_SOURCE: string`, drop the light/dark logic, keep the sidebar restore, and add `localStorage.removeItem('clarix.theme')` inside the existing try/catch.

- [ ] **Step 4: Rewrite the tokens in `globals.css`** with the values above.
  - Delete `@custom-variant dark`, both `prefers-color-scheme: dark` blocks and the scoped light-palette class. Keep that class name as an empty no-op until plan 2 removes its last users.
  - Set `--color-navy-surface` to indigo-night, so the remaining dark panels stay legible until plans 2–6 restyle them.

- [ ] **Step 5: Load the fonts in `layout.tsx`** with `next/font/google`:

```ts
const figtree = Figtree({ variable: "--font-figtree", subsets: ["latin"], display: "swap" });
const monaSans = Mona_Sans({ variable: "--font-mona", subsets: ["latin"], axes: ["wdth"], display: "swap" });
```

Map them to `--font-sans` and `--font-display` in `@theme`.

- [ ] **Step 6: Remove `ThemeToggle`** from every place it's used. Then run `grep -rn "ThemeToggle\|theme-toggle\|dark:" src`. Expected: no matches.

- [ ] **Step 7: Run the tests and checks**

Run: `npm test && npm run lint && npx tsc --noEmit && npm run build`
Expected: PASS.

- [ ] **Step 8: Commit and push**

```bash
git add -A src/app/globals.css src/app/layout.tsx src/lib/motion.ts src/lib/motion.test.ts src/components src/app
git commit -m "Adopt the Adire light tokens, Mona Sans and Figtree, and remove dark mode (D033, D034)"
git push
```

---

### Task 3: Buttons and chips become the spec's hierarchy

**Files:**
- Modify: `src/components/ui/button.tsx`.
- Create: `src/components/ui/chip.tsx`.
- Test: `src/components/ui/button.test.ts` and `src/components/ui/chip.test.ts`.

**Interfaces:**
- Produces: `buttonVariants`, with:
  - **Variants:** `primary | secondary | tertiary | destructive | icon`.
  - **Old names kept as aliases, so no screen breaks:** `navy` → secondary, `outline` → secondary, `ghost` → tertiary, `link` → tertiary, `danger` → destructive.
  - **Sizes:** `lg` (h-13, 52px, for the mobile primary), `default` (48px), `sm` (44px), `icon` (a 44×44 circle) and `inline`.
- Produces: `<Chip tone="waiting" | "confirmed" | "over" | "draft" | "neutral">`, a pill (`rounded-pill`, 12.5px, weight 700) whose children are required, because status is never shown by colour alone. The tones:

  | Tone | Background | Text |
  |---|---|---|
  | waiting | ochre-50 | `#7A5410` |
  | confirmed | emerald-50 | emerald-700 |
  | over | red-50 | red-600 |
  | draft | indigo-100 | indigo-600 |
  | neutral | white, with the flat shadow | ink |

- [ ] **Step 1: Write the failing tests**

```ts
// src/components/ui/button.test.ts
import { buttonVariants } from "./button";
test("primary is an emerald pill with the float shadow and dark text", () => {
  const c = buttonVariants({ variant: "primary" });
  expect(c).toMatch(/rounded-pill/);
  expect(c).toMatch(/bg-emerald-500/);
  expect(c).toMatch(/text-on-emerald/);
  expect(c).toMatch(/shadow-primary-float/);
});
test("only primary carries a shadow", () => {
  for (const v of ["secondary", "tertiary", "destructive", "icon"] as const)
    expect(buttonVariants({ variant: v })).not.toMatch(/shadow-primary-float|shadow-raised/);
});
test("legacy names map onto the new hierarchy", () => {
  expect(buttonVariants({ variant: "outline" })).toBe(buttonVariants({ variant: "secondary" }));
  expect(buttonVariants({ variant: "danger" })).toBe(buttonVariants({ variant: "destructive" }));
});
test("every size is at least a 44px target", () => {
  expect(buttonVariants({ size: "sm" })).toMatch(/h-11/);
  expect(buttonVariants({ size: "icon" })).toMatch(/size-11/);
});

// src/components/ui/chip.test.ts
import { chipClasses } from "./chip";
test("waiting chip uses ochre wash with readable text", () => {
  expect(chipClasses("waiting")).toMatch(/bg-ochre-50/);
  expect(chipClasses("waiting")).toMatch(/text-ochre-ink/);
});
```

- [ ] **Step 2: Run them to make sure they fail**

Run: `npx vitest run src/components/ui`
Expected: FAIL.

- [ ] **Step 3: Implement the variants, `chipClasses(tone: ChipTone): string` and `Chip({ tone, children, className })`.**
  - Use `rounded-pill` everywhere.
  - Focus ring: `focus-visible:outline-2 focus-visible:outline-indigo-600 focus-visible:outline-offset-2`.
  - The disabled primary is `bg-line text-muted`, without the shadow.

- [ ] **Step 4: Run the tests and checks**

Run: `npm test && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 5: Commit and push**

```bash
git add src/components/ui
git commit -m "Pill buttons in four levels and status chips that always carry their word (D035)"
git push
```

---

### Task 4: The logo family, icons and manifest

**Files:**
- Create: `src/components/brand/logo.tsx`.
- Create: `src/lib/brand.ts`.
- Modify: `src/components/clarix/wordmark.tsx`, re-exporting `Logo variant="horizontal"` so existing imports keep working.
- Create in `public/brand/`: `clarix-primary.svg`, `clarix-horizontal.svg`, `clarix-stacked.svg`, `clarix-submark.svg`, `clarix-black.svg` and `clarix-white.svg`.
- Modify: `src/app/icon.svg`, `src/app/apple-icon.svg`, `public/icons/icon.svg` and `public/icons/icon-maskable.svg`.
- Create: `public/icons/icon-192.png`, `public/icons/icon-512.png`, `public/icons/icon-maskable-512.png` and `scripts/brand/render-icons.mjs`.
- Modify: `src/app/manifest.ts`.
- Test: `src/lib/brand.test.ts` and `src/app/manifest.test.ts`.

**Interfaces:**
- Produces: `ringArc(radius: number, fraction = 2 / 3): { dash: number; gap: number }`, the stroke-dasharray for the meter ring: the circumference times the fraction, then the full circumference.
- Produces: `<Logo variant="primary" | "horizontal" | "stacked" | "mark" | "stamp" tone="color" | "black" | "white" size?: number />`.
  - **Variants:**
    - primary: the ring, "Clarix" and the tagline "Cooperative records, made clear";
    - horizontal: the ring and the name;
    - stacked: the ring above the name;
    - mark: the ring only;
    - stamp: the dye-stamp submark from the round-1 Adire brand sheet (an indigo-600 rounded square with rx 34 at 148px, corner rings and an emerald arc).
  - **Tones:** colour draws its track in `#DCE0F2` and its arc in indigo-600. Black and white drop the track and draw only the arc.
  - **Wordmark:** `font-display`, weight 800, tracking −0.035em.
- **Favicon:** a night-indigo `#0B1033` rounded square with an emerald arc. At 16px the track is left out.

- [ ] **Step 1: Write the failing tests**

```ts
// src/lib/brand.test.ts
import { ringArc } from "./brand";
test("two-thirds arc on the 8.5 ring", () => {
  const { dash, gap } = ringArc(8.5);
  expect(dash).toBeCloseTo(35.6, 1);
  expect(gap).toBeCloseTo(53.41, 1);
});
// src/app/manifest.test.ts
import manifest from "./manifest";
test("manifest is light, generic and installable", () => {
  const m = manifest();
  expect(m.name).toBe("Clarix");
  expect(m.description).not.toMatch(/FMC|salary/i);
  expect(m.background_color).toBe("#F5F6FB");
  expect(m.theme_color).toBe("#F5F6FB");
  expect(m.orientation).toBeUndefined();
  const sizes = (m.icons ?? []).map((i) => i.sizes);
  expect(sizes).toEqual(expect.arrayContaining(["192x192", "512x512"]));
  expect((m.icons ?? []).some((i) => i.purpose === "maskable")).toBe(true);
});
```

- [ ] **Step 2: Run them to make sure they fail**

Run: `npx vitest run src/lib/brand.test.ts src/app/manifest.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement `ringArc`, `Logo` and the SVG files, copying the geometry from the round-1 B brand sheet.** Then update `manifest.ts`:
  - `name` and `short_name`: "Clarix";
  - description: "Savings, loans, repayments and member statements for every kind of cooperative, with a limit check across every cooperative a member belongs to.";
  - remove `orientation`, so the desktop app can be any shape;
  - add the three PNG icons;
  - `categories: ["finance", "business", "productivity"]`.

- [ ] **Step 4: Render the PNG icons.** `scripts/brand/render-icons.mjs` uses `require('playwright')` and `chromium.launch()`, with no install step. It screenshots `public/icons/icon.svg` and the maskable SVG at 192 and 512 with `omitBackground`, then writes them into `public/icons/`.

Run: `node scripts/brand/render-icons.mjs && file public/icons/*.png`
Expected: three PNGs, at 192×192, 512×512 and 512×512.

- [ ] **Step 5: Run the tests and checks**

Run: `npm test && npx tsc --noEmit && npm run build`
Expected: PASS.

- [ ] **Step 6: Commit and push**

```bash
git add src/components/brand src/lib/brand.ts src/lib/brand.test.ts src/components/clarix/wordmark.tsx public/brand public/icons src/app/icon.svg src/app/apple-icon.svg src/app/manifest.ts src/app/manifest.test.ts scripts/brand
git commit -m "The Clarix logo family, favicon and installable PNG icons"
git push
```

---

### Task 5: SEO files and metadata

**Files:**
- Create: `src/lib/site.ts`.
- Create: `src/app/robots.ts`, `src/app/sitemap.ts` and `src/app/opengraph-image.tsx`. Read `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/01-metadata/opengraph-image.md` first.
- Create: `src/components/marketing/structured-data.tsx`.
- Modify: `src/app/layout.tsx` (metadata).
- Test: `src/lib/site.test.ts`, `src/app/robots.test.ts` and `src/app/sitemap.test.ts`.

**Interfaces:**
- Produces: `siteUrl(): string`, which returns:
  1. `process.env.NEXT_PUBLIC_SITE_URL`, without a trailing slash, when it's set;
  2. otherwise `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`, when that's set;
  3. otherwise `http://localhost:3000`.
- Produces: `PUBLIC_ROUTES: readonly { path: string; priority: number; changeFrequency: "weekly" | "monthly" | "yearly" }[]`:

  | Path | Priority | Change frequency |
  |---|---|---|
  | `/` | 1.0 | weekly |
  | `/pricing` | 0.9 | monthly |
  | `/for-members` | 0.8 | monthly |
  | `/privacy` | 0.3 | yearly |
  | `/login` | 0.2 | yearly |
  | `/signup` | 0.5 | yearly |

- Produces: `PRIVATE_PREFIXES: readonly string[]`, listing every authenticated or one-time area: `/admin`, `/platform`, `/officer`, `/onboarding`, `/dashboard`, `/cooperatives`, `/loans`, `/notifications`, `/profile`, `/help`, `/more`, `/invite`, `/verify`, `/reset-password`, `/offline` and `/api`.
- Produces: `<StructuredData />`, which renders one `application/ld+json` script holding:
  - an `Organization`: name "Clarix", the site URL, and the logo `/brand/clarix-primary.svg`;
  - a `SoftwareApplication`: applicationCategory "FinanceApplication", operatingSystem "Web", and offers with price "150", priceCurrency "NGN" and the description "per active member per month after a 60-day free trial".

- [ ] **Step 1: Write the failing tests**

```ts
// src/lib/site.test.ts
import { siteUrl } from "./site";
test("prefers the configured site URL and strips the slash", () => {
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://clarix-orpin.vercel.app/");
  expect(siteUrl()).toBe("https://clarix-orpin.vercel.app");
});
test("falls back to localhost", () => {
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
  vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "");
  expect(siteUrl()).toBe("http://localhost:3000");
});
// src/app/robots.test.ts
import robots from "./robots";
import { PRIVATE_PREFIXES } from "@/lib/site";
test("blocks every private area and points at the sitemap", () => {
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://clarix-orpin.vercel.app");
  const r = robots();
  const rule = Array.isArray(r.rules) ? r.rules[0] : r.rules;
  expect(rule.allow).toBe("/");
  expect(rule.disallow).toEqual([...PRIVATE_PREFIXES]);
  expect(r.sitemap).toBe("https://clarix-orpin.vercel.app/sitemap.xml");
});
// src/app/sitemap.test.ts
import sitemap from "./sitemap";
test("lists only public pages, absolute, with the home page first", () => {
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://clarix-orpin.vercel.app");
  const s = sitemap();
  expect(s[0].url).toBe("https://clarix-orpin.vercel.app/");
  expect(s.map((e) => e.url)).not.toEqual(expect.arrayContaining([expect.stringMatching(/\/admin|\/dashboard/)]));
});
```

- [ ] **Step 2: Run them to make sure they fail**

Run: `npx vitest run src/lib/site.test.ts src/app/robots.test.ts src/app/sitemap.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement `site.ts`, `robots.ts`, `sitemap.ts` and `opengraph-image.tsx`.** The Open Graph image is 1200×630 on porcelain. It carries the horizontal logo, the headline "Run your cooperative with every number in view." in Mona Sans 800, and a strip of the meter in indigo, ochre and emerald.

- [ ] **Step 4: Set the root metadata in `layout.tsx`:**
  - `metadataBase: new URL(siteUrl())`;
  - the title default "Clarix · Cooperative management with a cross-cooperative limit check", with the template `%s · Clarix`;
  - the description "Savings, loans, repayments and member statements for every kind of cooperative in Nigeria. Before a loan is approved, Clarix checks what the member already owes in every cooperative they belong to.";
  - `alternates.canonical: "/"`;
  - `openGraph` (type website, locale en_NG, siteName Clarix) and `twitter` (`summary_large_image`);
  - `robots: { index: true, follow: true }`.

  Each authenticated area's layout gets `robots: { index: false, follow: false }`. Use the nearest existing layout for each area: `src/app/(app)/layout.tsx`, the admin layout, the platform layout, `src/app/officer/layout.tsx` and `src/app/onboarding/layout.tsx`.

- [ ] **Step 5: Run the tests and checks**

Run: `npm test && npm run build`, then, under `npm start`, `curl -s localhost:3000/robots.txt` and `curl -s localhost:3000/sitemap.xml`.
Expected: the tests pass, robots.txt lists every disallow line and the Sitemap line, and sitemap.xml has the 6 URLs.

- [ ] **Step 6: Commit and push**

```bash
git add src/lib/site.ts src/lib/site.test.ts src/app/robots.ts src/app/robots.test.ts src/app/sitemap.ts src/app/sitemap.test.ts src/app/opengraph-image.tsx src/components/marketing/structured-data.tsx src/app/layout.tsx src/app
git commit -m "robots.txt, sitemap.xml, Open Graph image and structured data; private areas are noindex"
git push
```

---

### Task 6: Pricing logic

**Files:**
- Create: `src/lib/pricing.ts`.
- Test: `src/lib/pricing.test.ts`.

**Interfaces:**
- Produces:
  - **Constants:** `PRICE_PER_ACTIVE_MEMBER_NGN = 150`, `MINIMUM_MONTHLY_BILL_NGN = 5000`, `TRIAL_DAYS = 60`, `GRACE_DAYS = 14`, `YEARLY_MONTHS_CHARGED = 10`.
  - **Types:** `type BillingCycle = "monthly" | "yearly"`.
  - `normaliseMemberCount(input: unknown): number`, returning a non-negative integer: blank, `NaN` and negatives give 0, decimals round down, and anything above 100,000 is clamped to 100,000.
  - `estimateBill(activeMembers: number, cycle: BillingCycle): { monthly: number; total: number; minimumApplied: boolean }`.
  - `formatNaira(amount: number): string`, using `en-NG` grouping, a `₦` prefix and no decimals.

- [ ] **Step 1: Write the failing tests**

```ts
import { estimateBill, normaliseMemberCount, formatNaira } from "./pricing";
test("180 active members, monthly", () =>
  expect(estimateBill(180, "monthly")).toEqual({ monthly: 27000, total: 27000, minimumApplied: false }));
test("yearly charges ten months", () => expect(estimateBill(180, "yearly").total).toBe(270000));
test("small cooperatives pay the minimum", () =>
  expect(estimateBill(12, "monthly")).toEqual({ monthly: 5000, total: 5000, minimumApplied: true }));
test("zero members still shows the minimum, never zero or negative", () =>
  expect(estimateBill(0, "yearly")).toEqual({ monthly: 5000, total: 50000, minimumApplied: true }));
test.each([["", 0], [-5, 0], [12.9, 12], ["abc", 0], [250000, 100000]])("normalises %p to %p", (i, o) =>
  expect(normaliseMemberCount(i)).toBe(o));
test("formats naira", () => expect(formatNaira(1248500)).toBe("₦1,248,500"));
```

- [ ] **Step 2: Run them to make sure they fail**

Run: `npx vitest run src/lib/pricing.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement the functions.** The minimum applies per month, before any yearly multiplication.

- [ ] **Step 4: Run them to make sure they pass**

Run: `npx vitest run src/lib/pricing.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit and push**

```bash
git add src/lib/pricing.ts src/lib/pricing.test.ts
git commit -m "Pricing: ₦150 per active member, ₦5,000 minimum, yearly pays for ten months (D037)"
git push
```

---

### Task 7: Landing navigation and hero

**Files:**
- Rewrite: `src/components/landing/landing-nav.tsx` as `src/components/marketing/site-nav.tsx`, and delete the old file.
- Rewrite: `src/components/landing/landing-hero.tsx` as `src/components/marketing/hero.tsx`.
- Create: `src/components/marketing/hero-carousel.tsx` (client), `src/components/marketing/hero-tilt.tsx` (client) and `src/lib/carousel.ts`.
- Delete: `src/components/landing/hero-backdrop.tsx`.
- Create in `public/images/landing/`: `repay.jpg`, `treasurer.jpg`, `approve.jpg`, `desk.jpg`, `market.jpg` and `members.jpg`. Copy them from the canvas assets in this session's scratchpad (`canvas/assets/`). If that folder is gone, download them again at width 1600 from Unsplash, using these photo IDs:

  | File | Unsplash photo ID |
  |---|---|
  | `repay.jpg` | `_MExu0l-sCM` |
  | `treasurer.jpg` | `wT-xJyLHcNA` |
  | `approve.jpg` | `0Ftgn7-a4dc` |
  | `desk.jpg` | `r2fZ65O6lWY` |
  | `market.jpg` | `cnVn4Gg4b00` |
  | `members.jpg` | `GLLeZ59t3bA` |

- Test: `src/lib/carousel.test.ts`.

**Interfaces:**
- Consumes: `Logo` (Task 4), `buttonVariants` (Task 3), the tokens (Task 2) and `springStandard`.
- Produces:
  - `HERO_SLIDES: readonly { src: string; alt: string; caption: string; position: string }[]`: the four slides, with captions and alt text exactly as on the round-2 canvas landing board, and `position: "50% 25%"`.
  - `SLIDE_INTERVAL_MS = 6000`.
  - `nextSlideIndex(current: number, count: number): number`.
  - `carouselShouldRun({ reducedMotion, documentHidden, count }): boolean`.
  - **`<SiteNav />`:**
    - On desktop, a floating white pill (radius 999) with the flat and raised shadows. It holds:
      - the logo;
      - links to Product (`/#how-it-works`), For members (`/for-members`), Pricing (`/pricing`) and Help (`/#faq`);
      - "Sign in" (tertiary, to `/login`) and "Start free trial" (primary, size sm, to `/signup`).
    - On mobile, the logo, "Start free trial" and a menu button that opens a base-ui sheet.
  - **`<Hero />`**, a server component:
    - **Left column:**
      - the badge "For every kind of cooperative, salaried or not";
      - the H1 "Run your cooperative with every number in view." (`type-display`), and the subline from the canvas;
      - the primary button "Start your 60-day free trial" with an arrow, and the secondary "Book a walkthrough" (a `mailto` link to the support address in `CLARIX_SUPPORT_EMAIL`);
      - three ticks: No card needed · Members always free · Export everything, any time.
    - **Right column:** `<HeroTilt>` wrapping a radius-32 photo frame that holds `<HeroCarousel>`, two floating cards, and then the slide dots. The cards:
      1. "Repayment confirmed · ₦25,000 · Ikeja Traders Thrift", with an emerald-50 tick.
      2. "Amaka can still take on ₦72,363 a month", using the existing `MeterBar` restyled to the Task 2 tokens (committed indigo-600, request ochre-500, available emerald-500) on an indigo-50 well.
  - **`<HeroCarousel />`**, a client component:
    - every slide is a `next/image` with `fill` and `sizes="(min-width: 1024px) 560px, 100vw"`; the first slide has `priority` and the rest load lazily;
    - slides cross-fade over 1.2s, and the active one scales from 1 to 1.06 over 6.5s;
    - it pauses when the document is hidden and doesn't run under reduced motion;
    - the caption sits over a bottom scrim, and the dots are buttons labelled "Show photo n";
    - `aria-roledescription="carousel"` and `aria-live="off"`.
  - **`<HeroTilt>`**, a client component using `useScroll` and `useTransform` from `motion/react`. Across scroll progress 0–0.35, `rotateX` goes from 14° to 0° and scale from 0.94 to 1, with `perspective: 1400px` on the parent. It renders static under reduced motion.

- [ ] **Step 1: Write the failing tests**

```ts
import { nextSlideIndex, carouselShouldRun, SLIDE_INTERVAL_MS } from "./carousel";
test("wraps around", () => { expect(nextSlideIndex(3, 4)).toBe(0); expect(nextSlideIndex(1, 4)).toBe(2); });
test("a single slide stays put", () => expect(nextSlideIndex(0, 1)).toBe(0));
test("six seconds per slide", () => expect(SLIDE_INTERVAL_MS).toBe(6000));
test("never runs for reduced motion, hidden tabs or one slide", () => {
  expect(carouselShouldRun({ reducedMotion: true, documentHidden: false, count: 4 })).toBe(false);
  expect(carouselShouldRun({ reducedMotion: false, documentHidden: true, count: 4 })).toBe(false);
  expect(carouselShouldRun({ reducedMotion: false, documentHidden: false, count: 1 })).toBe(false);
  expect(carouselShouldRun({ reducedMotion: false, documentHidden: false, count: 4 })).toBe(true);
});
```

- [ ] **Step 2: Run them to make sure they fail**

Run: `npx vitest run src/lib/carousel.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement `carousel.ts`, then the four components, matching the Round 2 "Landing page" board for spacing:**
  - content max-width 1240, on a 12-column grid with a 40px gap;
  - hero top padding 56;
  - the photo frame is 600 tall on desktop and 420 on mobile, and on mobile it stacks under the copy;
  - the floating cards are 280 and 330 wide on desktop. On mobile they shrink to the frame width minus 32 and overlap its bottom edge.

- [ ] **Step 4: Run the tests and checks**

Run: `npm test && npx tsc --noEmit && npm run build`
Expected: PASS.

- [ ] **Step 5: Commit and push**

```bash
git add src/lib/carousel.ts src/lib/carousel.test.ts src/components/marketing public/images/landing src/components/landing
git commit -m "Landing hero: floating nav, photo slideshow with real product cards, scroll tilt"
git push
```

---

### Task 8: Landing sections and footer

**Files:**
- Create in `src/components/marketing/`: `built-for.tsx`, `repayment-steps.tsx`, `roles.tsx`, `cross-check.tsx`, `statement-preview.tsx`, `pricing-estimator.tsx` (client), `faq.tsx`, `final-cta.tsx`, `site-footer.tsx` and `copy.ts`.
- Rewrite: `src/app/page.tsx`.
- Test: `src/components/marketing/copy.test.ts`.

**Interfaces:**
- Consumes:
  - `estimateBill`, `normaliseMemberCount` and `formatNaira` (Task 6);
  - `Chip` (Task 3);
  - `Logo` (Task 4);
  - `StructuredData` (Task 5);
  - `SiteNav` and `Hero` (Task 7);
  - the existing `ui/accordion`.
- Produces, in `copy.ts`, used word for word by the components:
  - `BUILT_FOR`: the six cooperative types;
  - `REPAYMENT_STEPS`: three entries;
  - `ROLES`: three entries, each with a photo path, alt text and credit;
  - `FAQ_ITEMS`: the five questions and answers from the canvas board, word for word;
  - `PHOTO_CREDITS`: Adeniji Abdullahi, David Olubaji, Abraham George, Francis Odeyemi, Tunde Buremo and Iwaria, each "on Unsplash".
- Produces: `<PricingEstimator />`:
  - **Billing cycle:** a segmented Monthly / Yearly control (`role="radiogroup"`) whose pill slides on `springStandard`.
  - **Member count:**
    - a stepper with − and + buttons (44px each) that move in steps of 10;
    - a text input with `inputMode="numeric"`, passed through `normaliseMemberCount`.
  - **The bill:** shown with the existing `RollingNumber`.
  - **The note under the bill:**
    - when `minimumApplied`: "The smallest bill is ₦5,000 a month.";
    - otherwise, monthly: "180 members × ₦150";
    - otherwise, yearly: "₦27,000 a month, with two months free".
- Section order on `/`:
  1. Nav
  2. Hero
  3. Built for
  4. Repayment steps (`id="how-it-works"`)
  5. Roles
  6. Cross-cooperative check
  7. Statements
  8. Pricing estimator
  9. FAQ (`id="faq"`)
  10. Final CTA
  11. Footer
- There is no testimonials section.
- Every section heading uses `type-page-title`, and every card is one of the five surface kinds in spec §6. Sections below the hero carry the `reveal` utility.

- [ ] **Step 1: Write the failing test.** It guards the copy rules, which a reviewer can't easily check by eye across many files.

```ts
import * as copy from "./copy";
const all = JSON.stringify(copy);
test("no FMC, hospital, IPPIS or single-employer wording on the public site", () =>
  expect(all).not.toMatch(/FMC|Federal Medical|hospital|IPPIS|One salary/i));
test("no testimonial or invented-proof copy", () =>
  expect(all).not.toMatch(/testimonial|trusted by|10,000\+|★/i));
test("six cooperative types, five FAQs, six photo credits", () => {
  expect(copy.BUILT_FOR).toHaveLength(6);
  expect(copy.FAQ_ITEMS).toHaveLength(5);
  expect(copy.PHOTO_CREDITS).toHaveLength(6);
});
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `npx vitest run src/components/marketing/copy.test.ts`
Expected: FAIL (the module doesn't exist yet).

- [ ] **Step 3: Write `copy.ts`, then the components and `page.tsx`, matching the canvas board.** The footer has:
  - the horizontal logo;
  - links to Privacy, Help (`/#faq`) and Contact (the support email shown as text, with a `mailto` link);
  - "© 2026 Clarix";
  - the photo-credit line.

  There's no Terms link until real terms exist.

- [ ] **Step 4: Run the tests and checks**

Run: `npm test && npm run lint && npx tsc --noEmit && npm run build`
Expected: PASS.

- [ ] **Step 5: Commit and push**

```bash
git add src/components/marketing src/app/page.tsx
git commit -m "Landing sections: repayment steps, roles, the cross-cooperative check, statements, live pricing estimator, FAQ"
git push
```

---

### Task 9: Pricing, For members and Privacy pages

**Files:**
- Create: `src/app/pricing/page.tsx` and `src/app/for-members/page.tsx`.
- Modify: `src/app/privacy/page.tsx`. Restyle it to the new tokens and remove the FMC, IPPIS and employer-only wording. Describe payslips **and** bank statements as income evidence, and say who can open them: only the reviewing officer, during a loan review (D031, D038).
- Modify, copy only: `src/app/(auth)/layout.tsx` and `src/app/(auth)/signup/page.tsx`. Remove "Built for FMC Abeokuta's staff cooperatives" and similar lines. The layout restyle is plan 2.
- Test: extend `src/components/marketing/copy.test.ts` with `PRICING_PAGE` and `FOR_MEMBERS_PAGE` copy objects.

**Interfaces:**
- Consumes: the components from Tasks 6–8.
- Produces:
  - **`/pricing`:**
    1. The H1 "One price, only for members who use it".
    2. The `PricingEstimator`.
    3. A definition list covering what counts as active, the 60-day trial, the 14-day grace period, and read-only after it ("nothing is deleted; you and your members can still view and export every record").
    4. The billing questions from the FAQ.
    5. The final CTA.
  - **`/for-members`:**
    1. The H1 "Every cooperative you belong to, in one place".
    2. A three-step "How to join": find your cooperative, add your income evidence, get approved.
    3. What members see.
    4. "Free, always".
    5. The primary CTA "Find your cooperative", linking to `/signup?as=member`.
  - Each page exports its own `metadata` (title and description) and can be reached from the nav and the sitemap.

- [ ] **Step 1: Extend the copy test.** `PRICING_PAGE` and `FOR_MEMBERS_PAGE` are covered by the same FMC and testimonial bans, and `PRICING_PAGE` must mention "₦150", "₦5,000", "60 days" and "read-only".

- [ ] **Step 2: Run it to make sure it fails**

Run: `npx vitest run src/components/marketing/copy.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement both pages and the privacy and auth copy edits.** Then run `grep -rn "FMC\|Federal Medical\|IPPIS" src/app/page.tsx src/app/pricing src/app/for-members src/app/privacy src/app/\(auth\) src/components/marketing`. Expected: no matches.

- [ ] **Step 4: Run the tests and checks**

Run: `npm test && npm run lint && npx tsc --noEmit && npm run build`
Expected: PASS.

- [ ] **Step 5: Commit and push**

```bash
git add src/app/pricing src/app/for-members src/app/privacy src/app/\(auth\) src/components/marketing
git commit -m "Pricing and For members pages; privacy and sign-up copy no longer assume one employer"
git push
```

---

### Task 10: Visual check, documents and the preview

**Files:**
- Create: `scripts/visual/check-marketing.mjs`.
- Modify: `DESIGN_SYSTEM.md`. Replace the token, type, radius, motion and dark-mode sections with a short summary and a pointer to the spec. Keep the anti-generic checklist, updated with the spec §6 and §12 bans.
- Modify: `docs/planning/clarix-employee-ux-blueprint.md` §1.1. Amend the landing description to match what was built (the light hero, the photo slideshow and the sections, with the dark navy header removed), adding the note "Amended 2026-11-21, see spec §11.9".
- Modify: `docs/PROJECT-STATE.md`, marking the plan 1 checklist done.

**Interfaces:**
- Consumes: everything above.

- [ ] **Step 1: Write the visual check script.** It uses `require('playwright')` and `chromium.launch()`, and runs against `BASE_URL` (default `http://localhost:3000`).
  - **Pages and widths:** `/`, `/pricing`, `/for-members`, `/privacy` and `/login`, each at widths 360, 390, 768 and 1440.
  - **For each page and width:**
    1. Assert `document.documentElement.scrollWidth <= window.innerWidth`.
    2. Assert there are no console errors.
    3. Assert that exactly one `button` or `a` in the first viewport is styled as primary (select it by the primary class from `buttonVariants`).
    4. Save `scripts/visual/out/<page>-<width>.png` at `deviceScaleFactor: 1`.
  - **Reduced motion:** open `/` with `reducedMotion: 'reduce'`, wait 7 seconds, and assert that the active slide is still slide 1.
  - It exits non-zero on any failure.

- [ ] **Step 2: Run it against a production build**

Run: `npm run build && (npm start &) && sleep 5 && node scripts/visual/check-marketing.mjs`
Expected: PASS, with 20 screenshots. Open each screenshot, compare it with the "Landing page" canvas board, and fix any difference in spacing, size or hierarchy before going on.

- [ ] **Step 3: Update the three documents** listed under Files, and add `scripts/visual/out/` to `.gitignore`.

- [ ] **Step 4: Run the full checks once more**

Run: `npm test && npm run lint && npx tsc --noEmit && npm run build`
Expected: PASS.

- [ ] **Step 5: Commit, push and check the Vercel preview**

```bash
git add scripts/visual DESIGN_SYSTEM.md docs .gitignore
git commit -m "Visual check for the marketing site; design docs point at the Adire spec"
git push
```

Confirm the preview deployment for this branch on the `clarix` Vercel project reaches READY. Then run `BASE_URL=<preview url> node scripts/visual/check-marketing.mjs`. Expected: PASS.

- [ ] **Step 6: Open the pull request without merging it, and hand it to the owner.** Target `main`, and use the repository's PR template if there is one. The body lists every page changed, the preview URL, and the plans that follow. Do not merge.
