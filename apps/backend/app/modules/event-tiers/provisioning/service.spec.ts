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
import env from "#start/env";
import { getUserSession } from "#auth/queries";
import { passwordTokenKey } from "#modules/auth/password-tokens";
import { Service as ResetPasswordService } from "#modules/auth/reset-password/service";
import { GetOrgService } from "#modules/orgs/get-org/service";
import { ListEventsService } from "#modules/orgs/events/list/service";
import { grantsOrgAdmin } from "#shared/org/membership";
import hash from "@adonisjs/core/services/hash";
import mail from "@adonisjs/mail/services/main";
import redis from "@adonisjs/redis/services/main";
import { test } from "@japa/runner";
import { eq } from "drizzle-orm";
import { type PurchaseDetails } from "../checkout/metadata.ts";
import OrgReadyEmail from "./email.ts";
import {
  organizerUsername,
  ProvisionPurchaseService,
  splitName,
} from "./service.ts";
import { deriveOrgSlug, orgSlugCandidates } from "./slug.ts";

const svc = new ProvisionPurchaseService(new DatabaseService());

async function makeBuyer(suffix: string) {
  const [buyer] = await db
    .insert(users)
    .values({
      username: `organizer_${suffix}`,
      email: `organizer_${suffix}@example.com`,
      displayEmail: `organizer_${suffix}@example.com`,
      firstName: "Ada",
      lastName: "Organizer",
      password: "h",
      role: "user",
      type: "dancer",
    })
    .returning();

  return buyer!;
}

/** The pre-checkout form's buyer fields for an existing account. */
/** The Org-ready emails the fake mailer caught. */
const orgReadyEmails = (fake: ReturnType<typeof mail.fake>) =>
  fake.mails
    .sent()
    .filter(
      (message): message is OrgReadyEmail => message instanceof OrgReadyEmail
    );

const as = (buyer: { email: string }) => ({
  name: "Ada Organizer",
  email: buyer.email,
});

const purchase = (
  overrides: Partial<PurchaseDetails> = {}
): PurchaseDetails => ({
  eventTier: "regional",
  orgName: "The Summit",
  eventName: "Summit 2026",
  startDate: "2026-06-13",
  endDate: "2026-06-14",
  ...overrides,
});

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

