import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetPopup,
  SheetTitle,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQuery } from "@tanstack/react-query";
import { scoutingQueries } from "@/features/org/api/scouting-queries";
import { useOrg } from "@/features/org/context/use-org";
import { Button } from "@/components/ui/button";
import { FavoriteButton } from "./favorite-button";
import { RatingInput } from "./rating-input";
import { NotesEditor } from "./notes-editor";

interface DancerSheetProps {
  rosterId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  compareIds?: string[];
  onToggleCompare?: (rosterId: string) => void;
}

export function DancerSheet({
  rosterId,
  open,
  onOpenChange,
  compareIds = [],
  onToggleCompare,
}: DancerSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetPopup side="right" variant="inset">
        {rosterId && open && (
          <DancerSheetContent
            rosterId={rosterId}
            compareIds={compareIds}
            onToggleCompare={onToggleCompare}
          />
        )}
      </SheetPopup>
    </Sheet>
  );
}

function DancerSheetContent({
  rosterId,
  compareIds,
  onToggleCompare,
}: {
  rosterId: string;
  compareIds: string[];
  onToggleCompare?: (rosterId: string) => void;
}) {
  const { org } = useOrg();
  const { data: dancer, isLoading } = useQuery(
    scoutingQueries.dancer(org.slug, rosterId),
  );

  const isCompared = compareIds.includes(rosterId);
  const compareFull = compareIds.length >= 3;

  if (isLoading || !dancer) {
    return (
      <SheetHeader>
        <SheetTitle>Loading...</SheetTitle>
      </SheetHeader>
    );
  }

  return (
    <>
      <SheetHeader>
        <div className="flex items-start gap-3">
          <Avatar className="size-16 rounded-lg">
            <AvatarImage src={dancer.profilePhotoUrl ?? undefined} />
            <AvatarFallback className="rounded-lg text-lg">
              {dancer.firstName?.[0]}
              {dancer.lastName?.[0]}
            </AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-col">
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
          </div>
        </div>
      </SheetHeader>

      <SheetContent className="px-4 py-3">
        <div className="flex flex-col gap-5">
          <div className="flex items-center gap-2">
            <FavoriteButton
              dancerRosterId={rosterId}
              isFavorited={dancer.isFavorited}
            />
            {onToggleCompare && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onToggleCompare(rosterId)}
                disabled={compareFull && !isCompared}
                title={
                  compareFull && !isCompared ? "Max 3 dancers" : undefined
                }
              >
                {isCompared ? "Remove from Compare" : "Compare"}
              </Button>
            )}
          </div>

          <div>
            <label className="text-sm font-medium">Rating</label>
            <RatingInput
              value={dancer.rating ?? null}
              dancerRosterId={rosterId}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Notes</label>
            <NotesEditor
              dancerRosterId={rosterId}
              initial={dancer.note ?? null}
            />
          </div>

          {dancer.bio && (
            <div>
              <label className="text-sm font-medium">Bio</label>
              <p className="text-muted-foreground mt-1 text-sm whitespace-pre-wrap">
                {dancer.bio}
              </p>
            </div>
          )}
        </div>
      </SheetContent>
    </>
  );
}
