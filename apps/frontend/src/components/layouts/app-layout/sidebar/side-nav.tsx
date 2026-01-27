import { Separator } from "@/components/ui/separator";
import { useSession } from "@/lib/session";
import {
  BookIcon,
  CompassIcon,
  HomeIcon,
  SettingsIcon,
  SparklesIcon,
  UserIcon,
} from "lucide-react";
import { NavLink } from "./nav-link";

export function SideNav() {
  const session = useSession();

  return (
    <aside className="w-fit xl:w-72 shrink-0">
      <nav className="sticky top-12 p-2 py-0 xl:p-4">
        <div className="flex flex-col xl:border border-r h-[calc(100vh-3rem)] xl:h-auto xl:rounded-xl pl-0 xl:pl-2 p-2 space-y-1">
          <NavLink to="/" label="For You">
            <HomeIcon className="size-4" />
          </NavLink>
          <NavLink to="/explore" label="Explore">
            <CompassIcon className="size-4" />
          </NavLink>
          <NavLink to="/events" label="Events">
            <SparklesIcon className="size-4" />
          </NavLink>
          <NavLink to="/resources" label="Resources">
            <BookIcon className="size-4" />
          </NavLink>
          <NavLink
            to="/$username"
            params={{ username: session.username }}
            preload="render"
            label="Profile"
          >
            <UserIcon className="size-4" />
          </NavLink>
          <Separator className="my-2" />
          <NavLink to="/settings" label="Settings">
            <SettingsIcon className="size-4" />
          </NavLink>
        </div>
      </nav>
    </aside>
  );
}
