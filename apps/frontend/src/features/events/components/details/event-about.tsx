import {
  Frame,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/ui/frame";

interface EventAboutProps {
  description: string;
}

export function EventAbout({ description }: EventAboutProps) {
  return (
    <Frame>
      <FrameHeader>
        <FrameTitle>About</FrameTitle>
      </FrameHeader>
      <FramePanel className="text-sm leading-relaxed">{description}</FramePanel>
    </Frame>
  );
}
