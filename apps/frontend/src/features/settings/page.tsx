import { Link } from "@tanstack/react-router";
import {
  ChevronRight,
  CreditCard,
  FolderOpen,
  Settings,
  User,
} from "lucide-react";

const settingsItems = [
  {
    icon: User,
    label: "Personal",
    description: "Name, bio, and contact info",
    href: "/settings/personal",
  },
  {
    icon: FolderOpen,
    label: "Portfolio",
    description: "Manage your public details",
    href: "/settings/portfolio",
  },
  {
    icon: Settings,
    label: "General",
    description: "Preferences, notifications, and privacy",
    href: "/settings/general",
  },
  {
    icon: CreditCard,
    label: "Membership",
    description: "Subscription and billing",
    href: "/settings/membership",
  },
] as const;

export function SettingsPage() {
  return (
    <div className="mobile:pb-14 flex flex-col gap-4 pt-1 sm:pt-0">
      <div className="flex flex-col max-sm:pl-1">
        <h1 className="text-2xl leading-none font-bold tracking-tight">
          Settings
        </h1>
        <p className="text-muted-foreground text-sm">
          Manage your account and preferences
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border">
        {settingsItems.map((item, index) => (
          <Link
            key={item.href}
            to={item.href}
            className="hover:bg-muted/50 active:bg-muted flex items-center gap-4 px-4 py-3.5 transition-colors"
            style={
              index < settingsItems.length - 1
                ? { borderBottom: "1px solid var(--color-border)" }
                : undefined
            }
          >
            <div className="bg-muted text-brand flex size-9 shrink-0 items-center justify-center rounded-lg">
              <item.icon className="size-4.5" />
            </div>
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="text-sm font-medium">{item.label}</span>
              <span className="text-muted-foreground text-xs">
                {item.description}
              </span>
            </div>
            <ChevronRight className="text-muted-foreground size-4 shrink-0" />
          </Link>
        ))}
      </div>
    </div>
  );
}
