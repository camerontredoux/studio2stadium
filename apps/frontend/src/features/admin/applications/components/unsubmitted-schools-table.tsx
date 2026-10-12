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

type UnsubmittedSchool = ApiSchemas["AdminUnsubmittedschoolsResponse"][number];

interface UnsubmittedSchoolsTableProps {
  schools: UnsubmittedSchool[];
}

export function UnsubmittedSchoolsTable({
  schools,
}: UnsubmittedSchoolsTableProps) {
  if (schools.length === 0) {
    return <p className="text-muted-foreground">No schools waiting</p>;
  }

  return (
    <Frame>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>School</TableHead>
            <TableHead className="hidden sm:table-cell">Email</TableHead>
            <TableHead className="hidden lg:table-cell">Location</TableHead>
            <TableHead>Signed up</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {schools.map((school) => (
            <TableRow key={school.id}>
              <TableCell>
                <div className="font-medium">{school.name}</div>
                <div className="text-muted-foreground text-sm">
                  {school.firstName} {school.lastName}
                </div>
                <div className="text-muted-foreground text-sm sm:hidden">
                  {school.email}
                </div>
              </TableCell>
              <TableCell className="hidden sm:table-cell">
                {school.email}
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                {school.location}
              </TableCell>
              <TableCell>
                <span
                  title={formatDate(school.signedUpAt)}
                  className="text-muted-foreground"
                >
                  {dateToRelativeTime(school.signedUpAt, { strict: true })}
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Frame>
  );
}
