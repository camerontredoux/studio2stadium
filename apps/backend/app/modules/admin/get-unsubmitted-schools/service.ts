import { DatabaseService } from "#database/service";
import {
  schoolApplications,
  schoolInvites,
  schoolProfiles,
} from "#database/schema/schools";
import { users } from "#database/schema/users";
import { inject } from "@adonisjs/core";
import {
  and,
  desc,
  eq,
  isNotNull,
  isNull,
  not,
  exists,
  sql,
} from "drizzle-orm";

/**
 * Schools that signed up but have not submitted the application form
 * (phone + ID image), so they have no `school_applications` row to approve.
 * Org-invited schools are created verified and skip the application by
 * design; the consumed-invite check keeps them out even if that changes.
 */
@inject()
export class Service {
  constructor(private db: DatabaseService) {}

  async execute() {
    return this.db.use((db) =>
      db
        .select({
          id: schoolProfiles.id,
          name: schoolProfiles.name,
          location: schoolProfiles.location,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          signedUpAt: users.createdAt,
        })
        .from(schoolProfiles)
        .innerJoin(users, eq(users.id, schoolProfiles.userId))
        .leftJoin(
          schoolApplications,
          eq(schoolApplications.schoolId, schoolProfiles.id)
        )
        .where(
          and(
            eq(users.verified, false),
            isNull(schoolApplications.id),
            not(
              exists(
                db
                  .select({ one: sql`1` })
                  .from(schoolInvites)
                  .where(
                    and(
                      sql`lower(${schoolInvites.email}) = lower(${users.email})`,
                      isNotNull(schoolInvites.consumedAt)
                    )
                  )
              )
            )
          )
        )
        .orderBy(desc(users.createdAt))
    );
  }
}
