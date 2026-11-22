import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { FAQ_HEADING, FAQ_ITEMS, type FaqItem } from "./copy";

/**
 * The FAQ (spec §8 faq-2, §11.1 item 9; round-2 board): five questions as separate white
 * cards, the first open, one open at a time. The board's answers, word for word.
 *
 * /pricing passes its billing subset and heading; the landing page takes the defaults.
 */
export function Faq({
  items = FAQ_ITEMS,
  heading = FAQ_HEADING,
}: {
  items?: readonly FaqItem[];
  heading?: string;
} = {}) {
  return (
    <section
      id="faq"
      aria-labelledby="faq-heading"
      className="reveal mx-auto flex w-full max-w-[860px] scroll-mt-28 flex-col gap-6 px-5 pb-[72px] md:px-6 lg:pb-24"
    >
      <h2
        id="faq-heading"
        className="type-section-title text-center text-balance text-indigo-night"
      >
        {heading}
      </h2>

      <Accordion defaultValue={[items[0].question]} className="gap-2.5">
        {items.map((item) => (
          <AccordionItem
            key={item.question}
            value={item.question}
            className="overflow-hidden rounded-card border-b-0 bg-white shadow-flat"
          >
            <AccordionTrigger
              indicator="plus"
              className={cn(
                "px-[22px] py-[18px] type-body-m leading-[1.4] font-semibold text-indigo-night",
                "hover:text-indigo-600 focus-visible:-outline-offset-2",
              )}
            >
              {item.question}
            </AccordionTrigger>
            <AccordionContent className="px-[22px] pb-5 type-body-m leading-[1.55] text-ink-2">
              {item.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
