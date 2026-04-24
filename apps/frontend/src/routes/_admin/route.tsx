import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetHeader,
  SheetPopup,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ToastProvider } from "@/components/ui/toast";
import { queries } from "@/lib/session";
import {
  Link,
  Outlet,
  createFileRoute,
  redirect,
} from "@tanstack/react-router";
import { Menu } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/_admin")({
  beforeLoad: async ({ context }) => {
    const session = await context.queryClient.ensureQueryData(
      queries.session(),
    );

    if (!session || session.role !== "admin") {
      throw redirect({ to: "/login", replace: true });
    }

    return { session };
  },
  component: RouteComponent,
});

const navLinks = [
  { to: "/admin/dashboard", label: "Dashboard" },
  { to: "/admin/applications", label: "Applications" },
  { to: "/admin/dancers", label: "Dancers" },
  { to: "/admin/school-events", label: "Schools" },
  { to: "/admin/global-events", label: "Global Events" },
  { to: "/admin/blog", label: "Blog" },
  { to: "/admin/video-library", label: "Video Library" },
  { to: "/admin/outbox-stats", label: "Stats" },
] as const;

function RouteComponent() {
  const [open, setOpen] = useState(false);

  return (
    <ToastProvider position="top-center">
      <div className="bg-background min-h-screen">
        <header className="bg-background/95 supports-backdrop-filter:bg-background/60 sticky top-0 z-50 border-b backdrop-blur">
          <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
            <Link to="/admin/dashboard" className="text-lg font-semibold">
              S2S Dashboard
            </Link>

            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger render={<Button variant="ghost" size="icon" />}>
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </SheetTrigger>
              <SheetPopup variant="inset" side="right" className="w-64">
                <SheetHeader>
                  <SheetTitle>Menu</SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col gap-4 px-4 py-6">
                  {navLinks.map((link) => (
                    <Link
                      key={link.to}
                      to={link.to}
                      onClick={() => setOpen(false)}
                      className="text-muted-foreground hover:text-foreground [&.active]:text-foreground text-sm transition-colors [&.active]:font-medium"
                    >
                      {link.label}
                    </Link>
                  ))}
                  <hr className="my-2" />
                  <Link
                    to="/"
                    onClick={() => setOpen(false)}
                    className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                  >
                    Back to Site
                  </Link>
                </nav>
              </SheetPopup>
            </Sheet>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-4 sm:px-6">
          <Outlet />
        </main>
      </div>
    </ToastProvider>
  );
}
