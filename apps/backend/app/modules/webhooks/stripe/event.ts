import { db } from "#database/connection";
import { BaseEvent } from "@adonisjs/core/events";
import emitter from "@adonisjs/core/services/emitter";
import { guardListener } from "#shared/events/guard-listener";
import mail from "@adonisjs/mail/services/main";
import PaymentFailedEmail from "./emails/payment-failed.ts";
import PremiumWelcomeEmail from "./emails/premium-welcome.ts";
import SubscriptionEndedEmail from "./emails/subscription-ended.ts";

interface SubscriptionCreatedEventData {
  userId: string;
}

interface SubscriptionDeletedEventData {
  email: string;
  name: string;
}

interface PaymentFailedEventData {
  userId: string;
  /** When the member loses access unless a retry or a new card succeeds. */
  accessEndsAt: Date;
}

/** A subscription renewal payment failed and its grace period began. */
export class PaymentFailedEvent extends BaseEvent {
  constructor(public data: PaymentFailedEventData) {
    super();
  }
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

    if (!user.notifications) {
      return;
    }

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
    const { email, name } = event.data;

    await mail.send(
      new SubscriptionEndedEmail({
        email,
        firstName: name,
      })
    );
  }
}

// A billing notice, not a notification: it goes out even when the member
// turned notifications off, like the subscription-ended email.
class PaymentFailedHandler {
  async handle(event: PaymentFailedEvent) {
    const { userId, accessEndsAt } = event.data;

    const user = await db.query.users.findFirst({
      where: { id: userId },
    });

    if (!user) {
      return;
    }

    await mail.send(
      new PaymentFailedEmail({
        email: user.displayEmail,
        firstName: user.firstName,
        accessEndsAt,
      })
    );
  }
}

emitter.listen(PaymentFailedEvent, [guardListener(PaymentFailedHandler)]);
emitter.listen(SubscriptionCreatedEvent, [
  guardListener(SubscriptionCreatedHandler),
]);
emitter.listen(SubscriptionDeletedEvent, [
  guardListener(SubscriptionDeletedHandler),
]);
