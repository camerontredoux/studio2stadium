import { db } from "#database/connection";
import { eventTierPurchases } from "#database/schema/event-tier-purchases";
import {
  csvUploads,
  eventAuditLog,
  eventRosters,
  orgEvents,
} from "#database/schema/org-events";
import { orgMemberships, organizations } from "#database/schema/organizations";
import { users } from "#database/schema/users";
import { DatabaseService } from "#database/service";
import { mintPasswordToken } from "#modules/auth/password-tokens";
import { Service as ResetPasswordService } from "#modules/auth/reset-password/service";
import env from "#start/env";
import hash from "@adonisjs/core/services/hash";
import mail from "@adonisjs/mail/services/main";
import redis from "@adonisjs/redis/services/main";
import type { ApiClient } from "@japa/api-client";
import { test } from "@japa/runner";
import { eq } from "drizzle-orm";
import OrgReadyEmail from "../provisioning/email.ts";
import { ProvisionPurchaseService } from "../provisioning/service.ts";
import { Service as ClaimService } from "./service.ts";
import { claimTokenKey } from "./tokens.ts";

const PASSWORD = "claim-test-password";
const provision = new ProvisionPurchaseService(new DatabaseService());

async function wipe() {
  await db.delete(eventAuditLog).execute();
  await db.delete(csvUploads).execute();
  await db.delete(eventRosters).execute();
  await db.delete(eventTierPurchases).execute();
  await db.delete(orgEvents).execute();
  await db.delete(orgMemberships).execute();
  await db.delete(users).execute();
  await db.delete(organizations).execute();
}

/**
 * An account signed up with an email nobody proved they read — `verified`
 * included, which a dancer sets by finishing onboarding, not by opening mail.
 */
async function makeUser(
  name: string,
  opts: { role?: "admin" | "user"; emailVerified?: boolean } = {}
) {
  const email = `${name}@example.com`;
  const [user] = await db
    .insert(users)
    .values({
      username: name,
      email,
      displayEmail: email,
      firstName: name,
      lastName: "Tester",
      password: await hash.make(PASSWORD),
      role: opts.role ?? "user",
      type: "dancer",
      verified: true,
      emailVerifiedAt: opts.emailVerified ? new Date() : null,
    })
    .returning();
  return user!;
}

async function tokenFor(client: ApiClient, email: string) {
  const res = await client
    .post("/auth/login")
    .header("X-Client-Type", "mobile")
    .json({ email, password: PASSWORD });
  res.assertStatus(200);
  return (res.body() as { token: string }).token;
}

const input = (
  reference: string,
  email: string,
  orgName = "Claim Dance Co"
) => ({
  reference,
  buyer: { name: "Ada Organizer", email },
  purchase: {
    eventTier: "regional" as const,
    orgName,
    eventName: "Summit 2026",
    startDate: "2026-06-13",
    endDate: "2026-06-14",
  },
});

const orgReadyEmails = (fake: ReturnType<typeof mail.fake>) =>
  fake.mails
    .sent()
    .filter(
      (message): message is OrgReadyEmail => message instanceof OrgReadyEmail
    );

/** The token and userId of the newest claim link emailed. */
function claimLink(fake: ReturnType<typeof mail.fake>) {
  const sent = orgReadyEmails(fake).at(-1);
  const url = new URL(sent!.data.claimUrl!);
  return {
    url,
    token: url.searchParams.get("token")!,
    userId: url.searchParams.get("userId")!,
  };
}

async function membershipsOf(userId: string) {
  return await db
    .select()
    .from(orgMemberships)
    .where(eq(orgMemberships.userId, userId));
}

async function claimedAtOf(reference: string) {
  const [row] = await db
    .select({ claimedAt: eventTierPurchases.claimedAt })
    .from(eventTierPurchases)
    .where(eq(eventTierPurchases.reference, reference));
  return row!.claimedAt;
}

async function emailVerifiedAt(userId: string) {
  const [row] = await db
    .select({ at: users.emailVerifiedAt })
    .from(users)
    .where(eq(users.id, userId));
  return row!.at;
}

