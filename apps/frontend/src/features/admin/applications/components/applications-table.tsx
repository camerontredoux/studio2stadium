import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Frame } from "@/components/ui/frame";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/components/utils/format";
import type { ApiSchemas } from "@/lib/api/client";
import { dateToRelativeTime } from "@/utils/date";
import { StatusBadge } from "./status-badge";

type Application = ApiSchemas["AdminApplicationsResponse"][number];

interface ApplicationsTableProps {
  applications: Application[];
  onApprove: (app: Application) => void;
  onReject: (app: Application) => void;
}

export function ApplicationsTable({
  applications,
  onApprove,
  onReject,
}: ApplicationsTableProps) {
  if (applications.length === 0) {
    return <p className="text-muted-foreground">No applications</p>;
  }

  return (
    <Frame>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>School</TableHead>
            <TableHead className="hidden sm:table-cell">Email</TableHead>
            <TableHead className="hidden lg:table-cell">Location</TableHead>
            <TableHead className="hidden md:table-cell">Submitted</TableHead>
            <TableHead className="hidden sm:table-cell">Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {applications.map((app) => (
            <TableRow key={app.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="size-10">
                    <AvatarImage src={app.thumbnail ?? undefined} />
                    <AvatarFallback>
                      {app.school.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{app.school.name}</div>
                    <div className="text-muted-foreground text-sm">
                      {app.school.user.firstName} {app.school.user.lastName}
                    </div>
                    <StatusBadge
                      status={app.status}
                      className="mt-1 sm:hidden"
                    />
                  </div>
                </div>
              </TableCell>
              <TableCell className="hidden sm:table-cell">
                {app.school.user.email}
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                {app.school.location}
              </TableCell>
              <TableCell className="hidden md:table-cell">
                <span
                  title={formatDate(app.createdAt)}
                  className="text-muted-foreground"
                >
                  {dateToRelativeTime(app.createdAt, { strict: true })}
                </span>
              </TableCell>
              <TableCell className="hidden sm:table-cell">
                <StatusBadge status={app.status} />
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  {app.status !== "accepted" && (
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() => onApprove(app)}
                    >
                      Approve
                    </Button>
                  )}
                  {app.status !== "rejected" && (
                    <Button
                      size="xs"
                      variant="destructive-outline"
                      onClick={() => onReject(app)}
                    >
                      Reject
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Frame>
  );
}
