# ROLES-AND-PERMISSIONS.md, Clarix

**Authority level: 3.** Defers to `DECISIONS.md` (see D001, D003, D010). For the screen-by-screen
experience of each role, see the four role blueprints under `docs/planning/` (Member, formerly
Employee; Cooperative Admin; Cooperative Officer; Super Admin).

**R2 changes (D034 to D042), in short:** the Employee role is called **Member** everywhere (the
database enum may keep `employee` until a migration renames it; the UI never shows it). Members are
no longer tied to one employer. Staff gain new actions: add existing loans, bulk monthly entry,
apply on a member's behalf, verify income evidence, export records, issue statements. The Super Admin
gains billing actions. The matrix below includes them.

## The four roles

| Role | Scope |
|---|---|
| **Super Admin** | Operates the Clarix platform itself. Not a member of any cooperative's financial data by default, see the Access Grant exception below. |
| **Cooperative Admin** | Head/owner of one cooperative. Full control of that cooperative. Invited by Super Admin, never self-registered. |
| **Cooperative Officer** | Day-to-day staff of one cooperative. Permissions are a subset of Admin's, configured per-officer by that cooperative's own Admin. Invited by their Admin, never by Super Admin. |
| **Member** (was User/Employee) | One Clarix account, with zero or more cooperative memberships, at cooperatives with or without an institution behind them. Open self-service signup. |

## Permission matrix

| Screen / Action | Super Admin | Cooperative Admin | Cooperative Officer | Member |
|---|---|---|---|---|
| Create/activate cooperative account | ✅ | ❌ | ❌ | ❌ |
| Set an institution's default repayment policy | ✅ | view only | ❌ | ❌ |
| Set own cooperative's repayment policy (may only lower an institution cap, D035) | ✅ | ✅ | ❌ | ❌ |
| View own cooperative's member list | ❌* | ✅ | ✅ | ❌ |
| Add/import members | ❌ | ✅ | Configurable | ❌ |
| View a member's full record (own coop) | ❌* | ✅ | ✅ | own record only |
| Run cross-cooperative eligibility check | ❌* | ✅ | ✅ | preview on own new loan only |
| Submit loan application (creates reservation, or `pending_review` if above the limit, D040) | ❌ | ✅ on a member's behalf | Configurable | ✅ own, at one cooperative at a time |
| Approve/reject loan | ❌ | ✅ | Configurable | ❌ |
| Configure cooperative's own loan products/savings ratio | ❌ | ✅ | ❌ | ❌ |
| Add/remove officers, set officer permissions | ❌ | ✅ | ❌ | ❌ |
| Edit cooperative public profile (discovery) | ❌ | ✅ | ❌ | ❌ |
| Add an existing loan / bulk monthly entries (D036) | ❌ | ✅ | Configurable (record permission) | ❌ |
| Verify a member's income evidence (D035) | ❌ | ✅ | Configurable (approve permission) | add own evidence |
| Export records (CSV, XLSX, PDF) and issue statements (D036, D044) | ❌ | ✅ | Configurable (new `export` permission) | download own statements |
| Look up a document verification code (D044) | ✅ | ✅ (own cooperative's documents) | ✅ | ❌ |
| View subscription, invoices; start yearly plan (D041) | ✅ all | ✅ own | ❌ | ❌ |
| Record a manual payment, extend a trial (D042) | ✅ | ❌ | ❌ | ❌ |
| View member home (own data, all own cooperatives) | ❌ | ❌ | ❌ | ✅ |
| Browse cooperative discovery (public info only) | ✅ | ✅ | ✅ | ✅ |
| View audit log | platform-level events only | own cooperative's log | ❌ | ❌ |

*Super Admin has no standing access to member financial detail. A support case requiring it must
go through the explicit, logged Access Grant flow below, never default visibility. This is a
hard requirement, not a convenience shortcut, even for debugging.

## Officer permissions are configured per person, default-deny

A Cooperative Admin toggles exactly what each of their officers can do (search/view members,
record contributions/repayments, submit loan applications, approve/reject loan applications,
add/import members). A permission not explicitly granted is not usable: the UI must not show a
disabled control for something an officer lacks; it should simply not render that control at all.
Admins can also set a purely cosmetic `title` per officer (e.g. "Treasurer," "Secretary") that
never changes the underlying permission set.

## Onboarding differs by role. This is intentional, not an oversight

- **Member, open self-service signup.** Email → verify → name and phone → join or find a
  cooperative → member ID if that cooperative requires one → optional proof of income (payslip,
  bank statement or declared). Nothing after "join" blocks the home screen (D035). No invitation
  needed. (Until a Resend domain is verified, verification email reaches only the owner, D049.)
- **Cooperative Admin, invited by Super Admin, never self-registered.** Super Admin creates the
  `cooperatives` row (part of that cooperative's paid onboarding) and sends a one-time email
  invite via Resend. Accepting it drops the Admin into an Admin-specific setup flow (cooperative
  profile, loan products, repayment policy, spreadsheet import of members and existing loans), never the member join flow, since being
  an Admin doesn't by itself make someone a beneficiary member anywhere.
- **Cooperative Officer, invited by their own Admin, not by Super Admin.** Same invite-link
  mechanic, triggered from the Admin's "manage officers" screen, landing the Officer in a much
  shorter setup (accept invite, set password) since there's no cooperative-level configuration
  for them to do.
- **The important wrinkle:** if the invited email already has a Clarix account under any other
  role or membership, the invite attaches the new role to that *existing* account rather than
  forcing a new signup. One email always resolves to one account (`DECISIONS.md` D010).

## Multi-role accounts

One account per email, always. What varies is which relationships that account holds, and they're
independent per cooperative:

- A `cooperative_memberships` row (beneficiary) is separate from a `cooperative_staff_roles` row
  (admin/officer). A person can have either, both, or neither, at any given cooperative.
- The same user can hold `cooperative_staff_roles` rows at *multiple* cooperatives simultaneously
, officer at A and officer at B is just two rows, not a special case. Being an officer at B
  carries no permission at A; every check is scoped by `cooperative_id`.
- A person can be Admin of their own cooperative while also Officer somewhere else and an ordinary
  contributing member at a third. All under one login.
- What an Admin controls (an officer's title, an officer's permission flags) is scoped to staff
  roles granted at *their own* cooperative only. No visibility or control over that same person's
  roles elsewhere.

## The Access Grant exception (Super Admin)

The one deliberate crossing of the "Super Admin has no standing financial-data access" rule. A
genuine support case (a cooperative reports an unexplained discrepancy) can require a Super Admin
to look at specific member-level data. Rather than allow that quietly, Clarix makes it visible,
justified, and time-boxed:

1. Super Admin submits an access request naming a cooperative (and optionally one member) with a
   required, non-generic reason.
2. The affected cooperative's Admin is notified the moment the request is submitted.
3. Once active, the grant is strictly time-boxed (short default window, e.g. 24 hours) and can be
   revoked early by the requesting Super Admin.
4. The resulting view is read-only, visually distinct (a persistent "temporary access" banner),
   and every screen/record viewed under it is logged individually, more granular than ordinary
   platform audit events.

Full schema: `access_grants` table in `docs/DATA-MODEL.md`. Full screen flow: the Super Admin
blueprint under `docs/planning/`.
