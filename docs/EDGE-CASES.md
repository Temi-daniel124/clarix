# EDGE-CASES.md, Clarix

The worst cases Clarix must survive, each traced against the live code (commit `d1c3a0a`) and given a
fallback. The pattern found in R1: missing or odd data became a zero limit, and a zero limit turned
every application into one that silently disappeared. **The R2 rule is that bad or missing data
degrades to "Not assessed yet" or "needs review", never to a crash, a block, or silence.**

Every feature PR names the case numbers it covers and adds a test for each.

## Members and income

| # | Case | What happens in R1 | R2 behaviour | Decision / step |
|---|---|---|---|---|
| E01 | Member has no payslip (trader, artisan, farmer, pensioner, self-employed) | Stuck at onboarding step 3; limit ₦0 if they reach apply | Joins, saves and browses with no evidence. Limit "Not assessed yet" with "Add proof of income". Applications are stored as `pending_review` | D035.5, D040, 3.3 |
| E02 | Member has no staff ID | Stuck at step 2 (ID required, six digits) | Member ID optional unless the cooperative requires it. Identified by phone or email plus the cooperative's member number | D034, 3.1 |
| E03 | Member ID in another format (letters, leading zeros, slashes) | Rejected by the FMC six-digit pattern | Pattern set per cooperative; default none. IDs stored as text, never numbers (keeps leading zeros) | D034, 3.1, 8.2 |
| E04 | Income only visible on bank statements | No path | 3 to 6 months of statements, average monthly inflow, staff confirm | D035.2, 7.2 |
| E09 | Irregular income (seasonal trader, farmer) | One fixed figure only | Average over the statement period; the cooperative may set a lower cap for inflow-based income (default 30%) | D035.3, 7.2 |
| E10 | Typo in income (₦2,656,907 for ₦265,690) | Accepted up to ₦99,999,999; limit 10× too high | Sanity band per cooperative; a jump of more than 3× asks the member to confirm and flags it to the reviewer | 7.5 |
| E11 | Evidence two years old | Used forever | Shows its age on review after the cooperative's window (default 12 months) and asks the member to refresh; still counts | D035.7, 7.4 |
| E13 | Declared income only | Not possible | Allowed if the cooperative permits; marked "Declared, not verified" everywhere until staff verify | D035.2 |
| E14 | Net typed above gross | Rejected with a message | Keep | — |
| E15 | Member's cooperatives use different policies (33.3% of gross vs 30% of inflow) | One platform cap | The lowest resulting limit is used, with one line saying so | D035.4 |

## Loans and the check

| # | Case | R1 | R2 | Decision / step |
|---|---|---|---|---|
| E05 | Over-limit "Submit anyway" | Told "the cooperative has your application"; nothing stored | Stored `pending_review`, flagged, holds nothing, staff decide with a reason | D040, 0.1 |
| E06 | Application from a member with no limit | Vanishes (limit ₦0) | Same as E05 | D040, 0.1 |
| E07 | Two cooperatives approve against the same room in the same minute | Prevented by the advisory lock and re-check | Keep; add a pgTAP test that `pending_review` loans are excluded from the lock's arithmetic | 0.1 |
| E08 | Cooperative joins Clarix with members already owing loans | Committed shows ₦0; limit overstated | "Add existing loan" (0.3) and existing-loan columns in import (8.2). Until a cooperative has entered its book, staff see "Existing loans not entered yet" on its members' checks | D036, 0.3, 8.2 |
| E16 | Member borrows from a cooperative not on Clarix | Invisible | Optional "Other monthly repayments" the member or staff declare, counted against the limit and labelled | 7.1 |
| E17 | Member in five cooperatives, each with loans | Works | Keep; breakdown sheet lists each cooperative only to the member; staff see one combined committed figure | D003 |
| E18 | A cooperative goes read-only for non-payment | — | Its active loans still count in every other cooperative's check; it cannot add new ones | D042, 9.3 |
| E19 | Loan reaches its end date but no one marks it complete | Keeps counting | After the expected end date plus one month, staff get a "Mark as repaid?" Needs-you item; it keeps counting until they act | 6.5 |
| E20 | Reservation lapses while staff are reviewing | Approval refused | Keep; the review panel shows the countdown and a "Ask the member to re-submit" action | 6.5 |

## Imports and records

| # | Case | R1 | R2 | Decision / step |
|---|---|---|---|---|
| E12 | Someone signs up with a colleague's member ID | First claim wins and inherits the balance | Imported balance attaches only after staff confirm the match; the real person can dispute from the "This ID is already linked" screen | 8.5 |
| E21 | Excel strips leading zeros (`004512` → `4512`) | Fails the pattern | Read cells as text where the column is mapped to ID; warn "4 IDs look shortened" in the preview | 8.2 |
| E22 | Spreadsheet with merged header rows, totals row, a second sheet | Untested | Header row picker, totals row detected and excluded, sheet picker | 8.2 |
| E23 | 4,000-row roster | 2,000-row limit | 5,000 rows, saved in chunks of 500 with progress and a resumable summary | 8.2 |
| E24 | Browser validation bypassed | Server saves rows unchecked (RLS still scopes it) | The server action re-validates every row with the same zod schema | 8.2 |
| E25 | Duplicate member in the same file | Flagged | Keep | — |
| E26 | Two admins record the same payment | Two ledger rows | Same member, amount and date within 10 minutes shows "This looks like a duplicate" with Timed Undo | 6.7 |

## Accounts, money and operations

| # | Case | R1 | R2 | Decision / step |
|---|---|---|---|---|
| E27 | Email cannot be delivered (no Resend domain) | Signup cannot complete for anyone but the owner | Every email-dependent screen offers the working path: a copyable invite link, a download, an in-app notice. Never "We've sent you an email" when nothing was sent | D049 |
| E28 | Staff member holds roles at two cooperatives | Always lands on the first | Cooperative switcher | 1.4 |
| E29 | Staff member is also a member | No link to their own member view | "Switch to my member view" in the account menu | 1.4 |
| E30 | Trial ends during a weekend with no admin around | — | 14-day grace, reminders on days 46 and 57, read-only only after grace | D041, D042 |
| E31 | Payment made by transfer with the wrong reference | — | Super Admin records it manually against the right cooperative; the invoice shows "Paid by transfer" | 9.4 |
| E32 | A member count changes mid-month | — | Billed on members active during the calendar month (D041.1), counted when the invoice is generated on the 1st | D041, 9.1 |
| E33 | Free Supabase project paused after 7 idle days | Possible | Demo use keeps it awake; if it pauses, the owner restores it from the dashboard; production moves to Pro on first revenue | D049 |
| E34 | Someone opens a Preview link from a search engine | Indexable | `robots` disallows all and every page is `noindex` on Preview | D047 |
| E35 | Real payslips used as demo data | The uploaded sample holds real names, bank numbers and pension PINs | Never commit or seed real documents; demo seed is synthetic only | SECURITY.md |
| E36 | Offline on a phone | Offline page | Keep; any write attempted offline says "You're offline. Nothing was saved." | — |
