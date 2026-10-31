import { db } from "#database/connection";
import { eventTierPurchases } from "#database/schema/event-tier-purchases";
import { orgEvents } from "#database/schema/org-events";
import { orgMemberships, organizations } from "#database/schema/organizations";
import { users } from "#database/schema/users";
import { DatabaseService } from "#database/service";
import { mintPasswordToken } from "#modules/auth/password-tokens";
import { Service as ResetPasswordService } from "#modules/auth/reset-password/service";
import { validator as signupValidator } from "#modules/auth/signup/validator";
import mail from "@adonisjs/mail/services/main";
import type { ApiClient } from "@japa/api-client";
import { test } from "@japa/runner";
import { ProvisionPurchaseService } from "./service.ts";

const PASSWORD = "organizer-password";
const provision = new ProvisionPurchaseService(new DatabaseService());

async function wipe() {
  await db.delete(eventTierPurchases).execute();
  await db.delete(orgEvents).execute();
  await db.delete(orgMemberships).execute();
  await db.delete(users).execute();
  await db.delete(organizations).execute();
}

/** Provision a purchase for a new buyer and set their password. */
async function newOrganizer() {
  const result = await provision.execute({
    reference: "cs_organizer_account",
    buyer: { name: "Olive Organizer", email: "olive@example.com" },
    purchase: {
      eventTier: "regional",
      orgName: "Olive Dance Co",
      eventName: "Olive Summit",
      startDate: "2026-06-13",
      endDate: "2026-06-14",
    },
  });

  await new ResetPasswordService(new DatabaseService()).execute({
    userId: result.buyer.id,
    token: await mintPasswordToken("setup", result.buyer.id),
    password: PASSWORD,
  });

  return result;
}

async function tokenFor(client: ApiClient, email: string) {
  const res = await client
    .post("/auth/login")
    .header("X-Client-Type", "mobile")
    .json({ email, password: PASSWORD });
  res.assertStatus(200);
  return (res.body() as { token: string }).token;
}

test.group("An Organizer account a purchase created", (group) => {
  group.each.setup(async () => {
    await wipe();
    mail.fake();
  });

  group.each.teardown(async () => {
    mail.restore();
    await wipe();
  });

  test("signs in as an Organizer with its Org admin membership and no profile", async ({
    client,
    assert,
  }) => {
    const { org } = await newOrganizer();
    const bearer = `Bearer ${await tokenFor(client, "olive@example.com")}`;

    const session = await client
      .get("/auth/session")
      .header("Authorization", bearer);
    session.assertStatus(200);
    assert.equal(session.body().type, "organizer");
    assert.notExists(session.body().profileId);
    assert.deepInclude(session.body().orgMemberships, {
      orgSlug: org.slug,
      role: "admin",
      type: "organizer",
    });
  });

  test("has an empty feed and is refused profile routes", async ({
    client,
    assert,
  }) => {
    await newOrganizer();
    const bearer = `Bearer ${await tokenFor(client, "olive@example.com")}`;

    const feed = await client.get("/feed").header("Authorization", bearer);
    feed.assertStatus(200);
    assert.deepEqual(feed.body().feed, []);

    const activity = await client
      .get("/users/activity")
      .header("Authorization", bearer);
    activity.assertStatus(403);
  });

  test("nobody can sign up as an Organizer", async ({ assert }) => {
    const payload = {
      email: "signup@example.com",
      password: "a-long-password",
      username: "signuporganizer",
      firstName: "Sign",
      lastName: "Up",
      termsChecked: true,
    };

    await assert.rejects(() =>
      signupValidator.validate({ ...payload, type: "organizer" })
    );
    const dancer = await signupValidator.validate({
      ...payload,
      type: "dancer",
    });
    assert.equal(dancer.type, "dancer");
  });
});
