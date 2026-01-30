import { MainLogo } from "@/components/shared/main-logo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Menu,
  MenuGroup,
  MenuItem,
  MenuPopup,
  MenuSeparator,
  MenuTrigger,
} from "@/components/ui/menu";
import { useSession } from "@/lib/session";
import { Link } from "@tanstack/react-router";
import { MoonIcon, SunIcon } from "lucide-react";
import { useEffect, useState } from "react";

export function Topbar() {
  const session = useSession();

  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("darkMode");
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem("darkMode", JSON.stringify(darkMode));
    document.body.classList.toggle("dark", darkMode);
  }, [darkMode]);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-12 border-b bg-background lg:bg-background/50 lg:backdrop-blur-xs border-border">
      <div className="relative max-w-7xl mx-auto h-full px-2 lg:px-4 flex items-center justify-between">
        <div className="absolute left-1/2 -translate-x-1/2 sm:static sm:translate-x-0 shrink-0">
          <MainLogo className="h-4 dark:invert" />
        </div>
        <div className="flex justify-between sm:justify-end w-full items-center gap-2">
          <Button
            variant="ghost"
            className="rounded-full max-sm:size-8!"
            size="icon"
            onClick={() => setDarkMode(() => !darkMode)}
          >
            {darkMode ? <MoonIcon /> : <SunIcon />}
          </Button>
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
              <MenuGroup>
                <MenuItem disabled>@{session.username}</MenuItem>
              </MenuGroup>
              <MenuSeparator />
              <MenuGroup>
                <MenuItem closeOnClick render={<Link to="/logout" />}>
                  Logout
                </MenuItem>
              </MenuGroup>
            </MenuPopup>
          </Menu>
        </div>
      </div>
    </header>
  );
}
