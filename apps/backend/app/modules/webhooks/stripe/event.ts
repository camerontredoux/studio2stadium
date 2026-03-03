import { db } from "#database/connection";
import { BaseEvent } from "@adonisjs/core/events";
import emitter from "@adonisjs/core/services/emitter";
import mail from "@adonisjs/mail/services/main";
import PremiumWelcomeEmail from "./emails/premium-welcome.ts";
import SubscriptionEndedEmail from "./emails/subscription-ended.ts";

interface SubscriptionCreatedEventData {
  userId: string;
}

interface SubscriptionDeletedEventData {
  email: string;
  name: string;
  isAdmin?: boolean;
}

export class SubscriptionCreatedEvent extends BaseEvent {
  constructor(public data: SubscriptionCreatedEventData) {
    super();
  }
}

export class SubscriptionDeletedEvent extends BaseEvent {
  constructor(public data: SubscriptionDeletedEventData) {
    super();
  }
}

class SubscriptionCreatedHandler {
  async handle(event: SubscriptionCreatedEvent) {
    const { userId } = event.data;

    const user = await db.query.users.findFirst({
      where: { id: userId },
    });

    if (!user) {
      return;
    }

    // Skip email for admin users
    const isAdmin = user.role === "admin" || user.role === "prodigy_admin";
    if (isAdmin) return;

    await mail.send(
      new PremiumWelcomeEmail({
        email: user.displayEmail,
        firstName: user.firstName,
      })
    );
  }
}

class SubscriptionDeletedHandler {
  async handle(event: SubscriptionDeletedEvent) {
    if (event.data.isAdmin) return;

    const { email, name } = event.data;

    await mail.send(
      new SubscriptionEndedEmail({
        email,
        firstName: name,
      })
    );
  }
}

emitter.listen(SubscriptionCreatedEvent, [SubscriptionCreatedHandler]);
emitter.listen(SubscriptionDeletedEvent, [SubscriptionDeletedHandler]);
