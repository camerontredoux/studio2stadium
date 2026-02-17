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
    <header className="bg-background border-border fixed top-0 right-0 left-0 z-50 h-12 border-b">
      <div className="relative mx-auto flex h-full max-w-7xl items-center justify-between px-2 lg:px-4">
        <div className="absolute left-1/2 shrink-0 -translate-x-1/2 sm:static sm:translate-x-0">
          <MainLogo className="h-5 dark:invert" />
        </div>
        <div className="flex w-full items-center justify-end gap-2">
          <Menu>
            <MenuTrigger className="cursor-pointer">
              <Avatar className="mobile:size-9 border transition-colors duration-100 hover:border-white/20">
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
