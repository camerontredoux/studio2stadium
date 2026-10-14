import type { OrgMemberType } from "#database/schema/enums";
import { resolveEffectiveMembership } from "#shared/org/membership";
import { DatabaseService } from "#database/service";
import { organizations, orgMemberships } from "#database/schema/organizations";
import { eventRosters, orgEvents } from "#database/schema/org-events";
import { users } from "#database/schema/users";
import { inject } from "@adonisjs/core";
import { and, desc, eq, sql } from "drizzle-orm";

export interface MyOrgEntry {
  id: string;
  slug: string;
  name: string;
  logoUrl: string | null;
  primaryColor: string | null;
  role: "admin" | "member" | null;
  /**
   * The user's standing in this org. An Organizer runs it; the roster type is
   * only a fallback for someone rostered without a membership row.
   */
  type: OrgMemberType;
}

@inject()
export class GetMyOrgsService {
  constructor(private db: DatabaseService) {}

  async execute(userId: string): Promise<MyOrgEntry[]> {
    return this.db.use(async (db) => {
      const [account] = await db
        .select({
          role: users.role,
          tier: users.orgAccountTier,
          expiresAt: users.orgAccountTierExpiresAt,
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      // Once the advisory window closes the dancer is a plain free user, so the
      // org stops appearing for her. A dancer who never had a tier at all (an
      // unpaid free-tier attendee) has no account window, so only the org's own
      // window below can hide it from her.
      const dancerAccessExpired = Boolean(
        account?.tier && account.expiresAt && account.expiresAt < new Date()
      );

      const [rosterRows, membershipRows] = await Promise.all([
        db
          .selectDistinctOn([organizations.id], {
            id: organizations.id,
            slug: organizations.slug,
            name: organizations.name,
            logoUrl: organizations.logoUrl,
            primaryColor: organizations.primaryColor,
            rosterType: eventRosters.type,
            membershipRole: orgMemberships.role,
            membershipType: orgMemberships.type,
            orgFeatures: organizations.features,
            orgSettings: organizations.settings,
            // The end of her latest Org Event as a dancer in this org. Her
            // access there runs from it, so a newer upload refreshes it.
            latestDancerEnd: sql<
              string | null
            >`max(case when ${eventRosters.type} = 'dancer' then ${orgEvents.endDate} end) over (partition by ${organizations.id})`,
          })
          .from(eventRosters)
          .innerJoin(orgEvents, eq(orgEvents.id, eventRosters.eventId))
          .innerJoin(organizations, eq(organizations.id, orgEvents.orgId))
          .leftJoin(
            orgMemberships,
            and(
              eq(orgMemberships.orgId, organizations.id),
              eq(orgMemberships.userId, userId)
            )
          )
          .where(eq(eventRosters.userId, userId))
          .orderBy(organizations.id, desc(eventRosters.createdAt)),

        db
          .select({
            id: organizations.id,
            slug: organizations.slug,
            name: organizations.name,
            logoUrl: organizations.logoUrl,
            primaryColor: organizations.primaryColor,
            role: orgMemberships.role,
            type: orgMemberships.type,
          })
          .from(orgMemberships)
          .innerJoin(organizations, eq(organizations.id, orgMemberships.orgId))
          .where(eq(orgMemberships.userId, userId)),
      ]);

      const orgsById = new Map<string, MyOrgEntry>();
      const now = new Date();
      // Each org sets its own window (1 month, 3 months, ...). The account
      // window above can be held open by a different org, so check this one's
      // too: once her latest event here is that far behind her, the org hides
      // until she is uploaded to a newer one.
      const orgWindowClosed = new Set<string>();
      for (const r of rosterRows) {
        if (!r.latestDancerEnd) continue;
        const features =
          (r.orgFeatures as Record<string, unknown> | null) ?? {};
        const settings =
          (r.orgSettings as Record<string, unknown> | null) ?? {};
        const tierExpiryMonths =
          Number(settings.tierExpiryMonths ?? features.tierExpiryMonths) || 3;
        const expiresAt = new Date(r.latestDancerEnd);
        expiresAt.setMonth(expiresAt.getMonth() + tierExpiryMonths);
        if (expiresAt < now) orgWindowClosed.add(r.id);
      }

      // A person can hold more than one membership in an org (ADR 0003), so
      // collapse them to the highest-privilege one rather than letting the last
      // row read win.
      const membershipsByOrg = new Map<string, typeof membershipRows>();
      for (const r of membershipRows) {
        const bucket = membershipsByOrg.get(r.id);
        if (bucket) bucket.push(r);
        else membershipsByOrg.set(r.id, [r]);
      }

      for (const [orgId, rows] of membershipsByOrg) {
        const effective = resolveEffectiveMembership(rows)!;
        orgsById.set(orgId, {
          id: effective.id,
          slug: effective.slug,
          name: effective.name,
          logoUrl: effective.logoUrl,
          primaryColor: effective.primaryColor,
          role: effective.role,
          type: effective.type,
        });
      }

      for (const r of rosterRows) {
        const existing = orgsById.get(r.id);
        orgsById.set(r.id, {
          id: r.id,
          slug: r.slug,
          name: r.name,
          logoUrl: r.logoUrl,
          primaryColor: r.primaryColor,
          role:
            existing?.role ??
            (r.membershipRole as "admin" | "member" | null) ??
            null,
          type: existing?.type ?? r.membershipType ?? r.rosterType,
        });
      }

      // Coach and admin entries are staff access, unrelated to the dancer tier,
      // so an expired window never hides them. Platform admins and the org's
      // own admins keep it too, even when their only entry there is a dancer one.
      const platformAdmin =
        account?.role === "admin" || account?.role === "prodigy_admin";
      return [...orgsById.values()].filter(
        (org) =>
          platformAdmin ||
          org.role === "admin" ||
          !(
            org.type === "dancer" &&
            (dancerAccessExpired || orgWindowClosed.has(org.id))
          )
      );
    });
  }
}
