import { test } from "@japa/runner";
import { randomBytes } from "node:crypto";

test.group("dev sign-in routes", () => {
  test("GET /auth/dev-sign-in is not registered outside the dev web server", async ({
    client,
  }) => {
    const code = randomBytes(32).toString("hex");
    const response = await client.get(`/auth/dev-sign-in?code=${code}`);

    response.assertStatus(404);
  });
});
