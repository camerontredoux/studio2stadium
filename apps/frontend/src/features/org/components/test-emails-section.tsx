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

// Participant emails honor the "Send as" (dancer/coach) selector.
const PARTICIPANT_BUTTONS: { kind: TestEmailKind; label: string }[] = [
  { kind: "invite", label: "Org Invite" },
  { kind: "roster-added", label: "Roster Added" },
];

// The school-account invite always creates a school/coach account, so the
// dancer/coach selector does not apply to it.
const SCHOOL_BUTTONS: { kind: TestEmailKind; label: string }[] = [
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
  // null = untouched; we derive a default (first event) below until the user
  // picks something.
  const [eventId, setEventId] = useState<string | null>(null);
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

  const events = eventsQuery.data ?? [];
  // Default to the first event until the user explicitly chooses.
  const selectedEventId =
    eventId ?? (events.length > 0 ? events[0]!.id : NO_EVENT);

  const mutation = useMutation({
    mutationFn: async (kind: TestEmailKind) => {
      const res = await rawClient.POST(`/orgs/${orgSlug}/events/test-emails`, {
        params: { path: { slug: orgSlug } },
        body: {
          kind,
          eventId: selectedEventId === NO_EVENT ? undefined : selectedEventId,
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
              value={selectedEventId}
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
              Sends the Org Invite and Roster Added emails as a dancer or a
              coach &mdash; this changes their wording and which welcome video
              is included. Does not apply to the School Account Invite.
            </p>
          </Field>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <p className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
              Participant emails &middot; sent as {audience}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              {PARTICIPANT_BUTTONS.map((btn) => (
                <TestEmailButton
                  key={btn.kind}
                  label={btn.label}
                  kind={btn.kind}
                  pending={mutation.isPending}
                  isThis={mutation.variables === btn.kind}
                  onSend={() => mutation.mutate(btn.kind)}
                />
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
              School emails &middot; always a school/coach account
            </p>
            <div className="flex flex-wrap items-center gap-2">
              {SCHOOL_BUTTONS.map((btn) => (
                <TestEmailButton
                  key={btn.kind}
                  label={btn.label}
                  kind={btn.kind}
                  pending={mutation.isPending}
                  isThis={mutation.variables === btn.kind}
                  onSend={() => mutation.mutate(btn.kind)}
                />
              ))}
            </div>
          </div>
        </div>
      </FramePanel>
    </Frame>
  );
}

function TestEmailButton({
  label,
  pending,
  isThis,
  onSend,
}: {
  label: string;
  kind: TestEmailKind;
  pending: boolean;
  isThis: boolean;
  onSend: () => void;
}) {
  return (
    <Button size="sm" variant="outline" disabled={pending} onClick={onSend}>
      {pending && isThis ? <Spinner label="Sending..." /> : label}
    </Button>
  );
}
