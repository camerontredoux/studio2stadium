import {
  Accordion,
  AccordionItem,
  AccordionPanel,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Frame,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/ui/frame";
import type { SchoolProfile } from "@/features/school/types";

interface ProgramDetailsProps {
  school: SchoolProfile;
}

export function ProgramDetails({ school }: ProgramDetailsProps) {
  const hasMission = !!school.missionStatement;
  const hasWhatWeDo = !!school.whatWeDo;
  const hasBenefits = !!school.benefits;
  const hasContent = hasMission || hasWhatWeDo || hasBenefits;

  const sections = [
    { id: "mission", label: "Mission Statement", content: school.missionStatement },
    { id: "whatWeDo", label: "What We Do", content: school.whatWeDo },
    { id: "benefits", label: "Benefits", content: school.benefits },
  ].filter((s) => s.content);

  const defaultValue = sections.length > 0 ? [sections[0].id] : [];

  return (
    <Frame className="h-fit w-full">
      <FrameHeader>
        <FrameTitle className="flex items-center justify-between gap-2">
          Program Details
          <div className="h-7 w-fit sm:h-6" />
        </FrameTitle>
      </FrameHeader>
      <FramePanel className="p-0!">
        {hasContent ? (
          <Accordion defaultValue={defaultValue} className="w-full">
            {sections.map((section) => (
              <AccordionItem key={section.id} value={section.id}>
                <AccordionTrigger className="text-muted-foreground rounded-none px-4 text-sm font-medium hover:no-underline">
                  {section.label}
                </AccordionTrigger>
                <AccordionPanel className="px-4 pb-4">
                  <p className="text-primary text-sm leading-relaxed whitespace-pre-wrap">
                    {section.content}
                  </p>
                </AccordionPanel>
              </AccordionItem>
            ))}
          </Accordion>
        ) : (
          <div className="text-muted-foreground p-4 text-sm">
            No program details provided
          </div>
        )}
      </FramePanel>
    </Frame>
  );
}
