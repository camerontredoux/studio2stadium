import transmit from "@adonisjs/transmit/services/main";
import { db } from "#database/connection";
import { organizations, orgMemberships } from "#database/schema/organizations";
import { and, eq } from "drizzle-orm";

transmit.authorize<{ slug: string }>(
  "orgs/:slug/callbacks",
  async (ctx, { slug }) => {
    await ctx.auth.check();
    const user = ctx.auth.user;
    if (!user) return false;

    const [org] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.slug, slug))
      .limit(1);
    if (!org) return false;

    const [membership] = await db
      .select()
      .from(orgMemberships)
      .where(
        and(
          eq(orgMemberships.userId, user.id),
          eq(orgMemberships.orgId, org.id)
        )
      )
      .limit(1);

    return membership?.role === "admin";
  }
);
