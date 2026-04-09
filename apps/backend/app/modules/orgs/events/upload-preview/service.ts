import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import { users } from "#database/schema/users";
import { schoolProfiles } from "#database/schema/schools";
import { eventRosters } from "#database/schema/org-events";
import { parseCoachCsv, parseDancerCsv } from "#shared/org/csv-parser";
import { and, eq, inArray } from "drizzle-orm";

export type UploadKind = "dancer" | "coach";

export interface UploadPreviewResult {
  kind: UploadKind;
  totalRows: number;
  willMatch: number;       // rows whose email belongs to an existing S2S account
  willInvite: number;      // rows that will trigger an invite email
  willUpdate: number;      // rows that already exist on this event roster
  willError: number;       // parser errors (bad rows)
  errors: Array<{ row: number; reason: string }>;
}

@inject()
export class UploadPreviewService {
  constructor(private db: DatabaseService = new DatabaseService()) {}

  async execute({
    eventId,
    kind,
    csv,
  }: {
    orgId: string;
    eventId: string;
    kind: UploadKind;
    csv: string;
  }): Promise<UploadPreviewResult> {
    const { rows, errors } =
      kind === "dancer" ? parseDancerCsv(csv) : parseCoachCsv(csv);

    if (rows.length === 0) {
      return {
        kind,
        totalRows: 0,
        willMatch: 0,
        willInvite: 0,
        willUpdate: 0,
        willError: errors.length,
        errors: errors as Array<{ row: number; reason: string }>,
      };
    }

    const emails = rows.map((r) => r.email);

    // Matched users: dancers match on any user account; coaches require a schoolProfile.
    const matchedUsers = await this.db.use(async (db) => {
      if (kind === "dancer") {
        return db
          .select({ email: users.email })
          .from(users)
          .where(inArray(users.email, emails));
      }
      return db
        .select({ email: users.email })
        .from(users)
        .innerJoin(schoolProfiles, eq(schoolProfiles.userId, users.id))
        .where(inArray(users.email, emails));
    });

    const matchedSet = new Set(
      matchedUsers.map((u) => u.email.toLowerCase()),
    );

    // Rows already on this event's roster — these will be updates, not net-new invites.
    const existingRows = await this.db.use((db) =>
      db
        .select({ email: eventRosters.email })
        .from(eventRosters)
        .where(
          and(
            eq(eventRosters.eventId, eventId),
            inArray(eventRosters.email, emails),
          ),
        ),
    );
    const existingSet = new Set(
      existingRows.map((r) => r.email.toLowerCase()),
    );

    let willMatch = 0;
    let willInvite = 0;
    let willUpdate = 0;

    for (const r of rows) {
      const email = r.email.toLowerCase();
      const isExistingRosterRow = existingSet.has(email);
      const isMatchedUser = matchedSet.has(email);

      if (isExistingRosterRow) {
        willUpdate += 1;
        if (isMatchedUser) willMatch += 1;
        // Already on roster — no new invite sent on re-upload
        continue;
      }

      if (isMatchedUser) {
        willMatch += 1;
      } else {
        willInvite += 1;
      }
    }

    return {
      kind,
      totalRows: rows.length,
      willMatch,
      willInvite,
      willUpdate,
      willError: errors.length,
      errors: errors as Array<{ row: number; reason: string }>,
    };
  }
}
