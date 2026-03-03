import { db } from "#database/connection";
import { BaseEvent } from "@adonisjs/core/events";
import emitter from "@adonisjs/core/services/emitter";
import mail from "@adonisjs/mail/services/main";
import DancerWelcomeEmail from "./email.ts";

interface DancerCreatedEventData {
  userId: string;
  isAdmin?: boolean;
}

export class DancerCreatedEvent extends BaseEvent {
  constructor(public data: DancerCreatedEventData) {
    super();
  }
}

class DancerCreatedHandler {
  async handle(event: DancerCreatedEvent) {
    const { userId, isAdmin } = event.data;

    if (isAdmin) return;

    const user = await db.query.users.findFirst({
      where: { id: userId },
    });

    if (!user) {
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
