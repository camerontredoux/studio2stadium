import { useSession } from "@/lib/session";
import { Link } from "@tanstack/react-router";
import {
  ChevronRight,
  CreditCard,
  FolderOpen,
  SkullIcon,
  User,
  UserRoundSearchIcon,
} from "lucide-react";

export function SettingsPage() {
  const session = useSession();

  const settingsItems = [
    {
      icon: User,
      label: "Account",
      description: "Manage your account",
      href: "/settings/account",
    },
    {
      icon: FolderOpen,
      label: "Password",
      description: "Change your password",
      href: "/settings/password",
    },
    ...(session.type === "dancer"
      ? [
          {
            icon: CreditCard,
            label: "Membership",
            description: "Manage your membership",
            href: "/settings/membership",
          },
        ]
      : [
          {
            icon: UserRoundSearchIcon,
            label: "Application",
            description: "Manage your application",
            href: "/settings/application",
          },
        ]),
    {
      icon: SkullIcon,
      label: "Danger",
      description: "Delete your account",
      href: "/settings/delete",
    },
  ] as const;

  return (
    <div className="flex flex-col gap-2 pt-1 sm:pt-0 lg:gap-4">
      <div className="flex flex-col max-sm:pl-1">
        <h1 className="text-2xl leading-none font-bold tracking-tight">
          Settings
        </h1>
        <p className="text-muted-foreground text-sm">
          Manage your account and preferences
        </p>
      </div>
      <div className="divide-y overflow-hidden">
        {settingsItems.map((item, index) => (
          <Link
            key={item.href}
            to={item.href}
            className="hover:bg-muted/50 active:bg-muted flex items-center gap-4 px-4 py-3.5 transition-colors duration-75"
            style={
              index < settingsItems.length - 1
                ? { borderBottom: "1px solid var(--color-border)" }
                : undefined
            }
          >
            <div
              className={`bg-muted ${item.label === "Danger" ? "text-destructive-foreground" : "text-brand"} flex size-9 shrink-0 items-center justify-center rounded-lg`}
            >
              <item.icon className="size-4.5" />
            </div>
            <div className="flex min-w-0 flex-1 flex-col">
              <span
                className={`text-sm font-medium ${item.label === "Danger" ? "text-destructive-foreground" : "text-brand"}`}
              >
                {item.label}
              </span>
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
