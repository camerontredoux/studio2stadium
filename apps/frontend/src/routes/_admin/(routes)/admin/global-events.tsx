import { useIsMobile } from "@/components/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Frame } from "@/components/ui/frame";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toastManager } from "@/components/ui/toast-manager";
import {
  useAddGlobalEvent,
  useEditGlobalEvent,
} from "@/features/admin/api/mutations";
import type { GlobalEventFormData } from "@/features/admin/api/schemas";
import { GlobalEventForm } from "@/features/admin/components/global-event-form";
import { eventQueries } from "@/features/events/api/queries";
import type { ApiSchemas } from "@/lib/api/client";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { CalendarIcon, MapPinIcon, PlusIcon, UsersIcon } from "lucide-react";
import { Suspense, useRef, useState } from "react";

export const Route = createFileRoute("/_admin/(routes)/admin/global-events")({
  component: GlobalEventsPage,
});

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

function GlobalEventsPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Global Events</h2>
        <AddEventDialog />
      </div>
      <Suspense fallback={<EventsTableSkeleton />}>
        <EventsView />
      </Suspense>
    </div>
  );
}

function AddEventDialog() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const { mutate: addEvent, isPending } = useAddGlobalEvent();

  const handleSubmit = (data: GlobalEventFormData) => {
    const startDatetime = combineDateAndTime(data.startDate, data.startTime);
    const endDatetime = combineDateAndTime(data.endDate, data.endTime);

    addEvent(
      {
        body: {
          type: data.type,
          title: data.title,
          description: data.description,
          location: data.location,
          website: data.website,
          startDatetime,
          endDatetime,
          thumbnail: data.thumbnail,
          organization: data.organization,
        },
      },
      {
        onSuccess: () => {
          toastManager.add({
            title: "Success",
            description: "Global event created",
            type: "success",
          });
          queryClient.invalidateQueries({
            queryKey: eventQueries.globalEvents().queryKey,
          });
          setOpen(false);
        },
        onError: () => {
          toastManager.add({
            title: "Error",
            description: "Failed to create global event",
            type: "error",
          });
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>
        <PlusIcon className="size-4" />
        Add Event
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Global Event</DialogTitle>
        </DialogHeader>
        <DialogPanel>
          <GlobalEventForm
            onSubmit={handleSubmit}
            formId="add-global-event-form"
          />
        </DialogPanel>
        <DialogFooter>
          <DialogClose render={<Button variant="secondary" />}>
            Cancel
          </DialogClose>
          <Button
            type="submit"
            form="add-global-event-form"
            disabled={isPending}
          >
            {isPending ? <Spinner label="Creating..." /> : "Create Event"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type GlobalEvent = ApiSchemas["EventsGlobalResponse"][number];

function EventsView() {
  const { data: events } = useSuspenseQuery(eventQueries.globalEvents());
  const [editingEvent, setEditingEvent] = useState<GlobalEvent | null>(null);
  const isMobile = useIsMobile();

  return (
    <>
      {isMobile ? (
        <EventsCardList events={events} onEdit={setEditingEvent} />
      ) : (
        <EventsTable events={events} onEdit={setEditingEvent} />
      )}

      <EditEventDialog
        event={editingEvent}
        onOpenChange={(open) => !open && setEditingEvent(null)}
      />
    </>
  );
}

interface EventsListProps {
  events: GlobalEvent[];
  onEdit: (event: GlobalEvent) => void;
}

function EventsTable({ events, onEdit }: EventsListProps) {
  if (events.length === 0) {
    return <p className="text-muted-foreground">No global events found</p>;
  }

  return (
    <Frame>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Title</TableHead>
            <TableHead className="hidden sm:table-cell">Type</TableHead>
            <TableHead className="hidden md:table-cell">Location</TableHead>
            <TableHead className="hidden sm:table-cell">Start Date</TableHead>
            <TableHead className="hidden lg:table-cell">Attendees</TableHead>
            <TableHead className="whitespace-nowrap">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {events.map((event) => (
            <TableRow key={event.id}>
              <TableCell>
                <div className="font-medium">{event.title}</div>
                <div className="text-muted-foreground text-sm sm:hidden">
                  {event.type} &middot; {event.startDate}
                </div>
              </TableCell>
              <TableCell className="hidden capitalize sm:table-cell">
                {event.type}
              </TableCell>
              <TableCell className="hidden md:table-cell">
                {event.location}
              </TableCell>
              <TableCell className="hidden sm:table-cell">
                {event.startDate} {event.startTime}
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                {event.attendees}
              </TableCell>
              <TableCell className="whitespace-nowrap">
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => onEdit(event)}
                >
                  Edit
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Frame>
  );
}

function EventsCardList({ events, onEdit }: EventsListProps) {
  if (events.length === 0) {
    return <p className="text-muted-foreground">No global events found</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {events.map((event) => (
        <Card key={event.id}>
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <CardTitle className="text-base">{event.title}</CardTitle>
                <span className="text-muted-foreground text-sm capitalize">
                  {event.type}
                </span>
              </div>
              <Button variant="outline" size="xs" onClick={() => onEdit(event)}>
                Edit
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pb-3">
            <div className="text-muted-foreground flex flex-col gap-1 text-sm">
              <div className="flex items-center gap-1.5">
                <CalendarIcon className="size-3.5 shrink-0" />
                <span>
                  {event.startDate} {event.startTime}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPinIcon className="size-3.5 shrink-0" />
                <span>{event.location}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <UsersIcon className="size-3.5 shrink-0" />
                <span>{event.attendees} attendees</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function EventsTableSkeleton() {
  return (
    <Frame>
      <div className="flex items-center justify-center p-8">
        <Spinner label="Loading events..." />
      </div>
    </Frame>
  );
}

function parseDateString(dateStr: string): Date {
  // Parse "Mar 15, 2026" format (en-US medium date style)
  const parsed = new Date(dateStr);
  if (!isNaN(parsed.getTime())) {
    return parsed;
  }
  return new Date();
}

function parseTimeString(timeStr: string): string {
  // Parse "10:00 AM" or "2:30 PM" format (en-US short time style) to "HH:mm"
  const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return "00:00";

  let hours = parseInt(match[1], 10);
  const minutes = match[2];
  const period = match[3]?.toUpperCase();

  if (period === "PM" && hours !== 12) {
    hours += 12;
  } else if (period === "AM" && hours === 12) {
    hours = 0;
  }

  return `${String(hours).padStart(2, "0")}:${minutes}`;
}

interface EditEventDialogProps {
  event: GlobalEvent | null;
  onOpenChange: (open: boolean) => void;
}

function EditEventDialog({ event, onOpenChange }: EditEventDialogProps) {
  const queryClient = useQueryClient();
  const { mutate: editEvent, isPending } = useEditGlobalEvent();

  // Keep reference to last event for exit animation
  const lastEventRef = useRef<GlobalEvent | null>(null);
  if (event) {
    lastEventRef.current = event;
  }
  const displayEvent = event ?? lastEventRef.current;

  const defaultValues: Partial<GlobalEventFormData> | undefined = displayEvent
    ? {
        type: displayEvent.type,
        title: displayEvent.title,
        description: displayEvent.description,
        location: displayEvent.location,
        website: displayEvent.website,
        thumbnail: displayEvent.thumbnail ?? "",
        organization: displayEvent.organization,
        startDate: parseDateString(displayEvent.startDate),
        startTime: parseTimeString(displayEvent.startTime),
        endDate: parseDateString(displayEvent.endDate),
        endTime: parseTimeString(displayEvent.endTime),
      }
    : undefined;

  const handleSubmit = (data: GlobalEventFormData) => {
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
          website: data.website,
          startDatetime,
          endDatetime,
          thumbnail: data.thumbnail,
          organization: data.organization,
        },
      },
      {
        onSuccess: () => {
          toastManager.add({
            title: "Success",
            description: "Global event updated",
            type: "success",
          });
          queryClient.invalidateQueries({
            queryKey: eventQueries.globalEvents().queryKey,
          });
          onOpenChange(false);
        },
        onError: () => {
          toastManager.add({
            title: "Error",
            description: "Failed to update global event",
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
          <GlobalEventForm
            key={displayEvent?.id}
            onSubmit={handleSubmit}
            formId="edit-global-event-form"
            defaultValues={defaultValues}
          />
        </DialogPanel>
        <DialogFooter>
          <DialogClose render={<Button variant="secondary" />}>
            Cancel
          </DialogClose>
          <Button
            type="submit"
            form="edit-global-event-form"
            disabled={isPending}
          >
            {isPending ? <Spinner label="Saving..." /> : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
