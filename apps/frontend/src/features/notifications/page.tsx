import { Button } from "@/components/ui/button";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMarkAllNotificationsRead } from "./api/mutations";
import { notificationQueries } from "./api/queries";
import { NotificationList } from "./components/notification-list";

export function Page() {
  const { data: countData } = useSuspenseQuery(notificationQueries.count());
  const markAllRead = useMarkAllNotificationsRead();

  const hasUnread = countData.count > 0;

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
          <Button
            variant="ghost"
            size="sm"
            onClick={() => markAllRead.mutate()}
          >
            Mark all as read
          </Button>
        )}
      </div>

      <NotificationList />
    </div>
  );
}
