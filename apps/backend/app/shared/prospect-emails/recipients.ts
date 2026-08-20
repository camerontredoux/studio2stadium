import { db } from "#database/connection";
import { crvSubmissions } from "#database/schema/crv";
import { schoolProfiles } from "#database/schema/schools";
import { users } from "#database/schema/users";
import { and, eq, inArray } from "drizzle-orm";

export interface ProspectEmailRecipient {
  schoolId: string;
  schoolName: string;
  userId: string;
  email: string;
}

/**
 * Schools with at least one unresolved CRV submission, whose owning user still
 * accepts notifications.
 *
 * Shared by both the monthly reminder and the twice-yearly digest so the two
 * emails can never disagree about who is an active recruiter. The old stack
 * kept status on a separate `prospectStatus` table; it now lives on the
 * submission row, and old `NONE` is new `pending`.
 */
export async function findProspectEmailRecipients(): Promise<
  ProspectEmailRecipient[]
> {
  return await db
    .selectDistinct({
      schoolId: schoolProfiles.id,
      schoolName: schoolProfiles.name,
      userId: users.id,
      email: users.email,
    })
    .from(crvSubmissions)
    .innerJoin(schoolProfiles, eq(crvSubmissions.schoolId, schoolProfiles.id))
    .innerJoin(users, eq(schoolProfiles.userId, users.id))
    .where(
      and(
        inArray(crvSubmissions.status, ["pending", "in_review"]),
        eq(users.notifications, true)
      )
    );
}
