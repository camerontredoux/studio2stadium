import { Separator } from "@/components/ui/separator";
import { useSession } from "@/lib/session";

import {
  HiBookOpen,
  HiCalendar,
  HiCog,
  HiHome,
  HiOutlineBookOpen,
  HiOutlineCalendar,
  HiOutlineCog,
  HiOutlineHome,
  HiOutlineSearchCircle,
  HiOutlineUserCircle,
  HiSearchCircle,
  HiUserCircle,
} from "react-icons/hi";

import { HiOutlineSparkles, HiSparkles } from "react-icons/hi2";

import { NavLink } from "./nav-link";

export function Navbar() {
  const session = useSession();

  return (
    <aside className="w-fit xl:w-72 mobile:z-50 shrink-0 mobile:fixed mobile:bg-background mobile:left-0 mobile:right-0 mobile:bottom-0 mobile:w-full mobile:border-t">
      <nav className="sticky top-12 pl-2 mobile:px-2 py-0 xl:pr-0 xl:p-4">
        <div className="flex bg-background mobile:flex-row mobile:justify-between desktop:flex-col xl:border desktop:border-r desktop:h-[calc(100vh-3rem)] desktop:xl:h-auto xl:rounded-xl desktop:pl-0 desktop:xl:pl-2 mobile:px-0 p-2 gap-1">
          <NavLink
            to="/feed"
            label="For You"
            activeIcon={HiHome}
            inactiveIcon={HiOutlineHome}
          />
          <NavLink
            to="/explore"
            label="Explore"
            preload="render"
            activeIcon={HiSearchCircle}
            inactiveIcon={HiOutlineSearchCircle}
          />
          <NavLink
            to="/events"
            label="Events"
            activeIcon={HiCalendar}
            inactiveIcon={HiOutlineCalendar}
          />
          <NavLink
            to="/recruiting"
            label="Recruiting"
            activeIcon={HiSparkles}
            inactiveIcon={HiOutlineSparkles}
          />
          <NavLink
            to="/resources"
            label="Resources"
            activeIcon={HiBookOpen}
            inactiveIcon={HiOutlineBookOpen}
          />
          <NavLink
            to="/$username"
            params={{ username: session.username }}
            preload="render"
            label="Profile"
            activeIcon={HiUserCircle}
            inactiveIcon={HiOutlineUserCircle}
          />

          <Separator className="my-2 hidden xl:block" />

          <NavLink
            className="mobile:hidden"
            to="/settings"
            label="Settings"
            activeIcon={HiCog}
            inactiveIcon={HiOutlineCog}
          />

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
