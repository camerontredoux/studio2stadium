import { Badge } from "@/components/ui/badge";
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
import { Link } from "@tanstack/react-router";
import { Pencil, SearchIcon, Trash2, Users } from "lucide-react";
import * as React from "react";

interface Org {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  primaryColor: string | null;
  accentColor: string | null;
  features: Record<string, unknown>;
  settings: Record<string, unknown>;
  createdAt: string;
  memberCount: number;
  eventCount: number;
  activeEvent: string | null;
}

interface OrgsTableProps {
  orgs: Org[];
  onEdit: (org: Org) => void;
  onDelete: (org: Org) => void;
  onManageMembers: (org: Org) => void;
}

export function OrgsTable({
  orgs,
  onEdit,
  onDelete,
  onManageMembers,
}: OrgsTableProps) {
  const [search, setSearch] = React.useState("");

  const filtered = orgs.filter(
    (org) =>
      org.name.toLowerCase().includes(search.toLowerCase()) ||
      org.slug.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-4">
      <InputGroup className="sm:max-w-sm">
        <InputGroupAddon>
          <SearchIcon />
        </InputGroupAddon>
        <InputGroupInput
          placeholder="Search organizations..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </InputGroup>

      <Frame>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Organization</TableHead>
              <TableHead className="hidden sm:table-cell">Slug</TableHead>
              <TableHead className="hidden md:table-cell">Colors</TableHead>
              <TableHead className="text-center">Members</TableHead>
              <TableHead className="text-center hidden sm:table-cell">Events</TableHead>
              <TableHead className="hidden lg:table-cell">Active Event</TableHead>
              <TableHead className="whitespace-nowrap">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-muted-foreground text-center"
                >
                  {search ? "No organizations match your search" : "No organizations yet"}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((org) => (
                <TableRow key={org.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {org.logoUrl ? (
                        <img
                          src={org.logoUrl}
                          alt=""
                          className="size-8 shrink-0 rounded-md object-cover"
                        />
                      ) : (
                        <div
                          className="flex size-8 shrink-0 items-center justify-center rounded-md text-xs font-semibold text-white"
                          style={{
                            backgroundColor: org.primaryColor || "var(--color-muted-foreground)",
                          }}
                        >
                          {org.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <Link
                        to="/o/$orgSlug/admin"
                        params={{ orgSlug: org.slug }}
                        className="truncate font-medium hover:underline"
                      >
                        {org.name}
                      </Link>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground hidden sm:table-cell font-mono text-xs">
                    {org.slug}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="flex gap-1.5">
                      {org.primaryColor && (
                        <div
                          className="size-5 rounded-full border"
                          style={{ backgroundColor: org.primaryColor }}
                          title={`Primary: ${org.primaryColor}`}
                        />
                      )}
                      {org.accentColor && (
                        <div
                          className="size-5 rounded-full border"
                          style={{ backgroundColor: org.accentColor }}
                          title={`Accent: ${org.accentColor}`}
                        />
                      )}
                      {!org.primaryColor && !org.accentColor && (
                        <span className="text-muted-foreground text-xs">-</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-center tabular-nums">{org.memberCount}</TableCell>
                  <TableCell className="text-center tabular-nums hidden sm:table-cell">
                    {org.eventCount}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {org.activeEvent ? (
                      <Badge variant="secondary" className="text-xs">
                        {org.activeEvent}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-xs">None</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        size="xs"
                        variant="ghost"
                        onClick={() => onManageMembers(org)}
                        title="Members"
                      >
                        <Users className="size-3.5" />
                      </Button>
                      <Button
                        size="xs"
                        variant="ghost"
                        onClick={() => onEdit(org)}
                        title="Edit"
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        size="xs"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => onDelete(org)}
                        title="Delete"
                      >
                        <Trash2 className="size-3.5" />
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