test.group("ProvisionPurchaseService", (group) => {
  group.each.setup(async () => {
    await wipe();
    mail.fake();
  });

  // `event_tier_purchases.buyer_id` is ON DELETE RESTRICT, so rows left behind
  // here would break the blanket `delete(users)` other suites run.
  group.each.teardown(async () => {
    mail.restore();
    await db.delete(eventTierPurchases).execute();
  });

  test("a first purchase creates the Org, its Org Event at the bought Event Tier, and an organizer admin membership", async ({
    assert,
  }) => {
    const buyer = await makeBuyer("first");

    const result = await svc.execute({
      reference: "cs_first",
      buyer: as(buyer),
      purchase: purchase({ eventTier: "national" }),
    });

    assert.isTrue(result.provisioned);
    assert.equal(result.org.name, "The Summit");
    assert.equal(result.org.slug, "the-summit");
    assert.equal(result.event.name, "Summit 2026");
    assert.equal(result.event.orgId, result.org.id);
    assert.equal(result.event.eventTier, "national");
    assert.equal(result.event.startDate, "2026-06-13");
    assert.equal(result.event.endDate, "2026-06-14");

    const memberships = await db
      .select()
      .from(orgMemberships)
      .where(eq(orgMemberships.orgId, result.org.id));

    assert.lengthOf(memberships, 1);
    assert.equal(memberships[0]!.userId, buyer.id);
    assert.equal(memberships[0]!.type, "organizer");
    assert.equal(memberships[0]!.role, "admin");
  });

  test("the sale records the payment it was settled with, for a refund or dispute to find", async ({
    assert,
  }) => {
    const buyer = await makeBuyer("payment");

    const result = await svc.execute({
      reference: "cs_payment",
      buyer: as(buyer),
      purchase: purchase(),
      paymentIntentId: "pi_payment",
    });

    assert.equal(result.purchase.paymentIntentId, "pi_payment");
    assert.isNull(result.purchase.deactivatedAt);
  });

  test("the sale records the amount charged, for staff to answer a billing question (#92)", async ({
    assert,
  }) => {
    const buyer = await makeBuyer("amount");

    const result = await svc.execute({
      reference: "cs_amount",
      buyer: as(buyer),
      purchase: purchase(),
      amountTotal: 49900,
      currency: "usd",
    });

    assert.equal(result.purchase.amountTotal, 49900);
    assert.equal(result.purchase.currency, "usd");
  });

  test("the buyer can administer their Org and see its Org Event straight away", async ({
    assert,
  }) => {
    const buyer = await makeBuyer("admin_area");

    const result = await svc.execute({
      reference: "cs_admin_area",
      buyer: as(buyer),
      purchase: purchase(),
    });

    // What the sign-in session carries, which the org area routes on.
    const session = await getUserSession(buyer.id);
    assert.deepInclude(session!.orgMemberships, {
      orgSlug: result.org.slug,
      role: "admin",
      type: "organizer",
    });

    // What `GET /orgs/:slug` answers, and what `orgAdmin` checks.
    const access = await new GetOrgService(new DatabaseService()).execute(
      result.org.slug,
      buyer.id
    );
    assert.isTrue(grantsOrgAdmin(access!.membership!));

    // What the admin area lists first.
    const events = await new ListEventsService(new DatabaseService()).execute(
      result.org.id
    );
    assert.deepEqual(
      events.map((event) => event.id),
      [result.event.id]
    );
  });

  test("the Org Event is created inactive, for the Organizer to configure and activate", async ({
    assert,
  }) => {
    const buyer = await makeBuyer("active");

    const first = await svc.execute({
      reference: "cs_active_1",
      buyer: as(buyer),
      purchase: purchase(),
    });

    // What arrives from checkout is a name and two dates. The active event is
    // what `OrgEventMiddleware` routes every request in the Org's area into, so
    // a purchase must not put an unconfigured event there — the Organizer sets
    // the event up and activates it through `orgs/events/update`, which is also
    // what stands the previous active event down.
    assert.isFalse(first.event.isActive);

    const second = await svc.execute({
      reference: "cs_active_2",
      buyer: as(buyer),
      purchase: purchase({ eventName: "Summit 2027" }),
    });
    assert.isFalse(second.event.isActive);

    const active = await db
      .select({ id: orgEvents.id })
      .from(orgEvents)
      .where(eq(orgEvents.isActive, true));

    assert.lengthOf(active, 0);
  });

  test("a second purchase by the same buyer adds an Org Event to their existing Org", async ({
    assert,
  }) => {
    const buyer = await makeBuyer("second");

    const first = await svc.execute({
      reference: "cs_second_1",
      buyer: as(buyer),
      purchase: purchase(),
    });

    const second = await svc.execute({
      reference: "cs_second_2",
      buyer: as(buyer),
      // A different Org name on the second purchase does not fork the tenant:
      // S2S Live is sold per event, not per Org (ADR 0001).
      purchase: purchase({ orgName: "Summit Dance", eventName: "Combine" }),
    });

    assert.equal(second.org.id, first.org.id);
    assert.notEqual(second.event.id, first.event.id);

    const orgs = await db.select().from(organizations);
    assert.lengthOf(orgs, 1);

    const events = await db
      .select()
      .from(orgEvents)
      .where(eq(orgEvents.orgId, first.org.id));
    assert.lengthOf(events, 2);

    const memberships = await db
      .select()
      .from(orgMemberships)
      .where(eq(orgMemberships.userId, buyer.id));
    assert.lengthOf(memberships, 1);
  });

  test("an Org name whose derived URL is already taken still produces a usable Org", async ({
    assert,
  }) => {
    await db
      .insert(organizations)
      .values({ name: "The Summit", slug: "the-summit" })
      .execute();

    const buyer = await makeBuyer("collision");

    const result = await svc.execute({
      reference: "cs_collision",
      buyer: as(buyer),
      purchase: purchase(),
    });

    assert.equal(result.org.name, "The Summit");
    assert.equal(result.org.slug, "the-summit-2");
    assert.equal(result.event.orgId, result.org.id);
  });

  test("provisioning the same purchase twice provisions once", async ({
    assert,
  }) => {
    const buyer = await makeBuyer("redelivery");
    const input = {
      reference: "cs_redelivered",
      buyer: as(buyer),
      purchase: purchase(),
    };

    const first = await svc.execute(input);
    const second = await svc.execute(input);

    assert.isTrue(first.provisioned);
    assert.isFalse(second.provisioned);
    assert.equal(second.org.id, first.org.id);
    assert.equal(second.event.id, first.event.id);
    assert.equal(second.purchase.id, first.purchase.id);

    assert.lengthOf(await db.select().from(organizations), 1);
    assert.lengthOf(await db.select().from(orgEvents), 1);
    assert.lengthOf(await db.select().from(eventTierPurchases), 1);
    assert.lengthOf(await db.select().from(orgMemberships), 1);
  });

  test("a failure part-way leaves nothing behind", async ({ assert }) => {
    const buyer = await makeBuyer("atomic");

    let caught: unknown;
    try {
      await svc.execute({
        reference: "cs_atomic",
        buyer: as(buyer),
        // Longer than `org_events.name`, so the Org is already inserted by the
        // time the event insert fails.
        purchase: purchase({ eventName: "E".repeat(200) }),
      });
    } catch (error) {
      caught = error;
    }

    assert.exists(caught, "expected provisioning to fail");
    assert.lengthOf(await db.select().from(organizations), 0);
    assert.lengthOf(await db.select().from(orgEvents), 0);
    assert.lengthOf(await db.select().from(orgMemberships), 0);
    assert.lengthOf(await db.select().from(eventTierPurchases), 0);
  });

  test("a buyer with no account gets one, with their Org, its Org Event and admin membership", async ({
    assert,
  }) => {
    const fake = mail.fake();

    const result = await svc.execute({
      reference: "cs_new_buyer",
      buyer: {
        name: "Grace  Hopper Organizer",
        email: "Grace.New@Example.com",
      },
      purchase: purchase(),
    });

    const created = await db
      .select()
      .from(users)
      .where(eq(users.id, result.buyer.id));
    assert.lengthOf(created, 1);
    const [user] = created;
    // Stored the way signup stores it: normalized for lookup, as typed for mail.
    assert.equal(user!.email, "grace.new@example.com");
    assert.equal(user!.displayEmail, "Grace.New@Example.com");
    assert.equal(user!.firstName, "Grace");
    assert.equal(user!.lastName, "Hopper Organizer");
    assert.equal(user!.role, "user");
    assert.isTrue(result.buyer.accountCreated);
    assert.isTrue(result.purchase.buyerAccountCreated);
    assert.equal(result.purchase.buyerId, user!.id);

    const memberships = await db
      .select()
      .from(orgMemberships)
      .where(eq(orgMemberships.userId, user!.id));
    assert.lengthOf(memberships, 1);
    assert.equal(memberships[0]!.orgId, result.org.id);
    assert.equal(memberships[0]!.type, "organizer");
    assert.equal(memberships[0]!.role, "admin");

    // Nobody knows its password, so nothing signs in until one is set.
    for (const guess of ["", "password", user!.email, user!.username]) {
      assert.isFalse(await hash.verify(user!.password, guess));
    }

    // One email, with a set-password link to the reset page.
    fake.mails.assertSentCount(OrgReadyEmail, 1);
    const [sent] = orgReadyEmails(fake);
    assert.equal(sent!.data.to, "Grace.New@Example.com");
    assert.equal(sent!.data.orgName, "The Summit");
    assert.equal(
      sent!.data.orgUrl,
      `${env.get("SITE_URL")}/o/${result.org.slug}/admin`
    );
    assert.equal(sent!.subject, "Your Org is ready — set your password");

    const link = new URL(sent!.data.setPasswordUrl!);
    assert.equal(link.origin + link.pathname, `${env.get("SITE_URL")}/reset`);
    assert.equal(link.searchParams.get("userId"), user!.id);

    // The minted token lives for about a week, under its own key, and the
    // existing reset-password endpoint accepts it once.
    assert.isAbove(
      await redis.ttl(passwordTokenKey("setup", user!.id)),
      6 * 24 * 60 * 60
    );
    const token = link.searchParams.get("token")!;
    await new ResetPasswordService(new DatabaseService()).execute({
      userId: user!.id,
      token,
      password: "organizer-password",
    });
    const [after] = await db
      .select({ password: users.password })
      .from(users)
      .where(eq(users.id, user!.id));
    assert.isTrue(await hash.verify(after!.password, "organizer-password"));
  });

  test("a buyer whose email already has an account is attached to it and told to sign in", async ({
    assert,
  }) => {
    const buyer = await makeBuyer("existing");
    const fake = mail.fake();

    const result = await svc.execute({
      reference: "cs_existing",
      // Typed differently from how signup stored it; the same mailbox.
      buyer: { name: "Someone Else", email: "Organizer_Existing@Example.com" },
      purchase: purchase(),
    });

    assert.equal(result.buyer.id, buyer.id);
    assert.isFalse(result.buyer.accountCreated);
    assert.isFalse(result.purchase.buyerAccountCreated);
    assert.lengthOf(await db.select().from(users), 1);

    const [kept] = await db.select().from(users).where(eq(users.id, buyer.id));
    assert.equal(kept!.firstName, "Ada");
    assert.equal(kept!.password, "h");

    fake.mails.assertSentCount(OrgReadyEmail, 1);
    fake.mails.assertSent(OrgReadyEmail, (message) => {
      return (
        message.data.to === buyer.displayEmail &&
        message.data.setPasswordUrl === null &&
        message.subject === "Your Org is ready — sign in"
      );
    });
    assert.isNull(await redis.get(passwordTokenKey("setup", buyer.id)));
  });

  test("a redelivered webhook creates no second account and sends no second email", async ({
    assert,
  }) => {
    const fake = mail.fake();
    const input = {
      reference: "cs_retry_new",
      buyer: { name: "Retry Buyer", email: "retry_new@example.com" },
      purchase: purchase(),
    };

    const first = await svc.execute(input);
    const second = await svc.execute(input);

    assert.isTrue(first.provisioned);
    assert.isFalse(second.provisioned);
    assert.equal(second.buyer.id, first.buyer.id);
    assert.isTrue(second.buyer.accountCreated);
    assert.lengthOf(
      await db
        .select()
        .from(users)
        .where(eq(users.email, "retry_new@example.com")),
      1
    );
    assert.lengthOf(await db.select().from(eventTierPurchases), 1);
    fake.mails.assertSentCount(OrgReadyEmail, 1);
  });

  test("two purchases racing for the same new email create one account", async ({
    assert,
  }) => {
    const fake = mail.fake();
    const buyer = { name: "Race Buyer", email: "race_new@example.com" };

    const results = await Promise.all([
      svc.execute({
        reference: "cs_race_1",
        buyer,
        purchase: purchase({ eventName: "Race One" }),
      }),
      svc.execute({
        reference: "cs_race_2",
        buyer,
        purchase: purchase({ eventName: "Race Two" }),
      }),
    ]);

    const accounts = await db
      .select()
      .from(users)
      .where(eq(users.email, "race_new@example.com"));
    assert.lengthOf(accounts, 1);
    assert.deepEqual(
      results.map((result) => result.purchase.buyerId),
      [accounts[0]!.id, accounts[0]!.id]
    );
    // Exactly one of them created it.
    assert.sameMembers(
      results.map((result) => result.buyer.accountCreated),
      [true, false]
    );
    assert.lengthOf(await db.select().from(eventTierPurchases), 2);
    fake.mails.assertSentCount(OrgReadyEmail, 2);

    // The loser also sends a set-password link when the winner's is already
    // pending, and a newer link replaces the older one. Either way exactly
    // one working link reached the buyer.
    const links = orgReadyEmails(fake)
      .map((message) => message.data.setPasswordUrl)
      .filter((url): url is string => url !== null);
    assert.isAtLeast(links.length, 1);

    const reset = new ResetPasswordService(new DatabaseService());
    const worked = await Promise.all(
      links.map((url) =>
        reset
          .execute({
            userId: accounts[0]!.id,
            token: new URL(url).searchParams.get("token")!,
            password: "race-password",
          })
          .then(
            () => true,
            () => false
          )
      )
    );
    assert.lengthOf(
      worked.filter((ok) => ok),
      1
    );
  });

  test("a second purchase before the buyer set their password sends a fresh set-password link", async ({
    assert,
  }) => {
    const fake = mail.fake();
    const buyer = { name: "Twice Buyer", email: "twice_new@example.com" };

    const first = await svc.execute({
      reference: "cs_twice_1",
      buyer,
      purchase: purchase({ eventName: "First" }),
    });
    const second = await svc.execute({
      reference: "cs_twice_2",
      buyer,
      purchase: purchase({ eventName: "Second" }),
    });

    assert.isTrue(first.buyer.accountCreated);
    assert.isFalse(second.buyer.accountCreated);

    const [firstEmail, secondEmail] = orgReadyEmails(fake);
    assert.equal(secondEmail!.subject, "Your Org is ready — set your password");

    const tokenOf = (message: OrgReadyEmail) =>
      new URL(message.data.setPasswordUrl!).searchParams.get("token")!;
    const reset = new ResetPasswordService(new DatabaseService());

    // The newer link replaced the older one.
    await assert.rejects(() =>
      reset.execute({
        userId: first.buyer.id,
        token: tokenOf(firstEmail!),
        password: "stale-password",
      })
    );
    await reset.execute({
      userId: first.buyer.id,
      token: tokenOf(secondEmail!),
      password: "organizer-password",
    });

    // With a password set, a third purchase is told to sign in.
    await svc.execute({
      reference: "cs_twice_3",
      buyer,
      purchase: purchase({ eventName: "Third" }),
    });
    const third = orgReadyEmails(fake)[2]!;
    assert.isNull(third.data.setPasswordUrl);
    assert.equal(third.subject, "Your Org is ready — sign in");
  });

  test("a failed email does not undo the purchase", async ({ assert }) => {
    mail.restore();
    const send = mail.send;
    mail.send = (async () => {
      throw new Error("mail transport down");
    }) as typeof mail.send;

    try {
      const result = await svc.execute({
        reference: "cs_mail_down",
        buyer: { name: "Offline Buyer", email: "mail_down@example.com" },
        purchase: purchase(),
      });

      assert.isTrue(result.provisioned);
      assert.lengthOf(await db.select().from(eventTierPurchases), 1);
      assert.lengthOf(
        await db
          .select()
          .from(users)
          .where(eq(users.email, "mail_down@example.com")),
        1
      );
    } finally {
      mail.send = send;
    }
  });

  test("the buyer is the email typed at checkout; another account is never touched", async ({
    assert,
  }) => {
    const buyer = await makeBuyer("identity");
    const [finance] = await db
      .insert(users)
      .values({
        username: "finance_dept",
        // The address a corporate card would bill to (PRD story 17).
        email: "finance@corp.example",
        displayEmail: "finance@corp.example",
        firstName: "Finance",
        lastName: "Department",
        password: "h",
        role: "user",
        type: "dancer",
      })
      .returning();

    const result = await svc.execute({
      reference: "cs_identity",
      buyer: as(buyer),
      purchase: purchase(),
    });

    assert.equal(result.purchase.buyerId, buyer.id);

    const memberships = await db
      .select()
      .from(orgMemberships)
      .where(eq(orgMemberships.userId, finance!.id));
    assert.lengthOf(memberships, 0);
  });

  test("the organizer never becomes a Roster Entry", async ({ assert }) => {
    const buyer = await makeBuyer("roster");

    const result = await svc.execute({
      reference: "cs_roster",
      buyer: as(buyer),
      purchase: purchase(),
    });

    // ADR 0003: an Organizer runs the event and never appears on a roster. The
    // staff-flagged row `CreateEventService` seeds for a product admin (issues
    // #99/#101) is a coach preview sandbox — a purchase must not produce even
    // that, staff flag or not.
    const roster = await db
      .select()
      .from(eventRosters)
      .where(eq(eventRosters.eventId, result.event.id));

    assert.lengthOf(roster, 0);

    const coachMemberships = await db
      .select()
      .from(orgMemberships)
      .where(eq(orgMemberships.type, "coach"));

    assert.lengthOf(coachMemberships, 0);
  });

  test("what was bought, by whom, and at what Event Tier is retrievable", async ({
    assert,
  }) => {
    const buyer = await makeBuyer("record");

    const result = await svc.execute({
      reference: "cs_record",
      buyer: as(buyer),
      purchase: purchase({ eventTier: "core" }),
    });

    const found = await svc.find("cs_record");

    assert.exists(found);
    assert.equal(found!.id, result.purchase.id);
    assert.equal(found!.buyerId, buyer.id);
    assert.equal(found!.eventId, result.event.id);
    assert.equal(found!.eventTier, "core");

    assert.isNull(await svc.find("cs_never_happened"));
  });

  test("the Org a purchase creates is self-serve", async ({ assert }) => {
    const buyer = await makeBuyer("selfserve_new");

    const result = await svc.execute({
      reference: "cs_selfserve_new",
      buyer: as(buyer),
      purchase: purchase(),
    });

    assert.isTrue(result.org.selfServe);
    const [stored] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, result.org.id));
    assert.isTrue(stored!.selfServe);
  });

  test("a purchase for an Org the buyer already administers makes it self-serve", async ({
    assert,
  }) => {
    const buyer = await makeBuyer("selfserve_existing");
    const [handBuilt] = await db
      .insert(organizations)
      .values({ name: "Hand Built", slug: "hand-built" })
      .returning();
    await db.insert(orgMemberships).values({
      orgId: handBuilt!.id,
      userId: buyer.id,
      role: "admin",
      type: "organizer",
    });
    assert.isFalse(handBuilt!.selfServe);

    const result = await svc.execute({
      reference: "cs_selfserve_existing",
      buyer: as(buyer),
      purchase: purchase(),
    });

    assert.equal(result.org.id, handBuilt!.id);
    assert.isTrue(result.org.selfServe);
  });
});

