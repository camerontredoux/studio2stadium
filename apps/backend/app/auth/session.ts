import type { SessionUser } from "#auth/provider";

export type ProfileSession = SessionUser & { profileId: string };

declare module "@adonisjs/core/http" {
  interface HttpContext {
    session: ProfileSession;
  }
}
