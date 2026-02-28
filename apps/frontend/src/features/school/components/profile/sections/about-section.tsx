import {
  Frame,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/ui/frame";
import { useProfile } from "../context/use-profile";
import { EditDialog } from "../edit/edit-dialog";

interface AboutSectionProps {
  about: string | null;
}

export function AboutSection({ about }: AboutSectionProps) {
  const { username, showOwnerControls } = useProfile();

  return (
    <Frame>
      <FrameHeader>
        <FrameTitle className="flex items-center justify-between gap-2">
          About
          {showOwnerControls ? (
            <EditDialog username={username} />
          ) : (
            <div className="h-7 w-fit sm:h-6" />
          )}
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
