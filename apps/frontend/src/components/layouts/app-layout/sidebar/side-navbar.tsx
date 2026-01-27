import { Separator } from "@/components/ui/separator";
import { useSession } from "@/lib/session";
import {
  BookHeadphonesIcon,
  CompassIcon,
  HomeIcon,
  SettingsIcon,
  SparklesIcon,
  UserCircle2Icon,
  VideoIcon,
} from "lucide-react";
import { NavLink } from "./nav-link";

export function SideNavbar() {
  const session = useSession();

  return (
    <aside className="w-fit xl:w-72 mobile:z-50 shrink-0 mobile:fixed mobile:bg-white mobile:pb-[env(safe-area-inset-bottom)] mobile:left-0 mobile:right-0 mobile:bottom-0 mobile:w-full mobile:border-t">
      <nav className="sticky top-12 pl-2 mobile:pr-2 py-0 xl:pr-2 xl:p-4">
        <div className="flex bg-white mobile:flex-row mobile:justify-between desktop:flex-col xl:border desktop:border-r desktop:h-[calc(100vh-3rem)] desktop:xl:h-auto xl:rounded-xl desktop:pl-0 desktop:xl:pl-2 mobile:px-0 p-2 space-y-1">
          <NavLink to="/" label="For You">
            <HomeIcon className="size-4" />
          </NavLink>
          <NavLink to="/explore" label="Explore">
            <CompassIcon className="size-4" />
          </NavLink>
          <NavLink to="/events" label="Events">
            <SparklesIcon className="size-4" />
          </NavLink>
          <NavLink to="/recruiting" label="Recruiting">
            <VideoIcon className="size-4" />
          </NavLink>
          <NavLink to="/resources" label="Resources">
            <BookHeadphonesIcon className="size-4" />
          </NavLink>
          <NavLink
            to="/$username"
            params={{ username: session.username }}
            preload="render"
            label="Profile"
          >
            <UserCircle2Icon className="size-4" />
          </NavLink>

          <Separator className="my-2 hidden xl:block" />

          <NavLink className="mobile:hidden" to="/settings" label="Settings">
            <SettingsIcon className="size-4" />
          </NavLink>

          <Separator className="mt-1 hidden xl:block" />

          <div className="hidden xl:block p-2 text-sm">
            <p className="mb-2">Your Activity</p>
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-2">
                <p className="text-muted-foreground text-xs">Videos</p>
                <p className="ml-auto">10</p>
              </div>
              <div className="flex items-center gap-2">
                <p className="text-muted-foreground text-xs">Followers</p>
                <p className="ml-auto">10</p>
              </div>
              <div className="flex items-center gap-2">
                <p className="text-muted-foreground text-xs">Following</p>
                <p className="ml-auto">10</p>
              </div>
            </div>
          </div>
        </div>
      </nav>
    </aside>
  );
}
