import { db } from "#database/connection";
import { AppEvent } from "#shared/event";
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

class DancerCreatedHandler {
  async handle(event: DancerCreatedEvent) {
    const { userId } = event.data;

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
