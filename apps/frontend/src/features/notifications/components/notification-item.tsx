import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/components/utils/cn";
import type { ApiSchemas } from "@/lib/api/client";
import { Link } from "@tanstack/react-router";
import { formatDistanceToNow } from "date-fns";
import { useMarkNotificationRead } from "../api/mutations";

type Notification = ApiSchemas["NotificationsResponse"][number];

export function NotificationItem({
  notification,
}: {
  notification: Notification;
}) {
  const markRead = useMarkNotificationRead();

  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), {
    addSuffix: true,
  });

  const handleClick = () => {
    if (!notification.read) {
      markRead.mutate(notification.id);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        "hover:bg-muted/50 flex cursor-pointer items-start gap-3 px-2 py-3 transition-colors",
        !notification.read && "bg-brand/5",
      )}
    >
      <Link
        to={notification.actor?.profileUrl ?? "#"}
        onClick={(e) => e.stopPropagation()}
        className="relative shrink-0"
      >
        <Avatar className="size-10">
          {notification.actor?.avatar ? (
            <AvatarImage
              src={notification.actor.avatar}
              alt={notification.actor.name}
            />
          ) : null}
          <AvatarFallback>
            {notification.actor?.name?.charAt(0).toUpperCase() ?? "?"}
          </AvatarFallback>
        </Avatar>
        {!notification.read && (
          <span className="bg-brand absolute -top-0.5 -right-0.5 size-2.5 rounded-full" />
        )}
      </Link>

      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="text-sm">
          <Link
            to={notification.actor?.profileUrl ?? "#"}
            onClick={(e) => e.stopPropagation()}
            className="font-semibold hover:underline"
          >
            {notification.actor?.name}
          </Link>{" "}
          <span className="text-muted-foreground">
            {notification.message}
            {notification.metadata?.eventTitle &&
              notification.metadata?.eventLink && (
                <>
                  :{" "}
                  <Link
                    to={notification.metadata.eventLink as string}
                    onClick={(e) => e.stopPropagation()}
                    className="text-foreground font-medium hover:underline"
                  >
                    {notification.metadata.eventTitle as string}
                  </Link>
                </>
              )}
          </span>
        </p>
        <p className="text-muted-foreground text-xs">{timeAgo}</p>
      </div>
    </div>
  );
}
