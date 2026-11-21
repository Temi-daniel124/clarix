import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * The base-ui button primitive in the Adire light hierarchy: primary (emerald, the only one with
 * a shadow), secondary (indigo wash), tertiary (text only) and destructive (red wash). Every
 * button is a pill and every size is at least a 44px target. The pre-redesign names (navy,
 * outline, ghost, link, danger) stay as aliases so existing screens keep working.
 */
const primary =
  "bg-emerald-500 text-on-emerald shadow-primary-float hover:bg-emerald-500/90 active:bg-emerald-500/95 disabled:bg-line disabled:text-muted disabled:shadow-none";
const secondary =
  "bg-indigo-100 text-indigo-600 hover:bg-indigo-100/70 active:bg-indigo-100/50 disabled:bg-line disabled:text-muted";
const tertiary =
  "bg-transparent text-indigo-600 hover:bg-indigo-50 active:bg-indigo-100 disabled:text-muted disabled:hover:bg-transparent";
const destructive =
  "bg-red-50 text-red-600 hover:bg-red-50/70 active:bg-red-50/50 disabled:bg-line disabled:text-muted";

const buttonVariants = cva(
  [
    "group/button inline-flex shrink-0 items-center justify-center gap-2",
    "whitespace-nowrap font-semibold select-none",
    "transition-[background-color,border-color,color,opacity] duration-150",
    "outline-none focus-visible:outline-2 focus-visible:outline-indigo-600 focus-visible:outline-offset-2",
    "disabled:pointer-events-none",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  ].join(" "),
  {
    variants: {
      variant: {
        primary,
        secondary,
        tertiary,
        destructive,
        /** A circular icon-only button; pair with size="icon". */
        icon: tertiary,
        // Legacy aliases.
        navy: secondary,
        outline: secondary,
        ghost: tertiary,
        link: tertiary,
        danger: destructive,
      },
      size: {
        /** 52px, the mobile primary action. */
        lg: "h-13 rounded-pill px-8 type-body",
        /** 48px, the standard CTA height. */
        default: "h-12 rounded-pill px-6 type-body",
        /** 44px, the minimum touch target; dense contexts such as a top bar. */
        sm: "h-11 rounded-pill px-5 text-[14px]",
        /** A 44x44 circle. */
        icon: "size-11 rounded-pill",
        inline: "h-auto rounded-none p-0",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
);

function Button({
  className,
  variant,
  size,
  nativeButton,
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  // base-ui assumes it is rendering a real <button> unless told otherwise. Every Clarix button
  // that navigates is rendered as a Next <Link>, i.e. an <a>, and leaving nativeButton at its
  // default made base-ui strip native button semantics and log an accessibility error on each
  // one. Anything given a `render` element is therefore declared non-native by default, while
  // an explicit prop still wins.
  const resolvedNativeButton = nativeButton ?? (props.render ? false : undefined);

  return (
    <ButtonPrimitive
      data-slot="button"
      nativeButton={resolvedNativeButton}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
