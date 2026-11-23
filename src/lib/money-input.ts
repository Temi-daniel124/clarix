/**
 * The two halves of a money field (DESIGN_SYSTEM.md §5.2): what is shown while typing, and the
 * number it means. Pure, so they are unit-tested rather than trusted.
 */

/** "1500000" → "1,500,000" as it is typed; at most two decimal places; no leading zeros. */
export function groupThousands(raw: string): string {
  const cleaned = raw.replace(/[^0-9.]/g, "");
  const [whole = "", ...rest] = cleaned.split(".");
  const grouped = whole.replace(/^0+(?=\d)/, "").replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return rest.length > 0 ? `${grouped}.${rest.join("").slice(0, 2)}` : grouped;
}

/** "₦1,500,000.50" → 1500000.5. Empty or unreadable text is null, never 0. */
export function parseMoney(text: string): number | null {
  const cleaned = text.replace(/[₦,\s]/g, "");
  if (cleaned === "") return null;
  const value = Number(cleaned);
  return Number.isFinite(value) ? value : null;
}
