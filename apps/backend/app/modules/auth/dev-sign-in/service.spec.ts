import { db } from "#database/connection";
import { users } from "#database/schema/users";
import redis from "@adonisjs/redis/services/main";
import { test } from "@japa/runner";
import { randomBytes } from "node:crypto";
import { isDevSignInEnabled } from "./enabled.ts";
import { devSignInKey, Service } from "./service.ts";

async function makeUser() {
  const handle = `dev-sign-in-${Date.now()}`;
  const [user] = await db
    .insert(users)
    .values({
      username: handle,
      email: `${handle}@example.com`,
      displayEmail: `${handle}@example.com`,
      firstName: "Dev",
      lastName: "SignIn",
      password: "x",
      role: "user",
      type: "dancer",
    })
    .returning();
  return user!;
}

/** What sign-in.sh does: store the code's hash with a TTL. */
async function mintCode(userId: string) {
  const code = randomBytes(32).toString("hex");
  await redis.connection("cache").set(devSignInKey(code), userId, "EX", 300);
  return code;
}

test.group("dev sign-in gate", () => {
  test("is on only for the web server in development with the flag", ({
    assert,
  }) => {
    const on = {
      nodeEnvironment: "development",
      appEnvironment: "web",
      flag: true,
    };
    assert.isTrue(isDevSignInEnabled(on));
    assert.isFalse(
      isDevSignInEnabled({ ...on, nodeEnvironment: "production" })
    );
    assert.isFalse(isDevSignInEnabled({ ...on, nodeEnvironment: "test" }));
    assert.isFalse(isDevSignInEnabled({ ...on, appEnvironment: "console" }));
    assert.isFalse(isDevSignInEnabled({ ...on, appEnvironment: "test" }));
    assert.isFalse(isDevSignInEnabled({ ...on, flag: false }));
    assert.isFalse(isDevSignInEnabled({ ...on, flag: undefined }));
  });
});

test.group("dev sign-in service", (group) => {
  group.each.setup(async () => {
    await db.delete(users).execute();
  });

  test("a code signs in its user once", async ({ assert }) => {
    const user = await makeUser();
    const code = await mintCode(user.id);
    const service = new Service();

    const session = await service.execute({ code });
    assert.equal(session?.id, user.id);

    assert.isNull(await service.execute({ code }));
    assert.isNull(await redis.connection("cache").get(devSignInKey(code)));
  });

  test("an unknown code signs in nobody", async ({ assert }) => {
    const service = new Service();
    const code = randomBytes(32).toString("hex");

    assert.isNull(await service.execute({ code }));
  });

  test("the key holds the code's hash, not the code", ({ assert }) => {
    const code = randomBytes(32).toString("hex");

    assert.notInclude(devSignInKey(code), code);
    assert.match(devSignInKey(code), /^dev-sign-in:[0-9a-f]{64}$/);
  });
});
