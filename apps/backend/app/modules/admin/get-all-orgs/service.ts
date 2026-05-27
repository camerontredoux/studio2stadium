import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";

@inject()
export class Service {
  constructor(private db: DatabaseService) {}

  async execute() {
    const orgs = await this.db.use((db) =>
      db.query.organizations.findMany({
        with: {
          memberships: {
            columns: { id: true, role: true, type: true },
          },
          events: {
            columns: { id: true, name: true, isActive: true },
          },
        },
        orderBy: { createdAt: "desc" },
      })
    );

    return orgs.map((org) => ({
      id: org.id,
      name: org.name,
      slug: org.slug,
      logoUrl: org.logoUrl,
      primaryColor: org.primaryColor,
      accentColor: org.accentColor,
      features: org.features,
      settings: org.settings,
      createdAt: org.createdAt,
      updatedAt: org.updatedAt,
      memberCount: org.memberships.length,
      eventCount: org.events.length,
      activeEvent: org.events.find((e) => e.isActive)?.name ?? null,
    }));
  }
}
