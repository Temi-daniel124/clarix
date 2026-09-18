/**
 * Naira formatting helpers. Clarix shows money in Nigerian Naira everywhere. There is no
 * multi-currency requirement in scope, so this is deliberately a single fixed formatter
 * rather than a locale abstraction.
 */

const groupedFormatter = new Intl.NumberFormat("en-NG", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export const NAIRA = "₦";

/** "1234567" -> "1,234,567". No symbol: RollingNumber renders the symbol separately. */
export function formatAmount(value: number): string {
  return groupedFormatter.format(Math.round(value));
}

/** "1234567" -> "₦1,234,567". For static copy, not for rolling figures. */
export function formatNaira(value: number): string {
  return `${NAIRA}${formatAmount(value)}`;
}

/** Clamps a ratio into 0–1 so a meter can never render past its own track. */
export function clampRatio(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

/**
 * Dates, always in the timezone the product actually lives in.
 *
 * Every figure in Clarix is about a Nigerian payroll, and most of these labels are rendered on
 * the server, which runs in UTC in production. Left to the default, "26 August at 1:00" means one
 * thing to the server and another to the member reading it, and between midnight and 1am Lagos
 * time the two disagree about the day. That is not hypothetical: it is how the dashboard came to
 * show a date that had not happened yet.
 *
 * These exist so no call site has to remember. Nineteen of them did not.
 */

const LAGOS = "Africa/Lagos";

const fullDateFormatter = new Intl.DateTimeFormat("en-NG", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: LAGOS,
});

const shortDateFormatter = new Intl.DateTimeFormat("en-NG", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: LAGOS,
});

const dayMonthFormatter = new Intl.DateTimeFormat("en-NG", {
  day: "numeric",
  month: "long",
  timeZone: LAGOS,
});

const dayMonthTimeFormatter = new Intl.DateTimeFormat("en-NG", {
  day: "numeric",
  month: "long",
  hour: "numeric",
  minute: "2-digit",
  timeZone: LAGOS,
});

const shortDateTimeFormatter = new Intl.DateTimeFormat("en-NG", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: LAGOS,
});

const monthYearFormatter = new Intl.DateTimeFormat("en-NG", {
  month: "short",
  year: "numeric",
  timeZone: LAGOS,
});

/** "18 September 2026". */
export function formatFullDate(value: string | Date): string {
  return fullDateFormatter.format(new Date(value));
}

/** "18 Sept 2026". */
export function formatShortDate(value: string | Date): string {
  return shortDateFormatter.format(new Date(value));
}

/** "18 September", for a date close enough that the year is noise. */
export function formatDayMonth(value: string | Date): string {
  return dayMonthFormatter.format(new Date(value));
}

/** "18 September at 14:05". */
export function formatDayMonthTime(value: string | Date): string {
  return dayMonthTimeFormatter.format(new Date(value));
}

/** "18 Sept 2026, 14:05". */
export function formatShortDateTime(value: string | Date): string {
  return shortDateTimeFormatter.format(new Date(value));
}

/** "Sept 2026", for a series plotted by month. */
export function formatMonthYear(value: string | Date): string {
  return monthYearFormatter.format(new Date(value));
}

const monthYearLongFormatter = new Intl.DateTimeFormat("en-NG", {
  month: "long",
  year: "numeric",
  timeZone: LAGOS,
});

/** "September 2026", for a reconciliation period that names itself in full. */
export function formatMonthYearLong(value: string | Date): string {
  return monthYearLongFormatter.format(new Date(value));
}
