import { Skeleton } from "@/components/ui/skeleton";
import { useSuspenseQuery } from "@tanstack/react-query";
import { notificationQueries } from "../api/queries";
import { NotificationItem } from "./notification-item";

export function NotificationList() {
  const { data: notifications } = useSuspenseQuery(
    notificationQueries.notifications(),
  );

  if (notifications.length === 0) {
    return (
      <div className="text-muted-foreground flex flex-col items-center justify-center py-12 text-center">
        <p className="text-lg font-medium">No notifications yet</p>
        <p className="text-sm">When something happens, you'll see it here</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col divide-y">
      {notifications.map((notification) => (
        <NotificationItem key={notification.id} notification={notification} />
      ))}
    </div>
  );
}

export function NotificationListSkeleton() {
  return (
    <div className="flex flex-col divide-y">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-start gap-3 px-2 py-3">
          <Skeleton className="size-10 shrink-0 rounded-full" />
          <div className="flex flex-1 flex-col gap-1.5">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}
