import { Accordion as AccordionPrimitive } from "@base-ui/react/accordion";
import { ChevronDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * base-ui accordion, reskinned to DESIGN_SYSTEM.md. Used for the landing page FAQ.
 *
 * The panel animates on its own height rather than a spring, because this is disclosure of
 * static text, not a figure moving against a limit, and the global prefers-reduced-motion
 * rule in globals.css collapses the transition to nothing when asked.
 */

function Accordion({ className, ...props }: AccordionPrimitive.Root.Props) {
  return (
    <AccordionPrimitive.Root
      data-slot="accordion"
      className={cn("flex w-full flex-col", className)}
      {...props}
    />
  );
}

function AccordionItem({ className, ...props }: AccordionPrimitive.Item.Props) {
  return (
    <AccordionPrimitive.Item
      data-slot="accordion-item"
      className={cn("border-b border-border last:border-b-0", className)}
      {...props}
    />
  );
}

/**
 * `indicator="plus"` is the landing FAQ's (round-2 board, Watermelon faq-2): a 28px pill that turns
 * from the indigo wash to solid indigo and rotates its plus into a cross as the item opens.
 */
function AccordionTrigger({
  className,
  children,
  indicator = "chevron",
  ...props
}: AccordionPrimitive.Trigger.Props & { indicator?: "chevron" | "plus" }) {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        data-slot="accordion-trigger"
        className={cn(
          "group/accordion-trigger flex min-w-0 flex-1 items-center justify-between gap-4 py-5 text-left",
          "type-card-title text-text transition-colors duration-150",
          "outline-none hover:text-emerald-700 focus-visible:outline-2 focus-visible:outline-indigo focus-visible:outline-offset-2",
          className,
        )}
        {...props}
      >
        {children}
        {indicator === "plus" ? (
          <span
            aria-hidden
            className="grid size-7 shrink-0 place-items-center rounded-pill bg-indigo-100 text-indigo-600 transition-[background-color,color,rotate] duration-300 group-aria-expanded/accordion-trigger:rotate-45 group-aria-expanded/accordion-trigger:bg-indigo-600 group-aria-expanded/accordion-trigger:text-white"
          >
            <Plus className="size-4" strokeWidth={2} />
          </span>
        ) : (
          <ChevronDown
            aria-hidden
            strokeWidth={2}
            className="size-5 shrink-0 text-text-muted transition-transform duration-200 group-aria-expanded/accordion-trigger:rotate-180"
          />
        )}
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
}

function AccordionContent({ className, children, ...props }: AccordionPrimitive.Panel.Props) {
  return (
    <AccordionPrimitive.Panel
      data-slot="accordion-content"
      className={cn(
        "h-(--accordion-panel-height) overflow-hidden transition-[height] duration-200 ease-out",
        "data-ending-style:h-0 data-starting-style:h-0",
      )}
      {...props}
    >
      <div className={cn("type-body pb-5 text-text-secondary", className)}>{children}</div>
    </AccordionPrimitive.Panel>
  );
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
