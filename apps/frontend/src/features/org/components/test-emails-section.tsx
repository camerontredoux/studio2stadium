import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Frame, FramePanel } from "@/components/ui/frame";
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { toastManager } from "@/components/ui/toast-manager";
import { client } from "@/lib/api/client";
import { useSession } from "@/lib/session";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";

type TestEmailKind = "invite" | "roster-added" | "school-account-invite";

const NO_EVENT = "none";

const EMAIL_BUTTONS: { kind: TestEmailKind; label: string }[] = [
  { kind: "invite", label: "Org Invite" },
  { kind: "roster-added", label: "Roster Added" },
  { kind: "school-account-invite", label: "School Account Invite" },
];

// The generated list-response type is mis-mapped in the OpenAPI spec, so we
// fetch with the raw client and assert the shape we actually rely on.
interface OrgEventRow {
  id: string;
  name: string;
  startDate: string | null;
}

const rawClient = client as unknown as {
  GET: (
    path: string,
    opts: { params: { path: Record<string, string> } },
  ) => Promise<{ data: unknown; error?: unknown }>;
  POST: (
    path: string,
    opts: { params: { path: Record<string, string> }; body: unknown },
  ) => Promise<{ data: unknown; error?: unknown }>;
};

export function TestEmailsSection({ orgSlug }: { orgSlug: string }) {
  const session = useSession();
  const [eventId, setEventId] = useState<string>(NO_EVENT);
  const [audience, setAudience] = useState<"dancer" | "coach">("dancer");

  const eventsQuery = useQuery({
    queryKey: ["org-events-test-emails", orgSlug],
    queryFn: async () => {
      const res = await rawClient.GET(`/orgs/${orgSlug}/events`, {
        params: { path: { slug: orgSlug } },
      });
      if (res.error) throw new Error("Failed to load events");
      return (res.data as OrgEventRow[]) ?? [];
    },
  });

  const mutation = useMutation({
    mutationFn: async (kind: TestEmailKind) => {
      const res = await rawClient.POST(`/orgs/${orgSlug}/events/test-emails`, {
        params: { path: { slug: orgSlug } },
        body: {
          kind,
          eventId: eventId === NO_EVENT ? undefined : eventId,
          audience,
        },
      });
      if (res.error) throw new Error("Send failed");
      return res.data;
    },
    onSuccess: () => {
      toastManager.add({
        title: `Test email sent to ${session.displayEmail}`,
        type: "success",
      });
    },
    onError: () => {
      toastManager.add({ title: "Couldn't send test email", type: "error" });
    },
  });

  const events = eventsQuery.data ?? [];

  return (
    <Frame>
      <FramePanel className="flex flex-col gap-6 p-5">
        <div className="flex flex-col gap-1">
          <h2 className="text-sm font-semibold">Testing emails</h2>
          <p className="text-muted-foreground text-xs">
            Send yourself a real copy of each org email to preview how it looks.
            Templates are filled with the selected event&apos;s details and your
            account&apos;s name. Sends to{" "}
            <span className="font-medium">{session.displayEmail}</span>.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field name="testEmailEvent">
            <FieldLabel>Event</FieldLabel>
            <Select
              items={[
                { value: NO_EVENT, label: "No event (org only)" },
                ...events.map((e) => ({ value: e.id, label: e.name })),
              ]}
              value={eventId}
              onValueChange={(v) => setEventId(v as string)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select an event" />
              </SelectTrigger>
              <SelectPopup>
                <SelectItem value={NO_EVENT}>No event (org only)</SelectItem>
                {events.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.name}
                  </SelectItem>
                ))}
              </SelectPopup>
            </Select>
            <p className="text-muted-foreground mt-1 text-xs">
              {eventsQuery.isLoading
                ? "Loading events..."
                : "Pick an event to fill in its name, date, and venue."}
            </p>
          </Field>

          <Field name="testEmailAudience">
            <FieldLabel>Send as</FieldLabel>
            <Select
              items={[
                { value: "dancer", label: "Dancer" },
                { value: "coach", label: "Coach" },
              ]}
              value={audience}
              onValueChange={(v) => setAudience(v as "dancer" | "coach")}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Audience" />
              </SelectTrigger>
              <SelectPopup>
                <SelectItem value="dancer">Dancer</SelectItem>
                <SelectItem value="coach">Coach</SelectItem>
              </SelectPopup>
            </Select>
            <p className="text-muted-foreground mt-1 text-xs">
              Affects copy and welcome-video used by the invite &amp; roster
              emails.
            </p>
          </Field>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {EMAIL_BUTTONS.map((btn) => {
            const isThisPending =
              mutation.isPending && mutation.variables === btn.kind;
            return (
              <Button
                key={btn.kind}
                size="sm"
                variant="outline"
                disabled={mutation.isPending}
                onClick={() => mutation.mutate(btn.kind)}
              >
                {isThisPending ? <Spinner label="Sending..." /> : btn.label}
              </Button>
            );
          })}
        </div>
      </FramePanel>
    </Frame>
  );
}
