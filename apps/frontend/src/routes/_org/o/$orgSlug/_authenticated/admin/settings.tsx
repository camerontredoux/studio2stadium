import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Frame, FramePanel } from "@/components/ui/frame";
import { Popover, PopoverPopup, PopoverTrigger } from "@/components/ui/popover";
import { Spinner } from "@/components/ui/spinner";
import { toastManager } from "@/components/ui/toast-manager";
import { orgQueries } from "@/features/org/api/queries";
import { useOrg } from "@/features/org/context/use-org";
import { client } from "@/lib/api/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { CheckIcon, ChevronDownIcon, GlobeIcon } from "lucide-react";
import { useMemo, useRef, useState } from "react";

export const Route = createFileRoute(
  "/_org/o/$orgSlug/_authenticated/admin/settings",
)({
  component: SettingsPage,
});

const COMMON_TIMEZONES = [
  { value: "America/New_York", label: "Eastern (America/New_York)" },
  { value: "America/Chicago", label: "Central (America/Chicago)" },
  { value: "America/Denver", label: "Mountain (America/Denver)" },
  { value: "America/Los_Angeles", label: "Pacific (America/Los_Angeles)" },
  { value: "America/Phoenix", label: "Arizona (America/Phoenix)" },
  { value: "Pacific/Honolulu", label: "Hawaii (Pacific/Honolulu)" },
  { value: "America/Anchorage", label: "Alaska (America/Anchorage)" },
];

const ALL_TIMEZONES: string[] = (() => {
  try {
    return Intl.supportedValuesOf("timeZone");
  } catch {
    return [];
  }
})();

function SettingsPage() {
  const { orgSlug } = Route.useParams();
  const { org, settings } = useOrg();
  const qc = useQueryClient();

  const currentTimezone = (settings.defaultTimezone as string) ?? "";
  const [selectedTz, setSelectedTz] = useState(currentTimezone);
  const isDirty = selectedTz !== currentTimezone;

  const rawClient = client as unknown as {
    PATCH: (
      path: string,
      opts: { body: Record<string, unknown> },
    ) => Promise<{ data: unknown; error?: unknown }>;
  };

  const mutation = useMutation({
    mutationFn: async (timezone: string | null) => {
      const res = await rawClient.PATCH(`/orgs/${orgSlug}/settings`, {
        body: { defaultTimezone: timezone },
      });
      if (res.error) throw new Error("Update failed");
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries(orgQueries.org(orgSlug));
      toastManager.add({ title: "Settings saved", type: "success" });
    },
    onError: () => {
      toastManager.add({ title: "Couldn't save settings", type: "error" });
    },
  });

  const handleSave = () => {
    mutation.mutate(selectedTz || null);
  };

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-4 md:p-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-sm">
          Organization preferences for {org.name}
        </p>
      </header>

      <Frame>
        <FramePanel className="flex flex-col gap-6 p-5">
          <div className="flex flex-col gap-1">
            <h2 className="text-sm font-semibold">Organization</h2>
            <p className="text-muted-foreground text-xs">
              Basic details about your organization
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <SettingDisplay label="Name" value={org.name} />
            <SettingDisplay
              label="Brand color"
              value={
                <span className="inline-flex items-center gap-2">
                  <span
                    className="border-border/60 inline-block size-4 rounded-full border"
                    style={{
                      backgroundColor:
                        org.primaryColor ?? "var(--color-primary)",
                    }}
                    aria-hidden="true"
                  />
                  <span className="font-mono text-sm">
                    {org.primaryColor ?? "default"}
                  </span>
                </span>
              }
            />
            <SettingDisplay
              label="Logo"
              value={org.logoUrl ? "Uploaded" : "None"}
            />
          </div>
        </FramePanel>
      </Frame>

      <Frame>
        <FramePanel className="flex flex-col gap-6 p-5">
          <div className="flex flex-col gap-1">
            <h2 className="text-sm font-semibold">Event defaults</h2>
            <p className="text-muted-foreground text-xs">
              Preferences that auto-fill when you create new events
            </p>
          </div>

          <Field name="defaultTimezone">
            <FieldLabel>Default timezone</FieldLabel>
            <TimezonePicker value={selectedTz} onChange={setSelectedTz} />
            <p className="text-muted-foreground mt-1 text-xs">
              Pre-fills the timezone field when creating events. You can override
              it per event.
            </p>
          </Field>

          <div className="flex items-center gap-3">
            <Button
              size="sm"
              disabled={!isDirty || mutation.isPending}
              onClick={handleSave}
            >
              {mutation.isPending ? (
                <Spinner label="Saving..." />
              ) : (
                "Save changes"
              )}
            </Button>
            {!isDirty && currentTimezone && (
              <span className="text-muted-foreground inline-flex items-center gap-1 text-xs">
                <CheckIcon className="size-3" />
                Saved
              </span>
            )}
          </div>
        </FramePanel>
      </Frame>
    </div>
  );
}

