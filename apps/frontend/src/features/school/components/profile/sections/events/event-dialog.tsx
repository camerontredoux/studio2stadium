import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { toastManager } from "@/components/ui/toast-manager";
import {
  useCreateEvent,
  useUpdateEvent,
} from "@/features/school/api/mutations";
import type { SchoolEvent } from "@/features/school/types";
import { PencilIcon, PlusIcon } from "lucide-react";
import * as React from "react";
import { useProfile } from "../../context/use-profile";
import { EventDelete } from "./event-delete";
import { EventForm, type EventFormData } from "./event-form";

interface EventDialogProps {
  event?: SchoolEvent;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

function combineDateAndTime(date: Date, time: string): string {
  const [hours, minutes] = parseTime(time);
  // Format as ISO datetime without timezone conversion
  // The timezone is stored separately in the event
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(hours).padStart(2, "0");
  const min = String(minutes).padStart(2, "0");
  return `${year}-${month}-${day}T${hour}:${min}:00`;
}

function parseTime(time: string): [number, number] {
  // TimePicker outputs 24-hour format like "09:30" or "21:30"
  const match = time.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (!match) return [0, 0];
  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  return [hours, minutes];
}

function parseDatetimeToFormValues(datetime: string): {
  date: Date;
  time: string;
} {
  // Parse datetime string without timezone conversion
  // Expected format: "2026-03-15T15:00:00" (no Z suffix)
  const [datePart, timePart] = datetime.split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hour, minute] = timePart.split(":").map(Number);

  // Create date using local timezone
  const date = new Date(year, month - 1, day);

  // TimePicker expects 24-hour format like "09:30" or "21:30"
  const time = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;

  return { date, time };
}

export function EventDialog({
  event,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: EventDialogProps) {
  const { username } = useProfile();
  const [internalOpen, setInternalOpen] = React.useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? controlledOnOpenChange! : setInternalOpen;

  const isEditMode = !!event;

  const { mutate: createEvent, isPending: isCreating } =
    useCreateEvent(username);
  const { mutate: updateEvent, isPending: isUpdating } =
    useUpdateEvent(username);

  const isPending = isCreating || isUpdating;

  const handleSubmit = (data: EventFormData) => {
    const startDatetime = combineDateAndTime(data.startDate, data.startTime);
    const endDatetime = combineDateAndTime(data.endDate, data.endTime);

    const body = {
      type: data.type,
      title: data.title,
      description: data.description,
      location: data.location,
      startDatetime,
      endDatetime,
      website: data.website || null,
      address: data.address || null,
    };

    if (isEditMode) {
      updateEvent(
        { params: { path: { id: event.id } }, body },
        {
          onSuccess: () => {
            toastManager.add({
              title: "Success",
              description: "Event updated",
              type: "success",
            });
            setOpen(false);
          },
        },
      );
    } else {
      createEvent(
        { body },
        {
          onSuccess: () => {
            toastManager.add({
              title: "Success",
              description: "Event created",
              type: "success",
            });
            setOpen(false);
          },
        },
      );
    }
  };

  const defaultValues = event
    ? {
        type: event.type,
        title: event.title,
        description: event.description ?? "",
        location: event.location,
        website: event.website ?? "",
        address: event.address ?? "",
        cost: event.cost ?? "",
        ...(() => {
          const start = parseDatetimeToFormValues(event.startDatetime);
          const end = parseDatetimeToFormValues(event.endDatetime);
          return {
            startDate: start.date,
            startTime: start.time,
            endDate: end.date,
            endTime: end.time,
          };
        })(),
      }
    : undefined;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isControlled && (
        <DialogTrigger render={<Button size="icon-xs" variant="ghost" />}>
          {isEditMode ? <PencilIcon /> : <PlusIcon />}
        </DialogTrigger>
      )}
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Edit Event" : "Create Event"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Update this event's information."
              : "Add a new event to your calendar."}
          </DialogDescription>
        </DialogHeader>
        <DialogPanel>
          <EventForm
            key={event?.id ?? "new"}
            onSubmit={handleSubmit}
            defaultValues={defaultValues}
            formId="event-form"
          />
        </DialogPanel>
        <DialogFooter>
          {isEditMode && (
            <EventDelete
              eventId={event.id}
              username={username}
              onDeleted={() => setOpen(false)}
            />
          )}
          <DialogClose render={<Button variant="secondary" />}>
            Cancel
          </DialogClose>
          <Button type="submit" form="event-form" disabled={isPending}>
            {isPending ? (
              <Spinner label={isEditMode ? "Saving..." : "Creating..."} />
            ) : isEditMode ? (
              "Save"
            ) : (
              "Create"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
