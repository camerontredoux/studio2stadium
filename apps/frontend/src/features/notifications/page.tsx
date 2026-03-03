import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/components/utils/cn";
import type { ApiSchemas } from "@/lib/api/client";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { formatDistanceToNow } from "date-fns";
import { notificationMutations, notificationQueries } from "./api/queries";

export function Page() {
  const queryClient = useQueryClient();
  const { data: notifications } = useSuspenseQuery(
    notificationQueries.notifications(),
  );

  const hasUnread = notifications.some((n) => !n.read);

  const handleMarkAllRead = () => {
    // Optimistically update notifications list
    queryClient.setQueryData(
      notificationQueries.notifications().queryKey,
      (old: Notification[] | undefined) =>
        old?.map((n) => ({ ...n, read: true })),
    );

    // Optimistically set count to 0
    queryClient.setQueryData(notificationQueries.count().queryKey, {
      count: 0,
    });

    // Fire and forget
    notificationMutations.markAllRead();
  };

  return (
    <div className="mobile:pb-14 flex flex-col gap-2 pt-1 sm:pt-0">
      <div className="mb-2 flex flex-row items-end justify-between sm:mb-4">
        <div className="flex flex-col">
          <h1 className="text-2xl leading-none font-bold tracking-tight max-sm:pl-1">
            Notifications
          </h1>
          <p className="text-muted-foreground text-sm max-sm:pl-1">
            Stay up to date with your activity
          </p>
        </div>
        {hasUnread && (
          <Button variant="ghost" size="sm" onClick={handleMarkAllRead}>
            Mark all as read
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="text-muted-foreground flex flex-col items-center justify-center py-12 text-center">
          <p className="text-lg font-medium">No notifications yet</p>
          <p className="text-sm">When something happens, you'll see it here</p>
        </div>
      ) : (
        <div className="flex flex-col divide-y">
          {notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
            />
          ))}
        </div>
      )}
    </div>
  );
}

type Notification = ApiSchemas["NotificationsResponse"][number];

function NotificationItem({ notification }: { notification: Notification }) {
  const queryClient = useQueryClient();

  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), {
    addSuffix: true,
  });

  const markAsRead = () => {
    if (notification.read) return;

    // Optimistically update notifications list
    queryClient.setQueryData(
      notificationQueries.notifications().queryKey,
      (old: Notification[] | undefined) =>
        old?.map((n) => (n.id === notification.id ? { ...n, read: true } : n)),
    );

    // Optimistically decrement count
    queryClient.setQueryData(
      notificationQueries.count().queryKey,
      (old: { count: number } | undefined) =>
        old ? { count: Math.max(0, old.count - 1) } : { count: 0 },
    );

    // Fire and forget
    notificationMutations.markRead(notification.id);
  };

  return (
    <div
      onClick={markAsRead}
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
