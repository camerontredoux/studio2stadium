import { useOrg } from "@/features/org/context/use-org";
import { useSession } from "@/lib/session";
import { client } from "@/lib/api/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/menu";
import { SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { toastManager } from "@/components/ui/toast-manager";
import { useLocation, useNavigate, useParams } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { EyeIcon } from "lucide-react";

type View = "Admin" | "Coach" | "Dancer";

export function ViewSwitcher() {
  const { membership } = useOrg();
  const session = useSession();
  const location = useLocation();
  const navigate = useNavigate();
  const { orgSlug } = useParams({ strict: false }) as { orgSlug: string };
  const attendMutation = useMutation({
    mutationFn: async (type: "coach" | "dancer") => {
      const raw = client as unknown as {
        POST: (
          path: string,
          opts: { body: { type: "coach" | "dancer" } },
        ) => Promise<void>;
      };
      await raw.POST(`/orgs/${orgSlug}/events/view-as`, { body: { type } });
    },
  });

  if (membership?.role !== "admin" && session.role !== "admin") return null;

  const current: View = location.pathname.includes("/admin")
    ? "Admin"
    : location.pathname.includes("/coach")
      ? "Coach"
      : "Dancer";

  async function handleSelect(view: View) {
    if (view === current) return;
    try {
      if (view === "Admin") {
        await navigate({ to: "/o/$orgSlug/admin", params: { orgSlug } });
        return;
      }

      if (view === "Coach") {
        await attendMutation.mutateAsync("coach");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (navigate as any)({ to: "/o/$orgSlug/coach", params: { orgSlug } });
        return;
      }

      await attendMutation.mutateAsync("dancer");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (navigate as any)({ to: "/o/$orgSlug", params: { orgSlug } });
    } catch {
      toastManager.add({
        title: "Couldn't switch views",
        description: "Unable to register you on the active event right now.",
        type: "error",
      });
    }
  }

  const disabled = attendMutation.isPending;

  return (
    <SidebarMenuItem>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <SidebarMenuButton
              tooltip="Switch view"
              className="border-sidebar-border hover:bg-sidebar-accent/20 rounded-none border-t-2 border-t-transparent px-3 py-3 group-data-[collapsible=icon]:h-12! group-data-[collapsible=icon]:w-full! group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:rounded-none group-data-[collapsible=icon]:border-b group-data-[collapsible=icon]:p-0!"
            />
          }
        >
          <EyeIcon />
          <span>Viewing as: {current}</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="top" align="start">
          {(["Admin", "Coach", "Dancer"] as View[]).map((view) => (
            <DropdownMenuItem
              key={view}
              disabled={disabled}
              onClick={() => {
                void handleSelect(view);
              }}
            >
              {view}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  );
}
