import { test } from "@japa/runner";
import { db } from "#database/connection";
import { faker } from "@faker-js/faker";

const userRegisterFixture = {
  username: faker.internet.username(),
  first_name: faker.person.firstName(),
  last_name: faker.person.lastName(),
  password: "password",
  terms_checked: true,
};

test.group("Login", (group) => {
  group.each.setup(async () => {
    await db.deleteFrom("users").execute();
  });

  test("register fails on duplicate email", async ({ client }) => {
    const register = await client.post("/auth/register").json({
      ...userRegisterFixture,
      email: "TEST.email+email@gMail.com",
    });

    register.assertStatus(201);
    register.assertAgainstApiSpec();

    const registerFails = await client.post("/auth/register").json({
      ...userRegisterFixture,
      email: "testemail@gmail.com",
    });

    registerFails.assertStatus(400);
    registerFails.assertBodyContains({ errors: [{ code: "23505" }] });
    registerFails.assertBodyContains({ errors: [{ cause: "email" }] });
  });
});
