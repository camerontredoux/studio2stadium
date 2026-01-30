import { db } from "#database/connection";

export async function getAccountByUsername(username: string) {
  return await db
    .selectFrom("users")
    .where("username", "=", username)
    .executeTakeFirst();
}
