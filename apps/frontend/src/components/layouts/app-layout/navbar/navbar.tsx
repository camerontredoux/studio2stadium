import { Separator } from "@/components/ui/separator";

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

import { useSession } from "@/lib/session";
import { Activity } from "./activity";
import { NavLink } from "./nav-link";

export function Navbar() {
  const session = useSession();

  return (
    <aside className="mobile:z-50 mobile:fixed mobile:bg-background mobile:left-0 mobile:right-0 mobile:bottom-0 mobile:w-full mobile:border-t w-fit shrink-0 xl:w-72">
      <nav className="mobile:px-2 sticky top-12 py-0 pl-2 xl:p-4 xl:pr-0">
        <div className="bg-background mobile:flex-row mobile:justify-between desktop:flex-col desktop:border-r desktop:h-[calc(100vh-3rem)] desktop:xl:h-auto desktop:pl-0 desktop:xl:pl-2 mobile:px-0 flex gap-1 p-2 xl:rounded-xl xl:border">
          <NavLink
            to="/feed"
            label="For You"
            activeIcon={HiHome}
            inactiveIcon={HiOutlineHome}
          />
          <NavLink
            to="/explore"
            label="Explore"
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
          {session.type === "dancer" ? (
            <NavLink
              to="/$username"
              params={{ username: session.username }}
              label="Profile"
              activeIcon={HiUserCircle}
              inactiveIcon={HiOutlineUserCircle}
            />
          ) : (
            <NavLink
              to="/explore/$username"
              params={{ username: session.username }}
              label="Profile"
              activeIcon={HiUserCircle}
              inactiveIcon={HiOutlineUserCircle}
            />
          )}

          <Separator className="mt-2 mb-1 hidden xl:block" />

          <NavLink
            className="mobile:hidden"
            to="/settings"
            label="Settings"
            activeIcon={HiCog}
            inactiveIcon={HiOutlineCog}
          />

          <Separator className="mt-1 hidden xl:block" />

          <Activity />
        </div>
      </nav>
    </aside>
  );
}
