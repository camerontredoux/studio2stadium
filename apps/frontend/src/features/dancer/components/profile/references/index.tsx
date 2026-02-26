import {
  Frame,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/ui/frame";
import type { Reference } from "@/features/dancer/types";
import { useProfile } from "../context/use-profile";
import { ReferenceItem } from "./reference-item";
import { ReferencesDialog } from "./references-dialog";

export function References({
  references,
  username,
}: {
  references: Reference[];
  username: string;
}) {
  const { showOwnerControls } = useProfile();

  return (
    <Frame className="h-fit">
      <FrameHeader>
        <FrameTitle className="flex items-center justify-between gap-2">
          References
          {showOwnerControls ? (
            <ReferencesDialog username={username} />
          ) : (
            <div className="h-7 w-fit sm:h-6" />
          )}
        </FrameTitle>
      </FrameHeader>
      <FramePanel className="p-0!">
        <div className="flex flex-col divide-y">
          {references.length > 0 ? (
            references.map((reference) => (
              <ReferenceItem
                key={reference.id}
                reference={reference}
                username={username}
                showOwnerControls={showOwnerControls}
              />
            ))
          ) : (
            <div className="flex flex-col gap-1 p-4">
              <span className="text-muted-foreground text-sm">
                No references posted
              </span>
            </div>
          )}
        </div>
      </FramePanel>
    </Frame>
  );
}
