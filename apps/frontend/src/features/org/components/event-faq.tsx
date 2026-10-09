import type { ReactNode } from "react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export type EventFaqItem = {
  value: string;
  question: string;
  answer: ReactNode;
};

export type EventFaqSection = {
  value: string;
  title: string;
  content: EventFaqItem[];
};

export function EventFaq({
  sections,
  subtitle,
}: {
  sections: EventFaqSection[];
  subtitle: string;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <div className="border-border border-b px-4 py-3">
        <h1 className="text-base font-semibold 2xl:text-lg">
          Frequently Asked Questions
        </h1>
        <p className="text-muted-foreground text-xs 2xl:text-sm">{subtitle}</p>
      </div>

      <div className="mx-auto w-full max-w-3xl p-4">
        <div className="flex flex-col gap-6">
          {sections.map((section) => (
            <section
              key={section.value}
              className="border-border overflow-hidden rounded-md border"
            >
              <div className="border-border bg-muted/40 border-b px-3 py-2">
                <span className="text-[11px] font-semibold tracking-wider uppercase 2xl:text-xs">
                  {section.title}
                </span>
              </div>
              <Accordion multiple={false} className="w-full px-3">
                {section.content.map((item) => (
                  <AccordionItem
                    key={item.value}
                    value={item.value}
                    className="border-b last:border-b-0"
                  >
                    <AccordionTrigger className="py-3 text-left text-sm font-medium">
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground flex flex-col gap-2 pb-3 text-sm leading-relaxed">
                      {item.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