function SettingDisplay({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
        {label}
      </span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

function TimezonePicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (val: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const allOtherTimezones = useMemo(
    () =>
      ALL_TIMEZONES.filter(
        (tz) => !COMMON_TIMEZONES.some((c) => c.value === tz),
      ),
    [],
  );

  const filterTz = (label: string) =>
    !search || label.toLowerCase().includes(search.toLowerCase());

  const filteredCommon = COMMON_TIMEZONES.filter((tz) => filterTz(tz.label));
  const filteredOther = allOtherTimezones.filter((tz) => filterTz(tz));

  const displayLabel =
    COMMON_TIMEZONES.find((tz) => tz.value === value)?.label ??
    (value || undefined);

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (nextOpen) setTimeout(() => searchRef.current?.focus(), 50);
        else setSearch("");
      }}
    >
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            className="w-full max-w-sm justify-between font-normal"
          />
        }
      >
        <span className="flex items-center gap-2 truncate">
          <GlobeIcon
            aria-hidden="true"
            className="size-4 shrink-0 opacity-50"
          />
          <span className="truncate">
            {displayLabel ?? (
              <span className="text-muted-foreground">No default set</span>
            )}
          </span>
        </span>
        <ChevronDownIcon
          aria-hidden="true"
          className="size-4 shrink-0 opacity-50"
        />
      </PopoverTrigger>
      <PopoverPopup align="start" className="w-72">
        <div className="flex flex-col gap-2">
          <input
            ref={searchRef}
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search timezones..."
            className="border-input bg-background placeholder:text-muted-foreground rounded-md border px-3 py-1.5 text-sm outline-none focus:ring-2"
          />
          <div className="max-h-56 overflow-y-auto">
            {filteredCommon.length > 0 && (
              <>
                <p className="text-muted-foreground px-1 pb-1 text-xs font-medium">
                  Common US
                </p>
                {filteredCommon.map((tz) => (
                  <button
                    key={tz.value}
                    type="button"
                    className={`hover:bg-accent w-full rounded px-2 py-1.5 text-left text-sm ${value === tz.value ? "bg-accent font-medium" : ""}`}
                    onClick={() => {
                      onChange(tz.value);
                      setOpen(false);
                      setSearch("");
                    }}
                  >
                    {tz.label}
                  </button>
                ))}
              </>
            )}
            {filteredOther.length > 0 && (
              <>
                <p className="text-muted-foreground mt-2 px-1 pb-1 text-xs font-medium">
                  All timezones
                </p>
                {filteredOther.map((tz) => (
                  <button
                    key={tz}
                    type="button"
                    className={`hover:bg-accent w-full rounded px-2 py-1.5 text-left text-sm ${value === tz ? "bg-accent font-medium" : ""}`}
                    onClick={() => {
                      onChange(tz);
                      setOpen(false);
                      setSearch("");
                    }}
                  >
                    {tz}
                  </button>
                ))}
              </>
            )}
            {filteredCommon.length === 0 && filteredOther.length === 0 && (
              <p className="text-muted-foreground px-2 py-4 text-center text-sm">
                No timezones found
              </p>
            )}
          </div>
          {value && (
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground border-border border-t pt-2 text-left text-xs"
              onClick={() => {
                onChange("");
                setOpen(false);
                setSearch("");
              }}
            >
              Clear default
            </button>
          )}
        </div>
      </PopoverPopup>
    </Popover>
  );
}
