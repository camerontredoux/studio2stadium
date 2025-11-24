import { test } from "@japa/runner";
import { db } from "#database/connection";
import hash from "@adonisjs/core/services/hash";

test.group("Login", (group) => {
  group.each.setup(async () => {
    await db.deleteFrom("users").execute();
  });

  test("user can login with valid credentials", async ({ client }) => {
    const passwordHash = await hash.make("password123");
    await db
      .insertInto("users")
      .values({
        id: "test-id",
        email: "test@example.com",
        username: "testuser",
        first_name: "John",
        last_name: "Doe",
        image: "avatar.jpg",
        password_hash: passwordHash,
      })
      .execute();

    const response = await client.post("/auth/login").json({
      email: "test@example.com",
      password: "password123",
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
    response.assertBodyContains({ errors: [{ message: "Invalid user credentials." }] });
  });

  test("login fails with invalid password", async ({ client }) => {
    const passwordHash = await hash.make("correctpassword");
    await db
      .insertInto("users")
      .values({
        email: "test@example.com",
        username: "testuser",
        first_name: "John",
        last_name: "Doe",
        image: "avatar.jpg",
        password_hash: passwordHash,
      })
      .execute();

    const response = await client.post("/auth/login").json({
      email: "test@example.com",
      password: "wrongpassword",
    });

    response.assertStatus(400);
    response.assertBodyContains({ errors: [{ message: "Invalid user credentials." }] });
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
    const passwordHash = await hash.make("password123");
    const user = await db
      .insertInto("users")
      .values({
        email: "test1@example.com",
        username: "testuser",
        first_name: "John",
        last_name: "Doe",
        image: "avatar.jpg",
        password_hash: passwordHash,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    const protectedResponse = await client.get("/user").loginAs(user);

    protectedResponse.assertStatus(200);
    protectedResponse.assertCookie("adonis-session");
    protectedResponse.assertBodyContains({ id: user.id });
  });
});
