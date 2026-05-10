import type { db } from "#database/connection";
import { dancerProfiles } from "#database/schema/dancers";
import { schoolProfiles, schoolInvites } from "#database/schema/schools";
import { dancerInvites } from "#database/schema/organizations";
import { users } from "#database/schema/users";
import { and, eq, inArray, isNull, sql } from "drizzle-orm";

type AnyDb = typeof db | Parameters<Parameters<typeof db.transaction>[0]>[0];

export interface RoleConflict {
  email: string;
  conflictingType: "school" | "dancer";
}

/**
 * Checks whether any emails already have an account whose type conflicts with
 * the intended upload role, OR have a pending invite on the opposite side.
 *
 * - dancer upload: rejects school accounts + emails with unconsumed schoolInvites
 * - coach upload:  rejects dancer accounts + emails with unconsumed dancerInvites
 */
export async function enforceEmailRole(
  conn: AnyDb,
  emails: string[],
  expectedRole: "dancer" | "coach"
): Promise<RoleConflict[]> {
  if (emails.length === 0) return [];

  if (expectedRole === "dancer") {
    const [accountRows, pendingRows] = await Promise.all([
      conn
        .select({ email: users.email })
        .from(users)
        .innerJoin(schoolProfiles, eq(schoolProfiles.userId, users.id))
        .leftJoin(dancerProfiles, eq(dancerProfiles.userId, users.id))
        .where(and(inArray(users.email, emails), isNull(dancerProfiles.id))),
      conn
        .select({ email: schoolInvites.email })
        .from(schoolInvites)
        .where(
          and(
            inArray(schoolInvites.email, emails),
            isNull(schoolInvites.consumedAt),
            sql`${schoolInvites.expiresAt} > now()`
          )
        ),
    ]);
    const seen = new Set<string>();
    const conflicts: RoleConflict[] = [];
    for (const r of accountRows) {
      seen.add(r.email.toLowerCase());
      conflicts.push({ email: r.email, conflictingType: "school" });
    }
    for (const r of pendingRows) {
      if (!seen.has(r.email.toLowerCase())) {
        seen.add(r.email.toLowerCase());
        conflicts.push({ email: r.email, conflictingType: "school" });
      }
    }
    return conflicts;
  }

  const [accountRows, pendingRows] = await Promise.all([
    conn
      .select({ email: users.email })
      .from(users)
      .innerJoin(dancerProfiles, eq(dancerProfiles.userId, users.id))
      .leftJoin(schoolProfiles, eq(schoolProfiles.userId, users.id))
      .where(and(inArray(users.email, emails), isNull(schoolProfiles.id))),
    conn
      .select({ email: dancerInvites.email })
      .from(dancerInvites)
      .where(
        and(
          inArray(dancerInvites.email, emails),
          isNull(dancerInvites.consumedAt),
          sql`${dancerInvites.expiresAt} > now()`
        )
      ),
  ]);
  const seen = new Set<string>();
  const conflicts: RoleConflict[] = [];
  for (const r of accountRows) {
    seen.add(r.email.toLowerCase());
    conflicts.push({ email: r.email, conflictingType: "dancer" });
  }
  for (const r of pendingRows) {
    if (!seen.has(r.email.toLowerCase())) {
      seen.add(r.email.toLowerCase());
      conflicts.push({ email: r.email, conflictingType: "dancer" });
    }
  }
  return conflicts;
}
