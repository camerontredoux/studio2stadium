import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTab } from "@/components/ui/tabs";
import { toastManager } from "@/components/ui/toast-manager";
import { useUpdateOrg } from "@/features/admin/api/mutations";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

const profileSchema = z.object({
  name: z.string().min(1, "Name is required").max(128),
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(64)
    .regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers, and hyphens"),
  logoUrl: z.string().optional().or(z.literal("")),
  primaryColor: z.string().max(16).optional().or(z.literal("")),
  accentColor: z.string().max(16).optional().or(z.literal("")),
});

type ProfileForm = z.infer<typeof profileSchema>;

const KNOWN_FEATURES = [
  { key: "callbacks", label: "Callbacks", description: "Allow coaches to mark dancers for callbacks" },
  { key: "check_in", label: "Check-In", description: "Enable dancer/coach check-in at events" },
  { key: "school_selections", label: "School Selections", description: "Allow dancers to select interested schools" },
  { key: "video_library", label: "Video Library", description: "Enable video library for events" },
] as const;

interface Org {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  primaryColor: string | null;
  accentColor: string | null;
  features: Record<string, unknown>;
  settings: Record<string, unknown>;
}

interface EditOrgDialogProps {
  org: Org | null;
  onOpenChange: (open: boolean) => void;
}

