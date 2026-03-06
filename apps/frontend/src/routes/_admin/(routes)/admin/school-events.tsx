import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { toastManager } from "@/components/ui/toast-manager";
import { useAddSchoolEvent } from "@/features/admin/api/mutations";
import { adminQueries } from "@/features/admin/api/queries";
import type { SchoolEventFormData } from "@/features/admin/api/schemas";
import { SchoolEventForm } from "@/features/admin/components/school-event-form";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { PlusIcon, SearchIcon } from "lucide-react";
import * as React from "react";

export const Route = createFileRoute("/_admin/(routes)/admin/school-events")({
  component: SchoolEventsPage,
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

function SchoolEventsPage() {
  const { data: schools } = useSuspenseQuery(adminQueries.schools());
  const [search, setSearch] = React.useState("");
  const [selectedSchool, setSelectedSchool] = React.useState<{
    id: string;
    name: string;
  } | null>(null);

  const { mutate: addEvent, isPending } = useAddSchoolEvent();

  const filteredSchools = schools.filter((school) =>
    school.name.toLowerCase().includes(search.toLowerCase()),
  );

  const handleSubmit = (data: SchoolEventFormData) => {
    if (!selectedSchool) return;

    const startDatetime = combineDateAndTime(data.startDate, data.startTime);
    const endDatetime = combineDateAndTime(data.endDate, data.endTime);

    addEvent(
      {
        params: { path: { schoolId: selectedSchool.id } },
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
      <h2 className="text-2xl font-bold">Add School Events</h2>

      <div className="relative max-w-sm">
        <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search schools..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="rounded-md border">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="p-3 text-left text-sm font-medium">School</th>
              <th className="p-3 text-left text-sm font-medium">Location</th>
              <th className="p-3 text-left text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredSchools.map((school) => (
              <tr key={school.id} className="border-b">
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="size-10">
                      <AvatarImage src={school.user.avatar ?? undefined} />
                      <AvatarFallback>{school.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <Link
                      to="/explore/$username"
                      params={{ username: school.user.username }}
                      className="font-medium hover:underline"
                    >
                      {school.name}
                    </Link>
                  </div>
                </td>
                <td className="p-3 text-sm">{school.location}</td>
                <td className="p-3">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setSelectedSchool({ id: school.id, name: school.name })
                    }
                  >
                    <PlusIcon className="mr-1 h-4 w-4" />
                    Add Event
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog
        open={!!selectedSchool}
        onOpenChange={(open) => !open && setSelectedSchool(null)}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Event to {selectedSchool?.name}</DialogTitle>
          </DialogHeader>
          <DialogPanel>
            <SchoolEventForm onSubmit={handleSubmit} formId="school-event-form" />
          </DialogPanel>
          <DialogFooter>
            <DialogClose render={<Button variant="secondary" />}>
              Cancel
            </DialogClose>
            <Button type="submit" form="school-event-form" disabled={isPending}>
              {isPending ? <Spinner label="Creating..." /> : "Create Event"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
