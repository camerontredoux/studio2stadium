import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Frame,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/ui/frame";
import { Separator } from "@/components/ui/separator";
import { Link } from "@tanstack/react-router";
import { RecommendedSchool } from "./recommended-school";
import { UpcomingEvent } from "./upcoming-event";

export function SideInfo() {
  return (
    <aside className="hidden lg:block w-80 xl:w-96 shrink-0">
      <div className="sticky top-12 pl-0 p-2 xl:pl-2 xl:p-4 space-y-2 xl:space-y-4">
        <Frame className="border p-0 pt-1">
          <FrameHeader>
            <FrameTitle className="flex items-center gap-2">
              Upcoming Events{" "}
              <Button
                className="ml-auto"
                size="xs"
                render={<Link to="/events" />}
              >
                View All
              </Button>
            </FrameTitle>
          </FrameHeader>
          <FramePanel className="p-0! border-0 border-t overflow-clip">
            <Link
              to="/events/$eventId"
              params={{
                eventId: "121",
              }}
            >
              <UpcomingEvent />
            </Link>
            <Separator />
            <Link
              to="/events/$eventId"
              params={{
                eventId: "122",
              }}
            >
              <UpcomingEvent />
            </Link>
            <Separator />
            <Link
              to="/events/$eventId"
              params={{
                eventId: "123",
              }}
            >
              <UpcomingEvent />
            </Link>
          </FramePanel>
        </Frame>
        <Frame className="border p-0 pt-1">
          <FrameHeader>
            <FrameTitle className="flex items-center gap-2">
              Suggested Programs
            </FrameTitle>
          </FrameHeader>
          <FramePanel className="p-0! border-0 border-t">
            <RecommendedSchool />
            <Separator />
            <RecommendedSchool />
          </FramePanel>
        </Frame>
        <Card>
          <CardHeader className="border-b gap-0">
            <CardTitle className="text-base">Your Week</CardTitle>
            <CardDescription className="text-xs">
              Track your popularity this week.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-2">
              <div className="rounded-lg bg-accent p-4">
                <p className="text-2xl font-semibold">127</p>
                <p className="text-sm">Videos Watched</p>
              </div>
              <div className="rounded-lg bg-accent p-4">
                <p className="text-2xl font-semibold">20</p>
                <p className="text-sm">Profile Views</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </aside>
  );
}
