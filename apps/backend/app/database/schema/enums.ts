import { sql } from "drizzle-orm";
import { pgEnum } from "drizzle-orm/pg-core";

export const prospectStatus = pgEnum("prospect_status", [
  "pending",
  "released",
  "in_review",
  "accepted",
]);

export const mediaType = pgEnum("media_type", ["image", "video"]);

export const subscriptionSource = pgEnum("subscription_source", [
  "stripe",
  "revenuecat",
]);

export const platformName = pgEnum("platform_name", ["core", "prodigy"]);

export const role = pgEnum("role", ["admin", "prodigy_admin", "user"]);

export const accountType = pgEnum("account_type", ["dancer", "school"]);

export const feedItemType = pgEnum("feed_item_type", [
  "image",
  "video",
  "profile",
  "reference",
  "achievement",
]);

export const danceEventType = pgEnum("dance_event_type", [
  "audition",
  "rehearsal",
  "recital",
  "showcase",
  "competition",
  "class",
  "intensive",
  "workshop",
  "fundraiser",
  "combine",
  "convention",
  "clinic",
  "deadline",
  "recruitment",
  "performance",
  "camp",
  "other",
]);

export const teamSelectionType = pgEnum("team_selection_type", [
  "recruitment",
  "audition",
  "hybrid",
]);

export const competitiveCircuitType = pgEnum("competitive_circuit_type", [
  "uda",
  "dtu",
  "nda",
  "usa",
  "non-competitive",
  "other",
]);

export const schoolApplicationStatus = pgEnum("school_application_status", [
  "pending",
  "accepted",
  "rejected",
]);

export const videoType = pgEnum("video_type", ["youtube", "cloudflare"]);

export const videoUploadStatus = pgEnum("video_upload_status", [
  "pending",
  "processing",
  "ready",
  "failed",
]);

export const orgRole = pgEnum("org_role", ["admin", "member"]);
/**
 * What a person is inside an Org. Shared by `org_memberships` and, in the
 * narrowed `RosterType` form below, by `event_rosters` and `csv_uploads`.
 *
 * `organizer` is the person who runs the Org's events and buys S2S Live. They
 * administer the Org but never evaluate dancers and never appear on a Roster —
 * see docs/adr/0003-organizer-is-a-distinct-member-type.md.
 */
export const orgMemberType = pgEnum("org_member_type", [
  "coach",
  "dancer",
  "organizer",
]);

export type OrgMemberType = (typeof orgMemberType.enumValues)[number];

/**
 * The subset of `org_member_type` a Roster Entry may hold. An Organizer runs
 * the event rather than taking part in it, so an organizer membership must
 * never produce a Roster Entry — `event_rosters.type` and `csv_uploads.type`
 * are typed to this and carry a matching CHECK constraint.
 */
export const ROSTER_TYPES = ["coach", "dancer"] as const;
export type RosterType = (typeof ROSTER_TYPES)[number];

export const isRosterType = (value: string): value is RosterType =>
  (ROSTER_TYPES as readonly string[]).includes(value);

/**
 * SQL predicate for "this row's `type` is a Roster type". Shared by the roster
 * CHECK constraints, the membership partial indexes, and the ON CONFLICT clause
 * that has to infer one of those indexes — Postgres only infers a partial index
 * when the statement's predicate implies the index's, so these must not drift.
 *
 * Written as a positive list rather than `<> 'organizer'` for two reasons: DDL
 * may not name an enum label added in the same transaction, and a member type
 * added later then stays out of rosters until someone decides otherwise.
 */
export const isRosterTypeSql = () =>
  sql`type in (${sql.join(
    ROSTER_TYPES.map((t) => sql`${t}`),
    sql`, `
  )})`;

/** The complement of `isRosterTypeSql`, for indexes over the non-Roster types. */
export const isNotRosterTypeSql = () =>
  sql`type not in (${sql.join(
    ROSTER_TYPES.map((t) => sql`${t}`),
    sql`, `
  )})`;
export const premiumGrantSource = pgEnum("premium_grant_source", ["org_event"]);
export const orgAccountTier = pgEnum("org_account_tier", [
  "standard",
  "limited",
]);

export const auditAction = pgEnum("audit_action", [
  "upload",
  "create",
  "update",
  "delete",
  "activate",
  "resend_invite",
]);

/** What a CSV row did to the roster: created a new entry, or changed one. */
export const csvRowOutcome = pgEnum("csv_row_outcome", ["added", "updated"]);

/**
 * A dancer's claim that a roster entry is hers. Only ever resolved by an org
 * admin — the dancer is asking, never asserting.
 */
export const rosterClaimStatus = pgEnum("roster_claim_status", [
  "pending",
  "approved",
  "rejected",
]);

export const auditResource = pgEnum("audit_resource", [
  "roster",
  "event",
  "checklist",
  "csv_upload",
  "invite",
  "video_category",
  "video",
]);
