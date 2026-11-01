import { db } from "#database/connection";
import { BaseEvent } from "@adonisjs/core/events";
import emitter from "@adonisjs/core/services/emitter";
import mail from "@adonisjs/mail/services/main";
import ApplicationSubmittedEmail from "./email.ts";

interface ApplicationSubmittedEventData {
  schoolId: string;
  userId: string;
  submittedAt: Date;
}

export class ApplicationSubmittedEvent extends BaseEvent {
  constructor(public data: ApplicationSubmittedEventData) {
    super();
  }
}

export class ApplicationSubmittedHandler {
  async handle(event: ApplicationSubmittedEvent) {
    const { schoolId, userId, submittedAt } = event.data;

    const [school, user] = await Promise.all([
      db.query.schoolProfiles.findFirst({ where: { id: schoolId } }),
      db.query.users.findFirst({ where: { id: userId } }),
    ]);

    if (!school || !user) {
      return;
    }

    await mail.send(
      new ApplicationSubmittedEmail({
        schoolName: school.name,
        applicantName: `${user.firstName} ${user.lastName}`,
        applicantEmail: user.displayEmail,
        submittedAt,
      })
    );
  }
}

emitter.listen(ApplicationSubmittedEvent, [ApplicationSubmittedHandler]);
