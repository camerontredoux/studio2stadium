import { ContentCard } from "@/components/shared/content-card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  useSaveGlobalEvent,
  useUnsaveGlobalEvent,
} from "@/features/events/api/mutations";
import type { ApiSchemas } from "@/lib/api/client";
import {
  BookmarkIcon,
  CalendarIcon,
  ExternalLinkIcon,
  GraduationCapIcon,
  MapPinIcon,
} from "lucide-react";

interface GlobalEventCardProps {
  event: ApiSchemas["EventsGlobalResponse"][number] & { saved?: boolean };
}

export function GlobalEventCard({ event }: GlobalEventCardProps) {
  const { mutate: save } = useSaveGlobalEvent(event.id);
  const { mutate: unsave } = useUnsaveGlobalEvent(event.id);

  function handleToggleSave() {
    if (event.saved) {
      unsave();
    } else {
      save();
    }
  }

  return (
    <ContentCard
      image={event.thumbnail ?? ""}
      imageAlt={event.title}
      badge={event.type}
      title={event.title}
      altBadge={`${event.attendees} attendees`}
      footer={
        <div className="flex items-center gap-2 max-sm:w-full">
          <Button
            size="xs"
            className="flex-1"
            variant={event.saved ? "destructive-outline" : "default"}
            onClick={handleToggleSave}
          >
            {event.saved ? (
              <>
                <BookmarkIcon className="fill-destructive-foreground" />{" "}
                Attending
              </>
            ) : (
              <>
                <BookmarkIcon /> Attend
              </>
            )}
          </Button>
          <Dialog>
            <DialogTrigger
              render={<Button variant="outline" className="flex-1" size="xs" />}
            >
              View Details
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{event.title}</DialogTitle>
              </DialogHeader>
              <DialogPanel>{event.description}</DialogPanel>
              <DialogFooter>
                <DialogClose
                  render={<Button variant="secondary">Close</Button>}
                />
                <Button render={<a target="_blank" href={event.website} />}>
                  <ExternalLinkIcon /> More Info
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      }
    >
      <div className="text-muted-foreground flex flex-col gap-1 text-sm">
        <div className="flex items-center gap-1.5">
          <CalendarIcon className="text-brand size-3.5 shrink-0" />
          <span className="truncate">
            {event.startDate} &middot; {event.startTime}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <MapPinIcon className="text-brand size-3.5 shrink-0" />
          <span className="truncate">{event.location}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <GraduationCapIcon className="text-brand size-3.5 shrink-0" />
          <span className="truncate">{event.organization}</span>
        </div>
      </div>
    </ContentCard>
  );
}
