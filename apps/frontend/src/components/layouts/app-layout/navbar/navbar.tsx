import { MainLogo } from "@/components/shared/main-logo";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MenuIcon, UserIcon } from "lucide-react";
import { Search } from "./search";

export function TopNavbar() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-12 border-b bg-white/50 backdrop-blur-xs border-border">
      <div className="max-w-7xl mx-auto h-full px-2 sm:px-4 flex items-center justify-between">
        <div className="shrink-0">
          <MainLogo className="h-4" />
        </div>
        <div className="flex items-center sm:justify-center max-w-md gap-2 mx-4 sm:mx-8 flex-1">
          <Search />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon">
            <MenuIcon className="w-4 h-4" />
          </Button>
          <Avatar>
            <AvatarFallback>
              <UserIcon className="w-4 h-4" />
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}
