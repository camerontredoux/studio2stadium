import { test } from "@japa/runner";
import mail from "@adonisjs/mail/services/main";
import { db } from "#database/connection";
import { users } from "#database/schema/users";
import {
  organizations,
  orgMemberships,
} from "#database/schema/organizations";
import { DancerCreatedEvent, DancerCreatedHandler } from "./event.ts";
import DancerWelcomeEmail from "./email.ts";

async function makeUser(overrides: Partial<typeof users.$inferInsert> = {}) {
  const seed = `${Date.now()}-${Math.random()}`;
  const [user] = await db
    .insert(users)
    .values({
      username: `dancer_${seed}`,
      email: `dancer_${seed}@example.com`,
      displayEmail: `dancer_${seed}@example.com`,
      firstName: "Dana",
      lastName: "Dancer",
      password: "x",
      role: "user",
      type: "dancer",
      verified: true,
      ...overrides,
    })
    .returning();
  return user!;
}

async function makeOrg() {
  const [org] = await db
    .insert(organizations)
    .values({ name: "T", slug: `t-${Date.now()}-${Math.random()}` })
    .returning();
  return org!;
}

test.group("DancerCreatedHandler welcome email", (group) => {
  group.each.setup(async () => {
    await db.delete(orgMemberships).execute();
    await db.delete(organizations).execute();
    await db.delete(users).execute();
    mail.fake();
  });

  group.each.teardown(() => {
    mail.restore();
  });

  test("sends the welcome email to a standalone S2S dancer", async () => {
    const fake = mail.fake();
    const user = await makeUser();

    await new DancerCreatedHandler().handle(
      new DancerCreatedEvent({ userId: user.id })
    );

    fake.mails.assertSent(DancerWelcomeEmail);
  });

  test("does NOT send the welcome email to an org dancer", async () => {
    const fake = mail.fake();
    const user = await makeUser({ orgAccountTier: "limited" });
    const org = await makeOrg();
    await db.insert(orgMemberships).values({
      userId: user.id,
      orgId: org.id,
      type: "dancer",
      role: "member",
    });

    await new DancerCreatedHandler().handle(
      new DancerCreatedEvent({ userId: user.id })
    );

    fake.mails.assertNotSent(DancerWelcomeEmail);
  });

  test("respects the notifications opt-out for standalone dancers", async () => {
    const fake = mail.fake();
    const user = await makeUser({ notifications: false });

    await new DancerCreatedHandler().handle(
      new DancerCreatedEvent({ userId: user.id })
    );

    fake.mails.assertNotSent(DancerWelcomeEmail);
  });
});
