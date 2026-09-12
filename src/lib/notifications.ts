import { Banknote, BellRing, FileText, Package, type LucideIcon } from "lucide-react";
import type { Database } from "@/lib/supabase/database.types";

/**
 * The notification categories, described once for both screens that need them — the list
 * (blueprint 6.1) and the preference toggles (6.2).
 *
 * Keeping them here rather than in either screen is what stops the two drifting: a category
 * added to the enum without a description below fails the type check rather than silently
 * rendering an unlabelled row with no matching toggle.
 */

export type NotificationCategory = Database["public"]["Enums"]["notification_category"];

export type CategoryDescriptor = {
  /** The toggle's label on Profile. Written from the employee's side, not the system's. */
  label: string;
  /** One line under the toggle saying what this category actually covers. */
  description: string;
  icon: LucideIcon;
};

export const NOTIFICATION_CATEGORIES: Record<NotificationCategory, CategoryDescriptor> = {
  loan_decision: {
    label: "Loan decisions",
    description: "When a cooperative approves or turns down a loan you applied for.",
    icon: Banknote,
  },
  membership_decision: {
    label: "Membership decisions",
    description: "When a cooperative accepts or declines your application to join.",
    icon: BellRing,
  },
  new_loan_product: {
    label: "New packages",
    description: "When a cooperative you belong to starts offering a new loan package.",
    icon: Package,
  },
  salary_reverification: {
    label: "Salary re-checks",
    description: "When your confirmed salary needs a fresh payslip to stay current.",
    icon: FileText,
  },
};

export const NOTIFICATION_CATEGORY_ORDER: NotificationCategory[] = [
  "loan_decision",
  "membership_decision",
  "new_loan_product",
  "salary_reverification",
];

/**
 * Whether a category is switched on for this employee.
 *
 * A missing key means opted in (DECISIONS.md D025): only an explicit `false` turns a category
 * off, so a category added later arrives switched on for every existing account rather than
 * silently off for everyone who signed up before it existed.
 */
export function categoryEnabled(
  preferences: unknown,
  category: NotificationCategory,
): boolean {
  if (!preferences || typeof preferences !== "object") return true;
  return (preferences as Record<string, unknown>)[category] !== false;
}

/** Narrows an arbitrary string to a category, for form input that must not be trusted. */
export function isNotificationCategory(value: string): value is NotificationCategory {
  return value in NOTIFICATION_CATEGORIES;
}
