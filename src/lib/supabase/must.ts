/**
 * A read that must succeed (BUILD-PLAN 1.5). A failed query used to come back as `data: null`, and
 * the screen showed it as "nothing here": no loans, no members, ₦0. Wrapping a read in `must`
 * throws instead, so the shell's error page says the page didn't load and offers Try again, which
 * refetches. The message goes to the logs only; the page never shows it.
 */
export async function must<T extends { error: { message: string } | null }>(
  query: PromiseLike<T>,
  what: string,
): Promise<T> {
  const result = await query;
  if (result.error) throw new Error(`Could not load ${what}: ${result.error.message}`);
  return result;
}
