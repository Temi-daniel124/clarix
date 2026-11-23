# The demo data, and how to test without touching it

**The demo data in the shared `Clarix` Supabase project is never reset, deleted or bulk-rewritten
without the owner's word (DECISIONS.md D043.2).** That means the five FMC cooperatives, their
members and records, and the four demo accounts (one per role). Not for a test, not to "clean up",
not by an agent, not by a script.

Why it matters: Preview and Production use **one** Supabase project (D043, the owner's decision for
the demonstration stage). Every Preview deployment, every agent session and the live product read
and write the same rows. That is also why every non-Production page carries the strip "Preview ·
uses the live demo data" (BUILD-PLAN 0.4).

There are no seed scripts in this folder, on purpose. The demo data was entered once and is kept, not
regenerated. The demo account passwords are never written in this repository, a seed file, a PR or a
screenshot (`SECURITY.md`).

## Never run

- `supabase db reset` against the linked project.
- `delete`, `truncate` or `update` on any table without a `where` that names one throwaway
  cooperative's id.
- `supabase start`, `docker compose up` or anything else that starts a local database
  (`docs/DEVELOPMENT-WORKFLOW.md` §2). Database tests run only in GitHub Actions.

## Testing something that writes: use a throwaway cooperative

Anything that creates, changes or removes records (approving loans, recording entries, importing
members, entering existing loans) is tested on a cooperative made for the test and removed after it.

### Create one

1. Sign in as the **Super Admin** demo account.
2. **Platform → Cooperatives → New.** Name it so nobody mistakes it for a real one, for example
   `ZZ Test, <your name>, <date>`. It is created **inactive**, so it never appears to members on
   Discovery.
3. Invite its admin with a **test email address you control**, never a demo account. Accept the
   invitation from that address.
4. For members, sign up fresh test accounts (also addresses you control) and add them to this
   cooperative only. Never add a demo account to it, and never add a test account to an FMC
   cooperative.

Write down the cooperative's id (the last part of its Platform URL). Removing it uses that id and
nothing else.

### Remove it

Removing data from the shared project is an owner action, like applying a migration that changes
what `main` uses: an agent does it only when the owner has said so for that cooperative.

1. Check the id is the test cooperative's and not an FMC one:

   ```sql
   select id, name, status, created_at from public.cooperatives where id = '<test cooperative id>';
   ```

2. Delete that one row. Every table that belongs to a cooperative (memberships, staff roles, loan
   products, loans and the ledger through memberships, access grants, internal notes, its audit
   entries) is `on delete cascade`, so this removes all of it and touches nothing else:

   ```sql
   delete from public.cooperatives where id = '<test cooperative id>';
   ```

3. The test **sign-in accounts** are not removed by that. Delete each one in the Supabase dashboard
   (Authentication → Users), by its test email address. Never delete a demo account.

If a test went wrong and touched demo data, stop and tell the owner. Do not try to repair it with a
bulk update.
