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
import type { ApiSchemas } from "@/lib/api/client";
import {
  CalendarIcon,
  ExternalLinkIcon,
  GraduationCapIcon,
  MapPinIcon,
  SaveIcon,
} from "lucide-react";

interface GlobalEventCardProps {
  event: ApiSchemas["EventsGlobalResponse"][number];
}

export function GlobalEventCard({ event }: GlobalEventCardProps) {
  return (
    <ContentCard
      image={event.thumbnail ?? ""}
      imageAlt={event.title}
      badge={event.type}
      title={event.title}
      footer={
        <div className="flex items-center gap-2 max-sm:w-full">
          <Button size="xs" className="flex-1">
            <SaveIcon /> Save
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
