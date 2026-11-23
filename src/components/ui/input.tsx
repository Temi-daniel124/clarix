"use client";

import * as React from "react";
import { Input as InputPrimitive } from "@base-ui/react/input";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { groupThousands } from "@/lib/money-input";

/**
 * Inputs, DESIGN_SYSTEM.md §5.2: 52px tall on phones and 44px from 768px, `radius-sm`, a `surface`
 * fill with a 1px `hairline-strong` border, and the indigo 2px focus ring at a 2px offset. Errors
 * turn the border `red-500`. The label sits above (Label, `small` `ink-500`); a placeholder is never
 * the label.
 */
export const inputClassName = cn(
  "h-[52px] w-full min-w-0 rounded-sm border border-hairline-strong bg-surface px-4 md:h-11",
  "type-body text-ink-900 placeholder:text-ink-400",
  "transition-[border-color] duration-150",
  "disabled:pointer-events-none disabled:opacity-40",
  "aria-invalid:border-red-500",
);

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive type={type} data-slot="input" className={cn(inputClassName, className)} {...props} />
  );
}

/** A field with something fixed inside its leading edge: the `₦` of a money input, `+234`. */
function Affixed({ affix, children }: { affix: string; children: React.ReactNode }) {
  return (
    <div className="relative">
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-4 flex items-center type-body text-ink-500 tabular"
      >
        {affix}
      </span>
      {children}
    </div>
  );
}

/**
 * Money (§5.2): `₦` inside the field, the numeric keypad, thousands separators as you type, tabular
 * figures. The value handed to `onValueChange` is the formatted text ("1,500,000"); read the number
 * with `parseMoney` from `@/lib/money-input`.
 */
function MoneyInput({
  value,
  onValueChange,
  className,
  ...props
}: Omit<React.ComponentProps<"input">, "value" | "onChange" | "type" | "inputMode"> & {
  value: string;
  onValueChange: (value: string) => void;
}) {
  return (
    <Affixed affix="₦">
      <Input
        inputMode="numeric"
        autoComplete="off"
        value={value}
        onChange={(event) => onValueChange(groupThousands(event.target.value))}
        className={cn("pl-10 tabular", className)}
        {...props}
      />
    </Affixed>
  );
}

/**
 * A Nigerian phone number (§5.2): `+234` fixed inside the field, the phone keypad, and the national
 * number typed after it. A leading 0 is dropped as it is typed ("0803…" becomes "803…"), since the
 * prefix already stands for it.
 */
function PhoneInput({
  value,
  onValueChange,
  className,
  ...props
}: Omit<React.ComponentProps<"input">, "value" | "onChange" | "type" | "inputMode"> & {
  value: string;
  onValueChange: (value: string) => void;
}) {
  return (
    <Affixed affix="+234">
      <Input
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        value={value}
        onChange={(event) => onValueChange(event.target.value.replace(/[^0-9 ]/g, "").replace(/^0+/, ""))}
        className={cn("pl-[68px] tabular", className)}
        {...props}
      />
    </Affixed>
  );
}

/**
 * A password with a show/hide control inside the trailing edge: the one shared version of what
 * five forms each built for themselves. The toggle is the house `icon` button.
 */
function PasswordInput({
  className,
  revealed: revealedProp,
  onRevealedChange,
  ...props
}: Omit<React.ComponentProps<"input">, "type"> & {
  /** Controlled, when a confirm-password field beside it should show and hide with it. */
  revealed?: boolean;
  onRevealedChange?: (revealed: boolean) => void;
}) {
  const [revealedState, setRevealedState] = React.useState(false);
  const revealed = revealedProp ?? revealedState;
  const setRevealed = (update: (current: boolean) => boolean) => {
    const next = update(revealed);
    setRevealedState(next);
    onRevealedChange?.(next);
  };

  return (
    <div className="relative">
      <Input type={revealed ? "text" : "password"} className={cn("pr-14", className)} {...props} />
      <Button
        type="button"
        variant="icon"
        onClick={() => setRevealed((current) => !current)}
        aria-label={revealed ? "Hide password" : "Show password"}
        aria-pressed={revealed}
        className="absolute inset-y-0 right-1 my-auto"
      >
        {revealed ? <EyeOff aria-hidden /> : <Eye aria-hidden />}
      </Button>
    </div>
  );
}

export { Input, MoneyInput, PhoneInput, PasswordInput };
