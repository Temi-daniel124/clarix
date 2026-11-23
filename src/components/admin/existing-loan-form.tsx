"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowLeft, ArrowRight, Check, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CapacityMeter } from "@/components/clarix/capacity-meter";
import { RollingNumber } from "@/components/clarix/rolling-number";
import { cn } from "@/lib/utils";
import { formatNaira, NAIRA } from "@/lib/format";
import { springStandard } from "@/lib/motion";
import { defaultEndMonth } from "@/lib/loan-status";
import {
  recordExistingLoanAction,
  type ExistingLoanState,
} from "@/app/admin/existing-loan-actions";

const UNDO_SECONDS = 10;

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export type ExistingLoanProduct = { id: string; name: string };

/**
 * Add an existing loan (BUILD-PLAN 0.3, documents blueprint §3, D036).
 *
 * A loan the member was already repaying when this cooperative joined Clarix. Until it is entered,
 * their committed figure is short of the truth at every cooperative they belong to (E08).
 *
 * The meter at the top shows the member's available figure before and after, live as the monthly
 * repayment is typed. Saving uses the house Timed Undo: nothing is written for 10 seconds, the
 * screen says so, and Undo simply stops it.
 */
export function ExistingLoanForm({
  membershipId,
  memberName,
  capacity,
  products,
}: {
  membershipId: string;
  memberName: string;
  /** Null when the member has no limit on record yet; the loan still counts once they do. */
  capacity: { cap: number; committed: number; available: number } | null;
  products: ExistingLoanProduct[];
}) {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [, startTransition] = useTransition();

  const [outstanding, setOutstanding] = useState("");
  const [monthly, setMonthly] = useState("");
  const [startMonth, setStartMonth] = useState("");
  const [endMonth, setEndMonth] = useState("");
  const [endTouched, setEndTouched] = useState(false);
  const [original, setOriginal] = useState("");
  const [productId, setProductId] = useState("");
  const [note, setNote] = useState("");
  // Bumped by "Add another" so every field, including a half-chosen month, starts empty again.
  const [resetCount, setResetCount] = useState(0);

  const [pending, setPending] = useState(false);
  const [countdown, setCountdown] = useState(UNDO_SECONDS);
  const [state, setState] = useState<ExistingLoanState>({});
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const outstandingValue = toNumber(outstanding);
  const monthlyValue = toNumber(monthly);

  // Until the person picks an end month themselves, it follows the figures (blueprint §3).
  const suggestedEnd = defaultEndMonth({
    startMonth,
    outstanding: outstandingValue,
    monthly: monthlyValue,
  });
  const effectiveEnd = endTouched ? endMonth : (suggestedEnd ?? "");

  const availableAfter = capacity ? Math.max(capacity.available - monthlyValue, 0) : null;
  const overBy = capacity ? Math.max(monthlyValue - capacity.available, 0) : 0;

  const ready = outstandingValue > 0 && monthlyValue > 0 && startMonth !== "" && effectiveEnd !== "";

  const commit = useCallback(() => {
    startTransition(async () => {
      const result = await recordExistingLoanAction({
        membershipId,
        outstanding,
        monthly,
        startMonth,
        endMonth: effectiveEnd,
        original,
        loanProductId: productId,
        note,
      });

      setPending(false);
      setState(result);
      if (result.saved) router.refresh();
    });
  }, [membershipId, outstanding, monthly, startMonth, effectiveEnd, original, productId, note, router]);

  useEffect(() => {
    if (!pending) return;

    timer.current = setInterval(() => {
      setCountdown((current) => {
        if (current <= 1) {
          if (timer.current) clearInterval(timer.current);
          commit();
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [pending, commit]);

  if (state.saved) {
    return (
      <div>
        <span
          aria-hidden
          className="flex size-12 items-center justify-center rounded-card text-emerald"
          style={{ backgroundColor: "color-mix(in srgb, var(--clarix-brand-accent) 12%, transparent)" }}
        >
          <Check className="size-6" strokeWidth={2.5} />
        </span>
        <h1 className="type-page-title mt-6 text-text">Existing loan added</h1>
        <p className="type-body mt-3 max-w-[480px] text-text-secondary">
          {capacity
            ? `${memberName} now has ${formatNaira(state.saved.availableAfter)} a month available, at every cooperative they belong to.`
            : `It counts against ${memberName}'s limit at every cooperative from now on.`}
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Button render={<Link href={`/admin/members/${membershipId}`} />}>
            Back to {memberName}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setState({});
              setOutstanding("");
              setMonthly("");
              setStartMonth("");
              setEndMonth("");
              setEndTouched(false);
              setOriginal("");
              setProductId("");
              setNote("");
              setCountdown(UNDO_SECONDS);
              setResetCount((count) => count + 1);
            }}
          >
            Add another
          </Button>
        </div>
      </div>
    );
  }

  const locked = pending;

  return (
    <div>
      <Button
        variant="ghost"
        size="sm"
        className="-ml-2"
        render={<Link href={`/admin/members/${membershipId}`} />}
      >
        <ArrowLeft className="size-4" aria-hidden strokeWidth={2} />
        {memberName}
      </Button>

      <h1 className="type-page-title mt-6 text-text">Add existing loan</h1>
      <p className="type-body mt-2 max-w-[480px] text-text-secondary">
        A loan {memberName} was already repaying before you joined Clarix.
      </p>

      {/* Before and after, the signature meter: the one way a number against a limit is drawn. */}
      <section className="mt-6 rounded-feature border border-border bg-surface p-5">
        {capacity && availableAfter !== null ? (
          <>
            <p className="type-secondary text-text-secondary">Available each month</p>
            <p className="mt-1 flex flex-wrap items-baseline gap-x-3 tabular">
              <span className="type-card-title text-text-secondary">{formatNaira(capacity.available)}</span>
              <ArrowRight aria-hidden strokeWidth={2} className="size-4 self-center text-text-muted" />
              <RollingNumber value={availableAfter} className="type-kpi text-text" />
            </p>
            <CapacityMeter
              className="mt-4"
              cap={capacity.cap}
              committed={capacity.committed}
              proposed={monthlyValue}
              showHeadline={false}
              proposedLabel="This loan"
              caption={
                overBy > 0
                  ? `This takes them ${formatNaira(overBy)} a month past their limit. It is recorded as it is.`
                  : "Counted at every cooperative they belong to, the moment it is added."
              }
            />
          </>
        ) : (
          <p className="type-secondary text-text-secondary">
            No limit on record for {memberName} yet. This loan counts against it once they add
            proof of income.
          </p>
        )}
      </section>

      <form
        key={resetCount}
        className="mt-8 flex flex-col gap-5"
        onSubmit={(event) => {
          event.preventDefault();
          if (!ready || locked) return;
          setState({});
          setCountdown(UNDO_SECONDS);
          setPending(true);
        }}
      >
        <MoneyField
          id="outstanding"
          label="Still owed"
          value={outstanding}
          onChange={setOutstanding}
          disabled={locked}
          error={state.fieldErrors?.outstanding}
        />

        <MoneyField
          id="monthly"
          label="Monthly repayment"
          value={monthly}
          onChange={setMonthly}
          disabled={locked}
          error={state.fieldErrors?.monthly}
        />

        <div className="grid gap-5 sm:grid-cols-2">
          <MonthField
            id="start"
            label="Started"
            value={startMonth}
            onChange={setStartMonth}
            yearsBack={10}
            yearsAhead={0}
            disabled={locked}
            error={state.fieldErrors?.startMonth}
          />
          <MonthField
            id="end"
            label="Last repayment"
            value={effectiveEnd}
            onChange={(value) => {
              setEndTouched(true);
              setEndMonth(value);
            }}
            yearsBack={10}
            yearsAhead={10}
            disabled={locked}
            error={state.fieldErrors?.endMonth}
          />
        </div>

        <MoneyField
          id="original"
          label="Original amount"
          optional
          value={original}
          onChange={setOriginal}
          disabled={locked}
          error={state.fieldErrors?.original}
        />

        {products.length > 0 ? (
          <div className="flex flex-col gap-2">
            <Label htmlFor="product">
              Loan product <span className="font-normal text-text-muted">(optional)</span>
            </Label>
            <select
              id="product"
              value={productId}
              disabled={locked}
              onChange={(event) => setProductId(event.target.value)}
              className={SELECT_CLASS}
            >
              <option value="">None</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        <div className="flex flex-col gap-2">
          <Label htmlFor="note">
            Note <span className="font-normal text-text-muted">(optional)</span>
          </Label>
          <Textarea
            id="note"
            value={note}
            maxLength={500}
            disabled={locked}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Where these figures came from"
            className="min-h-20"
          />
        </div>

        {state.error ? (
          <p role="alert" className="type-secondary text-danger">
            {state.error}
          </p>
        ) : null}

        <AnimatePresence mode="wait" initial={false}>
          {pending ? (
            <motion.div
              key="pending"
              initial={reduceMotion ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={reduceMotion ? { duration: 0 } : springStandard}
              className="flex flex-wrap items-center gap-4 rounded-card border border-border bg-background px-5 py-4"
              aria-live="polite"
            >
              <div className="min-w-0 flex-1">
                <p className="type-card-title text-text">Adding in {countdown}…</p>
                <p className="type-secondary mt-1 text-text-secondary">Nothing has been written yet.</p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  if (timer.current) clearInterval(timer.current);
                  setPending(false);
                  setCountdown(UNDO_SECONDS);
                }}
              >
                <Undo2 className="size-4" aria-hidden strokeWidth={2} />
                Undo
              </Button>
            </motion.div>
          ) : (
            <motion.div key="submit" initial={reduceMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }}>
              <Button type="submit" disabled={!ready} className="w-full sm:w-auto">
                Add loan
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </form>
    </div>
  );
}

const SELECT_CLASS = cn(
  "h-12 w-full rounded-card border border-border bg-surface px-3 type-body text-text outline-none",
  "transition-[border-color] duration-150",
  "focus-visible:border-indigo focus-visible:outline-2 focus-visible:outline-indigo focus-visible:outline-offset-1",
  "disabled:pointer-events-none disabled:opacity-45",
  "aria-invalid:border-danger",
);

function MoneyField({
  id,
  label,
  value,
  onChange,
  disabled,
  error,
  optional = false,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
  error?: string;
  optional?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>
        {label}
        {optional ? <span className="font-normal text-text-muted"> (optional)</span> : null}
      </Label>
      <div className="relative">
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-4 flex items-center type-body text-text-muted"
        >
          {NAIRA}
        </span>
        <Input
          id={id}
          inputMode="decimal"
          autoComplete="off"
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(groupThousands(event.target.value))}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className="pl-10 tabular"
        />
      </div>
      {error ? (
        <p id={`${id}-error`} role="alert" className="type-caption text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/**
 * A month, as two standard selects. `<input type="month">` is not supported by desktop Safari or
 * Firefox, which fall back to a bare text box, so two selects are the plain control that works
 * everywhere.
 */
function MonthField({
  id,
  label,
  value,
  onChange,
  yearsBack,
  yearsAhead,
  disabled,
  error,
}: {
  id: string;
  label: string;
  /** "YYYY-MM" or "" */
  value: string;
  onChange: (value: string) => void;
  yearsBack: number;
  yearsAhead: number;
  disabled: boolean;
  error?: string;
}) {
  const thisYear = new Date().getFullYear();
  const years = Array.from({ length: yearsBack + yearsAhead + 1 }, (_, index) => thisYear + yearsAhead - index);
  const [year = "", month = ""] = value ? value.split("-") : [];

  const change = (nextYear: string, nextMonth: string) => {
    onChange(nextYear && nextMonth ? `${nextYear}-${nextMonth}` : "");
  };

  // Hold a half-chosen month locally, so picking the month first does not wipe it.
  const [draft, setDraft] = useState<{ year: string; month: string }>({ year, month });
  const shownYear = value ? year : draft.year;
  const shownMonth = value ? month : draft.month;

  return (
    <fieldset className="flex flex-col gap-2" aria-describedby={error ? `${id}-error` : undefined}>
      <legend className="mb-2 type-secondary font-medium text-text">{label}</legend>
      <div className="grid grid-cols-[1fr_112px] gap-2">
        <select
          id={`${id}-month`}
          aria-label={`${label}, month`}
          value={shownMonth}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          onChange={(event) => {
            setDraft({ year: shownYear, month: event.target.value });
            change(shownYear, event.target.value);
          }}
          className={SELECT_CLASS}
        >
          <option value="">Month</option>
          {MONTHS.map((name, index) => (
            <option key={name} value={String(index + 1).padStart(2, "0")}>
              {name}
            </option>
          ))}
        </select>
        <select
          id={`${id}-year`}
          aria-label={`${label}, year`}
          value={shownYear}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          onChange={(event) => {
            setDraft({ year: event.target.value, month: shownMonth });
            change(event.target.value, shownMonth);
          }}
          className={cn(SELECT_CLASS, "tabular")}
        >
          <option value="">Year</option>
          {years.map((entry) => (
            <option key={entry} value={String(entry)}>
              {entry}
            </option>
          ))}
        </select>
      </div>
      {error ? (
        <p id={`${id}-error`} role="alert" className="type-caption text-danger">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}

function toNumber(value: string): number {
  const amount = Number(value.replace(/[₦,\s]/g, ""));
  return Number.isFinite(amount) ? amount : 0;
}

/** "1500000" → "1,500,000" as it is typed (DESIGN_SYSTEM.md §8: ₦ always with separators). */
function groupThousands(raw: string): string {
  const cleaned = raw.replace(/[^0-9.]/g, "");
  const [whole, ...rest] = cleaned.split(".");
  const grouped = whole.replace(/^0+(?=\d)/, "").replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return rest.length > 0 ? `${grouped}.${rest.join("").slice(0, 2)}` : grouped;
}
