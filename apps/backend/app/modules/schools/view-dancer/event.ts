import { db } from "#database/connection";
import { outboxService } from "#database/outbox-service";
import env from "#start/env";
import { BaseEvent } from "@adonisjs/core/events";
import emitter from "@adonisjs/core/services/emitter";
import mail from "@adonisjs/mail/services/main";
import ProfileViewedEmail from "./email.ts";

interface ProfileViewedEventData {
  dancerId: string;
  schoolId: string;
  isAdmin?: boolean;
}

export class ProfileViewedEvent extends BaseEvent {
  constructor(public data: ProfileViewedEventData) {
    super();
  }
}

class ProfileViewedHandler {
  async handle(event: ProfileViewedEvent) {
    const { dancerId, schoolId, isAdmin } = event.data;

    // Outbox entry - simple, just IDs
    await outboxService.publish({
      type: "dancer.profile-viewed",
      payload: { dancerId, schoolId },
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

    const schoolProfileUrl = `${env.get("SITE_URL")}/school/${school.user.username}`;

    await mail.send(
      new ProfileViewedEmail({
        dancerEmail: dancer.user.displayEmail,
        dancerName: dancer.user.firstName,
        schoolName: school.name,
        schoolProfileUrl,
      })
    );
  }
}

emitter.listen(ProfileViewedEvent, [ProfileViewedHandler]);
