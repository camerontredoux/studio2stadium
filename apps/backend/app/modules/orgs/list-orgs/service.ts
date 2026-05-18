import { DatabaseService } from "#database/service";
import { organizations } from "#database/schema/organizations";
import { inject } from "@adonisjs/core";
import { asc } from "drizzle-orm";

export interface PublicOrgEntry {
  id: string;
  slug: string;
  name: string;
  logoUrl: string | null;
  primaryColor: string | null;
}

@inject()
export class ListOrgsService {
  constructor(private db: DatabaseService) {}

  async execute(): Promise<PublicOrgEntry[]> {
    return this.db.use((db) =>
      db
        .select({
          id: organizations.id,
          slug: organizations.slug,
          name: organizations.name,
          logoUrl: organizations.logoUrl,
          primaryColor: organizations.primaryColor,
        })
        .from(organizations)
        .orderBy(asc(organizations.name))
    );
  }
}
