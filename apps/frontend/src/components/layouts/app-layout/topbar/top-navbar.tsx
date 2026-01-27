import { MainLogo } from "@/components/shared/main-logo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Menu, MenuItem, MenuPopup, MenuTrigger } from "@/components/ui/menu";
import { useSession } from "@/lib/session";
import { Link } from "@tanstack/react-router";
import { Search } from "./search";

export function TopNavbar() {
  const session = useSession();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-12 border-b bg-white/50 backdrop-blur-xs border-border">
      <div className="max-w-7xl mx-auto h-full px-2 sm:px-4 flex items-center justify-between">
        <div className="shrink-0">
          <MainLogo className="h-4" />
        </div>
        <div className="flex items-center justify-center sm:max-w-md gap-2 mx-4 sm:mx-8 flex-1">
          <Search />
        </div>
        <div className="flex items-center gap-2">
          <Menu>
            <MenuTrigger>
              <Avatar className="mobile:size-9">
                <AvatarImage src={session.avatar ?? undefined} />
                <AvatarFallback>
                  {session.username.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </MenuTrigger>
            <MenuPopup align="end">
              <MenuItem disabled>@{session.username}</MenuItem>
              <MenuItem closeOnClick render={<Link to="/logout" />}>
                Logout
              </MenuItem>
            </MenuPopup>
          </Menu>
        </div>
      </div>
    </header>
  );
}
