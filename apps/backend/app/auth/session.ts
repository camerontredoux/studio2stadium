import type { SessionUser } from "#auth/provider";
import type { ProfileAccountType } from "#database/schema/enums";

/**
 * A signed-in user with a profile. Only dancer and school accounts have one,
 * so the type narrows with it: an Organizer account never reaches a route
 * behind the profile, dancer or school middleware.
 */
export type ProfileSession = SessionUser & {
  profileId: string;
  type: ProfileAccountType;
};

declare module "@adonisjs/core/http" {
  interface HttpContext {
    session: ProfileSession;
  }
}
