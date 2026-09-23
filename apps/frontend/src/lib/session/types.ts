import type { ApiSchemas } from "@/lib/api/client";

export type Session = ApiSchemas["AuthSessionResponse"];

/**
 * The account types built around a dancer or school profile. An `organizer`
 * account exists only to administer the Org an Event Tier purchase created,
 * has no profile, and is kept out of the profile product by the `_app` guard.
 */
export type ProfileAccountType = Exclude<Session["type"], "organizer">;

/** A session inside the profile product, where the account has a profile type. */
export type ProfileSession = Session & { type: ProfileAccountType };

export const isProfileSession = (session: Session): session is ProfileSession =>
  session.type !== "organizer";
