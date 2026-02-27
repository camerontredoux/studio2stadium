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
import { Spinner } from "@/components/ui/spinner";
import { useDeleteReference } from "@/features/dancer/api/mutations";
import type { Reference } from "@/features/dancer/types";
import { PencilIcon, TrashIcon, UserCircle2Icon } from "lucide-react";
import * as React from "react";
import { ReferencesDialog } from "./references-dialog";

export function ReferenceItem({
  reference,
  username,
  showOwnerControls,
}: {
  reference: Reference;
  username: string;
  showOwnerControls: boolean;
}) {
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const { mutate: deleteReference, isPending } = useDeleteReference(username);

  const handleDelete = () => {
    deleteReference(
      { params: { path: { id: reference.id } } },
      { onSuccess: () => setDeleteOpen(false) },
    );
  };

  return (
    <div className="hover:bg-accent/50 group flex flex-col gap-1 px-4 py-2">
      <div className="flex items-center gap-2">
        <UserCircle2Icon className="text-brand size-4 shrink-0" />
        <span className="flex min-w-0 flex-1 flex-nowrap items-center space-x-2 text-sm">
          <span>{reference.name}</span>{" "}
          <span className="text-muted-foreground">&middot;</span>{" "}
          <span className="truncate">{reference.title}</span>
        </span>
        {showOwnerControls ? (
          <div className="flex gap-1">
            <Button
              size="icon-xs"
              variant="ghost"
              onClick={() => setEditOpen(true)}
            >
              <PencilIcon className="size-3.5" />
            </Button>
            <ReferencesDialog
              username={username}
              reference={reference}
              open={editOpen}
              onOpenChange={setEditOpen}
            />
            <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
              <AlertDialogTrigger
                render={<Button size="icon-xs" variant="ghost" />}
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
          </div>
        ) : (
          <div className="h-7 w-fit sm:h-6" />
        )}
      </div>
      <span className="text-muted-foreground ml-6 text-sm">
        {reference.description ?? "No description"}
      </span>
    </div>
  );
}
