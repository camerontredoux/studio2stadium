import { db } from "#database/connection";
import { outboxService } from "#database/outbox-service";
import { AppEvent } from "#shared/event";
import env from "#start/env";
import emitter from "@adonisjs/core/services/emitter";
import mail from "@adonisjs/mail/services/main";
import ShowInterestEmail from "./email.ts";

interface ShowInterestEventData {
  dancerId: string;
  schoolId: string;
  interestCount: number;
}

export class ShowInterestEvent extends AppEvent {
  constructor(public data: ShowInterestEventData) {
    super();
  }
}

class ShowInterestHandler {
  async handle(event: ShowInterestEvent) {
    const { dancerId, schoolId, interestCount } = event.data;

    await outboxService.publish({
      type: "school.interest",
      payload: { dancerId, schoolId },
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

    const dancerName = `${dancer.user.firstName} ${dancer.user.lastName}`;
    const dancerProfileUrl = `${env.get("SITE_URL")}/${dancer.user.username}`;

    await mail.send(
      new ShowInterestEmail({
        schoolEmail: school.user.displayEmail,
        schoolName: school.name,
        dancerName,
        dancerProfileUrl,
        interestCount,
      })
    );
  }
}

emitter.listen(ShowInterestEvent, [ShowInterestHandler]);
