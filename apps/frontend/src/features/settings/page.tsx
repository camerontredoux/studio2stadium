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
  );
}
