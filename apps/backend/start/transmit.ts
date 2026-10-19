import transmit from "@adonisjs/transmit/services/main";
import router from "@adonisjs/core/services/router";
import type { HttpContext } from "@adonisjs/core/http";
import { db } from "#database/connection";
import { organizations } from "#database/schema/organizations";
import {
  grantsOrgAdmin,
  hasMemberType,
  loadOrgMemberships,
  resolveEffectiveMembership,
} from "#shared/org/membership";
import { eq } from "drizzle-orm";

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

/**
 * The signed-in user and every membership they hold in the Org with this slug,
 * or null when the user is signed out or the Org does not exist.
 */
async function loadSubscriber(ctx: HttpContext, slug: string) {
  await ctx.auth.check();
  const user = ctx.auth.user;
  if (!user) return null;

  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.slug, slug))
    .limit(1);
  if (!org) return null;

  const memberships = await loadOrgMemberships(db, user.id, org.id);
  return { user, memberships };
}

transmit.authorize<{ slug: string }>(
  "orgs/:slug/callbacks",
  async (ctx, { slug }) => {
    const subscriber = await loadSubscriber(ctx, slug);
    if (!subscriber) return false;

    return grantsOrgAdmin(resolveEffectiveMembership(subscriber.memberships));
  }
);

// Subscribed by the admin callbacks board and by the dancer sidebar, so it
// admits who the `orgMember` + `orgDancer` route middleware admits: platform
// admins, org admins (Organizers included), and dancers.
transmit.authorize<{ slug: string }>(
  "orgs/:slug/showcases",
  async (ctx, { slug }) => {
    const subscriber = await loadSubscriber(ctx, slug);
    if (!subscriber) return false;
    if (subscriber.user.role === "admin") return true;

    const { memberships } = subscriber;
    return (
      hasMemberType(memberships, "dancer") ||
      grantsOrgAdmin(resolveEffectiveMembership(memberships))
    );
  }
);
