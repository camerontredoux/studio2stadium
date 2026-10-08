import { FeedbackForm } from "@/components/shared/feedback-form";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useSession } from "@/lib/session";

import { dancerFaqSections } from "./dancer-faq";
import { faqSections as schoolFaqSections } from "./data";

export function FaqPage() {
  const session = useSession();
  const isDancer = session.type === "dancer";

  const faqSections = isDancer ? dancerFaqSections : schoolFaqSections;
  const intro = isDancer
    ? "Find answers to common questions about managing your membership, building your profile, and connecting with programs."
    : "Find answers to common questions about how Studio 2 Stadium helps your program discover, evaluate, and recruit dancers.";

  return (
    <div className="mobile:pb-14 mx-auto w-full max-w-4xl">
      <div className="bg-brand/10 rounded-2xl p-2 pt-4 sm:p-8">
        <div className="mb-6 text-center sm:mb-8 sm:text-left">
          <p className="text-brand mb-1 text-sm font-medium tracking-wide uppercase sm:mb-2">
            Got Questions?
          </p>
          <h1 className="mb-2 text-3xl font-semibold sm:text-4xl">
            Frequently Asked Questions
          </h1>
          <p className="text-muted-foreground sm:max-w-2xl">{intro}</p>
        </div>
        <div className="bg-card rounded-xl p-4 sm:p-6">
          <div className="space-y-8">
            {faqSections.map((section) => (
              <div key={section.value}>
                <div className="mb-4 flex items-center gap-3">
                  <div className="via-border h-px flex-1 bg-linear-to-r from-transparent to-transparent" />
                  <h2 className="text-brand text-center text-lg font-semibold">
                    {section.title}
                  </h2>
                  <div className="via-border h-px flex-1 bg-linear-to-r from-transparent to-transparent" />
                </div>

                <Accordion multiple={false} className="w-full">
                  {section.content.map((item) => (
                    <AccordionItem
                      key={item.value}
                      value={item.value}
                      className="border-b last:border-b-0"
                    >
                      <AccordionTrigger className="hover:text-brand text-foreground py-5 text-left text-base">
                        {item.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground pb-5 leading-relaxed">
                        {item.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-brand/10 mt-6 rounded-2xl p-2 pt-4 sm:p-8">
        <div className="mb-6 text-center sm:mb-8 sm:text-left">
          <p className="text-brand mb-1 text-sm font-medium tracking-wide uppercase sm:mb-2">
            Still Have Questions?
          </p>
          <h2 className="mb-2 text-3xl font-semibold sm:text-4xl">Contact Us</h2>
          <p className="text-muted-foreground sm:max-w-2xl">
            Can&apos;t find what you&apos;re looking for? Send us a message and
            our team will get back to you.
          </p>
        </div>
        <div className="bg-card rounded-xl p-4 sm:p-6">
          <FeedbackForm />
        </div>
      </div>
    </div>
  );
}
