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
