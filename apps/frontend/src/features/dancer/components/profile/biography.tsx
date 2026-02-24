import {
  Frame,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/ui/frame";

interface BiographyProps {
  description: string | null;
}

export function Biography({ description }: BiographyProps) {
  return (
    <Frame>
      <FrameHeader>
        <FrameTitle>About Me</FrameTitle>
      </FrameHeader>
      <FramePanel className="text-sm leading-relaxed">
        {description || (
          <span className="text-muted-foreground text-sm">
            No biography provided
          </span>
        )}
      </FramePanel>
    </Frame>
  );
}
