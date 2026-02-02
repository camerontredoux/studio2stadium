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
  "image_upload",
  "video_upload",
  "profile_update",
  "reference_created",
  "achievement_created",
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
  "other",
]);
