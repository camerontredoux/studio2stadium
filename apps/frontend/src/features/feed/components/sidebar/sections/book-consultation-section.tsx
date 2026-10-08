import { Button } from "@/components/ui/button";
import { Frame, FramePanel } from "@/components/ui/frame";
import { CalendarCheck2Icon } from "lucide-react";

export function BookConsultationSection() {
  return (
    <Frame compact>
      <FramePanel>
        <div className="p-4 px-5">
          <Button
            className="bg-transparent text-brand border border-brand rounded-xl shadow-none hover:bg-brand/10 w-full items-center gap-2"
            render={
              <a
                href="https://calendly.com/studio2stadium"
                target="_blank"
                rel="noreferrer noopener"
              />
            }
          >
            <CalendarCheck2Icon />
            Book a Consultation
          </Button>
        </div>
      </FramePanel>
    </Frame>
  );
}
