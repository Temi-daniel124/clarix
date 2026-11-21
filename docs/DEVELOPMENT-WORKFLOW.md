# DEVELOPMENT-WORKFLOW.md, Clarix

**Authority level: 3.** Defers to `DECISIONS.md` D015 and D016, which this document implements
operationally. Every agent (Claude Code included) and every human working on this repo follows
this loop and these two hard gates.

## The loop: PLAN → IMPLEMENT → TEST → REVIEW → CORRECT → ACCEPT

1. **PLAN.** Before writing code, state which requirement in `MVP-SCOPE.md` (or which screen in
   `docs/planning/*-ux-blueprint.md`) this work satisfies, and name the files it will touch. If
   the work doesn't map to something already written down in `DECISIONS.md`, `PRODUCT.md`,
   `MVP-SCOPE.md`, `ROLES-AND-PERMISSIONS.md`, or a UX blueprint, stop and raise it, don't
   improvise scope.
2. **IMPLEMENT.** Write the smallest coherent change that satisfies the plan. Follow
   `DESIGN_SYSTEM.md` exactly for anything UI-facing: no placeholder styling "to fix later."
   Follow `DATA-MODEL.md` exactly for anything schema-facing, migrations only, never a manual
   dashboard edit against the live project.
3. **TEST.** Every change that touches the database, RLS, or the eligibility/reservation logic
   gets a corresponding pgTAP test (see §3 below. These run in CI, not locally). Every
   change that touches UI gets checked against the relevant screen description in
   `docs/planning/` for completeness (every listed element and interaction present) before moving
   on.
4. **REVIEW.** Re-read the diff as if reviewing someone else's PR: does it match the plan, does it
   match the design system pixel-for-pixel (spacing, tokens, motion, the signature meter/rolling-
   number motif where a number-against-a-limit is shown), does it introduce any dependency not on
   the approved list in `TOOLING-POLICY.md`?
5. **CORRECT.** Fix what review found. Don't silently lower the bar (e.g. don't skip the meter
   motif because it's fiddly), either implement it correctly or flag it explicitly as
   incomplete and say why.
6. **ACCEPT.** Only after REVIEW passes clean: commit (see §1 below), push, let Vercel's Preview
   deployment build it, and confirm the Preview looks and behaves correctly before it's
   considered done. Update `docs/PROJECT-STATE.md`'s checklist if this closes an item there.

---

## 1. Hard requirement: commit identity, verified every session

Every commit in this repository must be authored as:

```
Name:  Temi-daniel124
Email: temmydaniel124@gmail.com
```

**Why this is a hard gate, not a convention:** a prior mismatch between the committing identity
and what GitHub/Vercel expected caused Vercel to block a production deployment outright. This
must never happen again.

