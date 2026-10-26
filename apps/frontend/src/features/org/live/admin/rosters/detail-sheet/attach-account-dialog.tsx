import { WarningIcon } from "@phosphor-icons/react";
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
import { BusyLabel } from "@/features/org/live/shared/busy-label";
import { PersonAvatar } from "@/features/org/live/shared/person-avatar";
import { toastManager } from "@/components/ui/toast-manager";
import {
  rosterSearchQueries,
  useAttachAccount,
} from "@/features/org/api/roster-queries";
import type { ApiSchemas } from "@/lib/api/client";

/** The account a roster entry currently belongs to, if any. */
export interface LinkedAccount {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
}

type SearchResult =
  ApiSchemas["OrgsIdEventsIdRostersSearchdancersResponse"][number];

interface AttachAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgSlug: string;
  eventId: string;
  rosterId: string;
  isRelink: boolean;
  /**
   * The account currently holding this entry. Drives the confirmation copy:
   * reassigning away from a real account unregisters them, so the admin is
   * shown who that is before anything is written.
   */
  linkedUser: LinkedAccount | null;
  onSuccess: () => void;
}

function fullName(
  person: { firstName: string | null; lastName: string | null } | null,
): string {
  if (!person) return "";
  return [person.firstName, person.lastName].filter(Boolean).join(" ").trim();
}

/**
 * Links a dancer's roster entry to an existing account ("Change" in the
 * roster detail sheet). Search, pick, then confirm; reassigning away from a
 * different account gets the destructive confirmation.
 */
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
    [onOpenChange, resetSearch],
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
    [searchQuery.data],
  );

  const itemToStringLabel = useCallback(
    (user: SearchResult) => `${fullName(user)} ${user.email}`.trim(),
    [],
  );

  // Reassigning away from a *different* account is the destructive case.
  // Re-attaching the account that already holds the entry changes nothing.
  const displaces =
    pendingUser !== null &&
    linkedUser !== null &&
    linkedUser.id !== pendingUser.id;

  const emptyMessage =
    debouncedQuery.trim().length < 2
      ? "Type at least 2 characters to search."
      : searchQuery.isLoading
        ? "Searching…"
        : "No accounts found.";

  const handleConfirm = async () => {
    if (!pendingUser) return;
    try {
      await attachMutation.mutateAsync({
        params: { path: { slug: orgSlug, id: eventId, rosterId } },
        body: { targetUserId: pendingUser.id, confirmRelink: displaces },
      });
      toastManager.add({
        title: isRelink ? "Account changed" : "Account linked",
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
          : (error?.message ?? "Couldn't link the account. Try again.");
      toastManager.add({ title: message, type: "error" });
      setPendingUser(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogPopup data-testid="attach-account-dialog">
        <DialogHeader>
          <DialogTitle>
            {isRelink ? "Change account" : "Link account"}
          </DialogTitle>
          <DialogDescription>
            Search for an existing account to link to this roster entry. The
            entry&rsquo;s name and email update to match it.
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          {linkedUser && (
            <div className="border-line bg-bg-300 flex items-center gap-(--space-10) rounded-(--radius-6) border p-(--space-10)">
              <PersonAvatar
                firstName={linkedUser.firstName}
                lastName={linkedUser.lastName}
                src={linkedUser.avatarUrl}
              />
              <div className="min-w-0 flex-1">
                <p className="type-meta text-fg-3">Currently linked to</p>
                <p className="type-body-strong text-fg truncate">
                  {fullName(linkedUser) || linkedUser.email}
                </p>
                <p className="type-caption text-fg-2 truncate">
                  {linkedUser.email}
                </p>
              </div>
            </div>
          )}

          <ComboboxRoot
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
            <ComboboxField
              aria-label="Search accounts by name or email"
              placeholder="Search by name or email"
              loading={debouncedQuery.length >= 2 && searchQuery.isFetching}
            />
            <ComboboxPopup aria-label="Matching accounts">
              <ComboboxEmpty>{emptyMessage}</ComboboxEmpty>
              <ComboboxList>
                {(user: SearchResult) => (
                  <ComboboxItem key={user.id} value={user}>
                    <PersonAvatar
                      firstName={user.firstName}
                      lastName={user.lastName}
                      src={user.avatar}
                    />
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="type-body-strong text-fg truncate">
                        {fullName(user) || user.email}
                      </span>
                      <span className="type-caption text-fg-2 truncate">
                        {user.email}
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
          open={pendingUser !== null}
          onOpenChange={(next) => {
            if (!next) setPendingUser(null);
          }}
        >
          <DialogPopup role="alertdialog">
            <DialogHeader>
              <DialogTitle>
                {displaces
                  ? "Reassign this roster entry?"
                  : "Link this account?"}
              </DialogTitle>
              <DialogDescription>
                {displaces ? (
                  <>
                    This entry belongs to{" "}
                    <span className="text-fg font-medium">
                      {fullName(linkedUser)}
                    </span>{" "}
                    ({linkedUser?.email}). Linking{" "}
                    <span className="text-fg font-medium">
                      {fullName(pendingUser)}
                    </span>{" "}
                    unregisters them from this event: they lose it from their
                    profile, along with any callbacks they have received.
                  </>
                ) : (
                  <>
                    <span className="text-fg font-medium">
                      {fullName(pendingUser)}
                    </span>{" "}
                    ({pendingUser?.email}) will be linked to this roster entry,
                    and the entry&rsquo;s name and email will update to match.
                  </>
                )}
              </DialogDescription>
            </DialogHeader>
            {displaces ? (
              <DialogBody>
                <p className="border-danger/40 text-danger type-body flex gap-(--space-8) rounded-(--radius-6) border p-(--space-10)">
                  <Icon icon={WarningIcon} className="mt-[2px]" />
                  Check this is the same person first. Changing it back does not
                  undo a reassignment.
                </p>
              </DialogBody>
            ) : (
              <div className="h-(--space-16)" />
            )}
            <DialogFooter>
              <DialogClose render={<Button variant="ghost" size="lg" />}>
                Cancel
              </DialogClose>
              <Button
                variant={displaces ? "danger" : "primary"}
                size="lg"
                onClick={handleConfirm}
                disabled={attachMutation.isPending}
              >
                {attachMutation.isPending ? (
                  <BusyLabel label="Saving…" />
                ) : displaces ? (
                  "Reassign entry"
                ) : (
                  "Link account"
                )}
              </Button>
            </DialogFooter>
          </DialogPopup>
        </Dialog>
      </DialogPopup>
    </Dialog>
  );
}
