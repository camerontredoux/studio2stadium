import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { toastManager } from "@/components/ui/toast-manager";
import { useAddGlobalEvent } from "@/features/admin/api/mutations";
import type { GlobalEventFormData } from "@/features/admin/api/schemas";
import { GlobalEventForm } from "@/features/admin/components/global-event-form";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_admin/(routes)/admin/global-events")({
  component: GlobalEventsPage,
});

function combineDateAndTime(date: Date, time: string): string {
  const match = time.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  const [hours, minutes] = match ? [parseInt(match[1], 10), parseInt(match[2], 10)] : [0, 0];
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(hours).padStart(2, "0");
  const min = String(minutes).padStart(2, "0");
  return `${year}-${month}-${day}T${hour}:${min}:00`;
}

function GlobalEventsPage() {
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
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Add Global Event</h2>

      <div className="max-w-xl rounded-md border p-6">
        <GlobalEventForm onSubmit={handleSubmit} formId="global-event-form" />
        <div className="mt-6 flex justify-end">
          <Button type="submit" form="global-event-form" disabled={isPending}>
            {isPending ? <Spinner label="Creating..." /> : "Create Global Event"}
          </Button>
        </div>
      </div>
    </div>
  );
}
