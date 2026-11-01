import transmit from "@adonisjs/transmit/services/main";
import logger from "@adonisjs/core/services/logger";
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
import {
  claimStream,
  releaseStream,
  replayTarget,
} from "#shared/realtime/stream-owner";
import env from "#start/env";
import { eq } from "drizzle-orm";

const machineId = env.get("FLY_MACHINE_ID");

/**
 * Sends a subscribe or unsubscribe that landed on the wrong Fly machine to the
 * machine holding the uid's stream, and reports whether it did. A request Fly
 * already replayed is answered here, so a stale owner cannot bounce it again.
 */
async function replayToStreamOwner(ctx: HttpContext, uid: string) {
  if (ctx.request.header("fly-replay-src")) return false;
  const owner = await replayTarget(uid, machineId);
  if (!owner) return false;
  // Fly's proxy swallows this response and replays the request on `owner`.
  ctx.response.header("fly-replay", `instance=${owner}`);
  ctx.response.conflict();
  return true;
}

// Register transmit routes inline to work around a @poppinss/utils
// version mismatch that breaks the built-in controllers.
router.get("__transmit/events", async (ctx) => {
  const uid = ctx.request.input("uid");
  if (!uid || typeof uid !== "string") {
    return ctx.response.badRequest({ message: 'Missing "uid"' });
  }

  // Without the owner record a stray subscribe still fails, but the stream
  // itself works, so a Redis error must not take it down.
  await claimStream(uid, machineId).catch((error) =>
    logger.warn({ err: error, uid }, "could not record transmit stream owner")
  );
  ctx.response.response.on("close", () => {
    releaseStream(uid, machineId).catch((error) =>
      logger.warn({ err: error, uid }, "could not clear transmit stream owner")
    );
  });

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
  if (typeof uid === "string" && (await replayToStreamOwner(ctx, uid))) return;

  const success = await transmit.subscribe({ uid, channel, context: ctx });
  if (!success) return ctx.response.badRequest();
  return ctx.response.noContent();
});

router.post("__transmit/unsubscribe", async (ctx) => {
  const uid = ctx.request.input("uid");
  const channel = ctx.request.input("channel");
  if (typeof uid === "string" && (await replayToStreamOwner(ctx, uid))) return;

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
    // Platform admins hold no membership row; the `orgMember` route
    // middleware admits them anyway, so the board they load must stream too.
    if (subscriber.user.role === "admin") return true;

    return grantsOrgAdmin(resolveEffectiveMembership(subscriber.memberships));
  }
);

// The check-in desk listens here for check-ins made anywhere else (another
// desk, a scan, a dancer's own pass), so it admits who `orgAdmin` admits.
transmit.authorize<{ slug: string }>(
  "orgs/:slug/check-in",
  async (ctx, { slug }) => {
    const subscriber = await loadSubscriber(ctx, slug);
    if (!subscriber) return false;
    if (subscriber.user.role === "admin") return true;

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
