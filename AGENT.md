# AGENT.md, Clarix

**Authority level: 10 of 14.** The full order is in "The governing documents" below.

This file is for any AI coding agent working in this repository (Claude Code is the one in active
use; this file is written generically so it holds up if that ever changes). If you are Claude Code,
also read `CLAUDE.md`, which adds Claude-Code-specific detail.

## Where to start

`docs/BUILD-PLAN.md` is the ordered list of work for Release 2. Find the first unticked step, read
the documents that step names, and do only that step in one branch and one pull request.

## Read this first, in this order

1. `docs/DECISIONS.md`: the log of record. Read D032 to D051 (Release 2) closely. Never contradict it;
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
  deployment, unless the owner has said so in words for that specific change. Preview and Production
  share one Supabase project (D043): from a branch only an additive migration may be applied, and
  never delete or reset the demo data. Every change is a branch, a PR and a Vercel Preview.
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

## The governing documents, highest authority first

When two documents disagree, the one higher in this list wins. This order is set by the owner and is
the same in every file that states an authority level.

| # | Document | What it governs |
|---|---|---|
| 1 | `docs/DECISIONS.md` | The log of record. Every locked choice. Never contradict it. |
| 2 | `docs/PRODUCT.md` | Why Clarix exists, who it serves, the rules of the eligibility check. |
| 3 | `docs/DATA-MODEL.md` | The canonical schema and its constraints. |
| 4 | `docs/ARCHITECTURE.md` | How the system is built and deployed; the one Supabase project. |
| 5 | `docs/ROLES-AND-PERMISSIONS.md` | Who can see and do what. |
| 6 | `docs/MVP-SCOPE.md` | What this release builds and what stays out. |
| 7 | `docs/PROJECT-STATE.md` | What exists now, what is broken, what waits on the owner. |
| 8 | `docs/DEVELOPMENT-WORKFLOW.md` | The working loop, git identity, no Docker, migrations, CI. |
| 9 | `docs/TOOLING-POLICY.md` | Which packages and services may be used or added. |
| 10 | `AGENT.md` | This file: rules for any coding agent. |
| 11 | `CLAUDE.md` | Claude-Code-specific rules on top of this file. |
| 12 | `BUILD.md` | Setup and day-to-day commands. |
| 13 | `SECURITY.md` | The boundaries: RLS, secrets, personal data, production. |
| 14 | `DESIGN_SYSTEM.md` | Every token, component and motion value; the pixel-perfect contract. |

Supporting documents sit below these 14 and follow them: `docs/BUILD-PLAN.md` (the ordered steps),
`docs/EDGE-CASES.md`, the screen blueprints under `docs/planning/`, `docs/BRAND.md` and
`docs/REFERENCE-STUDY.md`. A blueprint's screen detail is applied using `DESIGN_SYSTEM.md`'s tokens.

A lower document never overrides a higher one, but a lower document can be *more specific*: where
`DESIGN_SYSTEM.md` gives an exact value and nothing higher speaks to it, that value is the rule.
`SECURITY.md`'s boundaries are hard requirements; nothing in this ordering makes them optional.

## When something is genuinely ambiguous

Use the order above. If it is still unclear, or a change would contradict a Locked decision, ask the
owner plainly rather than guessing.
