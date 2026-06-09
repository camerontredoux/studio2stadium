import { db } from "#database/connection";
import { outboxService } from "#database/outbox-service";
import env from "#start/env";
import { BaseEvent } from "@adonisjs/core/events";
import app from "@adonisjs/core/services/app";
import emitter from "@adonisjs/core/services/emitter";
import mail from "@adonisjs/mail/services/main";
import SchoolWelcomeEmail from "./email.ts";
import SchoolRejectedEmail from "./rejected-email.ts";

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

    if (app.inProduction) {
      await fetch(env.get("CLOUDFLARE_DEPLOY_HOOK"), { method: "POST" });
    }

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

interface SchoolRejectedEventData {
  userId: string;
  schoolName: string;
  reason?: string;
}

export class SchoolRejectedEvent extends BaseEvent {
  constructor(public data: SchoolRejectedEventData) {
    super();
  }
}

class SchoolRejectedHandler {
  async handle(event: SchoolRejectedEvent) {
    const { userId, schoolName, reason } = event.data;

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
      new SchoolRejectedEmail({
        email: user.displayEmail,
        firstName: user.firstName,
        schoolName,
        reason,
      })
    );
  }
}

emitter.listen(SchoolRejectedEvent, [SchoolRejectedHandler]);
