import { faker } from "@faker-js/faker";
import { test } from "@japa/runner";
import { db } from "../../../database/connection.ts";

const userRegisterFixture = {
  username: faker.internet.username(),
  firstName: faker.person.firstName(),
  lastName: faker.person.lastName(),
  phone: faker.phone.number(),
  password: "password",
  confirmPassword: "password",
  termsChecked: true,
};

test.group("Signup failures", (group) => {
  group.each.setup(async () => {
    await db.deleteFrom("users").execute();
  });

  test("register fails on duplicate email", async ({ client }) => {
    const register = await client.post("/auth/signup").json({
      ...userRegisterFixture,
      email: "TEST.email+email@gMail.com",
    });

    register.assertStatus(201);

    const registerFails = await client.post("/auth/signup").json({
      ...userRegisterFixture,
      email: "testemail@gmail.com",
    });

    registerFails.assertStatus(400);
    registerFails.assertBodyContains({ errors: [{ code: "E_UNIQUE_VIOLATION" }] });
    registerFails.assertBodyContains({ errors: [{ cause: "email" }] });
  });

  test("rate limit after 5 failed registration attempts", async ({ client }) => {
    await client.post("/auth/signup").json({
      ...userRegisterFixture,
      email: "original@gmail.com",
    });

    for (let i = 0; i < 5; i++) {
      await client.post("/auth/signup").json({
        ...userRegisterFixture,
        email: `original@gmail.com`,
      });
    }

    const response = await client.post("/auth/signup").json({
      ...userRegisterFixture,
      email: "original@gmail.com",
    });

    response.assertStatus(429);
  });
});
