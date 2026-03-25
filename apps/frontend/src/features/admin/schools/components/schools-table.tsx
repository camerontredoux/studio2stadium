import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Frame } from "@/components/ui/frame";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ApiSchemas } from "@/lib/api/client";
import { Link } from "@tanstack/react-router";
import { SearchIcon } from "lucide-react";
import * as React from "react";

type School = ApiSchemas["AdminSchoolsResponse"][number];

interface SchoolsTableProps {
  schools: School[];
  onAddEvent: (school: { username: string; name: string }) => void;
  onViewEvents: (school: { username: string; name: string }) => void;
  onEdit: (school: { username: string; name: string }) => void;
}

export function SchoolsTable({
  schools,
  onAddEvent,
  onViewEvents,
  onEdit,
}: SchoolsTableProps) {
  const [search, setSearch] = React.useState("");

  const filteredSchools = schools.filter((school) =>
    school.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-4">
      <InputGroup className="sm:max-w-sm">
        <InputGroupAddon>
          <SearchIcon />
        </InputGroupAddon>
        <InputGroupInput
          placeholder="Search schools..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </InputGroup>

      <Frame>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-full">School</TableHead>
              <TableHead className="whitespace-nowrap">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSchools.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={2}
                  className="text-muted-foreground text-center"
                >
                  No schools found
                </TableCell>
              </TableRow>
            ) : (
              filteredSchools.map((school) => (
                <TableRow key={school.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="size-10 shrink-0">
                        <AvatarImage src={school.user.avatar ?? undefined} />
                        <AvatarFallback>
                          {school.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <Link
                        to="/explore/$username"
                        params={{ username: school.user.username }}
                        className="truncate font-medium hover:underline max-sm:max-w-40"
                      >
                        {school.name}
                      </Link>
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <div className="flex gap-2">
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() =>
                          onEdit({
                            username: school.user.username,
                            name: school.name,
                          })
                        }
                      >
                        Edit
                      </Button>
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() =>
                          onViewEvents({
                            username: school.user.username,
                            name: school.name,
                          })
                        }
                      >
                        View Events
                      </Button>
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() =>
                          onAddEvent({
                            username: school.user.username,
                            name: school.name,
                          })
                        }
                      >
                        Add Event
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Frame>
    </div>
  );
}
