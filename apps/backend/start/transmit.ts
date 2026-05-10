import transmit from "@adonisjs/transmit/services/main";
import router from "@adonisjs/core/services/router";
import { db } from "#database/connection";
import { organizations, orgMemberships } from "#database/schema/organizations";
import { and, eq } from "drizzle-orm";

// Register transmit routes inline to work around a @poppinss/utils
// version mismatch that breaks the built-in controllers.
router.get("__transmit/events", (ctx) => {
  const uid = ctx.request.input("uid");
  if (!uid) {
    return ctx.response.badRequest({ message: 'Missing "uid"' });
  }

  const stream = transmit.createStream({
    uid,
    context: ctx,
    request: ctx.request.request,
    response: ctx.response.response,
    injectResponseHeaders: ctx.response.getHeaders(),
  });

  return ctx.response.stream(stream);
});

router.post("__transmit/subscribe", async (ctx) => {
  const uid = ctx.request.input("uid");
  const channel = ctx.request.input("channel");

  const success = await transmit.subscribe({ uid, channel, context: ctx });
  if (!success) return ctx.response.badRequest();
  return ctx.response.noContent();
});

router.post("__transmit/unsubscribe", async (ctx) => {
  const uid = ctx.request.input("uid");
  const channel = ctx.request.input("channel");

  const success = await transmit.unsubscribe({ uid, channel, context: ctx });
  if (!success) return ctx.response.badRequest();
  return ctx.response.noContent();
});

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
