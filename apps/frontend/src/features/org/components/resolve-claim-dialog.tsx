import { ArrowDownIcon, WarningIcon } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";

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
import {
  ComboboxEmpty,
  ComboboxField,
  ComboboxItem,
  ComboboxList,
  ComboboxPopup,
  ComboboxRoot,
} from "@/components/event/combobox";
import { Icon } from "@/components/event/icon";
import { toastManager } from "@/components/ui/toast-manager";
import {
  useResolveRosterClaim,
  type RosterClaim,
} from "@/features/org/api/roster-claim-queries";
import {
  rosterQueries,
  type RosterEntry,
} from "@/features/org/api/roster-queries";
import { BusyLabel } from "@/features/org/live/shared/busy-label";

interface ResolveClaimDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgSlug: string;
  eventId: string;
  claim: RosterClaim;
  onSuccess: () => void;
}

function entryLabel(entry: RosterEntry) {
  return `${entry.firstName ?? ""} ${entry.lastName ?? ""} ${entry.email}`.trim();
}

export function ResolveClaimDialog({
  open,
  onOpenChange,
  orgSlug,
  eventId,
  claim,
  onSuccess,
}: ResolveClaimDialogProps) {
  // Seeded with the name they gave, since that is what the roster was most
  // likely uploaded under.
  const [query, setQuery] = useState(claim.claimed.lastName);
  const [debouncedQuery, setDebouncedQuery] = useState(claim.claimed.lastName);
  const [picked, setPicked] = useState<RosterEntry | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const resolve = useResolveRosterClaim();

  const rosterQuery = useQuery({
    ...rosterQueries.list(orgSlug, eventId, {
      type: "dancer",
      search: debouncedQuery,
      limit: 20,
    }),
    enabled: open && debouncedQuery.trim().length >= 2,
  });

  // Must stay referentially stable — Base UI reads it in a layout effect.
  const entries = useMemo<RosterEntry[]>(
    () => rosterQuery.data?.data ?? [],
    [rosterQuery.data],
  );
  // Module-scope, so already referentially stable — Base UI requires that.

  const reset = useCallback(() => {
    setPicked(null);
    setQuery(claim.claimed.lastName);
    setDebouncedQuery(claim.claimed.lastName);
  }, [claim.claimed.lastName]);

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (!next) reset();
      onOpenChange(next);
    },
    [onOpenChange, reset],
  );

  const handleConfirm = async () => {
    if (!picked) return;
    try {
      await resolve.mutateAsync({
        params: { path: { slug: orgSlug, claimId: claim.id } },
        body: { action: "approve", rosterId: picked.id },
      });
      toastManager.add({ title: "Roster entry connected", type: "success" });
      reset();
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      const e = err as { code?: string; message?: string };
      toastManager.add({
        title:
          e?.code === "DUPLICATE_ROSTER"
            ? "That account already has another entry for this event."
            : (e?.message ?? "Could not connect the roster entry."),
        type: "error",
      });
      setPicked(null);
    }
  };

  const emptyMessage =
    debouncedQuery.trim().length < 2
      ? "Type at least 2 characters to search."
      : rosterQuery.isLoading
        ? "Searching…"
        : "No roster entries found.";

  const requesterName = [claim.requester.firstName, claim.requester.lastName]
    .filter(Boolean)
    .join(" ");

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogPopup>
        <DialogHeader>
          <DialogTitle>Find their roster entry</DialogTitle>
          <DialogDescription>
            Pick the entry that belongs to {requesterName}. Their account gets
            linked to it.
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          <div className="border-line bg-bg-300 flex flex-col gap-(--space-2) rounded-(--radius-6) border p-(--space-10)">
            <p className="type-meta text-fg-3 m-0">
              They say they registered as
            </p>
            <p className="type-body-strong text-fg m-0 truncate">
              {claim.claimed.firstName} {claim.claimed.lastName}
            </p>
            {claim.claimed.email && (
              <p className="type-caption text-fg-2 m-0 truncate">
                using {claim.claimed.email}
              </p>
            )}
          </div>

          <ComboboxRoot
            items={entries}
            filter={null}
            value={null}
            itemToStringLabel={entryLabel}
            onInputValueChange={setQuery}
            onValueChange={(entry: RosterEntry | null) => {
              if (entry) setPicked(entry);
            }}
            autoHighlight
          >
            <ComboboxField
              aria-label="Search roster entries"
              placeholder="Search the roster by name or email"
              loading={
                debouncedQuery.trim().length >= 2 && rosterQuery.isFetching
              }
            />
            <ComboboxPopup aria-label="Matching roster entries">
              <ComboboxEmpty>{emptyMessage}</ComboboxEmpty>
              <ComboboxList>
                {(entry: RosterEntry) => (
                  <ComboboxItem key={entry.id} value={entry}>
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="type-body-strong text-fg truncate">
                        {entry.firstName} {entry.lastName}
                        {entry.bibNumber !== null && (
                          <span className="type-data-sm text-fg-3 ml-(--space-6)">
                            #{entry.bibNumber}
                          </span>
                        )}
                      </span>
                      <span className="type-caption text-fg-2 truncate">
                        {entry.email}
                        {entry.isRegistered && " · already claimed"}
                      </span>
                    </span>
                  </ComboboxItem>
                )}
              </ComboboxList>
            </ComboboxPopup>
          </ComboboxRoot>
        </DialogBody>
        <DialogFooter>
          <DialogClose render={<Button variant="ghost" size="lg" />}>
            Cancel
          </DialogClose>
        </DialogFooter>

        <Dialog
          open={picked !== null}
          onOpenChange={(next) => {
            if (!next) setPicked(null);
          }}
        >
          <DialogPopup role="alertdialog">
            <DialogHeader>
              <DialogTitle>
                {picked?.linkedUser
                  ? "Reassign this roster entry?"
                  : "Connect this roster entry?"}
              </DialogTitle>
              <DialogDescription>
                Roster entry{" "}
                <span className="text-fg font-medium">
                  {picked?.firstName} {picked?.lastName}
                </span>{" "}
                ({picked?.email}) will be linked to a different account.
              </DialogDescription>
            </DialogHeader>

            <DialogBody>
              <div className="border-line bg-bg-300 flex flex-col gap-(--space-8) rounded-(--radius-6) border p-(--space-10)">
                <div className="flex min-w-0 flex-col gap-(--space-2)">
                  <span className="type-meta text-fg-3">From</span>
                  {picked?.linkedUser ? (
                    <>
                      <span className="type-body-strong text-fg truncate">
                        {[
                          picked.linkedUser.firstName,
                          picked.linkedUser.lastName,
                        ]
                          .filter(Boolean)
                          .join(" ")}
                      </span>
                      <span className="type-caption text-fg-2 break-all">
                        {picked.linkedUser.email}
                      </span>
                    </>
                  ) : (
                    <span className="type-body text-fg-3">
                      No account linked
                    </span>
                  )}
                </div>
                <Icon icon={ArrowDownIcon} className="text-fg-3" />
                <div className="flex min-w-0 flex-col gap-(--space-2)">
                  <span className="type-meta text-fg-3">To</span>
                  <span className="type-body-strong text-fg truncate">
                    {requesterName}
                  </span>
                  <span className="type-caption text-fg-2 break-all">
                    {claim.requester.email}
                  </span>
                </div>
              </div>

              {picked?.linkedUser && (
                <p className="border-danger/40 text-danger type-body m-0 flex gap-(--space-8) rounded-(--radius-6) border p-(--space-10)">
                  <Icon icon={WarningIcon} className="mt-[2px]" />
                  This unregisters the current account from the event and drops
                  any callbacks it received. If it is a different dancer, stop
                  and check first.
                </p>
              )}
            </DialogBody>

            <DialogFooter>
              <DialogClose render={<Button variant="ghost" size="lg" />}>
                Cancel
              </DialogClose>
              <Button
                variant={picked?.linkedUser ? "danger" : "primary"}
                size="lg"
                className={
                  picked?.linkedUser
                    ? "border-danger/40 hover:border-danger"
                    : undefined
                }
                onClick={handleConfirm}
                disabled={resolve.isPending}
              >
                {resolve.isPending ? (
                  <BusyLabel label="Connecting…" />
                ) : picked?.linkedUser ? (
                  "Reassign entry"
                ) : (
                  "Connect entry"
                )}
              </Button>
            </DialogFooter>
          </DialogPopup>
        </Dialog>
      </DialogPopup>
    </Dialog>
  );
}
