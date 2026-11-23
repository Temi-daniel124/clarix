/**
 * "Good morning / afternoon / evening", by the clock in Lagos (DESIGN_SYSTEM §8: times are in
 * Africa/Lagos). One helper for every home (walkthrough 1.4d item 3): the member home rendered on
 * a server running in UTC and the admin home in the browser, so at 12:35 in Lagos one said
 * morning and the other afternoon. Fixing the zone also makes server and browser agree.
 */
export function greeting(now: Date = new Date()): string {
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", { hour: "numeric", hourCycle: "h23", timeZone: "Africa/Lagos" }).format(now),
  );
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}
