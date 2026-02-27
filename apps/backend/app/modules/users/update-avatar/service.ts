import { users } from "#database/schema/users";
import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import drive from "@adonisjs/drive/services/main";
import { eq } from "drizzle-orm";
import { Validator } from "./validator.ts";

@inject()
export class UpdateAvatarService {
  constructor(private db: DatabaseService) {}

  async execute(userId: string, avatar: string | null, { key }: Validator) {
    const disk = drive.use("r2");

    if (avatar && avatar.startsWith("avatar")) {
      await disk.delete(avatar);
    }

    const exists = await disk.exists(key);

    if (!exists) {
      return { error: "File not found" };
    }

    await this.db.use((db) =>
      db
        .update(users)
        .set({
          avatar: key,
        })
        .where(eq(users.id, userId))
    );
  }
}
