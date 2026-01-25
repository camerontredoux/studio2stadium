import { db } from "#database/connection";
import type {
  AccountType,
  PlatformName,
  Role,
  User,
} from "#database/generated/types";
import hash from "@adonisjs/core/services/hash";
import testUtils from "@adonisjs/core/services/test_utils";
import { faker } from "@faker-js/faker";
import { test } from "@japa/runner";
import { type Insertable } from "kysely";
import { SignupQueries } from "../signup/queries.ts";

const userFixture: Insertable<User> = {
  id: "test-id",
  email: "test@example.com",
  account_type: "dancer",
  role: "user" as Role,
  display_email: faker.internet.email(),
  username: faker.internet.username(),
  first_name: faker.person.firstName(),
  last_name: faker.person.lastName(),
  password: await hash.make("password"),
  avatar: faker.image.avatarGitHub(),
};

const testCtx = await testUtils.createHttpContext();
const queries = new SignupQueries(testCtx);

test.group("Login", (group) => {
  group.each.setup(async () => {
    await db.deleteFrom("users").execute();
  });

  test("user can login with valid credentials", async ({ client }) => {
    await queries.createUser(userFixture);
    const response = await client.post("/auth/login").json({
      email: "test@example.com",
      password: "password",
    });

    response.assertStatus(200);
    response.assertBodyContains({ id: "test-id" });
  });

  test("login fails with invalid email", async ({ client }) => {
    const response = await client.post("/auth/login").json({
      email: "nonexistent@example.com",
      password: "password123",
    });

    response.assertStatus(400);
    response.assertBodyContains({
      errors: [{ message: "Invalid user credentials." }],
    });
  });

  test("login fails with invalid password", async ({ client }) => {
    await queries.createUser(userFixture);

    const response = await client.post("/auth/login").json({
      email: "test@example.com",
      password: "wrongpassword",
    });

    response.assertStatus(400);
    response.assertBodyContains({
      errors: [{ message: "Invalid user credentials." }],
    });
  });

  test("login fails with missing email", async ({ client }) => {
    const response = await client.post("/auth/login").json({
      password: "password123",
    });

    response.assertStatus(422);
  });

  test("login fails with invalid email format", async ({ client }) => {
    const response = await client.post("/auth/login").json({
      email: "not-an-email",
      password: "password123",
    });

    response.assertStatus(422);
  });

  test("login fails with short password", async ({ client }) => {
    const response = await client.post("/auth/login").json({
      email: "test@example.com",
      password: "short",
    });

    response.assertStatus(422);
  });

  test("login creates session", async ({ client }) => {
    const user = await queries.createUser(userFixture);
    const sessionUser = {
      id: user.id,
      email: user.email,
      displayEmail: user.displayEmail,
      username: user.username,
      avatar: user.avatar,
      type: "dancer" as AccountType,
      role: "user" as Role,
      subscribed: false,
      platforms: ["core" as PlatformName],
    };
    const protectedResponse = await client
      .get("/auth/session")
      .loginAs(sessionUser);

    protectedResponse.assertStatus(200);
    protectedResponse.assertCookie("adonis-session");
    protectedResponse.assertBodyContains({ email: "test@example.com" });
  });
  test("login is case-insensitive and normalized", async ({
    client,
    assert,
  }) => {
    const user = await queries.createUser({
      ...userFixture,
      email: "testemail@gmail.com",
    });
    assert.equal(user.email, "testemail@gmail.com");

    const upperDomain = await client.post("/auth/login").json({
      email: "test.email+email@GMAIL.com",
      password: "password",
    });
    upperDomain.assertStatus(200);

    const subaddressWrong = await client.post("/auth/login").json({
      email: "test+email.email@GMAIL.com",
      password: "password",
    });
    subaddressWrong.assertStatus(400);
  });
});
