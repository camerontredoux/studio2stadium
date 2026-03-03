import { db } from "#database/connection";
import { outboxService } from "#database/outbox-service";
import { BaseEvent } from "@adonisjs/core/events";
import emitter from "@adonisjs/core/services/emitter";
import mail from "@adonisjs/mail/services/main";
import ProspectStatusEmail from "./email.ts";

interface ProspectStatusEventData {
  dancerId: string;
  schoolId: string;
  status: string;
  isAdmin?: boolean;
}

export class ProspectStatusEvent extends BaseEvent {
  constructor(public data: ProspectStatusEventData) {
    super();
  }
}

class ProspectStatusHandler {
  async handle(event: ProspectStatusEvent) {
    const { dancerId, schoolId, status, isAdmin } = event.data;

    // Outbox entry - simple, just IDs and status
    await outboxService.publish({
      type: "dancer.prospect-status",
      payload: { dancerId, schoolId, status },
    });

    // Skip email for admin users
    if (isAdmin) return;

    // Email still needs details - fetch them
    const [dancer, school] = await Promise.all([
      db.query.dancerProfiles.findFirst({
        where: { id: dancerId },
        with: { user: true },
      }),
      db.query.schoolProfiles.findFirst({
        where: { id: schoolId },
        with: { user: true },
      }),
    ]);

    if (!dancer?.user || !school?.user) {
      return;
    }

    await mail.send(
      new ProspectStatusEmail({
        dancerEmail: dancer.user.displayEmail,
        dancerName: dancer.user.firstName,
        schoolName: school.name,
        status,
      })
    );
  }
}

emitter.listen(ProspectStatusEvent, [ProspectStatusHandler]);
