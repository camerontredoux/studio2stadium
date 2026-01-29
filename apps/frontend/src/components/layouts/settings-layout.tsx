import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Link, useLocation } from "@tanstack/react-router";
import { Calendar, Home, Search, Settings, User } from "lucide-react";
import type { ReactNode } from "react";

const navItems = [
  { icon: Home, label: "Home", href: "/feed" },
  { icon: Search, label: "Explore", href: "/explore" },
  { icon: Calendar, label: "Events", href: "/events" },
  { icon: User, label: "Profile", href: "/profile" },
  { icon: Settings, label: "Settings", href: "/settings" },
];

interface SettingsLayoutProps {
  children: ReactNode;
}

export default function SettingsLayout({ children }: SettingsLayoutProps) {
  const currentPath = useLocation({ select: (location) => location.pathname });

  return (
    <SidebarProvider>
      {/* Left Navigation */}
      <Sidebar variant="floating" side="left" collapsible="icon">
        <SidebarHeader className="p-4">
          <Link to="/feed" className="font-bold text-lg">
            Studio2Stadium
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    isActive={currentPath === item.href}
                    tooltip={item.label}
                    render={<Link to={item.href} />}
                  >
                    <item.icon className="size-4" />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>{/* User menu */}</SidebarFooter>
      </Sidebar>

      {/* Main Content Area */}
      <SidebarInset>
        {/* Mobile Header - hamburger + logo */}
        <header className="md:hidden sticky top-0 z-20 flex items-center gap-4 border-b bg-background px-4 h-14">
          <SidebarTrigger />
          <span className="font-semibold">Studio2Stadium</span>
        </header>

        {/* Desktop Header - minimal logo only
        <header className="hidden md:flex sticky top-0 z-20 items-center border-b bg-background px-6 h-14">
          <span className="font-semibold">Studio2Stadium</span>
        </header> */}

        {/* Content + Right Sidebar */}
        <div className="flex flex-1 min-h-0">
          {/* Center Content */}
          <main className="flex-1 min-w-0 overflow-y-auto p-4 lg:p-6">
            {children}
          </main>

          {/* Right Sidebar - Desktop Only */}
          <aside className="hidden lg:flex lg:w-80 shrink-0 flex-col border-l">
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-6">
                {/* Recommendations Section */}
                <section>
                  <h3 className="font-semibold text-sm mb-3">
                    Recommendations
                  </h3>
                  <div className="space-y-3">
                    <div className="rounded-lg border p-3 text-sm text-muted-foreground">
                      Recommendation placeholder
                    </div>
                    <div className="rounded-lg border p-3 text-sm text-muted-foreground">
                      Recommendation placeholder
                    </div>
                  </div>
                </section>

                <Separator />

                {/* Upcoming Events Section */}
                <section>
                  <h3 className="font-semibold text-sm mb-3">
                    Upcoming Events
                  </h3>
                  <div className="space-y-3">
                    <div className="rounded-lg border p-3 text-sm text-muted-foreground">
                      Event placeholder
                    </div>
                    <div className="rounded-lg border p-3 text-sm text-muted-foreground">
                      Event placeholder
                    </div>
                  </div>
                </section>
              </div>
            </ScrollArea>
          </aside>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
