import { db } from "#database/connection";
import { sql } from "drizzle-orm";
import { type Validator } from "./validator.ts";

export class Service {
  async execute({ username }: Validator): Promise<boolean> {
    const [user] = await this.getAccountByUsername(username);

    return !user.exists;
  }

  async getAccountByUsername(username: string) {
    return await db.execute<{ exists: boolean }>(
      sql`SELECT EXISTS (SELECT 1 FROM users WHERE username = ${username})`
    );
  }
}
