import { users } from "#database/schema/users";
import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import { eq } from "drizzle-orm";

@inject()
export class Service {
  constructor(private db: DatabaseService) {}

  async execute(userId: string) {
    await this.db.use((db) => db.delete(users).where(eq(users.id, userId)));
  }
}
