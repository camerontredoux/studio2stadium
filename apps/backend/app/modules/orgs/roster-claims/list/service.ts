import { DatabaseService } from "#database/service";
import { rosterClaimRequests } from "#database/schema/org-events";
import { users } from "#database/schema/users";
import { imageUrl } from "#utils/image-url";
import { inject } from "@adonisjs/core";
import { and, desc, eq } from "drizzle-orm";

@inject()
export class ListRosterClaimsService {
  constructor(private db: DatabaseService = new DatabaseService()) {}

  async execute(orgId: string, status: "pending" | "approved" | "rejected") {
    return this.db.use(async (db) => {
      const rows = await db
        .select({
          id: rosterClaimRequests.id,
          claimedFirstName: rosterClaimRequests.claimedFirstName,
          claimedLastName: rosterClaimRequests.claimedLastName,
          claimedEmail: rosterClaimRequests.claimedEmail,
          note: rosterClaimRequests.note,
          status: rosterClaimRequests.status,
          resolvedRosterId: rosterClaimRequests.resolvedRosterId,
          resolvedAt: rosterClaimRequests.resolvedAt,
          createdAt: rosterClaimRequests.createdAt,
          requesterId: users.id,
          requesterEmail: users.email,
          requesterFirstName: users.firstName,
          requesterLastName: users.lastName,
          requesterAvatar: users.avatar,
        })
        .from(rosterClaimRequests)
        .innerJoin(users, eq(users.id, rosterClaimRequests.requesterId))
        .where(
          and(
            eq(rosterClaimRequests.orgId, orgId),
            eq(rosterClaimRequests.status, status)
          )
        )
        .orderBy(desc(rosterClaimRequests.createdAt));

      return {
        data: rows.map((r) => ({
          id: r.id,
          // What they say they were registered as — the admin matches this
          // against the roster.
          claimed: {
            firstName: r.claimedFirstName,
            lastName: r.claimedLastName,
            email: r.claimedEmail,
          },
          note: r.note,
          status: r.status,
          resolvedRosterId: r.resolvedRosterId,
          resolvedAt: r.resolvedAt?.toISOString() ?? null,
          createdAt: r.createdAt.toISOString(),
          // The account that would receive the entry.
          requester: {
            id: r.requesterId,
            email: r.requesterEmail,
            firstName: r.requesterFirstName,
            lastName: r.requesterLastName,
            avatarUrl: imageUrl(r.requesterAvatar, "avatar"),
          },
        })),
      };
    });
  }
}
