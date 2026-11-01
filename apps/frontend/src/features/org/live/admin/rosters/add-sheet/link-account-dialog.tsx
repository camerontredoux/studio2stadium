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
import type { RosterType } from "@/features/org/api/roster-queries";

import { type AccountResult, AccountSearch } from "../account-search";

interface LinkAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgSlug: string;
  eventId: string;
  type: RosterType;
  linked: boolean;
  onPick: (account: AccountResult) => void;
  onUnlink: () => void;
}

/**
 * Picks an existing account for an entry that isn't saved yet, so nothing is
 * written until the admin adds the entry.
 */
export function LinkAccountDialog({
  open,
  onOpenChange,
  orgSlug,
  eventId,
  type,
  linked,
  onPick,
  onUnlink,
}: LinkAccountDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup data-testid="link-account-dialog">
        <DialogHeader>
          <DialogTitle>
            {linked ? "Change account" : "Link account"}
          </DialogTitle>
          <DialogDescription>
            Search for an existing {type === "dancer" ? "dancer" : "school"}{" "}
            account. The new entry uses its email.
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          <AccountSearch
            orgSlug={orgSlug}
            eventId={eventId}
            type={type}
            enabled={open}
            onPick={(account) => {
              onPick(account);
              onOpenChange(false);
            }}
          />
        </DialogBody>
        <DialogFooter>
          {linked && (
            <Button
              variant="ghost"
              size="lg"
              className="me-auto"
              onClick={() => {
                onUnlink();
                onOpenChange(false);
              }}
            >
              Unlink
            </Button>
          )}
          <DialogClose render={<Button variant="ghost" size="lg" />}>
            Cancel
          </DialogClose>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}
