import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import { eventRosters } from "#database/schema/org-events";
import { and, asc, eq, ilike, isNotNull, isNull, or, sql } from "drizzle-orm";
import type { Validator } from "./validator.ts";

function csvEscape(value: string | number | null): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

@inject()
export class ExportRosterService {
  constructor(private db: DatabaseService = new DatabaseService()) {}

  async execute(eventId: string, q: Validator): Promise<string> {
    const isDancer = q.type === "dancer";
    const filters = [
      eq(eventRosters.eventId, eventId),
      eq(eventRosters.type, q.type),
      eq(eventRosters.isStaff, false),
    ];

    if (q.search) {
      const pattern = `%${q.search}%`;
      const searchClauses = [
        ilike(eventRosters.firstName, pattern),
        ilike(eventRosters.lastName, pattern),
        ilike(eventRosters.email, pattern),
      ];
      const asNumber = Number(q.search);
      if (Number.isInteger(asNumber) && asNumber > 0) {
        searchClauses.push(eq(eventRosters.bibNumber, asNumber));
      }
      filters.push(or(...searchClauses)!);
    }

    if (q.status === "active") filters.push(isNotNull(eventRosters.userId));
    else if (q.status === "pending") filters.push(isNull(eventRosters.userId));
    if (q.org && !isDancer) filters.push(eq(eventRosters.organization, q.org));

    const rows = await this.db.use((db) =>
      db
        .select({
          firstName: eventRosters.firstName,
          lastName: eventRosters.lastName,
          email: eventRosters.email,
          bibNumber: eventRosters.bibNumber,
          organization: eventRosters.organization,
          isRegistered: sql<boolean>`(${eventRosters.userId} IS NOT NULL)`,
        })
        .from(eventRosters)
        .where(and(...filters))
        .orderBy(asc(eventRosters.lastName), asc(eventRosters.firstName))
    );

    const header = isDancer
      ? ["First Name", "Last Name", "Email", "Bib #", "Status"]
      : ["First Name", "Last Name", "Email", "Bib #", "Organization", "Status"];
    const lines = [header.map(csvEscape).join(",")];
    for (const r of rows) {
      const cells = isDancer
        ? [
            csvEscape(r.firstName),
            csvEscape(r.lastName),
            csvEscape(r.email),
            csvEscape(r.bibNumber),
            csvEscape(r.isRegistered ? "Active" : "Pending"),
          ]
        : [
            csvEscape(r.firstName),
            csvEscape(r.lastName),
            csvEscape(r.email),
            csvEscape(r.bibNumber),
            csvEscape(r.organization),
            csvEscape(r.isRegistered ? "Active" : "Pending"),
          ];
      lines.push(cells.join(","));
    }
    return lines.join("\r\n") + "\r\n";
  }
}
