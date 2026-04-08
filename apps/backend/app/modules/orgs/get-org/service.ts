import { DatabaseService } from "#database/service";
import { organizations } from "#database/schema/organizations";
import { inject } from "@adonisjs/core";
import { eq } from "drizzle-orm";

@inject()
export class GetOrgService {
  constructor(private db: DatabaseService) {}

  async execute(slug: string) {
    return this.db.use((db) =>
      db
        .select()
        .from(organizations)
        .where(eq(organizations.slug, slug))
        .limit(1)
        .then((rows) => rows[0] ?? null)
    );
  }
}
