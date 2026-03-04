import { db } from "#database/connection";
import { outboxService } from "#database/outbox-service";
import { AppEvent } from "#shared/event";
import emitter from "@adonisjs/core/services/emitter";
import mail from "@adonisjs/mail/services/main";
import ProspectStatusEmail from "./email.ts";

interface ProspectStatusEventData {
  dancerId: string;
  schoolId: string;
  status: string;
}

export class ProspectStatusEvent extends AppEvent {
  constructor(public data: ProspectStatusEventData) {
    super();
  }
}

class ProspectStatusHandler {
  async handle(event: ProspectStatusEvent) {
    const { dancerId, schoolId, status } = event.data;

    await outboxService.publish({
      type: "dancer.prospect-status",
      payload: { dancerId, schoolId, status },
    });

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

    if (!dancer.user.notifications) {
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
