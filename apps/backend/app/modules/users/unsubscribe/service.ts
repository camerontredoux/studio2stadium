import { db } from "#database/connection";
import { users } from "#database/schema/users";
import { verifyUnsubscribeToken } from "#shared/prospect-emails/unsubscribe-token";
import { eq } from "drizzle-orm";

export class UnsubscribeService {
  /** Returns true when the token was valid and the user is now opted out. */
  async execute(token: string): Promise<boolean> {
    const userId = verifyUnsubscribeToken(token);

    if (!userId) {
      return false;
    }

    const updated = await db
      .update(users)
      .set({ notifications: false })
      .where(eq(users.id, userId))
      .returning({ id: users.id });

    return updated.length > 0;
  }
}
