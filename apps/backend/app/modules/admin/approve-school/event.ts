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
  isAdmin?: boolean;
}

export class SchoolApprovedEvent extends BaseEvent {
  constructor(public data: SchoolApprovedEventData) {
    super();
  }
}

class SchoolApprovedHandler {
  async handle(event: SchoolApprovedEvent) {
    const { userId, schoolId, schoolName, isAdmin } = event.data;

    // Outbox entry - processor adds to global notifications
    await outboxService.publish({
      type: "school.approved",
      payload: { schoolId },
    });

    // Skip email for admin users
    if (isAdmin) return;

    // Email still needs user details
    const user = await db.query.users.findFirst({
      where: { id: userId },
    });

    if (!user) {
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
