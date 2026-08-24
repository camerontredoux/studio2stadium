import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogPopup,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  rosterSearchQueries,
  useAttachAccount,
} from "@/features/org/api/roster-queries";
import { useQuery } from "@tanstack/react-query";
import { SearchIcon, TriangleAlertIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

/** The account a roster entry currently belongs to, if any. */
export interface LinkedAccount {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
}

interface SearchResult {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  avatar: string | null;
  username: string;
}

interface AttachAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgSlug: string;
  eventId: string;
  rosterId: string;
  isRelink: boolean;
  /**
   * The account currently holding this entry. Drives the confirmation copy —
   * reassigning away from a real account unregisters them, so the admin is
   * shown who that is before anything is written.
   */
  linkedUser: LinkedAccount | null;
  onSuccess: () => void;
}

function fullName(
  person: { firstName: string | null; lastName: string | null } | null
): string {
  if (!person) return "";
  return [person.firstName, person.lastName].filter(Boolean).join(" ").trim();
}

function initials(
  person: { firstName: string | null; lastName: string | null } | null
): string {
  if (!person) return "";
  return `${person.firstName?.[0] ?? ""}${person.lastName?.[0] ?? ""}`;
}

export function AttachAccountDialog({
  open,
  onOpenChange,
  orgSlug,
  eventId,
  rosterId,
  isRelink,
  linkedUser,
  onSuccess,
}: AttachAccountDialogProps) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [pendingUser, setPendingUser] = useState<SearchResult | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Cleared on the way out rather than on the way in, so the next open starts
  // fresh without a render pass that resets state under the open dialog.
  const resetSearch = useCallback(() => {
    setQuery("");
    setDebouncedQuery("");
    setPendingUser(null);
  }, []);

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (!next) resetSearch();
      onOpenChange(next);
    },
    [onOpenChange, resetSearch]
  );

  const searchQuery = useQuery({
    ...rosterSearchQueries.dancerUsers(orgSlug, eventId, debouncedQuery),
    enabled: open && debouncedQuery.length >= 2,
  });

  const attachMutation = useAttachAccount();

  // Base UI reads `items` in a layout effect, so an unstable reference here
  // loops until it blows the update-depth limit.
  const results = useMemo<SearchResult[]>(
    () => searchQuery.data ?? [],
    [searchQuery.data]
  );

  const itemToStringLabel = useCallback(
    (user: SearchResult) => `${fullName(user)} ${user.email}`.trim(),
    []
  );

  // Reassigning away from a *different* account is the destructive case. Re-
  // attaching the account that already holds the entry changes nothing.
  const displaces =
    pendingUser !== null &&
    linkedUser !== null &&
    linkedUser.id !== pendingUser.id;

  const emptyMessage =
    debouncedQuery.trim().length < 2
      ? "Type at least 2 characters to search."
      : searchQuery.isLoading
        ? "Searching…"
        : "No users found.";

  const handleConfirm = async () => {
    if (!pendingUser) return;
    try {
      await attachMutation.mutateAsync({
        params: { path: { slug: orgSlug, id: eventId, rosterId } },
        body: { targetUserId: pendingUser.id, confirmRelink: displaces },
      });
      toastManager.add({
        title: isRelink ? "Account changed" : "Account attached",
        type: "success",
      });
      resetSearch();
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      const error = err as { code?: string; message?: string };
      const message =
        error?.code === "ROSTER_ALREADY_LINKED"
          ? "This entry was claimed by another account while you were working. Reopen it to see the current owner."
          : (error?.message ??
            "Failed to attach account. Please try again.");
      toastManager.add({ title: message, type: "error" });
      setPendingUser(null);
    }
  };

  const title = isRelink ? "Change Account" : "Attach to Account";

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogPopup>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>
              Search for an existing user to link to this roster entry. The
              roster email and name will update to match the selected account.
            </DialogDescription>
          </DialogHeader>
          <DialogPanel>
            <div className="flex flex-col gap-3">
              {linkedUser && (
                <div className="bg-muted/50 flex items-center gap-3 rounded-md border p-3">
                  <Avatar className="size-8">
                    <AvatarImage src={linkedUser.avatarUrl ?? undefined} />
                    <AvatarFallback className="text-xs">
                      {initials(linkedUser)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="text-muted-foreground text-xs">
                      Currently linked to
                    </p>
                    <p className="truncate text-sm font-medium">
                      {fullName(linkedUser)}
                    </p>
                    <p className="text-muted-foreground truncate text-xs">
                      {linkedUser.email}
                    </p>
                  </div>
                </div>
              )}

              <Combobox
                items={results}
                filter={null}
                value={null}
                itemToStringLabel={itemToStringLabel}
                onInputValueChange={setQuery}
                onValueChange={(user: SearchResult | null) => {
                  if (user) setPendingUser(user);
                }}
                autoHighlight
              >
                <ComboboxInput
                  aria-label="Search accounts by name or email"
                  placeholder="Search by name or email…"
                  startAddon={<SearchIcon />}
                />
                <ComboboxPopup aria-label="Matching accounts">
                  <ComboboxEmpty>{emptyMessage}</ComboboxEmpty>
                  <ComboboxList>
                    {(user: SearchResult) => (
                      <ComboboxItem key={user.id} value={user}>
                        <div className="flex min-w-0 items-center gap-3">
                          <Avatar className="size-8">
                            <AvatarImage src={user.avatar ?? undefined} />
                            <AvatarFallback className="text-xs">
                              {initials(user)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">
                              {fullName(user)}
                            </p>
                            <p className="text-muted-foreground truncate text-xs">
                              {user.email}
                            </p>
                          </div>
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
        open={pendingUser !== null}
        onOpenChange={(next) => {
          if (!next) setPendingUser(null);
        }}
      >
        <AlertDialogPopup>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {displaces ? "Reassign this roster entry?" : "Link this account?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {displaces ? (
                <>
                  This entry currently belongs to{" "}
                  <span className="font-medium">{fullName(linkedUser)}</span> (
                  {linkedUser?.email}). Linking{" "}
                  <span className="font-medium">{fullName(pendingUser)}</span>{" "}
                  will unregister them from this event — they will lose it from
                  their profile along with any callbacks they have received.
                </>
              ) : (
                <>
                  <span className="font-medium">{fullName(pendingUser)}</span> (
                  {pendingUser?.email}) will be linked to this roster entry. The
                  entry&rsquo;s email and name will be updated to match.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {displaces && (
            <div className="border-destructive/30 bg-destructive/5 text-destructive mx-6 flex gap-2 rounded-md border p-3 text-sm">
              <TriangleAlertIcon className="mt-0.5 size-4 shrink-0" />
              <p>
                Check this is the same person before continuing. Reassigning is
                not undone by changing it back.
              </p>
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogClose render={<Button variant="ghost" />}>
              Cancel
            </AlertDialogClose>
            <Button
              variant={displaces ? "destructive" : "default"}
              onClick={handleConfirm}
              disabled={attachMutation.isPending}
            >
              {attachMutation.isPending ? (
                <Spinner label="Saving…" />
              ) : displaces ? (
                "Reassign entry"
              ) : (
                "Link account"
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogPopup>
      </AlertDialog>
    </>
  );
}
