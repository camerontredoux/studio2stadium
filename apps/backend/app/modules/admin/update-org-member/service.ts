import { orgMemberships } from "#database/schema/organizations";
import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import { eq } from "drizzle-orm";
import { Validator } from "./validator.ts";

@inject()
export class Service {
  constructor(private db: DatabaseService) {}

  async execute({ params, role, type }: Validator) {
    const updates: Partial<{ role: "admin" | "member"; type: "coach" | "dancer" }> = {};
    if (role) updates.role = role;
    if (type) updates.type = type;

    if (Object.keys(updates).length === 0) {
      return { error: "No fields to update" };
    }

    const [updated] = await this.db.use((db) =>
      db
        .update(orgMemberships)
        .set(updates)
        .where(eq(orgMemberships.id, params.memberId))
        .returning()
    );

    if (!updated) {
      return { error: "Membership not found" };
    }

    return updated;
  }
}
