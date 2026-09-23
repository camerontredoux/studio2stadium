import { DatabaseService } from "#database/service";
import { orgEvents } from "#database/schema/org-events";
import {
  describeCapabilities,
  type CapabilityResolution,
} from "#shared/org/entitlement";
import type { EventTier } from "#shared/org/event-tiers";
import { inject } from "@adonisjs/core";
import { desc, eq } from "drizzle-orm";
import { Validator } from "./validator.ts";

/**
 * One Org Event as staff configure its capabilities: what its Event Tier
 * includes, the exceptions set on it, and what is in force (#109).
 */
export interface EventCapabilitiesView {
  id: string;
  name: string;
  isActive: boolean;
  startDate: string;
  eventTier: EventTier;
  capabilities: CapabilityResolution[];
}

export function toEventCapabilitiesView(
  event: Pick<
    typeof orgEvents.$inferSelect,
    | "id"
    | "name"
    | "isActive"
    | "startDate"
    | "eventTier"
    | "capabilityOverrides"
  >
): EventCapabilitiesView {
  return {
    id: event.id,
    name: event.name,
    isActive: event.isActive,
    startDate: event.startDate,
    eventTier: event.eventTier,
    capabilities: describeCapabilities(event),
  };
}

@inject()
export class Service {
  constructor(private db: DatabaseService) {}

  async execute({ params }: Validator): Promise<EventCapabilitiesView[]> {
    const events = await this.db.use((db) =>
      db
        .select()
        .from(orgEvents)
        .where(eq(orgEvents.orgId, params.id))
        .orderBy(desc(orgEvents.isActive), desc(orgEvents.startDate))
    );
    return events.map(toEventCapabilitiesView);
  }
}
