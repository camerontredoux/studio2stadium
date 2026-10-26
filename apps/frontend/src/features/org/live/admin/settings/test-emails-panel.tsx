import { CircleNotchIcon, PaperPlaneTiltIcon } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { type ReactNode, useId, useState } from "react";

import { Button } from "@/components/event/button";
import { Icon } from "@/components/event/icon";
import { Label } from "@/components/event/label";
import { Panel, PanelHead } from "@/components/event/panel";
import { Select } from "@/components/event/select";
import { toastManager } from "@/components/ui/toast-manager";
import { cn } from "@/components/utils/cn";
import { adminQueries } from "@/features/org/api/admin-queries";
import { useOrg } from "@/features/org/context/use-org";
import { $api } from "@/lib/api/client";
import { useSession } from "@/lib/session";

type TestEmailKind =
  | "invite"
  | "roster-added"
  | "school-account-invite"
  | "free-tier-invite";

type Audience = "dancer" | "coach";

const NO_EVENT = "none";

const AUDIENCE_OPTIONS = [
  { value: "dancer", label: "Dancer" },
  { value: "coach", label: "Coach" },
];

// Participant emails honor the "Send as" (dancer/coach) selector.
const PARTICIPANT_BUTTONS: { kind: TestEmailKind; label: string }[] = [
  { kind: "invite", label: "Org invite" },
  { kind: "roster-added", label: "Roster added" },
];

// The school-account invite always creates a school/coach account, so the
// dancer/coach selector does not apply to it.
const SCHOOL_BUTTONS: { kind: TestEmailKind; label: string }[] = [
  { kind: "school-account-invite", label: "School account invite" },
];

const FREE_TIER_BUTTONS: { kind: TestEmailKind; label: string }[] = [
  { kind: "free-tier-invite", label: "Free-tier invite" },
];

/** Settings panel that sends the signed-in admin a real copy of each org email. */
function TestEmailsPanel({ orgSlug }: { orgSlug: string }) {
  const session = useSession();
  const { hasFeature } = useOrg();
  const eventFieldId = useId();
  const eventHelpId = useId();
  const audienceFieldId = useId();
  const audienceHelpId = useId();
  // null = untouched; we derive a default (first event) below until the user
  // picks something.
  const [eventId, setEventId] = useState<string | null>(null);
  const [audience, setAudience] = useState<Audience>("dancer");

  const eventsQuery = useQuery(adminQueries.events(orgSlug));

  const events = eventsQuery.data ?? [];
  // Default to the first event until the user explicitly chooses.
  const selectedEventId =
    eventId ?? (events.length > 0 ? events[0]!.id : NO_EVENT);

  const mutation = $api.useMutation("post", "/orgs/{slug}/events/test-emails", {
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

  const send = (kind: TestEmailKind) =>
    mutation.mutate({
      params: { path: { slug: orgSlug } },
      body: {
        kind,
        eventId: selectedEventId === NO_EVENT ? undefined : selectedEventId,
        audience,
      },
    });
  const sendingKind = mutation.variables?.body?.kind;

  const groups = [
    {
      id: "participant",
      title: "Participant emails",
      note: `Sent as a ${audience}`,
      buttons: PARTICIPANT_BUTTONS,
    },
    {
      id: "school",
      title: "School emails",
      note: "Always a school or coach account",
      buttons: SCHOOL_BUTTONS,
    },
    ...(hasFeature("freeTierUsers")
      ? [
          {
            id: "free-tier",
            title: "Free-tier emails",
            note: "Sent to unpaid dancers",
            buttons: FREE_TIER_BUTTONS,
          },
        ]
      : []),
  ];

  return (
    <Panel aria-labelledby="settings-test-emails">
      <PanelHead>
        <Label render={<h2 id="settings-test-emails" />}>Test emails</Label>
      </PanelHead>

      <div className="flex flex-col gap-(--space-14) p-(--space-14)">
        <p className="type-body text-fg-2 m-0 max-w-[60ch]">
          Send yourself a real copy of each org email to preview how it looks.
          Templates use the chosen event&apos;s details and your name. Sends to{" "}
          <span className="type-body-strong text-fg">
            {session.displayEmail}
          </span>
          .
        </p>

        <SettingRow
          fieldId={eventFieldId}
          helpId={eventHelpId}
          title="Event"
          help={
            eventsQuery.isLoading
              ? "Loading events…"
              : "Fills in the event's name, date and venue."
          }
        >
          <Select
            id={eventFieldId}
            aria-describedby={eventHelpId}
            options={[
              { value: NO_EVENT, label: "No event (org only)" },
              ...events.map((e) => ({ value: e.id, label: e.name })),
            ]}
            value={selectedEventId}
            onChange={(v) => setEventId(v ?? NO_EVENT)}
            placeholder="Select an event"
          />
        </SettingRow>

        <SettingRow
          fieldId={audienceFieldId}
          helpId={audienceHelpId}
          title="Send as"
          help="Changes the wording and welcome video of the org invite and roster added emails. The school account invite ignores it."
        >
          <Select
            id={audienceFieldId}
            aria-describedby={audienceHelpId}
            options={AUDIENCE_OPTIONS}
            value={audience}
            onChange={(v) => {
              if (v === "dancer" || v === "coach") setAudience(v);
            }}
          />
        </SettingRow>
      </div>

      <div className="border-line flex flex-col border-t">
        {groups.map((group, index) => (
          <section
            key={group.id}
            aria-labelledby={`test-emails-${group.id}`}
            className={cn(
              "bp-phone:flex-col bp-phone:items-start flex items-center gap-x-(--space-14) gap-y-(--space-8) px-(--space-14) py-(--space-10)",
              index > 0 && "border-line border-t",
            )}
          >
            <div className="flex min-w-0 flex-1 flex-col gap-(--space-2)">
              <Label render={<h3 id={`test-emails-${group.id}`} />}>
                {group.title}
              </Label>
              <span className="type-caption text-fg-3">{group.note}</span>
            </div>
            <div className="flex flex-wrap items-center gap-(--space-6)">
              {group.buttons.map((btn) => (
                <TestEmailButton
                  key={btn.kind}
                  label={btn.label}
                  pending={mutation.isPending}
                  isThis={sendingKind === btn.kind}
                  onSend={() => send(btn.kind)}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </Panel>
  );
}

/** Label and help text on the left, the control on the right (stacked on phones). */
function SettingRow({
  fieldId,
  helpId,
  title,
  help,
  children,
}: {
  fieldId: string;
  helpId: string;
  title: string;
  help: string;
  children: ReactNode;
}) {
  return (
    <div className="bp-phone:grid-cols-1 grid grid-cols-[minmax(0,240px)_minmax(0,1fr)] gap-x-(--space-14) gap-y-(--space-8)">
      <div className="flex flex-col gap-(--space-4)">
        <label htmlFor={fieldId} className="type-body-strong text-fg">
          {title}
        </label>
        <p id={helpId} className="type-caption text-fg-2 m-0">
          {help}
        </p>
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

function TestEmailButton({
  label,
  pending,
  isThis,
  onSend,
}: {
  label: string;
  pending: boolean;
  isThis: boolean;
  onSend: () => void;
}) {
  const sending = pending && isThis;
  return (
    <Button size="md" disabled={pending} onClick={onSend}>
      <Icon
        icon={sending ? CircleNotchIcon : PaperPlaneTiltIcon}
        className={cn(sending && "animate-spin")}
      />
      {sending ? "Sending" : label}
    </Button>
  );
}

export { TestEmailsPanel };
