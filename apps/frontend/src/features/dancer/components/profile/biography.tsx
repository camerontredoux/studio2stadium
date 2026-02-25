import {
  Frame,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/ui/frame";
import { useProfile } from "./context/use-profile";
import { EditDialog } from "./edit/edit-dialog";

interface BiographyProps {
  description: string | null;
  username: string;
}

export function Biography({ description, username }: BiographyProps) {
  const { showOwnerControls } = useProfile();

  return (
    <Frame>
      <FrameHeader>
        <FrameTitle className="flex items-center justify-between gap-2">
          About Me
          {showOwnerControls ? (
            <EditDialog username={username} />
          ) : (
            <div className="h-6 w-fit" />
          )}
        </FrameTitle>
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
