import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { Button } from "@/components/event/button";
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPopup,
  DialogTitle,
} from "@/components/event/dialog";
import { Label } from "@/components/event/label";
import { Input } from "@/components/ui/input";
import { toastManager } from "@/components/ui/toast-manager";
import {
  invalidateOrgEvents,
  type OrgEvent,
} from "@/features/org/api/admin-queries";
import { $api } from "@/lib/api/client";

// components/event has no text input yet; this dresses components/ui's Input as the S2S
// 32px control (the roster sheet fields use the same treatment).
const inputControl =
  "rounded-(--radius-6) border-line-control bg-bg-300 dark:bg-bg-300 text-fg shadow-none before:hidden transition-[border-color] " +
  "has-focus-visible:border-line-focus has-focus-visible:ring-0 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-fg " +
  "[&_input]:h-[30px] [&_input]:leading-[30px] [&_input]:px-[9px] [&_input]:s2s-input-size [&_input]:font-mono [&_input]:placeholder:text-fg-3";

/**
 * Confirms deleting the event: the admin types "delete", as on the old dashboard.
 * On success it calls `onDeleted` so the page can select another event.
 */
export function DeleteEventDialog({
  orgSlug,
  event,
  open,
  onOpenChange,
  onDeleted,
}: {
  orgSlug: string;
  event: OrgEvent;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted: () => void;
}) {
  const qc = useQueryClient();
  const [confirmText, setConfirmText] = useState("");
  const deleteMutation = $api.useMutation(
    "delete",
    "/orgs/{slug}/events/{id}",
    {
      onSuccess: () => {
        invalidateOrgEvents(qc, orgSlug);
        toastManager.add({ title: "Event deleted", type: "success" });
        setConfirmText("");
        onOpenChange(false);
        onDeleted();
      },
      onError: () => {
        toastManager.add({ title: "Couldn't delete event", type: "error" });
      },
    },
  );
  const confirmed = confirmText.trim().toLowerCase() === "delete";

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setConfirmText("");
        onOpenChange(next);
      }}
    >
      <DialogPopup role="alertdialog">
        <DialogHeader>
          <DialogTitle>Delete event</DialogTitle>
          <DialogDescription>
            This permanently deletes{" "}
            <span className="text-fg font-medium">{event.name}</span> with its
            rosters, uploads, callbacks and audit history. You can't undo it.
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          <label className="flex flex-col gap-(--space-6)">
            <Label>
              Type <span className="text-fg">delete</span> to confirm
            </Label>
            <Input
              className={inputControl}
              placeholder="delete"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              autoComplete="off"
              spellCheck={false}
            />
          </label>
        </DialogBody>
        <DialogFooter>
          <DialogClose
            render={<Button variant="ghost" size="lg" />}
            disabled={deleteMutation.isPending}
          >
            Cancel
          </DialogClose>
          <Button
            variant="danger"
            size="lg"
            className="border-danger/40 hover:border-danger"
            disabled={!confirmed || deleteMutation.isPending}
            onClick={() =>
              deleteMutation.mutate({
                params: { path: { slug: orgSlug, id: event.id } },
              })
            }
          >
            {deleteMutation.isPending ? "Deleting…" : "Delete event"}
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}
