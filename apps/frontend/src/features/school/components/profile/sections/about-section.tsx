import {
  Frame,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/ui/frame";

interface AboutSectionProps {
  about: string | null;
}

export function AboutSection({ about }: AboutSectionProps) {
  return (
    <Frame>
      <FrameHeader>
        <FrameTitle className="flex items-center justify-between gap-2">
          About
          <div className="h-7 w-fit sm:h-6" />
        </FrameTitle>
      </FrameHeader>
      <FramePanel className="text-sm leading-relaxed">
        {about || (
          <span className="text-muted-foreground text-sm">
            No description provided
          </span>
        )}
      </FramePanel>
    </Frame>
  );
}
