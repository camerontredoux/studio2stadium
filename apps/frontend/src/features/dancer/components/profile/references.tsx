import { Button } from "@/components/ui/button";
import {
  Frame,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/ui/frame";
import { type ApiSchemas } from "@/lib/api/client";
import { PlusIcon, UserCircle2Icon } from "lucide-react";
import { useProfile } from "./context/use-profile";

type Reference = ApiSchemas["DancersIdResponse"]["references"][number];

export function References({ references }: { references: Reference[] }) {
  const { showOwnerControls } = useProfile();

  return (
    <Frame>
      <FrameHeader>
        <FrameTitle className="flex items-center justify-between gap-2">
          References
          {showOwnerControls ? (
            <Button size="icon-xs" variant="ghost">
              <PlusIcon />
            </Button>
          ) : (
            <div className="h-7 w-fit sm:h-6" />
          )}
        </FrameTitle>
      </FrameHeader>
      <FramePanel className="p-0!">
        <div className="flex flex-col divide-y">
          {references.length > 0 ? (
            references.map((reference) => (
              <div className="hover:bg-accent/50 flex flex-col gap-1 px-4 py-2">
                <div className="flex items-center gap-2">
                  <UserCircle2Icon className="text-brand size-4 shrink-0" />
                  <span className="text-sm">{reference.name}</span>
                </div>
                <span className="text-muted-foreground text-sm">
                  {reference.description ?? "No description"}
                </span>
              </div>
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
