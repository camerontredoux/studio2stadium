import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetPopup,
  SheetTitle,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { scoutingQueries } from "@/features/org/api/scouting-queries";
import { useOrg } from "@/features/org/context/use-org";
import { $api } from "@/lib/api/client";
import { Loader2Icon } from "lucide-react";
import { FavoriteButton } from "./favorite-button";
import { CallbackButton } from "./callback-button";
import { RatingInput } from "./rating-input";
import { NotesEditor } from "./notes-editor";
import { toastManager } from "@/components/ui/toast-manager";
import { Link } from "@tanstack/react-router";

interface DancerSheetProps {
  rosterId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFavoriteToggle?: (rosterId: string, current: boolean) => void;
  onSave?: (rosterId: string, saved: { rating?: number; hasNote?: boolean }) => void;
}

export function DancerSheet({
  rosterId,
  open,
  onOpenChange,
  onFavoriteToggle,
  onSave,
}: DancerSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetPopup side="right" variant="inset">
        {rosterId && open && (
          <DancerSheetContent
            rosterId={rosterId}
            onFavoriteToggle={onFavoriteToggle}
            onSave={onSave}
          />
        )}
      </SheetPopup>
    </Sheet>
  );
}

function DancerSheetContent({
  rosterId,
  onFavoriteToggle,
  onSave,
}: {
  rosterId: string;
  onFavoriteToggle?: (rosterId: string, current: boolean) => void;
  onSave?: (rosterId: string, saved: { rating?: number; hasNote?: boolean }) => void;
}) {
  const { org, hasFeature } = useOrg();
  const qc = useQueryClient();
  const { data: dancer, isLoading } = useQuery(
    scoutingQueries.dancer(org.slug, rosterId),
  );

  const [notes, setNotes] = useState<string | null>(null);
  const [rating, setRating] = useState<number | null | undefined>(undefined);
  const [isSaving, setIsSaving] = useState(false);

  const currentNotes = notes ?? dancer?.note ?? "";
  const currentRating = rating !== undefined ? rating : (dancer?.rating ?? null);
  const isDirty =
    dancer != null &&
    (currentNotes !== (dancer.note ?? "") || currentRating !== (dancer.rating ?? null));

  const upsertNotes = $api.useMutation(
    "put",
    "/orgs/{slug}/dancers/{dancerRosterId}/notes",
  );
  const deleteNotes = $api.useMutation(
    "delete",
    "/orgs/{slug}/dancers/{dancerRosterId}/notes",
  );
  const upsertRating = $api.useMutation(
    "put",
    "/orgs/{slug}/dancers/{dancerRosterId}/rating",
  );

  async function handleSave() {
    if (!isDirty || isSaving) return;
    setIsSaving(true);

    try {
      const pathParams = { slug: org.slug, dancerRosterId: rosterId };
      const trimmedNotes = currentNotes.trim();

      const [notesResult, ratingResult] = await Promise.allSettled([
        trimmedNotes === ""
          ? deleteNotes.mutateAsync({ params: { path: pathParams } })
          : upsertNotes.mutateAsync({
              params: { path: pathParams },
              body: { content: currentNotes },
            }),
        upsertRating.mutateAsync({
          params: { path: pathParams },
          body: { rating: currentRating ?? 0 },
        }),
      ]);

      const notesFailed = notesResult.status === "rejected";
      const ratingFailed = ratingResult.status === "rejected";

      if (notesFailed || ratingFailed) {
        const failed = [notesFailed && "notes", ratingFailed && "rating"]
          .filter(Boolean)
          .join(" and ");
        toastManager.add({
          title: "Save failed",
          description: `Could not save ${failed}. Please try again.`,
          type: "error",
        });
      }

      const dancerQueryKey = scoutingQueries.dancer(org.slug, rosterId).queryKey;

      if (!notesFailed) {
        qc.setQueryData(dancerQueryKey, (old: any) =>
          old ? { ...old, note: trimmedNotes === "" ? null : currentNotes } : old,
        );
        setNotes(null);
      }
      if (!ratingFailed) {
        qc.setQueryData(dancerQueryKey, (old: any) =>
          old ? { ...old, rating: currentRating ?? 0 } : old,
        );
        setRating(undefined);
      }

      if (onSave) {
        onSave(rosterId, {
          rating: !ratingFailed ? (currentRating ?? 0) : undefined,
          hasNote: !notesFailed ? trimmedNotes !== "" : undefined,
        });
      }

      qc.invalidateQueries({
        queryKey: scoutingQueries.dancers(org.slug).queryKey,
      });
      qc.invalidateQueries({ queryKey: dancerQueryKey });
      qc.invalidateQueries({
        queryKey: scoutingQueries.rankings(org.slug).queryKey,
      });
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading || !dancer) {
    return (
      <div className="flex flex-1 items-center justify-center py-16">
        <Loader2Icon className="text-muted-foreground size-5 animate-spin" />
      </div>
    );
  }

  const username = dancer.username;

  return (
    <>
      <SheetHeader>
        <div className="flex items-start gap-3">
          <Avatar className="size-14 rounded-lg">
            <AvatarImage src={dancer.profilePhotoUrl ?? undefined} />
            <AvatarFallback className="rounded-lg text-lg">
              {dancer.firstName?.[0]}
              {dancer.lastName?.[0]}
            </AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-col gap-0.5">
            <SheetTitle>
              {dancer.bibNumber != null && (
                <span className="text-muted-foreground mr-1.5 font-mono text-sm">
                  #{String(dancer.bibNumber).padStart(2, "0")}
                </span>
              )}
              {dancer.firstName} {dancer.lastName}
            </SheetTitle>
            <p className="text-muted-foreground text-sm">
              {[
                dancer.gradYear ? `Class of ${dancer.gradYear}` : null,
                dancer.studio,
                dancer.state,
                dancer.gpa != null ? `GPA ${dancer.gpa.toFixed(1)}` : null,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
            {!dancer.isRegistered ? (
              <Badge variant="error">Unregistered</Badge>
            ) : username ? (
              <Link
                to="/$username"
                params={{ username }}
                className="text-indigo-400 hover:text-indigo-300 text-sm"
              >
                Visit Profile →
              </Link>
            ) : null}
          </div>
        </div>
      </SheetHeader>

      <SheetContent className="flex flex-col gap-4 px-4 pt-5 pb-3">
        <div className="flex items-center gap-2 pt-2">
          <div className="flex-1">
            <RatingInput
              value={currentRating}
              onChange={(v) => setRating(v)}
            />
          </div>
          {hasFeature("callbacks") && (
            <CallbackButton
              dancerRosterId={rosterId}
              isCalledBack={dancer.isCalledBack ?? false}
            />
          )}
          <FavoriteButton
            dancerRosterId={rosterId}
            isFavorited={dancer.isFavorited}
            onToggle={onFavoriteToggle}
          />
        </div>

        <div>
          <label className="text-muted-foreground mb-1 block text-xs uppercase tracking-wide">
            Bio
          </label>
          {dancer.bio ? (
            <p className="text-muted-foreground text-sm whitespace-pre-wrap">
              {dancer.bio}
            </p>
          ) : (
            <p className="text-muted-foreground/50 text-sm italic">
              No bio provided
            </p>
          )}
        </div>

        <div className="flex flex-1 flex-col">
          <label className="text-muted-foreground mb-1 block text-xs uppercase tracking-wide">
            Notes
          </label>
          <NotesEditor
            value={currentNotes}
            onChange={(v) => setNotes(v)}
          />
        </div>
      </SheetContent>

      <SheetFooter>
        <Button onClick={handleSave} disabled={!isDirty || isSaving}>
          {isSaving && <Loader2Icon className="size-4 animate-spin" />}
          Save
        </Button>
      </SheetFooter>
    </>
  );
}
