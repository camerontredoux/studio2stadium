import { db } from "#database/connection";
import { outboxService } from "#database/outbox-service";
import { BaseEvent } from "@adonisjs/core/events";
import emitter from "@adonisjs/core/services/emitter";
import mail from "@adonisjs/mail/services/main";
import SchoolWelcomeEmail from "./email.ts";

interface SchoolApprovedEventData {
  userId: string;
  schoolId: string;
  schoolName: string;
}

export class SchoolApprovedEvent extends BaseEvent {
  constructor(public data: SchoolApprovedEventData) {
    super();
  }
}

class SchoolApprovedHandler {
  async handle(event: SchoolApprovedEvent) {
    const { userId, schoolId, schoolName } = event.data;

    await outboxService.publish({
      type: "school.approved",
      payload: { schoolId },
    });

    // Email still needs user details
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
      new SchoolWelcomeEmail({
        email: user.displayEmail,
        firstName: user.firstName,
        schoolName,
      })
    );
  }
}

emitter.listen(SchoolApprovedEvent, [SchoolApprovedHandler]);
