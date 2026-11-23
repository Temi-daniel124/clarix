import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";
import { LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The one button (DESIGN_SYSTEM.md §5.1, D045), on the base-ui primitive.
 *
 * Every button is a pill. Heights are the phone value first and the desktop value from 768px, the
 * same breakpoint the type scale switches at. The label is 15px at 600; icons inside are 18px with
 * an 8px gap and the house 1.75px stroke (§6), whatever size a call site passed. Pressed is
 * `scale(0.98)` on the standard spring (§4.5); disabled is 40% opacity with no hover.
 *
 *   primary      emerald-500, hover 600, pressed 700. One per screen or sheet.
 *   secondary    surface-sunken, hover #EAEAE4. The "other" action.
 *   tertiary     transparent, underline on hover. Text actions inside lists and sheets.
 *   destructive  red-500. Always behind Timed Undo or a sheet confirmation.
 *   on-navy      white on navy bands.
 *   icon         40×40 (44×44 on phones), a 20px icon in ink-500. Give it an aria-label.
 */
const buttonVariants = cva(
  [
    "group/button relative inline-flex shrink-0 items-center justify-center gap-2 rounded-pill",
    "whitespace-nowrap select-none text-[15px] leading-none font-semibold tracking-[-0.01em]",
    "transition-[background-color,color,transform] duration-[var(--duration-spring)] ease-[var(--ease-spring)]",
    "active:scale-[0.98]",
    "disabled:pointer-events-none disabled:opacity-40",
    "data-[loading]:pointer-events-none",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:size-[18px] [&_svg]:[stroke-width:1.75]",
  ].join(" "),
  {
    variants: {
      variant: {
        primary:
          "h-[52px] px-6 md:h-11 md:px-5 bg-emerald-500 text-white hover:bg-emerald-600 active:bg-emerald-700",
        secondary:
          "h-[52px] px-6 md:h-11 md:px-5 bg-surface-sunken text-ink-900 hover:bg-[#eaeae4]",
        tertiary:
          "h-11 px-3 md:h-9 bg-transparent text-ink-900 underline-offset-4 decoration-1 hover:underline",
        destructive: "h-[52px] px-6 md:h-11 md:px-5 bg-red-500 text-white",
        "on-navy": "h-[52px] px-6 md:h-12 md:px-5 bg-white text-navy-900",
        icon: "size-11 md:size-10 bg-transparent text-ink-500 hover:bg-surface-sunken [&_svg]:size-5",
      },
    },
    defaultVariants: {
      variant: "primary",
    },
  },
);

type ButtonProps = ButtonPrimitive.Props &
  VariantProps<typeof buttonVariants> & {
    /**
     * A 16px spinner takes the place of the leading icon and the label stays (§5.1). The button
     * stops taking clicks while it is set, without dimming: it is busy, not unavailable.
     */
    loading?: boolean;
  };

function Button({ className, variant, nativeButton, loading = false, children, ...props }: ButtonProps) {
  // base-ui assumes it renders a real <button> unless told otherwise. A Clarix button that
  // navigates is rendered as a Next <Link>, an <a>, so anything given a `render` element is
  // declared non-native by default, while an explicit prop still wins.
  const resolvedNativeButton = nativeButton ?? (props.render ? false : undefined);

  return (
    <ButtonPrimitive
      data-slot="button"
      data-loading={loading ? "" : undefined}
      aria-busy={loading || undefined}
      nativeButton={resolvedNativeButton}
      className={cn(
        buttonVariants({ variant }),
        // The spinner replaces the leading icon: hide an icon that comes straight after it.
        loading && "[&>[data-spinner]+svg]:hidden",
        className,
      )}
      {...props}
    >
      {loading ? (
        <span data-spinner className="inline-flex">
          <LoaderCircle aria-hidden className="!size-4 animate-spin" />
        </span>
      ) : null}
      {children}
    </ButtonPrimitive>
  );
}

export { Button, buttonVariants };
