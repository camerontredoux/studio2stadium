import { DatabaseService } from "#database/service";
import { dancerInvites, organizations } from "#database/schema/organizations";
import { inject } from "@adonisjs/core";
import { and, eq } from "drizzle-orm";

export type InviteLookupDancerResult =
  | { status: "invalid" }
  | { status: "consumed" }
  | { status: "expired" }
  | {
      status: "valid";
      email: string;
      orgName: string;
      orgSlug: string;
      brandColor: string | null;
      expiresAt: Date;
    };

@inject()
export class InviteLookupDancerService {
  constructor(private db: DatabaseService) {}

  async execute(
    orgSlug: string,
    token: string
  ): Promise<InviteLookupDancerResult> {
    return this.db.use(async (db) => {
      const [row] = await db
        .select({
          email: dancerInvites.email,
          expiresAt: dancerInvites.expiresAt,
          consumedAt: dancerInvites.consumedAt,
          orgName: organizations.name,
          orgSlug: organizations.slug,
          brandColor: organizations.primaryColor,
        })
        .from(dancerInvites)
        .innerJoin(organizations, eq(organizations.id, dancerInvites.orgId))
        .where(
          and(eq(dancerInvites.token, token), eq(organizations.slug, orgSlug))
        )
        .limit(1);

      if (!row) return { status: "invalid" as const };
      if (row.consumedAt) return { status: "consumed" as const };
      if (row.expiresAt <= new Date()) return { status: "expired" as const };
      return {
        status: "valid" as const,
        email: row.email,
        orgName: row.orgName,
        orgSlug: row.orgSlug,
        brandColor: row.brandColor,
        expiresAt: row.expiresAt,
      };
    });
  }
}
