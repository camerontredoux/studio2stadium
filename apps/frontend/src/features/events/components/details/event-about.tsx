import { Frame, FrameHeader, FramePanel, FrameTitle } from "@/components/ui/frame";

interface EventAboutProps {
  description: string;
}

export function EventAbout({ description }: EventAboutProps) {
  return (
    <Frame>
      <FramePanel>
        <FrameHeader>
          <FrameTitle>About</FrameTitle>
        </FrameHeader>
        <div className="px-5 pb-4">
          <p className="text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        </div>
      </FramePanel>
    </Frame>
  );
}
