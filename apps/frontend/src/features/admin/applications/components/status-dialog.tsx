import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";

export interface PendingAction {
  id: string;
  status: "accepted" | "rejected";
  schoolName: string;
  thumbnail: string | null;
}

interface StatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pendingAction: PendingAction | null;
  isPending: boolean;
  onConfirm: (notes?: string) => void;
}

export function StatusDialog({
  open,
  onOpenChange,
  pendingAction,
  isPending,
  onConfirm,
}: StatusDialogProps) {
  const [notes, setNotes] = useState("");

  const handleConfirm = () => {
    onConfirm(notes || undefined);
  };

  const handleOpenChange = (isOpen: boolean) => {
    onOpenChange(isOpen);
    if (!isOpen) {
      setNotes("");
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {pendingAction?.status === "accepted" ? "Approve" : "Reject"}{" "}
            Application
          </AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to{" "}
            {pendingAction?.status === "accepted" ? "approve" : "reject"} the
            application from <strong>{pendingAction?.schoolName}</strong>?
            {pendingAction?.status === "accepted"
              ? " This will grant them access to the platform."
              : " This will deny their access to the platform."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {pendingAction?.status === "accepted" && pendingAction.thumbnail && (
          <div className="px-6 pb-4">
            <img
              src={pendingAction.thumbnail}
              alt={`${pendingAction.schoolName} submission`}
              className="w-full rounded-lg object-cover"
            />
          </div>
        )}
        {pendingAction?.status === "rejected" && (
          <div className="px-6 pb-4">
            <Textarea
              placeholder="Add a note (optional)..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        )}
        <AlertDialogFooter>
          <AlertDialogClose
            render={<Button variant="outline" disabled={isPending} />}
          >
            Cancel
          </AlertDialogClose>
          <Button
            variant={
              pendingAction?.status === "accepted"
                ? "default"
                : "destructive-outline"
            }
            disabled={isPending}
            onClick={handleConfirm}
          >
            {isPending ? (
              <Spinner
                label={
                  pendingAction?.status === "accepted"
                    ? "Approving..."
                    : "Rejecting..."
                }
              />
            ) : pendingAction?.status === "accepted" ? (
              "Approve"
            ) : (
              "Reject"
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
