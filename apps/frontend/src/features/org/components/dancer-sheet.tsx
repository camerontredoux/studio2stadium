import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetPopup,
  SheetTitle,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSuspenseQuery } from "@tanstack/react-query";
import { scoutingQueries } from "@/features/org/api/scouting-queries";
import { useOrg } from "@/features/org/context/use-org";
import { FavoriteButton } from "./favorite-button";
import { RatingInput } from "./rating-input";
import { NotesEditor } from "./notes-editor";

interface DancerSheetProps {
  rosterId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DancerSheet({ rosterId, open, onOpenChange }: DancerSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetPopup side="right" variant="inset">
        {rosterId && open && <DancerSheetContent rosterId={rosterId} />}
      </SheetPopup>
    </Sheet>
  );
}

function DancerSheetContent({ rosterId }: { rosterId: string }) {
  const { org } = useOrg();
  const { data: dancer } = useSuspenseQuery(
    scoutingQueries.dancer(org.slug, rosterId),
  );

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