**Verify before the first commit of every session** (run this, don't assume it):

```bash
git config user.name
git config user.email
```

If either doesn't exactly match the identity above **for this repository** (check local config,
not global: a global default set for other projects must not silently apply here, and this
repo's setting must not silently leak into other projects either):

```bash
git config user.name "Temi-daniel124"
git config user.email "temmydaniel124@gmail.com"
```

**Also confirm, once, on the GitHub side (not a per-session check, but check it now):**
`temmydaniel124@gmail.com` must appear under the GitHub account's **verified** email
addresses (Settings → Emails), and "Keep my email address private" must not be substituting a
`noreply` address for commits pushed from this machine. That private-email substitution is a
common, easy-to-miss cause of exactly the author-mismatch problem that caused the earlier block.

An agent (Claude Code included) must run the two `git config` read commands above as its literal
first action in any session that will end in a commit, and must refuse to commit if they don't
match, fixing the config first, never committing under the wrong identity "just this once."

## 2. Hard requirement: no local Docker

**Never run** `supabase start`, `docker compose up`, or any other command that starts a local
Supabase/Postgres stack via Docker on the development machine. This was previously done and
consumed roughly 2.3 GB RAM / 6.4 GB disk before Postgres even started, not affordable on this
machine, and not necessary.

**Instead, all local schema work targets the real remote Supabase project directly:**

```bash
# one-time per machine/checkout:
supabase link --project-ref <the Clarix project ref, from ARCHITECTURE.md>

# ongoing schema work:
supabase db diff -f <migration_name>     # generate a migration from local schema edits
supabase db push                          # apply pending migrations to the linked remote project
```

This means the remote `Clarix` Supabase project *is* the development database. There is no
separate local Postgres. Be deliberate with destructive migrations for exactly that reason (no
"just reset my local db" escape hatch exists here).

**Who applies a migration, and how, see `DECISIONS.md` D023.** There are two sanctioned paths,
and which one applies depends on who is at the keyboard:

| Operator | How the migration is applied | Why |
|---|---|---|
| A human maintainer | `supabase db push`, as above | They already hold the database password. |
| An AI coding agent | The Supabase Management API, using the agent's own authorized project connection | The agent is deliberately never given the database password, which `db push` requires. |

Both paths are bound by the same three rules, which are the part that actually matters:

1. **The `.sql` file under `supabase/migrations/` is written first and is the artefact of
   record.** Applying it is a separate, second step.
2. **When an agent applies a migration, its local filename timestamp is reconciled to the version
   the API recorded**, so a later `supabase db push` by a human sees it as already applied rather
   than trying to run it twice.
3. **Neither path may ever apply DDL that was not written down first**: no ad-hoc statements
   typed at the database, no edits through the dashboard's SQL editor. This is unchanged from
   `DATA-MODEL.md` § "Migration discipline" and applies to humans and agents alike.

If you want an agent to use `db push` in future, the way to do it without handing over a raw
password in a prompt is to set `SUPABASE_DB_PASSWORD` in the maintainer's own shell profile, or to
run `supabase link` once interactively so the CLI caches the credential in the OS keyring. That
option is recorded and deliberately not adopted, see D023 for the reasoning.

**Docker-dependent testing (pgTAP, full RLS integration tests) never runs locally either.** It
runs inside GitHub Actions, on GitHub's hosted Ubuntu runner, which provides its own Docker,
the cost lands on GitHub's infrastructure, never on this laptop. Supabase officially documents
`supabase db start` and pgTAP running this way in CI.

### GitHub Actions workflow stub

A ready-to-use stub is committed at `.github/workflows/db-tests.yml` (see that file). It:

- Triggers on pull requests that touch `supabase/migrations/**` or `supabase/tests/**`.
- Runs on `ubuntu-latest` (Docker available natively on the runner. Nothing to install).
- Installs the Supabase CLI, runs `supabase db start` (this is the *only* place `db start` is
  allowed to run, inside CI, never on the laptop), applies migrations, and runs the pgTAP suite
  under `supabase/tests/`.
- Fails the check (blocking merge, once branch protection is turned on) if any test fails.

Update this stub's test path and add real pgTAP files under `supabase/tests/` as the schema in
`DATA-MODEL.md` gets built out: the stub is intentionally minimal until there's something real
for it to run.

## 3. What actually gets tested where

| Kind of test | Where it runs | Why |
|---|---|---|
| RLS policy correctness (can Cooperative A ever read Cooperative B's rows?) | GitHub Actions (pgTAP) | Needs a real Postgres with `auth.users`/RLS behavior, Docker, but on the runner. |
| Reservation/advisory-lock concurrency behavior | GitHub Actions (pgTAP or a scripted concurrent-request test) | Same reason; also needs to simulate real concurrent transactions. |
| Eligibility arithmetic (Step 1/2 formulas in `DATA-MODEL.md`) | Unit tests, run locally and in CI, no Docker needed | Pure functions, no database required to test the math itself. |
| UI/screen completeness against `docs/planning/*.md` | Manual review during REVIEW step, and Vercel Preview inspection | No automated visual-diff tooling in v1; the design bar is enforced by disciplined review, not a snapshot test suite (P1 candidate: Playwright + visual regression, see `TOOLING-POLICY.md`). |

## 4. Branching and deploys

Small, reviewable commits on short-lived branches, merged to the default branch once REVIEW
passes. Every push triggers Vercel: a pull request gets a Preview deployment, a merge to the
default branch deploys to production. Never force-push the default branch. Never skip the commit-
identity check "to save time". It is the specific thing that broke deployment before.