test.group("new buyer accounts", () => {
  test("a name splits into first and last name", ({ assert }) => {
    assert.deepEqual(splitName("  Ada   Lovelace King "), {
      firstName: "Ada",
      lastName: "Lovelace King",
    });
    assert.deepEqual(splitName("Cher"), { firstName: "Cher", lastName: "" });
  });

  test("a username is what signup would accept, and unique per call", ({
    assert,
  }) => {
    const first = organizerUsername("Élan O'Brien-Smith");
    const second = organizerUsername("Élan O'Brien-Smith");

    assert.match(first, /^elanobriensmith[0-9a-f]{8}$/);
    assert.notEqual(first, second);
    assert.match(organizerUsername("東京"), /^organizer[0-9a-f]{8}$/);
    assert.isAtMost(organizerUsername("a".repeat(100)).length, 32);
  });
});

test.group("deriveOrgSlug", () => {
  test("derives a URL from the name the Organizer typed", ({ assert }) => {
    assert.equal(deriveOrgSlug("The Summit"), "the-summit");
    assert.equal(deriveOrgSlug("  Élan Dance & Co.  "), "elan-dance-co");
    assert.equal(deriveOrgSlug("Summit -- 2026"), "summit-2026");
  });

  test("a name with nothing URL-safe in it still produces a slug", ({
    assert,
  }) => {
    assert.equal(deriveOrgSlug("!!!"), "org");
    assert.equal(deriveOrgSlug("東京"), "org");
  });

  test("candidates stay within the slug column", ({ assert }) => {
    const candidates = orgSlugCandidates("a".repeat(120));

    for (const candidate of candidates) {
      assert.isAtMost(candidate.length, 64);
      assert.match(candidate, /^[a-z0-9-]+$/);
    }

    assert.equal(new Set(candidates).size, candidates.length);
  });
});
