import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Frame,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/ui/frame";
import { Spinner } from "@/components/ui/spinner";
import { useDeleteReference } from "@/features/dancer/api/mutations";
import { type ApiSchemas } from "@/lib/api/client";
import { TrashIcon, UserCircle2Icon } from "lucide-react";
import * as React from "react";
import { useProfile } from "../context/use-profile";
import { ReferencesDialog } from "./references-dialog";

type Reference = ApiSchemas["DancersIdResponse"]["references"][number];

function ReferenceItem({
  reference,
  username,
  showOwnerControls,
}: {
  reference: Reference;
  username: string;
  showOwnerControls: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const { mutate: deleteReference, isPending } = useDeleteReference(username);

  const handleDelete = () => {
    deleteReference(
      { params: { path: { id: reference.id } } },
      { onSuccess: () => setOpen(false) },
    );
  };

  return (
    <div className="hover:bg-accent/50 group flex flex-col gap-1 px-4 py-2">
      <div className="flex items-center gap-2">
        <UserCircle2Icon className="text-brand size-4 shrink-0" />
        <span className="flex-1 text-sm">
          {reference.name} &middot; {reference.title}
        </span>
        {showOwnerControls ? (
          <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger
              render={
                <Button
                  size="icon-xs"
                  variant="ghost"
                  className="mobile:opacity-100 opacity-0 group-hover:opacity-100"
                />
              }
            >
              <TrashIcon className="text-destructive-foreground size-3.5" />
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Reference</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete "{reference.name}"? This
                  action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogClose
                  render={<Button variant="outline" disabled={isPending} />}
                >
                  Cancel
                </AlertDialogClose>
                <Button
                  variant="destructive"
                  disabled={isPending}
                  onClick={handleDelete}
                >
                  {isPending ? <Spinner label="Deleting..." /> : "Delete"}
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : (
          <div className="h-7 w-fit sm:h-6" />
        )}
      </div>
      <span className="text-muted-foreground text-sm">
        {reference.description ?? "No description"}
      </span>
    </div>
  );
}

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
