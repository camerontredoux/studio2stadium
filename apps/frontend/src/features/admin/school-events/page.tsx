import { toastManager } from "@/components/ui/toast-manager";
import { useAddSchoolEvent } from "@/features/admin/api/mutations";
import { adminQueries } from "@/features/admin/api/queries";
import type { SchoolEventFormData } from "@/features/admin/api/schemas";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { EventDialog } from "./components/event-dialog";
import { SchoolsTable } from "./components/schools-table";

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

export function SchoolEventsPage() {
  const { data: schools } = useSuspenseQuery(adminQueries.schools());
  const { mutate: addEvent, isPending } = useAddSchoolEvent();
  const [selectedSchool, setSelectedSchool] = useState<{
    username: string;
    name: string;
  } | null>(null);

  const handleSubmit = (data: SchoolEventFormData) => {
    if (!selectedSchool) return;

    const startDatetime = combineDateAndTime(data.startDate, data.startTime);
    const endDatetime = combineDateAndTime(data.endDate, data.endTime);

    addEvent(
      {
        params: { path: { username: selectedSchool.username } },
        body: {
          type: data.type,
          title: data.title,
          description: data.description,
          location: data.location,
          startDatetime,
          endDatetime,
          timezone: data.timezone,
          website: data.website || null,
          address: data.address || null,
        },
      },
      {
        onSuccess: () => {
          toastManager.add({
            title: "Success",
            description: `Event added to ${selectedSchool.name}`,
            type: "success",
          });
          setSelectedSchool(null);
        },
        onError: () => {
          toastManager.add({
            title: "Error",
            description: "Failed to add event",
            type: "error",
          });
        },
      },
    );
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">School Events</h2>

      <SchoolsTable schools={schools} onAddEvent={setSelectedSchool} />

      <EventDialog
        school={selectedSchool}
        onOpenChange={(open) => !open && setSelectedSchool(null)}
        onSubmit={handleSubmit}
        isPending={isPending}
      />
    </div>
  );
}
