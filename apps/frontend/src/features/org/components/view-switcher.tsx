import { useOrg } from "@/features/org/context/use-org";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/menu";
import {
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useLocation, useNavigate, useParams } from "@tanstack/react-router";
import { EyeIcon } from "lucide-react";

type View = "Admin" | "Coach" | "Dancer";

export function ViewSwitcher() {
  const { membership } = useOrg();
  const location = useLocation();
  const navigate = useNavigate();
  const { orgSlug } = useParams({ strict: false }) as { orgSlug: string };

  if (membership?.role !== "admin") return null;

  const current: View = location.pathname.includes("/admin")
    ? "Admin"
    : location.pathname.includes("/coach")
      ? "Coach"
      : "Dancer";

  function handleSelect(view: View) {
    if (view === "Admin") {
      void navigate({ to: "/$orgSlug/admin", params: { orgSlug } });
    } else if (view === "Coach") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      void (navigate as any)({ to: "/$orgSlug/coach", params: { orgSlug } });
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      void (navigate as any)({ to: "/$orgSlug", params: { orgSlug } });
    }
  }

  return (
    <SidebarMenuItem>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <SidebarMenuButton
              tooltip="Switch view"
              className="rounded-none border-sidebar-border border-t-2 border-t-transparent px-3 py-3 hover:bg-sidebar-accent/20 group-data-[collapsible=icon]:h-12! group-data-[collapsible=icon]:w-full! group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:rounded-none group-data-[collapsible=icon]:border-b group-data-[collapsible=icon]:p-0!"
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
              onClick={() => handleSelect(view)}
            >
              {view}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  );
}
