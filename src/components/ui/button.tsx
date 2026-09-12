import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * The base-ui button primitive, fully reskinned to DESIGN_SYSTEM.md.
 *
 * Nothing of the shadcn preset's default styling survives here: heights come from the 4/8/12/
 * 16/20/24/32/40/48/64 spacing scale, colours come from the five-token Clarix palette, and the
 * radius comes from the card radius variable. Per DESIGN_SYSTEM.md § Component sourcing
 * discipline, an adopted component is never left in its demo colours or radii.
 */
const buttonVariants = cva(
  [
    "group/button inline-flex shrink-0 items-center justify-center gap-2",
    "whitespace-nowrap font-medium select-none",
    "transition-[background-color,border-color,color,opacity] duration-150",
    "outline-none focus-visible:outline-2 focus-visible:outline-indigo focus-visible:outline-offset-2",
    // Disabled is a real state with its own tokens, not the brand colour at reduced opacity —
    // a faded emerald reads as a broken button rather than an unavailable one, and its label
    // stops being legible. Each filled variant swaps to the neutral border tone below.
    "disabled:pointer-events-none",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  ].join(" "),
  {
    variants: {
      variant: {
        /** The single primary call to action on a screen. Emerald, per the accent token. */
        primary:
          "bg-emerald text-white hover:bg-emerald/90 active:bg-emerald/95 disabled:bg-border disabled:text-text-muted",
        /** Dark-surface actions — the landing page top bar, navy panels. */
        navy: "bg-navy text-background hover:bg-navy/90 disabled:bg-border disabled:text-text-muted",
        outline:
          "border border-border bg-surface text-text hover:bg-background active:bg-background disabled:text-text-muted",
        ghost: "text-text-secondary hover:bg-background hover:text-text disabled:text-text-muted",
        link: "h-auto p-0 text-indigo underline-offset-4 hover:underline disabled:text-text-muted disabled:no-underline",
        danger: "bg-danger text-white hover:bg-danger/90 disabled:bg-border disabled:text-text-muted",
      },
      size: {
        /** 48px — the standard CTA height, comfortable as a touch target. */
        default: "h-12 rounded-card px-6 type-body",
        /** 40px — dense contexts such as a top bar. */
        sm: "h-10 rounded-card px-4 text-[14px]",
        icon: "size-10 rounded-card",
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
