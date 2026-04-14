import {
  Command,
  CommandCollection,
  CommandDialog,
  CommandDialogPopup,
  CommandEmpty,
  CommandFooter,
  CommandGroup,
  CommandGroupLabel,
  CommandInput,
  CommandItem,
  CommandList,
  CommandPanel,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CornerDownLeftIcon,
  LayoutDashboardIcon,
  PencilIcon,
  SettingsIcon,
  UploadIcon,
  UsersIcon,
  HistoryIcon,
} from "lucide-react";
import { Fragment, useEffect, type ReactNode } from "react";
import { useNavigate, useParams } from "@tanstack/react-router";
import { useAdminCommands } from "@/features/org/hooks/use-admin-commands";

interface Item {
  value: string;
  label: string;
  icon: ReactNode;
  shortcut?: string;
  onRun: () => void;
}

interface Group {
  value: string;
  label: string;
  items: Item[];
}

export function AdminCommandPalette() {
  const { paletteOpen, openPalette, closePalette, dispatch } =
    useAdminCommands();
  const navigate = useNavigate();
  const { orgSlug } = useParams({ strict: false }) as { orgSlug: string };

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        if (paletteOpen) {
          closePalette();
        } else {
          openPalette();
        }
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [paletteOpen, openPalette, closePalette]);

  const groups: Group[] = [
    {
      value: "actions",
      label: "Actions",
      items: [
        {
          value: "edit-event",
          label: "Edit event details",
          icon: <PencilIcon className="size-4" />,
          onRun: () => dispatch({ type: "open-edit-event" }),
        },
        {
          value: "upload-dancer",
          label: "Upload dancer roster",
          icon: <UploadIcon className="size-4" />,
          onRun: () => dispatch({ type: "open-upload", kind: "dancer" }),
        },
        {
          value: "upload-coach",
          label: "Upload coach roster",
          icon: <UploadIcon className="size-4" />,
          onRun: () => dispatch({ type: "open-upload", kind: "coach" }),
        },
      ],
    },
    {
      value: "navigate",
      label: "Navigate",
      items: [
        {
          value: "nav-dashboard",
          label: "Dashboard",
          icon: <LayoutDashboardIcon className="size-4" />,
          onRun: () => {
            closePalette();
            navigate({ to: "/$orgSlug/admin", params: { orgSlug } });
          },
        },
        {
          value: "nav-dancers",
          label: "Dancers",
          icon: <UsersIcon className="size-4" />,
          onRun: () => {
            closePalette();
            navigate({ to: "/$orgSlug/admin/dancers" as string, params: { orgSlug } });
          },
        },
        {
          value: "nav-coaches",
          label: "Coaches",
          icon: <UsersIcon className="size-4" />,
          onRun: () => {
            closePalette();
            navigate({ to: "/$orgSlug/admin/coaches" as string, params: { orgSlug } });
          },
        },
        {
          value: "nav-uploads",
          label: "Uploads",
          icon: <HistoryIcon className="size-4" />,
          onRun: () => {
            closePalette();
            navigate({ to: "/$orgSlug/admin/uploads", params: { orgSlug } });
          },
        },
        {
          value: "nav-settings",
          label: "Settings",
          icon: <SettingsIcon className="size-4" />,
          onRun: () => {
            closePalette();
            navigate({ to: "/$orgSlug/admin/settings", params: { orgSlug } });
          },
        },
      ],
    },
  ];

  return (
    <CommandDialog
      open={paletteOpen}
      onOpenChange={(next) => (next ? openPalette() : closePalette())}
    >
      <CommandDialogPopup>
        <Command items={groups}>
          <CommandInput placeholder="Type a command or search..." />
          <CommandPanel>
            <CommandEmpty>No results.</CommandEmpty>
            <CommandList>
              {(group: Group) => (
                <Fragment key={group.value}>
                  <CommandGroup items={group.items}>
                    <CommandGroupLabel>{group.label}</CommandGroupLabel>
                    <CommandCollection>
                      {(item: Item) => (
                        <CommandItem
                          key={item.value}
                          value={item.value}
                          onClick={() => item.onRun()}
                        >
                          <span className="text-muted-foreground mr-2 inline-flex">
                            {item.icon}
                          </span>
                          <span className="flex-1">{item.label}</span>
                          {item.shortcut && (
                            <CommandShortcut>{item.shortcut}</CommandShortcut>
                          )}
                        </CommandItem>
                      )}
                    </CommandCollection>
                  </CommandGroup>
                  <CommandSeparator />
                </Fragment>
              )}
            </CommandList>
          </CommandPanel>
          <CommandFooter>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <KbdGroup>
                  <Kbd>
                    <ArrowUpIcon />
                  </Kbd>
                  <Kbd>
                    <ArrowDownIcon />
                  </Kbd>
                </KbdGroup>
                <span>Navigate</span>
              </div>
              <div className="flex items-center gap-2">
                <Kbd>
                  <CornerDownLeftIcon />
                </Kbd>
                <span>Run</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Kbd>Esc</Kbd>
              <span>Close</span>
            </div>
          </CommandFooter>
        </Command>
      </CommandDialogPopup>
    </CommandDialog>
  );
}
