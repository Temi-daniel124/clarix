# CLAUDE.md — Clarix

Claude-Code-specific instructions. Read `AGENT.md` first — everything there applies here too;
this file only adds what's specific to working as Claude Code in this repository.

## Project in one line

Clarix is a PWA that lets FMC Abeokuta's staff cooperatives check, before approving a loan,
whether a member's *combined* obligations across every cooperative they belong to still fit
within the legally agreed salary-deduction cap — without any cooperative seeing another's private
records. Full context: `docs/PRODUCT.md`.

## First action of every session that will end in a commit

Run, and actually check the output, before doing anything else:

```bash
git config user.name
git config user.email
```

These must read exactly `Temiloluwa Adebayo` and `adrianwilliams128765@gmail.com` **for this
repository**. If not, fix it immediately:

```bash
git config user.name "Temiloluwa Adebayo"
git config user.email "adrianwilliams128765@gmail.com"
```

Do not proceed to commit under any other identity, even temporarily. See
`docs/DEVELOPMENT-WORKFLOW.md` §1 for why this is a hard gate — it previously caused Vercel to
block a production deployment outright.

## Never run these, on this machine

```bash
supabase start
docker compose up
docker run ...   # anything Supabase/Postgres-related
```

Local schema work uses `supabase link` (one time) then `supabase db diff` / `supabase db push`
against the real remote `Clarix` project. Docker-dependent tests run only inside GitHub Actions —
see `.github/workflows/db-tests.yml` and `docs/DEVELOPMENT-WORKFLOW.md` §2–3.

## Design bar — read `DESIGN_SYSTEM.md` before writing any UI code, every time

This is stated plainly because it's the most likely thing to slip under time pressure: the client
has repeatedly and explicitly required that Clarix must never look AI-generated, generic, or
templated — on frontend or backend-facing admin screens. Before building or touching any screen:

1. Open the matching blueprint under `docs/planning/` for the role that screen belongs to, and
   build every element and interaction it describes — not an approximation, not "close enough."
2. Open `DESIGN_SYSTEM.md` and use its exact tokens (color, type scale, spacing, radius, shadow,
   the one standard motion spring config) — never an invented value, never a default shadcn/
   Tailwind value left unstyled "for now."
3. Use the signature motif — rolling-number figures plus the used-vs-available meter — everywhere
   a number is shown against a limit. Never introduce a second way of visualizing that
   relationship anywhere in the product.
4. `lucide-react` only, for every icon, everywhere. If a needed icon doesn't exist in
   `lucide-react`, say so and ask, rather than reaching for a different icon package.
5. Treat this as pixel-level work: exact spacing values, exact type sizes, exact motion timing,
   correct light/dark token pairs, correct responsive behavior at both mobile and desktop widths.
   "Functionally complete but visually approximate" is an incomplete task, not a finished one.
6. Run the finished screen mentally (or literally, via the Preview deployment) against the
   Concrete Anti-Generic-Design Checklist in `DESIGN_SYSTEM.md` before calling the work done.

## Scope and authority

Only build what `docs/MVP-SCOPE.md` lists under Must-Have (P0). `docs/DECISIONS.md` is the
highest-authority document in this repo — never contradict it, and if a new locked-in choice
genuinely needs to be made during implementation, add it there with a new entry rather than just
building around an undocumented assumption.

## Housekeeping

Keep `docs/PROJECT-STATE.md` current — update its checklist at the end of any session that
completes a milestone (account created, migration pushed, screen accepted, etc.). This is the
file a future session (yours or a human's) reads first to know where things actually stand.
