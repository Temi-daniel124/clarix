-- Clarix — migration 024: a notification category for access requests.
--
-- Alone in its own migration on purpose. Postgres will add a value to an enum inside a
-- transaction, but will not let that value be *used* in the same transaction, and the next
-- migration's functions insert notifications carrying it. Splitting them is the difference
-- between a migration that applies and one that fails on a runtime cast nobody sees until the
-- first request is submitted.
--
-- This is the first staff-facing category. The four that exist are all addressed to an employee
-- about their own money; this one is addressed to a cooperative's admin about somebody asking to
-- look at it (super-admin blueprint 7.2, SECURITY.md).

alter type public.notification_category add value if not exists 'access_request';
