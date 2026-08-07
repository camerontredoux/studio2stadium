import { db } from "#database/connection";
import { orgMemberships } from "#database/schema/organizations";
import { AppEvent } from "#shared/event";
import { eq } from "drizzle-orm";
import emitter from "@adonisjs/core/services/emitter";
import mail from "@adonisjs/mail/services/main";
import DancerWelcomeEmail from "./email.ts";

interface DancerCreatedEventData {
  userId: string;
}

export class DancerCreatedEvent extends AppEvent {
  constructor(public data: DancerCreatedEventData) {
    super();
  }
}

export class DancerCreatedHandler {
  async handle(event: DancerCreatedEvent) {
    const { userId } = event.data;

    const user = await db.query.users.findFirst({
      where: { id: userId },
    });

    if (!user) {
      return;
    }

    if (!user.notifications) {
      return;
    }

    // Org-provisioned dancers are freemium and must not receive the S2S
    // welcome email. If they later pay for full S2S access, the Stripe
    // SubscriptionCreatedEvent sends the premium welcome email instead.
    const [orgMembership] = await db
      .select({ userId: orgMemberships.userId })
      .from(orgMemberships)
      .where(eq(orgMemberships.userId, userId))
      .limit(1);

    if (orgMembership) {
      return;
    }

    await mail.send(
      new DancerWelcomeEmail({
        email: user.displayEmail,
        firstName: user.firstName,
      })
    );
  }
}

emitter.listen(DancerCreatedEvent, [DancerCreatedHandler]);
