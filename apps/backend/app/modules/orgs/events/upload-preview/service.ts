import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import { dancerProfiles } from "#database/schema/dancers";
import { schoolProfiles } from "#database/schema/schools";
import { users } from "#database/schema/users";
import { eventRosters } from "#database/schema/org-events";
import { organizations } from "#database/schema/organizations";
import {
  normalizeRowEmails,
  parseCoachCsv,
  parseDancerCsv,
  type CoachRow,
  type DancerRow,
} from "#shared/org/csv-parser";
import { enforceEmailRole } from "#shared/org/role-guard";
import { mintPreviewToken } from "#shared/org/preview-token";
import { and, eq, inArray } from "drizzle-orm";

export type UploadKind = "dancer" | "coach";

export interface UploadPreviewResult {
  kind: UploadKind;
  /** Rows that passed the CSV parser (invalid lines are excluded). */
  totalRows: number;
  /** Rows that will be processed on upload (excludes parser failures and dancer school-account rejections). */
  acceptedRows: number;
  willMatch: number; // net-new rows whose email matches an existing S2S account (activate on upload)
  willInvite: number; // net-new rows that will trigger an invite email
  willUpdate: number; // rows that already exist on this event roster (will be refreshed)
  willError: number; // parser errors + dancer rows rejected as school accounts
  errors: Array<{ row: number; reason: string }>;
  /** CSV row indices that will update an existing roster entry. */
  updateRows: number[];
  /** Short-lived signed token — must be passed to the commit endpoint. */
  previewToken: string;
}

@inject()
export class UploadPreviewService {
  constructor(private db: DatabaseService = new DatabaseService()) {}

  async execute({
    orgId,
    eventId,
    kind,
    csv,
  }: {
    orgId: string;
    eventId: string;
    kind: UploadKind;
    csv: string;
  }): Promise<UploadPreviewResult> {
    // Free-tier Users: dancer CSVs for these orgs must carry a `paid` column.
    const [org] = await this.db.use((db) =>
      db.select().from(organizations).where(eq(organizations.id, orgId))
    );
    const orgFeatures =
      (org?.features as Record<string, boolean> | undefined) ?? {};
    const freeTier = Boolean(orgFeatures.freeTierUsers);

    const parsed =
      kind === "dancer"
        ? parseDancerCsv(csv, { requirePaid: freeTier })
        : parseCoachCsv(csv);
    const rows = (await normalizeRowEmails(
      parsed.rows as Array<CoachRow | DancerRow>,
    )) as CoachRow[] | DancerRow[];
    const errors = parsed.errors;

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
        updateRows: [],
        previewToken: mintPreviewToken(eventId, kind),
      };
    }

    let rowsForCounts: CoachRow[] | DancerRow[] = rows;
    let accountErrors: Array<{ row: number; reason: string }> = [];
    let bibErrors: Array<{ row: number; reason: string }> = [];

    // Bib collision detection for dancer uploads (mirrors upload-dancers service)
    if (kind === "dancer") {
      const dancerRows = rows as DancerRow[];

      // In-file bib duplicates
      const bibsInFile = new Map<number, number>();
      for (const r of dancerRows) {
        if (r.bibNumber != null) {
          const firstRow = bibsInFile.get(r.bibNumber);
          if (firstRow !== undefined) {
            bibErrors.push({
              row: r.csvRow,
              reason: `duplicate bib number ${r.bibNumber} (first seen on row ${firstRow})`,
            });
          } else {
            bibsInFile.set(r.bibNumber, r.csvRow);
          }
        }
      }

      // Existing bib collisions on this event's roster
      const existingBibRows = await this.db.use((db) =>
        db
          .select({
            email: eventRosters.email,
            bibNumber: eventRosters.bibNumber,
          })
          .from(eventRosters)
          .where(eq(eventRosters.eventId, eventId))
      );
      const bibOwners = new Map<number, string>();
      for (const r of existingBibRows) {
        if (r.bibNumber != null) bibOwners.set(r.bibNumber, r.email.toLowerCase());
      }
      for (const r of dancerRows) {
        if (r.bibNumber != null) {
          const owner = bibOwners.get(r.bibNumber);
          if (owner && owner !== r.email.toLowerCase()) {
            bibErrors.push({
              row: r.csvRow,
              reason: `bib number ${r.bibNumber} already taken by ${owner} on this event`,
            });
          }
        }
      }
    }

    {
      const emails = rows.map((r) => r.email);
      const conflicts = await this.db.use((db) =>
        enforceEmailRole(db, emails, kind === "coach" ? "coach" : "dancer")
      );
      const conflictSet = new Map(
        conflicts.map((c) => [c.email.toLowerCase(), c.conflictingType])
      );
      if (conflictSet.size > 0) {
        accountErrors = rows
          .filter((r) => conflictSet.has(r.email.toLowerCase()))
          .map((r) => {
            const ct = conflictSet.get(r.email.toLowerCase());
            const reason =
              ct === "school"
                ? "email belongs to a school account — use the coach roster for staff"
                : "email belongs to a dancer account — use the dancer roster";
            return { row: r.csvRow, reason };
          });
        rowsForCounts = rows.filter(
          (r) => !conflictSet.has(r.email.toLowerCase())
        ) as CoachRow[] | DancerRow[];
      }
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

    const matchedSet = new Set(matchedUsers.map((u) => u.email.toLowerCase()));

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
                  inArray(eventRosters.email, emails)
                )
              )
          );
    const existingSet = new Set(existingRows.map((r) => r.email.toLowerCase()));

    let willMatch = 0;
    let willInvite = 0;
    let willUpdate = 0;
    const updateRows: number[] = [];

    for (const r of rowsForCounts) {
      const email = r.email.toLowerCase();
      const isExistingRosterRow = existingSet.has(email);
      const isMatchedUser = matchedSet.has(email);

      if (isExistingRosterRow) {
        willUpdate += 1;
        updateRows.push(r.csvRow);
        continue;
      }

      if (isMatchedUser) {
        willMatch += 1;
      } else {
        willInvite += 1;
      }
    }

    const allErrors = [...parserErrors, ...bibErrors, ...accountErrors];

    return {
      kind,
      totalRows: rows.length,
      acceptedRows: rowsForCounts.length,
      willMatch,
      willInvite,
      willUpdate,
      willError: allErrors.length,
      errors: allErrors,
      updateRows,
      previewToken: mintPreviewToken(eventId, kind),
    };
  }
}
