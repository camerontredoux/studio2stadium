import { dancerProfiles } from "#database/schema/dancers";
import { schoolApplications, schoolProfiles } from "#database/schema/schools";
import { users } from "#database/schema/users";
import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import {
  and,
  count,
  countDistinct,
  eq,
  isNull,
  notInArray,
  or,
  sql,
} from "drizzle-orm";

// Internal and test school accounts. Mirrors the exclusion list in the
// marketing site's scripts/fetch-schools.mjs so both surfaces agree.
const EXCLUDED_SCHOOLS = [
  "cameron admin",
  "studio 2 stadium",
  "summittesting",
  "test for onboard",
  "thedemispace",
  "universityofnorthdakota",
  "velocity",
];

@inject()
export class Service {
  constructor(private db: DatabaseService) {}

  async execute() {
    const schoolName = sql`lower(trim(${schoolProfiles.name}))`;

    const [[dancers], [schools]] = await Promise.all([
      this.db.use((db) =>
        db
          .select({ count: count() })
          .from(dancerProfiles)
          .innerJoin(users, eq(users.id, dancerProfiles.userId))
          .where(and(eq(users.type, "dancer"), eq(users.role, "user")))
      ),
      this.db.use((db) =>
        db
          .select({ count: countDistinct(schoolName) })
          .from(schoolProfiles)
          .innerJoin(users, eq(users.id, schoolProfiles.userId))
          .leftJoin(
            schoolApplications,
            eq(schoolApplications.schoolId, schoolProfiles.id)
          )
          .where(
            and(
              eq(users.type, "school"),
              eq(users.role, "user"),
              eq(users.verified, true),
              or(
                isNull(schoolApplications.status),
                eq(schoolApplications.status, "accepted")
              ),
              notInArray(schoolName, EXCLUDED_SCHOOLS)
            )
          )
      ),
    ]);

    return { dancers: dancers.count, schools: schools.count };
  }
}
