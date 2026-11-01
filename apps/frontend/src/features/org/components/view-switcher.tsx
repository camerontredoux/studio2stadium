import {
  ChalkboardTeacherIcon,
  MonitorIcon,
  MoonIcon,
  PersonSimpleIcon,
  ShieldCheckIcon,
  SignOutIcon,
  SunIcon,
  UserIcon,
} from "@phosphor-icons/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Link,
  useLocation,
  useNavigate,
  useParams,
} from "@tanstack/react-router";
import type { ReactNode } from "react";

import { Button } from "@/components/event/button";
import {
  Menu,
  MenuGroup,
  MenuGroupLabel,
  MenuItem,
  MenuPopup,
  MenuRadioGroup,
  MenuRadioItem,
  MenuSegmented,
  type MenuSegmentedOption,
  MenuSeparator,
  MenuTrigger,
} from "@/components/event/menu";
import {
  viewForPathname,
  type View,
} from "@/features/org/components/current-view";
import { ShellSidebarUser } from "@/components/event/shell";
import { toastManager } from "@/components/ui/toast-manager";
import { orgQueries } from "@/features/org/api/queries";
import { useOrg } from "@/features/org/context/use-org";
import { useOrgTheme, type OrgTheme } from "@/features/org/hooks/use-org-theme";
import { client } from "@/lib/api/client";
import { grantsOrgAdmin } from "@/lib/access";
import { useSession } from "@/lib/session";

const VIEWS = [
  { view: "Admin", icon: ShieldCheckIcon },
  { view: "Coach", icon: ChalkboardTeacherIcon },
  { view: "Dancer", icon: PersonSimpleIcon },
] as const;

const THEMES: ReadonlyArray<MenuSegmentedOption<OrgTheme>> = [
  { value: "light", label: "Light", icon: SunIcon },
  { value: "dark", label: "Dark", icon: MoonIcon },
  { value: "system", label: "System", icon: MonitorIcon },
];

function initialsOf(name: string) {
  const parts = name.split(/\s+/).filter(Boolean);
  const letters =
    parts.length > 1
      ? `${parts[0][0]}${parts[parts.length - 1][0]}`
      : name.slice(0, 2);
  return letters.toUpperCase();
}

/**
 * The signed-in person's menu: Profile, the Light / Dark / System theme, Log
 * out and, for people who can switch (org admins and platform admins), "View
 * as" Admin / Coach / Dancer. Switching to Coach or Dancer first registers the
 * admin on the active event (POST `/orgs/{slug}/events/view-as`), as before.
 *
 * `sidebar` (default) is the person at the foot of the event sidebar; `phone`
 * is an avatar button for the phone brand row, where the sidebar is hidden.
 */
export function ViewSwitcher({
  sub,
  variant = "sidebar",
}: {
  sub?: ReactNode;
  variant?: "sidebar" | "phone";
}) {
  const { membership } = useOrg();
  const session = useSession();
  const location = useLocation();
  const navigate = useNavigate();
  const { orgSlug } = useParams({ strict: false }) as { orgSlug: string };
  const queryClient = useQueryClient();
  const { ternaryDarkMode, setTernaryDarkMode } = useOrgTheme();
  const attendMutation = useMutation({
    mutationFn: async (type: "coach" | "dancer") => {
      const { error } = await client.POST("/orgs/{slug}/events/view-as", {
        params: { path: { slug: orgSlug } },
        body: { type },
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries(orgQueries.org(orgSlug));
    },
  });

  const canSwitchView = grantsOrgAdmin(membership) || session.role === "admin";

  const current = viewForPathname(location.pathname);

  async function handleSelect(view: View) {
    if (view === current) return;
    try {
      if (view === "Admin") {
        await navigate({ to: "/o/$orgSlug/admin", params: { orgSlug } });
        return;
      }
      await attendMutation.mutateAsync(view === "Coach" ? "coach" : "dancer");
      await navigate({
        to: view === "Coach" ? "/o/$orgSlug/coach" : "/o/$orgSlug/dancer",
        params: { orgSlug },
      });
    } catch {
      toastManager.add({
        title: "Couldn't switch views",
        description: "Unable to register you on the active event right now.",
        type: "error",
      });
    }
  }

  const displayName =
    [session.firstName, session.lastName].filter(Boolean).join(" ").trim() ||
    session.username;

  const initials = initialsOf(displayName);

  return (
    <Menu>
      {variant === "phone" ? (
        <MenuTrigger
          render={
            <Button
              variant="ghost"
              size="lg"
              iconOnly
              label={`Account: ${displayName}`}
              className="flex-none self-center"
            />
          }
        >
          <span className="s2s-avatar" aria-hidden="true">
            {initials}
          </span>
        </MenuTrigger>
      ) : (
        <ShellSidebarUser
          initials={initials}
          name={displayName}
          email={sub ?? session.displayEmail}
          tooltip={displayName}
          render={<MenuTrigger />}
        />
      )}
      <MenuPopup
        side={variant === "phone" ? "bottom" : "top"}
        align={variant === "phone" ? "end" : "start"}
        className="w-(--sidebar-w)"
      >
        {canSwitchView && (
          <>
            <MenuGroup>
              <MenuGroupLabel>View as</MenuGroupLabel>
              <MenuRadioGroup
                value={current}
                onValueChange={(view: View) => void handleSelect(view)}
              >
                {VIEWS.map(({ view, icon }) => (
                  <MenuRadioItem
                    key={view}
                    value={view}
                    icon={icon}
                    disabled={attendMutation.isPending}
                  >
                    {view}
                  </MenuRadioItem>
                ))}
              </MenuRadioGroup>
            </MenuGroup>
            <MenuSeparator />
          </>
        )}
        {session.type === "organizer" ? (
          // An Organizer account has no public profile to open.
          <MenuItem icon={UserIcon} render={<Link to="/settings/account" />}>
            Account
          </MenuItem>
        ) : (
          <MenuItem
            icon={UserIcon}
            render={
              <Link
                to={
                  session.type === "school"
                    ? "/explore/$username"
                    : "/$username"
                }
                params={{ username: session.username }}
              />
            }
          >
            Profile
          </MenuItem>
        )}
        <div className="px-(--space-2) py-(--space-4)">
          <MenuSegmented
            label="Theme"
            options={THEMES}
            value={ternaryDarkMode}
            onChange={setTernaryDarkMode}
          />
        </div>
        <MenuItem icon={SignOutIcon} render={<Link to="/logout" />}>
          Log out
        </MenuItem>
      </MenuPopup>
    </Menu>
  );
}