test.group(
  "Claiming an Org bought for an unproven account (ADR 0007)",
  (group) => {
    let fake: ReturnType<typeof mail.fake>;

    group.each.setup(async () => {
      await wipe();
      fake = mail.fake();
    });

    group.each.teardown(async () => {
      mail.restore();
      await db.delete(eventTierPurchases).execute();
    });

    test("a purchase for an unproven account provisions the Org, withholds the membership, and emails a claim link", async ({
      client,
      assert,
    }) => {
      const buyer = await makeUser("unproven");

      const result = await provision.execute(
        input("cs_claim_new", buyer.email)
      );

      assert.isTrue(result.provisioned);
      assert.isTrue(result.buyer.claimRequired);
      assert.equal(result.purchase.buyerId, buyer.id);
      assert.isTrue(result.purchase.claimRequired);
      assert.isNull(result.purchase.claimedAt);
      assert.equal(result.event.orgId, result.org.id);
      assert.lengthOf(await membershipsOf(buyer.id), 0);

      // The account is left as it was: nobody is signed out or locked out.
      const [kept] = await db
        .select()
        .from(users)
        .where(eq(users.id, buyer.id));
      assert.isTrue(await hash.verify(kept!.password, PASSWORD));
      assert.isNull(kept!.emailVerifiedAt);

      fake.mails.assertSentCount(OrgReadyEmail, 1);
      const [sent] = orgReadyEmails(fake);
      assert.equal(sent!.data.to, buyer.displayEmail);
      assert.equal(sent!.subject, "Your Org is ready — claim it");
      assert.isNull(sent!.data.setPasswordUrl);
      const link = claimLink(fake);
      assert.equal(
        link.url.origin + link.url.pathname,
        `${env.get("SITE_URL")}/claim`
      );
      assert.equal(link.userId, buyer.id);
      assert.isAbove(
        await redis.ttl(claimTokenKey(buyer.id)),
        6 * 24 * 60 * 60
      );

      const status = await client.get("/event-tiers/checkout/cs_claim_new");
      status.assertStatus(200);
      assert.equal(status.body().nextStep, "claim");
    });

    test("an unproven account that administers an Org gets a new Org, not that one", async ({
      assert,
    }) => {
      const buyer = await makeUser("unproven_admin");
      const [theirs] = await db
        .insert(organizations)
        .values({ name: "Squatter Org", slug: "squatter-org" })
        .returning();
      await db.insert(orgMemberships).values({
        orgId: theirs!.id,
        userId: buyer.id,
        role: "admin",
        type: "organizer",
      });

      const result = await provision.execute(
        input("cs_claim_squat", buyer.email)
      );

      assert.notEqual(result.org.id, theirs!.id);
      assert.equal(result.org.name, "Claim Dance Co");
    });

    test("the signed-in owner with the link claims the Org: membership, proof of inbox, claim cleared", async ({
      client,
      assert,
    }) => {
      const buyer = await makeUser("claimer");
      const result = await provision.execute(input("cs_claim_ok", buyer.email));
      const { token, userId } = claimLink(fake);

      const res = await client
        .post("/event-tiers/claim")
        .header(
          "Authorization",
          `Bearer ${await tokenFor(client, buyer.email)}`
        )
        .json({ token, userId });

      res.assertStatus(200);
      assert.deepEqual(res.body(), {
        orgs: [
          {
            name: result.org.name,
            slug: result.org.slug,
            url: `${env.get("SITE_URL")}/o/${result.org.slug}/admin`,
          },
        ],
      });

      const memberships = await membershipsOf(buyer.id);
      assert.lengthOf(memberships, 1);
      assert.equal(memberships[0]!.orgId, result.org.id);
      assert.equal(memberships[0]!.role, "admin");
      assert.equal(memberships[0]!.type, "organizer");
      assert.isNotNull(await emailVerifiedAt(buyer.id));
      assert.isNotNull(await claimedAtOf("cs_claim_ok"));
      assert.isNull(await redis.get(claimTokenKey(buyer.id)));

      const status = await client.get("/event-tiers/checkout/cs_claim_ok");
      assert.equal(status.body().nextStep, "sign_in");
    });

    test("a later purchase by a claimed account attaches straight away", async ({
      assert,
    }) => {
      const buyer = await makeUser("claimed_then_bought");
      await provision.execute(input("cs_claim_first", buyer.email));
      const { token } = claimLink(fake);
      await new ClaimService(new DatabaseService()).execute(buyer.id, {
        token,
        userId: buyer.id,
      });

      const second = await provision.execute(
        input("cs_claim_second", buyer.email)
      );

      assert.isFalse(second.buyer.claimRequired);
      assert.lengthOf(await membershipsOf(buyer.id), 1);
      assert.equal(
        orgReadyEmails(fake).at(-1)!.subject,
        "Your Org is ready — sign in"
      );
    });

    test("a user signed in as another account is refused, and the claim stays pending", async ({
      client,
      assert,
    }) => {
      const buyer = await makeUser("rightful");
      const other = await makeUser("interloper", { emailVerified: true });
      await provision.execute(input("cs_claim_wrong", buyer.email));
      const { token, userId } = claimLink(fake);

      const res = await client
        .post("/event-tiers/claim")
        .header(
          "Authorization",
          `Bearer ${await tokenFor(client, other.email)}`
        )
        .json({ token, userId });

      res.assertStatus(403);
      assert.lengthOf(await membershipsOf(other.id), 0);
      assert.lengthOf(await membershipsOf(buyer.id), 0);
      assert.isNull(await claimedAtOf("cs_claim_wrong"));
      assert.isNotNull(await redis.get(claimTokenKey(buyer.id)));

      // Nor can they pass it off as their own account's link.
      const own = await client
        .post("/event-tiers/claim")
        .header(
          "Authorization",
          `Bearer ${await tokenFor(client, other.email)}`
        )
        .json({ token, userId: other.id });
      own.assertStatus(400);
      assert.lengthOf(await membershipsOf(other.id), 0);
    });

    test("the account's owner without the link cannot claim", async ({
      client,
      assert,
    }) => {
      const buyer = await makeUser("no_link");
      await provision.execute(input("cs_claim_guess", buyer.email));

      const res = await client
        .post("/event-tiers/claim")
        .header(
          "Authorization",
          `Bearer ${await tokenFor(client, buyer.email)}`
        )
        .json({ token: "a".repeat(64), userId: buyer.id });

      res.assertStatus(400);
      assert.lengthOf(await membershipsOf(buyer.id), 0);
    });

    test("claiming needs a signed-in user", async ({ client }) => {
      const buyer = await makeUser("anon");
      await provision.execute(input("cs_claim_anon", buyer.email));
      const { token, userId } = claimLink(fake);

      const res = await client
        .post("/event-tiers/claim")
        .json({ token, userId });

      res.assertStatus(401);
    });

    test("a used link is refused the second time", async ({
      client,
      assert,
    }) => {
      const buyer = await makeUser("reuse");
      await provision.execute(input("cs_claim_reuse", buyer.email));
      const { token, userId } = claimLink(fake);
      const bearer = `Bearer ${await tokenFor(client, buyer.email)}`;

      const first = await client
        .post("/event-tiers/claim")
        .header("Authorization", bearer)
        .json({ token, userId });
      first.assertStatus(200);

      const second = await client
        .post("/event-tiers/claim")
        .header("Authorization", bearer)
        .json({ token, userId });
      second.assertStatus(400);
      assert.lengthOf(await membershipsOf(buyer.id), 1);
    });

    test("an expired link is refused", async ({ client, assert }) => {
      const buyer = await makeUser("expired");
      await provision.execute(input("cs_claim_expired", buyer.email));
      const { token, userId } = claimLink(fake);
      // What Redis does when the week is up.
      await redis.del(claimTokenKey(buyer.id));

      const res = await client
        .post("/event-tiers/claim")
        .header(
          "Authorization",
          `Bearer ${await tokenFor(client, buyer.email)}`
        )
        .json({ token, userId });

      res.assertStatus(400);
      assert.lengthOf(await membershipsOf(buyer.id), 0);
      assert.isNull(await claimedAtOf("cs_claim_expired"));
    });

    test("a redelivered webhook records no second claim and sends no second email", async ({
      assert,
    }) => {
      const buyer = await makeUser("retry");
      const first = await provision.execute(
        input("cs_claim_retry", buyer.email)
      );
      const tokenHash = await redis.get(claimTokenKey(buyer.id));

      const second = await provision.execute(
        input("cs_claim_retry", buyer.email)
      );

      assert.isFalse(second.provisioned);
      assert.isTrue(second.buyer.claimRequired);
      assert.equal(second.purchase.id, first.purchase.id);
      assert.lengthOf(await db.select().from(eventTierPurchases), 1);
      assert.lengthOf(await db.select().from(organizations), 1);
      fake.mails.assertSentCount(OrgReadyEmail, 1);
      // The link already sent still works: the retry minted nothing.
      assert.equal(await redis.get(claimTokenKey(buyer.id)), tokenHash);
    });

    test("two unclaimed purchases are both claimed by the newest link", async ({
      client,
      assert,
    }) => {
      const buyer = await makeUser("twice");
      await provision.execute(input("cs_claim_a", buyer.email, "First Co"));
      await provision.execute(input("cs_claim_b", buyer.email, "Second Co"));
      const { token, userId } = claimLink(fake);

      const res = await client
        .post("/event-tiers/claim")
        .header(
          "Authorization",
          `Bearer ${await tokenFor(client, buyer.email)}`
        )
        .json({ token, userId });

      res.assertStatus(200);
      assert.lengthOf(res.body().orgs, 2);
      assert.lengthOf(await membershipsOf(buyer.id), 2);
    });

    test("resetting the password through a forgot-password link completes a pending claim", async ({
      assert,
    }) => {
      const buyer = await makeUser("reset");
      const result = await provision.execute(
        input("cs_claim_reset", buyer.email)
      );

      await new ResetPasswordService(new DatabaseService()).execute({
        userId: buyer.id,
        token: await mintPasswordToken("reset", buyer.id),
        password: "a-brand-new-password",
      });

      const memberships = await membershipsOf(buyer.id);
      assert.lengthOf(memberships, 1);
      assert.equal(memberships[0]!.orgId, result.org.id);
      assert.isNotNull(await claimedAtOf("cs_claim_reset"));
      assert.isNotNull(await emailVerifiedAt(buyer.id));

      // `verified` means onboarded or an accepted school, not "read the inbox":
      // a reset leaves it as it was.
      const school = await makeUser("school_reset");
      await db
        .update(users)
        .set({ verified: false, type: "school" })
        .where(eq(users.id, school.id));
      await new ResetPasswordService(new DatabaseService()).execute({
        userId: school.id,
        token: await mintPasswordToken("reset", school.id),
        password: "a-brand-new-password",
      });
      const [after] = await db
        .select({ verified: users.verified })
        .from(users)
        .where(eq(users.id, school.id));
      assert.isFalse(after!.verified);
    });

    test("staff see a purchase awaiting its claim and can resend the link", async ({
      client,
      assert,
    }) => {
      const staff = await makeUser("staff_claim", {
        role: "admin",
        emailVerified: true,
      });
      const buyer = await makeUser("resend");
      const result = await provision.execute(
        input("cs_claim_resend", buyer.email)
      );
      const first = claimLink(fake);
      const bearer = `Bearer ${await tokenFor(client, staff.email)}`;

      const list = await client
        .get("/admin/event-tier-purchases")
        .header("Authorization", bearer);
      list.assertStatus(200);
      assert.isTrue(list.body()[0].awaitingClaim);

      const resend = await client
        .post(`/admin/event-tier-purchases/${result.purchase.id}/claim-email`)
        .header("Authorization", bearer);
      resend.assertStatus(204);
      fake.mails.assertSentCount(OrgReadyEmail, 2);
      const second = claimLink(fake);
      assert.equal(orgReadyEmails(fake).at(-1)!.data.to, buyer.displayEmail);
      assert.notEqual(second.token, first.token);

      // The newest link works; the replaced one does not.
      const buyerBearer = `Bearer ${await tokenFor(client, buyer.email)}`;
      const stale = await client
        .post("/event-tiers/claim")
        .header("Authorization", buyerBearer)
        .json({ token: first.token, userId: buyer.id });
      stale.assertStatus(400);
      const fresh = await client
        .post("/event-tiers/claim")
        .header("Authorization", buyerBearer)
        .json({ token: second.token, userId: buyer.id });
      fresh.assertStatus(200);

      const after = await client
        .get("/admin/event-tier-purchases")
        .header("Authorization", bearer);
      assert.isFalse(after.body()[0].awaitingClaim);

      const again = await client
        .post(`/admin/event-tier-purchases/${result.purchase.id}/claim-email`)
        .header("Authorization", bearer);
      again.assertStatus(409);
    });
  }
);
