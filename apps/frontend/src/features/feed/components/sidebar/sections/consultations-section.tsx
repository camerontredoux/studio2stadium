import { Button } from "@/components/ui/button";
import {
  Frame,
  FrameDescription,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/ui/frame";
import { CalendarCheck2Icon } from "lucide-react";

export function ConsultationsSection() {
  return (
    <Frame compact>
      <FrameHeader>
        <FrameTitle>Consultations</FrameTitle>
        <FrameDescription>Have questions? We're here to help!</FrameDescription>
      </FrameHeader>
      <FramePanel>
        <div className="p-4 px-5">
          <Button
            className="w-full items-center gap-2"
            render={
              <a
                href="https://calendly.com/studio2stadium"
                target="_blank"
                rel="noreferrer noopener"
              />
            }
          >
            <CalendarCheck2Icon />
            Schedule a Consultation
          </Button>
        </div>
      </FramePanel>
    </Frame>
  );
}
