import { db } from "#database/connection";
import { outboxService } from "#database/outbox-service";
import { AppEvent } from "#shared/event";
import env from "#start/env";
import emitter from "@adonisjs/core/services/emitter";
import mail from "@adonisjs/mail/services/main";
import ProfileViewedEmail from "./email.ts";

interface ProfileViewedEventData {
  dancerId: string;
  schoolId: string;
}

export class ProfileViewedEvent extends AppEvent {
  constructor(public data: ProfileViewedEventData) {
    super();
  }
}

class ProfileViewedHandler {
  async handle(event: ProfileViewedEvent) {
    const { dancerId, schoolId } = event.data;

    await outboxService.publish({
      type: "dancer.profile-viewed",
      payload: { dancerId, schoolId },
    });

    // Email still needs details - fetch them
    const [dancer, school] = await Promise.all([
      db.query.dancerProfiles.findFirst({
        where: { id: dancerId },
        with: { user: { with: { subscription: true } } },
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

    const schoolProfileUrl = `${env.get("SITE_URL")}/explore/${school.user.username}`;
    const upgradeUrl = `${env.get("SITE_URL")}/settings/membership`;

    const sub = dancer.user.subscription;
    const isPremium =
      !!sub &&
      sub.status === "active" &&
      !!sub.currentPeriodEnd &&
      sub.currentPeriodEnd > new Date();

    await mail.send(
      new ProfileViewedEmail({
        dancerEmail: dancer.user.displayEmail,
        dancerName: dancer.user.firstName,
        schoolName: school.name,
        schoolProfileUrl,
        freemium: !isPremium,
        upgradeUrl,
      })
    );
  }
}

emitter.listen(ProfileViewedEvent, [ProfileViewedHandler]);
