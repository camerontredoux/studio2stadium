import { MainLogo } from "@/components/shared/main-logo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Menu,
  MenuGroup,
  MenuGroupLabel,
  MenuItem,
  MenuPopup,
  MenuRadioGroup,
  MenuRadioItem,
  MenuSeparator,
  MenuTrigger,
} from "@/components/ui/menu";
import { useSession } from "@/lib/session";
import { Link } from "@tanstack/react-router";
import { useTernaryDarkMode, type TernaryDarkMode } from "usehooks-ts";

export function Topbar() {
  const session = useSession();

  const { ternaryDarkMode, setTernaryDarkMode } = useTernaryDarkMode({
    localStorageKey: "theme",
  });

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-12 border-b bg-background lg:bg-background/50 lg:backdrop-blur-xs border-border">
      <div className="relative max-w-7xl mx-auto h-full px-2 lg:px-4 flex items-center justify-between">
        <div className="absolute left-1/2 -translate-x-1/2 sm:static sm:translate-x-0 shrink-0">
          <MainLogo className="h-4 dark:invert" />
        </div>
        <div className="flex justify-end w-full items-center gap-2">
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
                <MenuGroupLabel>Theme</MenuGroupLabel>
                <MenuRadioGroup
                  onValueChange={(value) =>
                    setTernaryDarkMode(value as TernaryDarkMode)
                  }
                  defaultValue={ternaryDarkMode}
                >
                  <MenuRadioItem value="light">Light</MenuRadioItem>
                  <MenuRadioItem value="dark">Dark</MenuRadioItem>
                  <MenuRadioItem value="system">System</MenuRadioItem>
                </MenuRadioGroup>
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
