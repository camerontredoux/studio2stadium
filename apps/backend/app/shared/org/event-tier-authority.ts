import type { EventTier } from "./event-tiers.ts";

/**
 * Who may write an Org Event's Event Tier by hand.
 *
 * An Event Tier is what someone paid for, or what S2S agreed to give them
 * (ADR 0001, ADR 0002), so setting it is a commercial act. Organizers create
 * and edit their own events through the same endpoints staff use, which is why
 * the rule lives here rather than in route middleware: the endpoint is shared,
 * the right to touch this one field is not.
 */

/** The user shape the rule reads. Kept structural so a session user fits. */
export interface EventTierActorLike {
  role: string;
}

/** Studio 2 Stadium staff — a site admin, not an Org admin or Organizer. */
export function isEventTierStaff(user: EventTierActorLike): boolean {
  return user.role === "admin";
}

/** Someone other than S2S staff tried to set or change an Event Tier. */
export class EventTierForbiddenError extends Error {
  constructor() {
    super("Only Studio 2 Stadium staff can set an Event Tier.");
  }
}

/**
 * Staff created an Org Event without choosing its Event Tier. Left alone, the
 * column default would stamp it Enterprise — the grandfathering default from
 * ADR 0006, not a choice — so staff must say which Event Tier was agreed.
 */
export class EventTierRequiredError extends Error {
  constructor() {
    super("Choose the Event Tier for this event.");
  }
}

/**
 * Checks an Event Tier on an Org Event write.
 *
 * - Anyone but staff sending an Event Tier is refused.
 * - Staff creating an event must send one.
 * - Staff editing an event may leave it out, which keeps the current one.
 */
export function assertEventTierWrite(args: {
  isStaff: boolean;
  eventTier: EventTier | undefined;
  mode: "create" | "update";
}): void {
  if (args.eventTier !== undefined && !args.isStaff) {
    throw new EventTierForbiddenError();
  }
  if (args.mode === "create" && args.isStaff && args.eventTier === undefined) {
    throw new EventTierRequiredError();
  }
}

/**
 * An Organizer of a self-serve Org tried to create an Org Event themselves.
 * Their first event came from a purchase at the Event Tier they paid for;
 * further events are bought again or arranged with S2S (PRD #84), never
 * created free by the Organizer.
 */
export class EventTierPurchaseRequiredError extends Error {
  constructor() {
    super(
      "New events for this Org are bought or arranged with Studio 2 Stadium."
    );
  }
}

/**
 * Whether this actor may create an Org Event in this Org at all.
 *
 * An Org an Event Tier purchase has landed on is self-serve, for good (see
 * `isSelfServeOrg`): its Organizers bought their first event at a chosen Event
 * Tier, and further events come only from another purchase or from staff.
 * Letting them create events would
 * hand a Core customer free Enterprise events through the column default
 * (#112). Staff may create events anywhere, with an explicit Event Tier.
 *
 * Grandfathered, hand-built Orgs have no purchase and keep today's behaviour:
 * their Organizers create events, which take the Enterprise default (ADR 0006).
 */
export function assertMayCreateOrgEvent(args: {
  isStaff: boolean;
  orgIsSelfServe: boolean;
}): void {
  if (args.orgIsSelfServe && !args.isStaff) {
    throw new EventTierPurchaseRequiredError();
  }
}
