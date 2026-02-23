import {
  Frame,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/ui/frame";

interface DancerAboutProps {
  description: string;
}

export function DancerAbout({ description }: DancerAboutProps) {
  return (
    <Frame>
      <FrameHeader>
        <FrameTitle>About</FrameTitle>
      </FrameHeader>
      <FramePanel className="text-sm leading-relaxed">{description}</FramePanel>
    </Frame>
  );
}
