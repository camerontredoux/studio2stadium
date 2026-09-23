import { DatabaseService } from "#database/service";
import { orgEvents } from "#database/schema/org-events";
import { organizations } from "#database/schema/organizations";
import {
  toEventCapabilitiesView,
  type EventCapabilitiesView,
} from "#shared/org/entitlement";
import { inject } from "@adonisjs/core";
import { desc, eq } from "drizzle-orm";
import { Validator } from "./validator.ts";

@inject()
export class Service {
  constructor(private db: DatabaseService) {}

  /**
   * Each of an Org's events as staff configure its capabilities (#109), or
   * `null` when there is no such Org.
   */
  async execute({
    params,
  }: Validator): Promise<EventCapabilitiesView[] | null> {
    return this.db.use(async (db) => {
      const [org] = await db
        .select({ id: organizations.id })
        .from(organizations)
        .where(eq(organizations.id, params.id))
        .limit(1);
      if (!org) return null;

      const events = await db
        .select()
        .from(orgEvents)
        .where(eq(orgEvents.orgId, params.id))
        .orderBy(desc(orgEvents.isActive), desc(orgEvents.startDate));
      return events.map(toEventCapabilitiesView);
    });
  }
}
