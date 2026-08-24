import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogPopup,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Combobox,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxPopup,
} from "@/components/ui/combobox";
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { toastManager } from "@/components/ui/toast-manager";
import {
  rosterQueries,
  type RosterEntry,
} from "@/features/org/api/roster-queries";
import {
  useResolveRosterClaim,
  type RosterClaim,
} from "@/features/org/api/roster-claim-queries";
import { useQuery } from "@tanstack/react-query";
import { SearchIcon, TriangleAlertIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

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
  // Seeded with the name she gave, since that is what the roster was most
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
    [rosterQuery.data]
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
    [onOpenChange, reset]
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
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogPopup>
          <DialogHeader>
            <DialogTitle>Find her roster entry</DialogTitle>
            <DialogDescription>
              Choose the entry that belongs to {requesterName}. Her account will
              be linked to it and the entry updated to match.
            </DialogDescription>
          </DialogHeader>
          <DialogPanel>
            <div className="flex flex-col gap-3">
              <div className="bg-muted/50 rounded-md border p-3 text-sm">
                <p className="text-muted-foreground text-xs">She says she registered as</p>
                <p className="font-medium">
                  {claim.claimed.firstName} {claim.claimed.lastName}
                </p>
                {claim.claimed.email && (
                  <p className="text-muted-foreground text-xs">
                    using {claim.claimed.email}
                  </p>
                )}
              </div>

              <Combobox
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
                <ComboboxInput
                  aria-label="Search roster entries"
                  placeholder="Search the roster by name or email…"
                  startAddon={<SearchIcon />}
                />
                <ComboboxPopup aria-label="Matching roster entries">
                  <ComboboxEmpty>{emptyMessage}</ComboboxEmpty>
                  <ComboboxList>
                    {(entry: RosterEntry) => (
                      <ComboboxItem key={entry.id} value={entry}>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {entry.firstName} {entry.lastName}
                            {entry.bibNumber !== null && (
                              <span className="text-muted-foreground ml-1.5 text-xs">
                                #{entry.bibNumber}
                              </span>
                            )}
                          </p>
                          <p className="text-muted-foreground truncate text-xs">
                            {entry.email}
                            {entry.isRegistered && " · already claimed"}
                          </p>
                        </div>
                      </ComboboxItem>
                    )}
                  </ComboboxList>
                </ComboboxPopup>
              </Combobox>
            </div>
          </DialogPanel>
          <DialogFooter>
            <DialogClose render={<Button variant="ghost" />}>Cancel</DialogClose>
          </DialogFooter>
        </DialogPopup>
      </Dialog>

      <AlertDialog
        open={picked !== null}
        onOpenChange={(next) => {
          if (!next) setPicked(null);
        }}
      >
        <AlertDialogPopup>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {picked?.linkedUser
                ? "Reassign this roster entry?"
                : "Connect this roster entry?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {picked?.linkedUser ? (
                <>
                  <span className="font-medium">
                    {picked.firstName} {picked.lastName}
                  </span>{" "}
                  is currently linked to{" "}
                  <span className="font-medium">
                    {[
                      picked.linkedUser.firstName,
                      picked.linkedUser.lastName,
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  </span>{" "}
                  ({picked.linkedUser.email}). Connecting it to{" "}
                  <span className="font-medium">{requesterName}</span> will
                  unregister them from this event, along with any callbacks they
                  have received.
                </>
              ) : (
                <>
                  <span className="font-medium">{requesterName}</span> will be
                  linked to{" "}
                  <span className="font-medium">
                    {picked?.firstName} {picked?.lastName}
                  </span>{" "}
                  ({picked?.email}).
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {picked?.linkedUser && (
            <div className="border-destructive/30 bg-destructive/5 text-destructive mx-6 flex gap-2 rounded-md border p-3 text-sm">
              <TriangleAlertIcon className="mt-0.5 size-4 shrink-0" />
              <p>
                If a parent registered on her behalf this is expected. If it is
                a different dancer, stop and check first.
              </p>
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogClose render={<Button variant="ghost" />}>
              Cancel
            </AlertDialogClose>
            <Button
              variant={picked?.linkedUser ? "destructive" : "default"}
              onClick={handleConfirm}
              disabled={resolve.isPending}
            >
              {resolve.isPending ? (
                <Spinner label="Connecting…" />
              ) : picked?.linkedUser ? (
                "Reassign entry"
              ) : (
                "Connect entry"
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogPopup>
      </AlertDialog>
    </>
  );
}
