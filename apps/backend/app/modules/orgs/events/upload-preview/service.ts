import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import { dancerProfiles } from "#database/schema/dancers";
import { schoolProfiles } from "#database/schema/schools";
import { users } from "#database/schema/users";
import { eventRosters } from "#database/schema/org-events";
import { parseCoachCsv, parseDancerCsv } from "#shared/org/csv-parser";
import { and, eq, inArray, isNull } from "drizzle-orm";

export type UploadKind = "dancer" | "coach";

export interface UploadPreviewResult {
  kind: UploadKind;
  /** Rows that passed the CSV parser (invalid lines are excluded). */
  totalRows: number;
  /** Rows that will be processed on upload (excludes parser failures and dancer school-account rejections). */
  acceptedRows: number;
  willMatch: number;       // rows whose email belongs to an existing S2S account
  willInvite: number;      // rows that will trigger an invite email
  willUpdate: number;      // rows that already exist on this event roster
  willError: number;       // parser errors + dancer rows rejected as school accounts
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

    const parserErrors = errors as Array<{ row: number; reason: string }>;

    if (rows.length === 0) {
      return {
        kind,
        totalRows: 0,
        acceptedRows: 0,
        willMatch: 0,
        willInvite: 0,
        willUpdate: 0,
        willError: parserErrors.length,
        errors: parserErrors,
      };
    }

    let rowsForCounts = rows;
    let accountErrors: Array<{ row: number; reason: string }> = [];

    if (kind === "dancer") {
      const emails = rows.map((r) => r.email);
      const schoolOnlyRows = await this.db.use((db) =>
        db
          .select({ email: users.email })
          .from(users)
          .innerJoin(schoolProfiles, eq(schoolProfiles.userId, users.id))
          .leftJoin(dancerProfiles, eq(dancerProfiles.userId, users.id))
          .where(and(inArray(users.email, emails), isNull(dancerProfiles.id))),
      );
      const schoolOnly = new Set(
        schoolOnlyRows.map((u) => u.email.toLowerCase()),
      );
      accountErrors = rows
        .filter((r) => schoolOnly.has(r.email.toLowerCase()))
        .map((r) => ({
          row: r.csvRow,
          reason:
            "email belongs to a school account, not a dancer — use the coach roster for staff",
        }));
      rowsForCounts = rows.filter(
        (r) => !schoolOnly.has(r.email.toLowerCase()),
      );
    }

    const emails = rowsForCounts.map((r) => r.email);

    // Dancers: match users with a dancer profile. Coaches: require a school profile.
    const matchedUsers = await this.db.use(async (db) => {
      if (kind === "dancer") {
        if (emails.length === 0) return [];
        return db
          .select({ email: users.email })
          .from(users)
          .innerJoin(dancerProfiles, eq(dancerProfiles.userId, users.id))
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
    const existingRows =
      emails.length === 0
        ? []
        : await this.db.use((db) =>
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

    for (const r of rowsForCounts) {
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

    const allErrors = [...parserErrors, ...accountErrors];

    return {
      kind,
      totalRows: rows.length,
      acceptedRows: rowsForCounts.length,
      willMatch,
      willInvite,
      willUpdate,
      willError: allErrors.length,
      errors: allErrors,
    };
  }
}
