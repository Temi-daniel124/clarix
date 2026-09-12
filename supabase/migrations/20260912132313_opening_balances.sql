-- Clarix — migration 013: an imported opening balance becomes a ledger entry.
--
-- Found while reviewing Member Profile (blueprint 5.2) by eye. Migration 012 made
-- `cooperative_memberships.savings_balance` derived from `savings_transactions`, which is right —
-- a balance that disagrees with the entries behind it is exactly what a member would be right to
-- distrust. But an imported balance has no entries behind it: the roster carries a figure, and
-- migration 010's trigger copied that figure onto the membership directly.
--
-- So the two changes collided. Recording the first contribution against an imported member would
-- have recomputed their balance from a ledger containing only that one contribution, silently
-- erasing everything the cooperative imported. The Savings tab already showed the seam: a member
-- with 145,000 and "nothing recorded yet" beneath it.
--
-- The fix is to make the imported figure an entry like any other, so there is one account of
-- where the money came from and the member can see it on their own statement. Two parts:
--
--   1. Backfill: every membership whose balance is currently unexplained by its ledger gets one
--      entry for the difference, described for what it is.
--   2. The roster-link trigger writes that entry instead of setting the balance, and lets the
--      balance trigger from 012 do the arithmetic.

-- ---------------------------------------------------------------------------
-- 1. Explain the balances that already exist
-- ---------------------------------------------------------------------------

insert into public.savings_transactions (membership_id, type, amount, description, recorded_at)
select
  m.id,
  'contribution',
  m.savings_balance - coalesce(ledger.total, 0),
  'Balance carried over from the cooperative''s own records',
  coalesce(m.joined_at, now())
from public.cooperative_memberships m
left join lateral (
  select sum(
    case t.type
      when 'contribution' then t.amount
      when 'withdrawal_record' then -t.amount
      else 0
    end
  ) as total
  from public.savings_transactions t
  where t.membership_id = m.id
) ledger on true
where m.savings_balance - coalesce(ledger.total, 0) > 0;

-- ---------------------------------------------------------------------------
-- 2. And for every membership created from a roster entry from now on
-- ---------------------------------------------------------------------------

create or replace function public.apply_roster_link()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $fn$
declare
  v_employee_id text;
  v_entry public.member_roster_entries;
begin
  select u.employee_id into v_employee_id from public.users u where u.id = new.user_id;
  if v_employee_id is null then
    return null;
  end if;

  select * into v_entry
    from public.member_roster_entries e
   where e.cooperative_id = new.cooperative_id
     and e.employee_id = v_employee_id
     and e.membership_id is null
   limit 1;

  if not found then
    return null;
  end if;

  update public.member_roster_entries
     set membership_id = new.id, linked_at = now()
   where id = v_entry.id;

  -- The cooperative imported this person, so they are a member rather than an applicant.
  update public.cooperative_memberships
     set status = 'active',
         joined_at = coalesce(joined_at, now())
   where id = new.id
     and status <> 'active';

  -- The imported figure enters as an entry rather than as a bare balance, so the statement the
  -- member reads explains where their opening balance came from. The balance itself follows,
  -- via the trigger from migration 012.
  if v_entry.savings_balance > 0 then
    insert into public.savings_transactions (membership_id, type, amount, description)
    values (
      new.id,
      'contribution',
      v_entry.savings_balance,
      'Balance carried over from the cooperative''s own records'
    );
  end if;

  return null;
end;
$fn$;

revoke execute on function public.apply_roster_link() from public, anon, authenticated;
