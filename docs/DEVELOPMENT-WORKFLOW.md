# DEVELOPMENT-WORKFLOW.md, Clarix

**Authority level: 8 of 14.** Defers to `DECISIONS.md` D015, D016 (identity now D033) and D032, which this document implements
operationally. Every agent (Claude Code included) and every human working on this repo follows
this loop and these two hard gates.

## The loop: PLAN → IMPLEMENT → TEST → REVIEW → CORRECT → ACCEPT

1. **PLAN.** Before writing code, state which step in `BUILD-PLAN.md` (and which requirement in
   `MVP-SCOPE.md`, screen in `docs/planning/`, and cases in `EDGE-CASES.md`) this work satisfies, and name the files it will touch. If
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
6. **ACCEPT.** Only after REVIEW passes clean: commit (see §1 below), push **the branch**, open a
   PR, let Vercel's Preview deployment build it, check it yourself at 360/390/1280/1440px, put the
   Preview link and screenshots in the PR, tick the step in `BUILD-PLAN.md`, and update
   `docs/PROJECT-STATE.md`. Then stop: the owner reviews and decides when it merges (§4, D032).
   ACCEPT never includes merging.

---

## 1. Hard requirement: commit identity, verified every session

Every commit in this repository must be authored as:

```
Name:  Temi-daniel124
Email: temmydaniel124@gmail.com
```

(D033: the repository moved to GitHub `Temi-daniel124` and the Vercel account registered to this
address on 22 November 2026; the earlier address in D016 is retired.)

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
Supabase/Postgres stack via Docker on the development machine. "The development machine" means
every place an agent or person works on Clarix: the owner's laptop **and** every Claude Code cloud
session. The only place a Supabase stack is ever started is the GitHub Actions runner below. This was previously done and
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
separate local Postgres and no staging database: **Preview and Production share this one project
(D043)**, and it holds the live demo data. So:

- From a branch, an agent may apply only an **additive** migration (new table, new column with a
  default, new function, new policy). The PR title says "Migration: additive, applied".
- A migration that changes or removes anything `main` relies on is applied only when the owner says
  "merge" for that PR, immediately before the merge. The PR title says "Migration: applies at merge".
- Never delete, reset or bulk-rewrite the demo data (five FMC cooperatives, four demo accounts).
  Destructive tests use a throwaway cooperative created for the test and removed after it.
- `supabase db diff` is safe at any time (it only reads). `supabase db reset` is **never** run
  against the linked project.

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
the cost lands on GitHub's infrastructure, never on a laptop or a cloud session. Supabase officially
documents running `supabase start` and pgTAP this way in CI.

### GitHub Actions workflow stub

This is committed at `.github/workflows/db-tests.yml`. It is the only place `supabase start` and
`supabase db reset` are allowed to run: on GitHub's throwaway Ubuntu runner, against an empty
database that exists only for the length of the job, never against the real project.

```yaml
name: Database tests

on:
  pull_request:
    paths:
      - "supabase/migrations/**"
      - "supabase/tests/**"
      - ".github/workflows/db-tests.yml"

jobs:
  pgtap:
    name: pgTAP / RLS tests (hosted runner — Docker lives here, not on any laptop)
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Install Supabase CLI
        uses: supabase/setup-cli@v1
        with:
          version: latest

      - name: Start local Supabase stack (runner-only — never run this command on a laptop)
        run: supabase start

      - name: Apply migrations to the ephemeral runner database
        run: supabase db reset

      - name: Run pgTAP suite
        run: |
          if [ -d "supabase/tests" ] && [ -n "$(find supabase/tests -name '*.sql' -print -quit)" ]; then
            supabase test db
          else
            echo "No pgTAP tests found yet under supabase/tests/."
          fi

      - name: Stop Supabase stack
        if: always()
        run: supabase stop --no-backup
```

What it does: on any PR that touches migrations, tests or the workflow itself, it starts a fresh
stack on the runner, applies every migration from zero (which also proves the migrations replay
cleanly), runs every `supabase/tests/*.sql` pgTAP file, and fails the check if any test fails.
Branch protection is deferred by the owner, so today a red check does not block the merge button;
it still blocks the owner's acceptance, and no agent asks for a merge on a red check.

Every migration that creates a table scoped by `cooperative_id` or `institution_id` adds a pgTAP
file under `supabase/tests/` in the same PR proving another cooperative's user cannot read or write
its rows.

## 3. What actually gets tested where

| Kind of test | Where it runs | Why |
|---|---|---|
| RLS policy correctness (can Cooperative A ever read Cooperative B's rows?) | GitHub Actions (pgTAP) | Needs a real Postgres with `auth.users`/RLS behavior, Docker, but on the runner. |
| Reservation/advisory-lock concurrency behavior | GitHub Actions (pgTAP or a scripted concurrent-request test) | Same reason; also needs to simulate real concurrent transactions. |
| Eligibility arithmetic (Step 1/2 formulas in `DATA-MODEL.md`) | Unit tests, run locally and in CI, no Docker needed | Pure functions, no database required to test the math itself. |
| UI/screen completeness against `docs/planning/*.md` | Manual review during REVIEW step, and Vercel Preview inspection | No automated visual-diff tooling in v1; the design bar is enforced by disciplined review, not a snapshot test suite (P1 candidate: Playwright + visual regression, see `TOOLING-POLICY.md`). |

## 4. Branching, pull requests and deploys (D032)

- **Never commit to `main`.** Every change, however small, is a branch named
  `r2/<phase>-<step>-<short-name>` (or the branch a session was assigned) and a pull request.
- Every push to a branch gets a Vercel Preview. The PR description carries: the BUILD-PLAN step, the
  decisions and edge cases covered, the Preview URL, phone and desktop screenshots of every changed
  screen, a "How to check it" list for the owner, and "Needs migration applied" if it has one.
- **Only the owner merges**, or an agent the owner has told, in words, to merge that specific PR.
  Approval on one PR does not cover another. Never enable auto-merge. Never promote a Preview to
  Production by hand.
- Never force-push, rebase or delete `main`. On a feature branch, prefer new commits over rewriting
  history once a PR is open.
- Keep branches short-lived: one BUILD-PLAN step each. If review asks for more, it goes on the same
  branch; if it is a new step, it is a new branch.
- **Stacked steps.** When a step is built while the previous step's PR is still open, its branch
  starts from that previous step's branch, never from `main`, and its PR's base is that branch, so
  each PR shows only its own step. Title it "R2 <step number>: <step name>". The PR body lists the
  whole chain of open PRs in merge order and every migration not yet applied. Nothing in the chain
  is merged and nothing is pushed to `main`; the owner merges the whole chain later, in order.
  Database rule is unchanged: a purely additive migration may be applied from the branch (say so in
  the PR); anything that changes or removes what `main` uses stays unapplied until merge.
- Branch protection on `main` is deferred by the owner; D032 is the rule until it is on.

## 5. Visual QA (R2, light theme only, D037)

For every UI PR: check at 360×800, 390×844, 1280×800 and 1440×900; with `prefers-reduced-motion`;
with keyboard only on desktop; and against `DESIGN_SYSTEM.md` §11. Playwright (pre-installed in the
cloud environment) is the way to take the screenshots: sign in with the demo accounts from the
environment, never from a committed file. There is no dark-mode check any more.
