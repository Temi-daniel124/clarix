/**
 * The short-lived proof that somebody reached the password-choosing screen through a reset link,
 * rather than merely being signed in.
 *
 * Without it, that screen would let anybody with a live session set a new password without knowing
 * the current one, which is exactly the check the Profile security section makes on purpose. The
 * cookie is http-only, scoped to `/reset-password`, and cleared the moment the password is set.
 */
export const RESET_TICKET_COOKIE = "clarix-password-reset";

/** Fifteen minutes: long enough to choose a password, short enough not to linger. */
export const RESET_TICKET_MAX_AGE = 60 * 15;
