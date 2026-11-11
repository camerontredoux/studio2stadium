import {
  Frame,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/ui/frame";
import { useProfile } from "../context/use-profile";
import { EditDialog } from "../edit/edit-dialog";
import { BiographyContent } from "./biography-content";
import type { BiographyFormat } from "./format";

interface BiographyProps {
  description: string | null;
  format: BiographyFormat;
  username: string;
}

export function Biography({ description, format, username }: BiographyProps) {
  const { showOwnerControls } = useProfile();

  return (
    <Frame>
      <FrameHeader>
        <FrameTitle className="flex items-center justify-between gap-2">
          About Me
          {showOwnerControls ? (
            <EditDialog username={username} />
          ) : (
            <div className="h-7 w-fit sm:h-6" />
          )}
        </FrameTitle>
      </FrameHeader>
      <FramePanel className="text-sm leading-relaxed">
        {description ? (
          <BiographyContent text={description} format={format} />
        ) : (
          <span className="text-muted-foreground text-sm">
            No biography provided
          </span>
        )}
      </FramePanel>
    </Frame>
  );
}
