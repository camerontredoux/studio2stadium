import {
  Frame,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/ui/frame";

interface AboutProps {
  description: string;
}

export function About ({ description }: AboutProps) {
  return (
    <Frame>
      <FrameHeader>
        <FrameTitle>About</FrameTitle>
      </FrameHeader>
      <FramePanel className="text-sm leading-relaxed">"test"</FramePanel>
    </Frame>
  );
}
