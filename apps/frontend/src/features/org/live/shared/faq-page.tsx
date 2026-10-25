import type { ReactNode } from "react";

import {
  Accordion,
  AccordionItem,
  AccordionPanel,
  AccordionTrigger,
} from "@/components/event/accordion";
import { Panel, PanelHead, PanelSubHead } from "@/components/event/panel";
import type { EventFaqSection } from "@/features/org/components/event-faq";

type FaqPageProps = {
  /** The existing FAQ data (`coachEventFaqSections`, `dancerEventFaqSections`). */
  sections: EventFaqSection[];
  /** An optional title for the panel head. */
  title?: ReactNode;
};

/**
 * The FAQ: one panel at most 760px wide, a sub-head per section and a 48px row per
 * question. The first question starts open.
 */
function FaqPage({ sections, title }: FaqPageProps) {
  const first = sections[0]?.content[0]?.value;

  return (
    <Panel
      aria-label="Frequently asked questions"
      className="w-full max-w-[760px] overflow-hidden"
    >
      {title !== undefined && <PanelHead title={title} />}
      <Accordion multiple defaultValue={first ? [first] : []}>
        {sections.map((section) => (
          <section
            key={section.value}
            aria-label={section.title}
            className="[&:last-child>:last-child]:border-b-0"
          >
            <PanelSubHead label={section.title} />
            {section.content.map((item) => (
              <AccordionItem key={item.value} value={item.value}>
                <AccordionTrigger level={2}>{item.question}</AccordionTrigger>
                <AccordionPanel className="[&_a]:text-fg flex flex-col gap-(--space-8) [&_a]:underline [&_a]:underline-offset-2 [&_p]:m-0">
                  {item.answer}
                </AccordionPanel>
              </AccordionItem>
            ))}
          </section>
        ))}
      </Accordion>
    </Panel>
  );
}

export { FaqPage };
export type { FaqPageProps };