export function EditOrgDialog({ org, onOpenChange }: EditOrgDialogProps) {
  const { mutate: updateOrg, isPending } = useUpdateOrg();
  const [activeTab, setActiveTab] = useState<string | number>("profile");
  const [features, setFeatures] = useState<Record<string, boolean>>({});
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [newSettingKey, setNewSettingKey] = useState("");
  const [newSettingValue, setNewSettingValue] = useState("");
  const [coachVideoEnabled, setCoachVideoEnabled] = useState(false);
  const [coachVideoUrl, setCoachVideoUrl] = useState("");
  const [dancerVideoEnabled, setDancerVideoEnabled] = useState(false);
  const [dancerVideoUrl, setDancerVideoUrl] = useState("");

  const form = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      slug: "",
      logoUrl: "",
      primaryColor: "",
      accentColor: "",
    },
  });

  useEffect(() => {
    if (org) {
      form.reset({
        name: org.name,
        slug: org.slug,
        logoUrl: org.logoUrl ?? "",
        primaryColor: org.primaryColor ?? "",
        accentColor: org.accentColor ?? "",
      });
      const featureMap: Record<string, boolean> = {};
      for (const f of KNOWN_FEATURES) {
        featureMap[f.key] = Boolean(org.features?.[f.key]);
      }
      setFeatures(featureMap);

      const settingsMap: Record<string, string> = {};
      if (org.settings && typeof org.settings === "object") {
        for (const [k, v] of Object.entries(org.settings)) {
          settingsMap[k] = String(v);
        }
      }
      setSettings(settingsMap);

      const cwv = org.settings?.welcome_video_coach;
      setCoachVideoEnabled(Boolean(cwv));
      setCoachVideoUrl(typeof cwv === "string" ? cwv : "");
      const dwv = org.settings?.welcome_video_dancer;
      setDancerVideoEnabled(Boolean(dwv));
      setDancerVideoUrl(typeof dwv === "string" ? dwv : "");

      setActiveTab("profile");
    }
  }, [org, form]);

  const saveProfile = (data: ProfileForm) => {
    if (!org) return;
    updateOrg(
      {
        params: { path: { id: org.id } },
        body: {
          name: data.name,
          slug: data.slug,
          logoUrl: data.logoUrl || null,
          primaryColor: data.primaryColor || null,
          accentColor: data.accentColor || null,
        },
      },
      {
        onSuccess: () => {
          toastManager.add({
            title: "Profile updated",
            description: `${data.name} profile saved`,
            type: "success",
          });
        },
        onError: () => {
          toastManager.add({
            title: "Error",
            description: "Failed to update profile",
            type: "error",
          });
        },
      },
    );
  };

  const saveFeatures = () => {
    if (!org) return;
    const settingsUpdate = {
      ...org.settings,
      welcome_video_coach:
        coachVideoEnabled && coachVideoUrl.trim()
          ? coachVideoUrl.trim()
          : null,
      welcome_video_dancer:
        dancerVideoEnabled && dancerVideoUrl.trim()
          ? dancerVideoUrl.trim()
          : null,
    };
    updateOrg(
      {
        params: { path: { id: org.id } },
        body: { features, settings: settingsUpdate } as never,
      },
      {
        onSuccess: () => {
          toastManager.add({
            title: "Features updated",
            description: "Feature flags and welcome videos saved",
            type: "success",
          });
        },
        onError: () => {
          toastManager.add({
            title: "Error",
            description: "Failed to update features",
            type: "error",
          });
        },
      },
    );
  };

  const saveSettings = () => {
    if (!org) return;
    const parsed: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(settings)) {
      const num = Number(v);
      if (!isNaN(num) && v.trim() !== "") {
        parsed[k] = num;
      } else if (v === "true") {
        parsed[k] = true;
      } else if (v === "false") {
        parsed[k] = false;
      } else {
        parsed[k] = v;
      }
    }
    updateOrg(
      {
        params: { path: { id: org.id } },
        body: { settings: parsed } as never,
      },
      {
        onSuccess: () => {
          toastManager.add({
            title: "Settings updated",
            description: "Organization settings saved",
            type: "success",
          });
        },
        onError: () => {
          toastManager.add({
            title: "Error",
            description: "Failed to update settings",
            type: "error",
          });
        },
      },
    );
  };

  const addSetting = () => {
    if (newSettingKey.trim()) {
      setSettings((prev) => ({ ...prev, [newSettingKey.trim()]: newSettingValue }));
      setNewSettingKey("");
      setNewSettingValue("");
    }
  };

  const removeSetting = (key: string) => {
    setSettings((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  return (
    <Dialog open={!!org} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Edit Organization</DialogTitle>
          <DialogDescription>{org?.name}</DialogDescription>
        </DialogHeader>
        <DialogPanel>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList variant="underline" className="mb-4 w-full">
              <TabsTab value="profile">Profile</TabsTab>
              <TabsTab value="features">Features</TabsTab>
              <TabsTab value="settings">Settings</TabsTab>
            </TabsList>

            <TabsContent value="profile">
              <form
                id="edit-org-profile"
                onSubmit={form.handleSubmit(saveProfile)}
                className="space-y-4"
              >
                <Controller
                  control={form.control}
                  name="name"
                  render={({ field, fieldState }) => (
                    <Field name={field.name} invalid={fieldState.invalid}>
                      <FieldLabel>Name</FieldLabel>
                      <Input {...field} />
                      <FieldError error={fieldState.error} />
                    </Field>
                  )}
                />
                <Controller
                  control={form.control}
                  name="slug"
                  render={({ field, fieldState }) => (
                    <Field name={field.name} invalid={fieldState.invalid}>
                      <FieldLabel>Slug</FieldLabel>
                      <Input {...field} />
                      <FieldError error={fieldState.error} />
                    </Field>
                  )}
                />
                <Controller
                  control={form.control}
                  name="logoUrl"
                  render={({ field, fieldState }) => (
                    <Field name={field.name} invalid={fieldState.invalid}>
                      <FieldLabel>Logo URL</FieldLabel>
                      <Input {...field} placeholder="https://..." />
                      <FieldError error={fieldState.error} />
                    </Field>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <Controller
                    control={form.control}
                    name="primaryColor"
                    render={({ field, fieldState }) => (
                      <Field name={field.name} invalid={fieldState.invalid}>
                        <FieldLabel>Primary Color</FieldLabel>
                        <div className="flex gap-2">
                          <Input {...field} className="flex-1" />
                          {field.value && (
                            <div
                              className="size-9 shrink-0 rounded-md border"
                              style={{ backgroundColor: field.value }}
                            />
                          )}
                        </div>
                        <FieldError error={fieldState.error} />
                      </Field>
                    )}
                  />
                  <Controller
                    control={form.control}
                    name="accentColor"
                    render={({ field, fieldState }) => (
                      <Field name={field.name} invalid={fieldState.invalid}>
                        <FieldLabel>Accent Color</FieldLabel>
                        <div className="flex gap-2">
                          <Input {...field} className="flex-1" />
                          {field.value && (
                            <div
                              className="size-9 shrink-0 rounded-md border"
                              style={{ backgroundColor: field.value }}
                            />
                          )}
                        </div>
                        <FieldError error={fieldState.error} />
                      </Field>
                    )}
                  />
                </div>
              </form>
            </TabsContent>

            <TabsContent value="features">
              <div className="space-y-4">
                {KNOWN_FEATURES.map((feature) => (
                  <div
                    key={feature.key}
                    className="flex items-center justify-between gap-4 py-1"
                  >
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium">{feature.label}</p>
                      <p className="text-muted-foreground text-xs">
                        {feature.description}
                      </p>
                    </div>
                    <Switch
                      checked={features[feature.key] ?? false}
                      onCheckedChange={(checked) =>
                        setFeatures((prev) => ({ ...prev, [feature.key]: checked }))
                      }
                    />
                  </div>
                ))}
                <div className="border-border border-t pt-4 space-y-4">
                  <div>
                    <div className="flex items-center justify-between gap-4 py-1">
                      <div className="space-y-0.5">
                        <p className="text-sm font-medium">Coach Welcome Video</p>
                        <p className="text-muted-foreground text-xs">
                          Attach a welcome video to coach invite &amp; roster emails
                        </p>
                      </div>
                      <Switch
                        checked={coachVideoEnabled}
                        onCheckedChange={(checked) => {
                          setCoachVideoEnabled(checked);
                          if (!checked) setCoachVideoUrl("");
                        }}
                      />
                    </div>
                    {coachVideoEnabled && (
                      <div className="mt-3">
                        <Input
                          value={coachVideoUrl}
                          onChange={(e) => setCoachVideoUrl(e.target.value)}
                          placeholder="https://youtube.com/watch?v=..."
                          className="text-sm"
                        />
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center justify-between gap-4 py-1">
                      <div className="space-y-0.5">
                        <p className="text-sm font-medium">Dancer Welcome Video</p>
                        <p className="text-muted-foreground text-xs">
                          Attach a welcome video to dancer invite &amp; roster emails
                        </p>
                      </div>
                      <Switch
                        checked={dancerVideoEnabled}
                        onCheckedChange={(checked) => {
                          setDancerVideoEnabled(checked);
                          if (!checked) setDancerVideoUrl("");
                        }}
                      />
                    </div>
                    {dancerVideoEnabled && (
                      <div className="mt-3">
                        <Input
                          value={dancerVideoUrl}
                          onChange={(e) => setDancerVideoUrl(e.target.value)}
                          placeholder="https://youtube.com/watch?v=..."
                          className="text-sm"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="settings">
              <div className="space-y-3">
                {Object.entries(settings).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-2">
                    <Input
                      value={key}
                      disabled
                      className="flex-1 font-mono text-xs"
                    />
                    <Input
                      value={value}
                      onChange={(e) =>
                        setSettings((prev) => ({ ...prev, [key]: e.target.value }))
                      }
                      className="flex-1 font-mono text-xs"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="xs"
                      className="text-destructive hover:text-destructive shrink-0"
                      onClick={() => removeSetting(key)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
                <div className="border-border flex items-center gap-2 border-t pt-3">
                  <Input
                    value={newSettingKey}
                    onChange={(e) => setNewSettingKey(e.target.value)}
                    placeholder="key"
                    className="flex-1 font-mono text-xs"
                  />
                  <Input
                    value={newSettingValue}
                    onChange={(e) => setNewSettingValue(e.target.value)}
                    placeholder="value"
                    className="flex-1 font-mono text-xs"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addSetting();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    onClick={addSetting}
                    className="shrink-0"
                  >
                    Add
                  </Button>
                </div>
                {Object.keys(settings).length === 0 && (
                  <p className="text-muted-foreground py-4 text-center text-sm">
                    No settings configured. Add key-value pairs above.
                  </p>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </DialogPanel>
        <DialogFooter>
          <Button
            disabled={isPending}
            onClick={() => {
              if (activeTab === "profile") {
                form.handleSubmit(saveProfile)();
              } else if (activeTab === "features") {
                saveFeatures();
              } else if (activeTab === "settings") {
                saveSettings();
              }
            }}
          >
            {isPending ? "Saving..." : `Save ${activeTab === "profile" ? "Profile" : activeTab === "features" ? "Features" : "Settings"}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
