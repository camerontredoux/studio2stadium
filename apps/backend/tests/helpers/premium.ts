import { db } from "#database/connection";
import { dancerProfiles } from "#database/schema/dancers";
import { schoolProfiles } from "#database/schema/schools";
import { subscriptions } from "#database/schema/subscriptions";
import { users } from "#database/schema/users";
import env from "#start/env";
import { normalizeEmail } from "#utils/normalize-email";
import hash from "@adonisjs/core/services/hash";
import { faker } from "@faker-js/faker";
import type { ApiClient } from "@japa/api-client";

export const PASSWORD = "premium-test-password";
export const DAY_MS = 86_400_000;

let passwordHash: string | undefined;

async function createUser(type: "dancer" | "school") {
  passwordHash ??= await hash.make(PASSWORD);
  const displayEmail = faker.internet.email().toLowerCase();
  const [user] = await db
    .insert(users)
    .values({
      username: `${faker.internet.username().toLowerCase()}${faker.string.alphanumeric(6)}`,
      email: await normalizeEmail(displayEmail),
      displayEmail,
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      password: passwordHash,
      role: "user",
      type,
      verified: true,
    })
    .returning();
  return user!;
}

export async function createDancer() {
  const user = await createUser("dancer");
  const [profile] = await db
    .insert(dancerProfiles)
    .values({ userId: user.id, birthday: "2008-01-01", location: "CA" })
    .returning();
  return { ...user, profileId: profile!.id };
}

export async function createSchool() {
  const user = await createUser("school");
  const [school] = await db
    .insert(schoolProfiles)
    .values({
      userId: user.id,
      name: `${faker.company.name()} ${faker.string.alphanumeric(8)}`,
      location: "CA",
    })
    .returning();
  return school!;
}

/** A paying Stripe subscription that began `startedAt`. */
export async function subscribe(
  userId: string,
  {
    interval = "monthly",
    startedAt = new Date(),
    status = "active",
  }: {
    interval?: "monthly" | "annual";
    startedAt?: Date | null;
    status?: string;
  } = {}
) {
  await db.insert(subscriptions).values({
    userId,
    source: "stripe",
    status,
    subscriptionId: `sub_${faker.string.alphanumeric(14)}`,
    customerId: `cus_${faker.string.alphanumeric(14)}`,
    priceId: env.get(
      interval === "monthly"
        ? "STRIPE_PRICE_ID_MONTHLY"
        : "STRIPE_PRICE_ID_YEARLY"
    ),
    currentPeriodEnd: new Date(Date.now() + 30 * DAY_MS),
    startedAt,
  });
}

export async function login(client: ApiClient, email: string) {
  const response = await client
    .post("/auth/login")
    .header("X-Client-Type", "mobile")
    .json({ email, password: PASSWORD });
  response.assertStatus(200);
  return (response.body() as { token: string }).token;
}
