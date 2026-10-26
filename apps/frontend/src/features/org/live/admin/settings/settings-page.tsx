import {
  CircleNotchIcon,
  FloppyDiskIcon,
  LockSimpleIcon,
} from "@phosphor-icons/react";
import { useQueryClient } from "@tanstack/react-query";
import { useId, useState } from "react";

import { Button } from "@/components/event/button";
import { DetailList, DetailListItem } from "@/components/event/detail-list";
import { Icon } from "@/components/event/icon";
import { Label } from "@/components/event/label";
import { Panel, PanelHead } from "@/components/event/panel";
import { toastManager } from "@/components/ui/toast-manager";
import { cn } from "@/components/utils/cn";
import { orgQueries } from "@/features/org/api/queries";
import { useAdminEvent } from "@/features/org/context/use-admin-event";
import { useOrg } from "@/features/org/context/use-org";
import { $api } from "@/lib/api/client";

import { SubpageHeader } from "@/features/org/live/shared/event-header";
import { ShellPage } from "@/features/org/live/shared/shell-slots";
import { TestEmailsPanel } from "@/features/org/live/admin/settings/test-emails-panel";
import { TimezonePicker } from "@/features/org/live/admin/settings/timezone-picker";
import { timezoneLabel } from "@/features/org/live/shared/timezones";

/** Admin settings: org details (read only), event defaults and test emails. */
function SettingsPage({ orgSlug }: { orgSlug: string }) {
  const { org, settings } = useOrg();
  const { selectedEvent } = useAdminEvent();
  const qc = useQueryClient();
  const timezoneId = useId();
  const timezoneHelpId = useId();

  const currentTimezone = (settings.defaultTimezone as string) ?? "";
  const [selectedTz, setSelectedTz] = useState(currentTimezone);
  const isDirty = selectedTz !== currentTimezone;

  const mutation = $api.useMutation("patch", "/orgs/{slug}/settings", {
    onSuccess: () => {
      qc.invalidateQueries(orgQueries.org(orgSlug));
      toastManager.add({ title: "Settings saved", type: "success" });
    },
    onError: () => {
      toastManager.add({ title: "Couldn't save settings", type: "error" });
    },
  });

  const handleSave = () => {
    mutation.mutate({
      params: { path: { slug: orgSlug } },
      body: { defaultTimezone: selectedTz || null },
    });
  };

  const header = (
    <SubpageHeader
      event={selectedEvent ?? null}
      title="Settings"
      dashboardTo="/o/$orgSlug/admin"
      showStatus
    />
  );

  return (
    <ShellPage header={header}>
      <div className="flex w-full max-w-[760px] flex-col gap-(--space-8)">
        <Panel aria-labelledby="settings-org">
          <PanelHead
            actions={
              <span className="type-data-sm text-fg-3 inline-flex items-center gap-(--space-6) pr-(--space-6)">
                <Icon icon={LockSimpleIcon} />
                Read only
              </span>
            }
          >
            <Label render={<h2 id="settings-org" />}>Organization</Label>
          </PanelHead>
          <DetailList className="desk:grid desk:grid-cols-3 gap-(--space-12)">
            <DetailListItem label="Name" value={org.name} />
            <DetailListItem label="Brand color">
              <span
                aria-hidden="true"
                className="border-line-control size-3.5 shrink-0 rounded-full border"
                style={{
                  backgroundColor: org.primaryColor ?? "var(--event-accent)",
                }}
              />
              <span className="type-data text-fg">
                {org.primaryColor ?? "Default"}
              </span>
            </DetailListItem>
            <DetailListItem label="Logo">
              {org.logoUrl && (
                <img
                  src={org.logoUrl}
                  alt=""
                  className="border-line size-5 shrink-0 rounded-(--radius-4) border object-contain"
                />
              )}
              <span className="type-body text-fg">
                {org.logoUrl ? "Uploaded" : "None"}
              </span>
            </DetailListItem>
          </DetailList>
        </Panel>

        <Panel aria-labelledby="settings-event-defaults">
          <PanelHead>
            <Label render={<h2 id="settings-event-defaults" />}>
              Event defaults
            </Label>
          </PanelHead>
          <div className="bp-phone:grid-cols-1 grid grid-cols-[minmax(0,240px)_minmax(0,1fr)] gap-x-(--space-14) gap-y-(--space-8) p-(--space-14)">
            <div className="flex flex-col gap-(--space-4)">
              <label htmlFor={timezoneId} className="type-body-strong text-fg">
                Default timezone
              </label>
              <p id={timezoneHelpId} className="type-caption text-fg-2 m-0">
                Fills in the timezone when you create an event. You can change
                it per event.
              </p>
            </div>
            <div className="flex min-w-0 flex-col gap-(--space-6)">
              <TimezonePicker
                id={timezoneId}
                aria-describedby={timezoneHelpId}
                value={selectedTz}
                onChange={setSelectedTz}
                disabled={mutation.isPending}
              />
              <p className="type-data-sm text-fg-3 m-0">
                {isDirty
                  ? `Saved: ${currentTimezone ? timezoneLabel(currentTimezone) : "none"}`
                  : currentTimezone
                    ? "Saved"
                    : "No default saved"}
              </p>
            </div>
          </div>
        </Panel>

        <TestEmailsPanel orgSlug={orgSlug} />

        {isDirty && (
          <div
            role="region"
            aria-label="Unsaved changes"
            className="bg-surface-raised border-line-control bp-phone:bottom-[calc(84px+env(safe-area-inset-bottom)/2)] sticky bottom-(--space-8) z-10 flex min-h-12 items-center gap-(--space-8) rounded-(--radius-10) border py-(--space-8) pr-(--space-8) pl-(--space-14) shadow-(--shadow-panel)"
          >
            <span className="type-body text-fg-2 min-w-0 flex-1 truncate">
              Unsaved changes
            </span>
            <Button
              variant="ghost"
              disabled={mutation.isPending}
              onClick={() => setSelectedTz(currentTimezone)}
            >
              Discard
            </Button>
            <Button
              variant="primary"
              disabled={mutation.isPending}
              onClick={handleSave}
            >
              <Icon
                icon={mutation.isPending ? CircleNotchIcon : FloppyDiskIcon}
                className={cn(mutation.isPending && "animate-spin")}
              />
              {mutation.isPending ? "Saving" : "Save changes"}
            </Button>
          </div>
        )}
      </div>
    </ShellPage>
  );
}

export { SettingsPage };
