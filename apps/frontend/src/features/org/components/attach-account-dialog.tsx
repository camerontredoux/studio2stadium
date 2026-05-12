import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { toastManager } from "@/components/ui/toast-manager";
import {
  rosterSearchQueries,
  useAttachAccount,
} from "@/features/org/api/roster-queries";
import { useQuery } from "@tanstack/react-query";
import { SearchIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface AttachAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgSlug: string;
  eventId: string;
  rosterId: string;
  isRelink: boolean;
  onSuccess: () => void;
}

export function AttachAccountDialog({
  open,
  onOpenChange,
  orgSlug,
  eventId,
  rosterId,
  isRelink,
  onSuccess,
}: AttachAccountDialogProps) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setDebouncedQuery("");
      setSelectedId(null);
    }
  }, [open]);

  const searchQuery = useQuery({
    ...rosterSearchQueries.dancerUsers(orgSlug, eventId, debouncedQuery),
    enabled: open && debouncedQuery.length >= 2,
  });

  const attachMutation = useAttachAccount();

  const results = searchQuery.data ?? [];

  const handleAttach = async () => {
    if (!selectedId) return;
    try {
      await attachMutation.mutateAsync({
        params: {
          path: { slug: orgSlug, id: eventId, rosterId },
        },
        body: { targetUserId: selectedId },
      });
      toastManager.add({
        title: isRelink ? "Account changed" : "Account attached",
        type: "success",
      });
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      const message =
        (err as { message?: string })?.message ??
        "Failed to attach account. Please try again.";
      toastManager.add({ title: message, type: "error" });
    }
  };

  const title = isRelink ? "Change Account" : "Attach to Account";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Search for an existing user to link to this roster entry. The roster
            email and name will update to match the selected account.
          </DialogDescription>
        </DialogHeader>
        <DialogPanel>
          <div className="flex flex-col gap-3">
            <div className="relative">
              <SearchIcon className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
              <Input
                ref={inputRef}
                placeholder="Search by name or email..."
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedId(null);
                }}
                className="pl-9"
              />
            </div>

            {debouncedQuery.length >= 2 && searchQuery.isLoading && (
              <div className="flex justify-center py-4">
                <Spinner label="Searching..." />
              </div>
            )}

            {debouncedQuery.length >= 2 &&
              !searchQuery.isLoading &&
              results.length === 0 && (
                <p className="text-muted-foreground py-4 text-center text-sm">
                  No users found
                </p>
              )}

            {results.length > 0 && (
              <div className="flex max-h-64 flex-col overflow-y-auto rounded-md border">
                {results.map((user) => {
                  const isSelected = user.id === selectedId;
                  return (
                    <button
                      key={user.id}
                      type="button"
                      className={`flex items-center gap-3 border-l-3 px-3 py-2.5 text-left transition-colors ${
                        isSelected
                          ? "border-l-primary bg-primary/5"
                          : "border-l-transparent hover:bg-muted"
                      }`}
                      onClick={() =>
                        setSelectedId(isSelected ? null : user.id)
                      }
                    >
                      <Avatar className="size-8">
                        <AvatarImage src={user.avatar ?? undefined} />
                        <AvatarFallback className="text-xs">
                          {user.firstName?.[0]}
                          {user.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-muted-foreground truncate text-xs">
                          {user.email}
                        </p>
                      </div>
                      {isSelected && (
                        <span className="text-primary text-xs font-medium">
                          Selected
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </DialogPanel>
        <DialogFooter>
          <DialogClose render={<Button variant="ghost" />}>Cancel</DialogClose>
          <Button
            onClick={handleAttach}
            disabled={!selectedId || attachMutation.isPending}
          >
            {attachMutation.isPending ? (
              <Spinner label="Attaching..." />
            ) : isRelink ? (
              "Change"
            ) : (
              "Attach"
            )}
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}
