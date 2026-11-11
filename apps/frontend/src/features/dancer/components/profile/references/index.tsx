import { ReorderHint, SortableList } from "@/components/shared/sortable-list";
import {
  Frame,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/ui/frame";
import { useReorderReferences } from "@/features/dancer/api/mutations";
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
  const { mutate: reorder } = useReorderReferences(username);

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
        {showOwnerControls ? <ReorderHint items={references} /> : null}
      </FrameHeader>
      <FramePanel className="p-0!">
        {references.length > 0 ? (
          <SortableList
            items={references}
            getId={(reference) => reference.id}
            getLabel={(reference) => reference.name}
            onReorder={
              showOwnerControls
                ? (next) =>
                    reorder({
                      body: { ids: next.map((reference) => reference.id) },
                    })
                : undefined
            }
            className="flex flex-col divide-y"
          >
            {(reference, handle) => (
              <ReferenceItem
                reference={reference}
                username={username}
                showOwnerControls={showOwnerControls}
                handle={handle}
              />
            )}
          </SortableList>
        ) : (
          <div className="flex flex-col gap-1 p-4">
            <span className="text-muted-foreground text-sm">
              No references posted
            </span>
          </div>
        )}
      </FramePanel>
    </Frame>
  );
}
