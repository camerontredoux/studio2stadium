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
export const orgMemberType = pgEnum("org_member_type", ["coach", "dancer"]);
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

export const auditResource = pgEnum("audit_resource", [
  "roster",
  "event",
  "checklist",
  "csv_upload",
  "invite",
  "video_category",
  "video",
]);
