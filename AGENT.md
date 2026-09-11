# AGENT.md — Clarix

This file is for any AI coding agent working in this repository (Claude Code is the one in active
use; this file is written generically so it holds up if that ever changes). If you are Claude
Code specifically, also read `CLAUDE.md` — it adds Claude-Code-specific detail on top of this.

## Read this first, in this order

1. `docs/DECISIONS.md` — the log of record. Never contradict it. If something you're about to do
   seems to conflict with an entry there, stop and say so rather than proceeding.
2. `docs/PROJECT-STATE.md` — what already exists, what doesn't, and the immediate next steps.
   This is a living document; check it before assuming anything about repo/account state.
3. `docs/PRODUCT.md`, `docs/MVP-SCOPE.md`, `docs/ROLES-AND-PERMISSIONS.md`, `docs/DATA-MODEL.md`,
   `docs/ARCHITECTURE.md` — the "what" and "how" of the system.
4. `docs/planning/` — the four role-by-role screen blueprints and the original strategic
   analysis. This is the literal screen inventory for the MVP; build against it, don't reinvent
   screens.
5. `DESIGN_SYSTEM.md` — non-negotiable visual/interaction rules. Read this before writing any
   UI-facing code, every time, not just once.
6. `docs/DEVELOPMENT-WORKFLOW.md` and `docs/TOOLING-POLICY.md` — how you're expected to work, and
   what you're allowed to add as a dependency.
7. `SECURITY.md` — the boundaries that must never be crossed (RLS, secrets, PII).

## Non-negotiables

- **Scope discipline.** Only build what's in `docs/MVP-SCOPE.md` (P0). If a task seems to need
  something outside that list, say so explicitly rather than quietly expanding scope.
- **Git identity, verified every session, before the first commit.** See
  `docs/DEVELOPMENT-WORKFLOW.md` §1. This is not optional and not "usually fine to skip" — a
  mismatch previously blocked production deployment on Vercel.
- **No local Docker, ever.** See `docs/DEVELOPMENT-WORKFLOW.md` §2. Schema work goes through
  `supabase link` + `db diff`/`db push` against the real remote `Clarix` project. Never run
  `supabase start` or any `docker compose` command on this machine.
- **RLS is the security boundary, not the UI.** Every table scoped by `cooperative_id` or
  `organization_id` gets its RLS policy in the same migration that creates it — never "add
  security later."
- **Design quality is an acceptance criterion, not a finishing touch.** Every screen must match
  `DESIGN_SYSTEM.md` and the relevant blueprint under `docs/planning/` exactly — spacing, tokens,
  motion, the signature meter/rolling-number motif wherever a number is shown against a limit.
  "Functionally correct but visually generic" is not an acceptable finished state for any screen
  in this product. Treat every pixel, spacing value, and micro-interaction as something to get
  right, not something to approximate.
- **Never touch the pre-existing, unrelated Supabase project in this organization.** Only the
  `Clarix` project. If you are ever unsure which project you're pointed at, stop and confirm the
  project ref against `docs/ARCHITECTURE.md` before running anything.
- **No money movement, no payroll/IPPIS integration, no AI in the eligibility decision itself.**
  See `docs/DECISIONS.md` D004, D005, D018.

## The working loop

Follow PLAN → IMPLEMENT → TEST → REVIEW → CORRECT → ACCEPT for every unit of work, as detailed in
`docs/DEVELOPMENT-WORKFLOW.md`. Don't skip straight to IMPLEMENT.

## When something is genuinely ambiguous

If a requirement in the planning docs is unclear or two documents seem to disagree, resolve it in
this order of authority: `docs/DECISIONS.md` > `docs/PRODUCT.md`/`DATA-MODEL.md`/`ARCHITECTURE.md`/
`ROLES-AND-PERMISSIONS.md` > `docs/MVP-SCOPE.md`/`PROJECT-STATE.md`/`DEVELOPMENT-WORKFLOW.md`/
`TOOLING-POLICY.md` > everything else. If it's still unclear after that, say so plainly rather
than guessing and moving on.
