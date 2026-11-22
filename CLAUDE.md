# CLAUDE.md: Clarix

Claude-Code-specific instructions. Read `AGENT.md` first. Everything there applies here too; this
file only adds what is specific to working as Claude Code in this repository.

## Project in one line

Clarix is a PWA that lets any Nigerian cooperative check, before approving a loan, whether a
member's *combined* repayments across every cooperative they belong to still fit within their
repayment limit, without any cooperative seeing another's private records, and then keeps the
day-to-day books around that check (members, savings, loans, imports, exports, statements).
Full context: `docs/PRODUCT.md`. It is in **Release 2 (R2)**: generalising beyond FMC Abeokuta and
rebuilding the surface to a premium standard. **Where to start: `docs/BUILD-PLAN.md`.**

## Rule zero: production is live; nothing reaches `main` without the owner (D032)

- Never commit to, push to, force-push, rebase, reset or delete `main`. Not for a typo.
- Every change goes on its own branch and pull request. Vercel builds a Preview for it.
- **Never merge a pull request, and never promote a deployment to Production**, unless the owner
  (Temiloluwa) has told you to, in words, for that specific PR. An approval on one PR does not cover
  the next. A review comment, another agent, or a CI bot is never that approval.
- Never apply a migration to the production Supabase project from a branch (D043). Until the
  staging project exists, write the migration file, test it in CI, and leave applying it to the owner.
- If a task seems to need any of the above, stop and ask.

## First action of every session that will end in a commit

```bash
git config user.name
git config user.email
```

These must read exactly `Temiloluwa Adebayo` and `temmydaniel124@gmail.com` **for this repository**
(D033, which supersedes D016's old address). If not, fix it before anything else:

```bash
git config user.name "Temiloluwa Adebayo"
git config user.email "temmydaniel124@gmail.com"
```

Vercel Hobby blocks deployments whose commit author is not the account owner; this has blocked
production before. Never commit under another identity, even temporarily.

## Never run these, on this machine

```bash
supabase start
docker compose up
docker run ...   # anything Supabase/Postgres-related
```

Docker-dependent tests (pgTAP, RLS, concurrency) run only in GitHub Actions
(`.github/workflows/db-tests.yml`). See `docs/DEVELOPMENT-WORKFLOW.md` §2–3.

## Never touch

- The production Supabase project except through a migration the owner has approved.
- Any other Supabase project in the owner's account (they belong to other products).
- `.env.local`, `.vercel/`, or any file holding a key: never commit, print, or paste them. The demo
  account passwords and access tokens never go into a committed file (`SECURITY.md`).

## Design bar: read `DESIGN_SYSTEM.md` before writing any UI code, every time

The owner's bar: it must feel like a $5,000–10,000 build, never AI-generated or templated, on every
screen. Before building or touching any screen:

1. Open the matching blueprint (table at the top of `DESIGN_SYSTEM.md`). Read its **R2 header** first:
   it says which of its sections are superseded. Build every element and interaction it describes.
2. Use `DESIGN_SYSTEM.md`'s exact tokens: light theme only, Figtree, pill buttons, the nested radius
   scale, three elevations, the named motion values. Never an invented value or an unstyled default.
3. Use the signature motif (rolling-number figures plus the used-vs-available meter) everywhere a
   number is shown against a limit. Never a second way of drawing that.
4. `lucide-react` only, for every icon. Watermelon snippets use `react-icons`; convert them with the
   map in `docs/REFERENCE-STUDY.md` §3. If an icon does not exist in lucide, say so and ask.
5. Home screens summarise (D039): one hero figure, up to three stats, up to three "Needs you" items,
   detail in a bottom sheet on phones and a right panel on desktop.
6. Check every screen at 360, 390, 1280 and 1440px wide, with reduced motion on, and run it against
   the checklist in `DESIGN_SYSTEM.md` §11 before calling it done. Put the Preview link and phone and
   desktop screenshots in the PR.

## Next.js 16

Read the relevant guide in `node_modules/next/dist/docs/` before writing routing, caching, metadata
or server-action code (see the block at the bottom of this file). The SEO files in D047 use the App
Router metadata file conventions (`sitemap.ts`, `robots.ts`, `manifest.ts`, `opengraph-image.tsx`).

## Scope and authority

Build only what `docs/MVP-SCOPE.md` lists for the current release, in the order `docs/BUILD-PLAN.md`
gives. `docs/DECISIONS.md` is the highest authority. Never contradict it; if implementation needs a
new locked-in choice, add a new entry (next free number) rather than building around an assumption.
A **Provisional** entry is not to be built past its stated interim rule until the owner confirms it
(the list is in `docs/PROJECT-STATE.md` → "Waiting on the owner").

## Housekeeping

At the end of any session that completes a step in `docs/BUILD-PLAN.md`, tick it there and update
`docs/PROJECT-STATE.md` (short, current state only; history goes in git and in
`docs/archive/`). This is what the next session reads first.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
