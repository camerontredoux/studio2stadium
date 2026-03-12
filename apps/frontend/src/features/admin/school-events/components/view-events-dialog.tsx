import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { toastManager } from "@/components/ui/toast-manager";
import { useEditSchoolEvent } from "@/features/admin/api/mutations";
import type { SchoolEventFormData } from "@/features/admin/api/schemas";
import { SchoolEventForm } from "@/features/admin/components/school-event-form";
import { $api, type ApiSchemas } from "@/lib/api/client";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { CalendarIcon, MapPinIcon } from "lucide-react";
import { Suspense, useRef, useState } from "react";

type SchoolEvent = ApiSchemas["SchoolsIdResponse"]["events"][number];

interface ViewEventsDialogProps {
  school: { username: string; name: string } | null;
  onOpenChange: (open: boolean) => void;
}

export function ViewEventsDialog({
  school,
  onOpenChange,
}: ViewEventsDialogProps) {
  const [editingEvent, setEditingEvent] = useState<SchoolEvent | null>(null);

  // Keep reference to last school for exit animation
  const lastSchoolRef = useRef<{ username: string; name: string } | null>(null);
  if (school) {
    lastSchoolRef.current = school;
  }
  const displaySchool = school ?? lastSchoolRef.current;

  return (
    <>
      <Dialog open={!!school && !editingEvent} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Events - {displaySchool?.name}</DialogTitle>
          </DialogHeader>
          <DialogPanel>
            {displaySchool && (
              <Suspense
                fallback={
                  <div className="flex justify-center p-4">
                    <Spinner label="Loading events..." />
                  </div>
                }
              >
                <EventsList
                  username={displaySchool.username}
                  onEdit={setEditingEvent}
                />
              </Suspense>
            )}
          </DialogPanel>
          <DialogFooter>
            <DialogClose render={<Button variant="secondary" />}>
              Close
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <EditEventDialog
        event={editingEvent}
        schoolUsername={displaySchool?.username ?? ""}
        onOpenChange={(open) => !open && setEditingEvent(null)}
      />
    </>
  );
}

interface EventsListProps {
  username: string;
  onEdit: (event: SchoolEvent) => void;
}

function EventsList({ username, onEdit }: EventsListProps) {
  const { data: school } = useSuspenseQuery(
    $api.queryOptions("get", "/schools/{username}", {
      params: { path: { username } },
    }),
  );

  const events = school.events;

  if (events.length === 0) {
    return (
      <p className="text-muted-foreground py-4 text-center text-sm">
        No events found for this school
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {events.map((event) => (
        <EventCard key={event.id} event={event} onEdit={() => onEdit(event)} />
      ))}
    </div>
  );
}

interface EventCardProps {
  event: SchoolEvent;
  onEdit: () => void;
}

function EventCard({ event, onEdit }: EventCardProps) {
  const startDate = new Date(event.startDatetime);
  const formattedDate = startDate.toLocaleDateString("en-US", {
    dateStyle: "medium",
  });
  const formattedTime = startDate.toLocaleTimeString("en-US", {
    timeStyle: "short",
  });

  return (
    <div className="bg-muted/50 flex items-start justify-between gap-3 rounded-lg border p-3">
      <div className="min-w-0 flex-1">
        <div className="font-medium">{event.title}</div>
        <div className="text-muted-foreground text-sm capitalize">
          {event.type}
        </div>
        <div className="text-muted-foreground mt-1 flex flex-col gap-0.5 text-sm">
          <div className="flex items-center gap-1.5">
            <CalendarIcon className="size-3.5 shrink-0" />
            <span>
              {formattedDate} {formattedTime}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <MapPinIcon className="size-3.5 shrink-0" />
            <span className="truncate">{event.location}</span>
          </div>
        </div>
      </div>
      <Button variant="outline" size="xs" onClick={onEdit}>
        Edit
      </Button>
    </div>
  );
}

function combineDateAndTime(date: Date, time: string): string {
  const match = time.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  const [hours, minutes] = match
    ? [parseInt(match[1], 10), parseInt(match[2], 10)]
    : [0, 0];
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(hours).padStart(2, "0");
  const min = String(minutes).padStart(2, "0");
  return `${year}-${month}-${day}T${hour}:${min}:00`;
}

function parseISODateTime(datetime: string): { date: Date; time: string } {
  const d = new Date(datetime);
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return {
    date: d,
    time: `${hours}:${minutes}`,
  };
}

interface EditEventDialogProps {
  event: SchoolEvent | null;
  schoolUsername: string;
  onOpenChange: (open: boolean) => void;
}

function EditEventDialog({
  event,
  schoolUsername,
  onOpenChange,
}: EditEventDialogProps) {
  const queryClient = useQueryClient();
  const { mutate: editEvent, isPending } = useEditSchoolEvent();

  // Keep reference to last event for exit animation
  const lastEventRef = useRef<SchoolEvent | null>(null);
  if (event) {
    lastEventRef.current = event;
  }
  const displayEvent = event ?? lastEventRef.current;

  const defaultValues: Partial<SchoolEventFormData> | undefined = displayEvent
    ? (() => {
        const startDateTime = parseISODateTime(displayEvent.startDatetime);
        const endDateTime = parseISODateTime(displayEvent.endDatetime);
        return {
          type: displayEvent.type,
          title: displayEvent.title,
          description: displayEvent.description,
          location: displayEvent.location,
          website: displayEvent.website ?? "",
          address: displayEvent.address ?? "",
          startDate: startDateTime.date,
          startTime: startDateTime.time,
          endDate: endDateTime.date,
          endTime: endDateTime.time,
        };
      })()
    : undefined;

  const handleSubmit = (data: SchoolEventFormData) => {
    if (!displayEvent) return;

    const startDatetime = combineDateAndTime(data.startDate, data.startTime);
    const endDatetime = combineDateAndTime(data.endDate, data.endTime);

    editEvent(
      {
        params: { path: { id: displayEvent.id } },
        body: {
          type: data.type,
          title: data.title,
          description: data.description,
          location: data.location,
          startDatetime,
          endDatetime,
          website: data.website || null,
          address: data.address || null,
        },
      },
      {
        onSuccess: () => {
          toastManager.add({
            title: "Success",
            description: "Event updated",
            type: "success",
          });
          queryClient.invalidateQueries({
            queryKey: ["get", "/schools/{username}", { path: { username: schoolUsername } }],
          });
          onOpenChange(false);
        },
        onError: () => {
          toastManager.add({
            title: "Error",
            description: "Failed to update event",
            type: "error",
          });
        },
      },
    );
  };

  return (
    <Dialog open={!!event} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Event</DialogTitle>
        </DialogHeader>
        <DialogPanel>
          <SchoolEventForm
            key={displayEvent?.id}
            onSubmit={handleSubmit}
            formId="edit-school-event-form"
            defaultValues={defaultValues}
          />
        </DialogPanel>
        <DialogFooter>
          <DialogClose render={<Button variant="secondary" />}>
            Cancel
          </DialogClose>
          <Button
            type="submit"
            form="edit-school-event-form"
            disabled={isPending}
          >
            {isPending ? <Spinner label="Saving..." /> : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
