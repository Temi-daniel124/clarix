# AGENT.md, Clarix

This file is for any AI coding agent working in this repository (Claude Code is the one in active
use; this file is written generically so it holds up if that ever changes). If you are Claude Code,
also read `CLAUDE.md`, which adds Claude-Code-specific detail.

## Where to start

`docs/BUILD-PLAN.md` is the ordered list of work for Release 2. Find the first unticked step, read
the documents that step names, and do only that step in one branch and one pull request.

## Read this first, in this order

1. `docs/DECISIONS.md`: the log of record. Read D032 to D049 (Release 2) closely. Never contradict it;
   if something you are about to do conflicts with an entry, stop and say so.
2. `docs/PROJECT-STATE.md`: what exists now, what is broken, and what is waiting on the owner.
3. `docs/BUILD-PLAN.md`: the phase and step you are on, with its acceptance criteria.
4. `docs/PRODUCT.md`, `docs/MVP-SCOPE.md`, `docs/ROLES-AND-PERMISSIONS.md`, `docs/DATA-MODEL.md`,
   `docs/ARCHITECTURE.md`: the "what" and "how" of the system.
5. `docs/EDGE-CASES.md`: the worst cases each feature must survive (members with no salary, people in
   five cooperatives, lapsed subscriptions, bad imports). Every feature PR names the cases it covers.
6. `DESIGN_SYSTEM.md`, then the blueprint for the screen you are touching (table at the top of
   `DESIGN_SYSTEM.md`), then `docs/BRAND.md` and `docs/REFERENCE-STUDY.md` when relevant. Read the
   design system before any UI code, every time.
7. `docs/DEVELOPMENT-WORKFLOW.md` and `docs/TOOLING-POLICY.md`: how to work, and what you may add.
8. `SECURITY.md`: the boundaries that must never be crossed (RLS, secrets, PII, production).

## Non-negotiables

- **Production is protected (D032).** Never commit or push to `main`, never merge a PR, never promote a
  deployment, never apply a migration to production, unless the owner has said so in words for that
  specific change. Every change is a branch, a PR and a Vercel Preview.
- **Git identity, verified every session before the first commit** (D033,
  `docs/DEVELOPMENT-WORKFLOW.md` §1). A mismatch blocks Vercel deployment.
- **No local Docker, ever** (`docs/DEVELOPMENT-WORKFLOW.md` §2).
- **RLS is the security boundary, not the UI.** Every table scoped by `cooperative_id` or
  `institution_id` gets its RLS policy in the same migration that creates it.
- **Nothing silently fails.** An action the person took is either saved and confirmed, or refused with
  a reason on screen. The live "Submit anyway" defect (D040) is the example never to repeat.
- **Design quality is an acceptance criterion.** Every screen matches `DESIGN_SYSTEM.md` and its
  blueprint exactly, light theme only, at phone and desktop widths.
- **No money movement, no payroll integration, no AI in the eligibility decision itself** (D004, D018).
  Clarix records and checks; it never holds, moves or deducts money.
- **No employer is baked into the product** (D034). FMC Abeokuta is the first customer and its demo
  data stays, but code and copy never assume it.
- **Never touch another Supabase project** in the owner's account. Confirm the project ref against
  `docs/ARCHITECTURE.md` before running anything against a database.

## The working loop

PLAN → IMPLEMENT → TEST → REVIEW → CORRECT → ACCEPT for every step, as detailed in
`docs/DEVELOPMENT-WORKFLOW.md`. ACCEPT means the owner has seen the Preview; it never means you merged.

## When something is genuinely ambiguous

Resolve in this order of authority: `docs/DECISIONS.md` > `docs/PRODUCT.md` / `DATA-MODEL.md` /
`ARCHITECTURE.md` / `ROLES-AND-PERMISSIONS.md` > `DESIGN_SYSTEM.md` > `docs/BUILD-PLAN.md` /
`MVP-SCOPE.md` / `EDGE-CASES.md` / `PROJECT-STATE.md` / `DEVELOPMENT-WORKFLOW.md` /
`TOOLING-POLICY.md` > the blueprints under `docs/planning/` > everything else. If it is still unclear,
or a change would contradict a Locked decision, ask the owner plainly rather than guessing.
