import { test } from "@japa/runner";
import emitter from "@adonisjs/core/services/emitter";
import mail from "@adonisjs/mail/services/main";
import { db } from "#database/connection";
import { schoolApplications, schoolProfiles } from "#database/schema/schools";
import { users } from "#database/schema/users";
import { DatabaseService } from "#database/service";
import env from "#start/env";
import ApplicationSubmittedEmail, {
  DEFAULT_APPLICATION_ALERT_EMAIL,
} from "./email.ts";
import {
  ApplicationSubmittedEvent,
  ApplicationSubmittedHandler,
} from "./event.ts";
import { SubmitApplicationService } from "./service.ts";

let seq = 0;
function unique(prefix: string) {
  seq += 1;
  return `${prefix}-${Date.now()}-${seq}`;
}

async function makeSchool() {
  const handle = unique("school");
  const [user] = await db
    .insert(users)
    .values({
      username: handle,
      email: `${handle}@example.com`,
      role: "user",
      type: "school",
      displayEmail: `${handle}@example.com`,
      firstName: "Casey",
      lastName: "Coach",
      password: "x",
    })
    .returning();

  const [school] = await db
    .insert(schoolProfiles)
    .values({ userId: user!.id, name: unique("Bridgeport"), location: "CT" })
    .returning();

  return { user: user!, school: school! };
}

const service = () => new SubmitApplicationService(new DatabaseService());
const payload = { mediaId: "media-1", phone: "555-0100" };

test.group("SubmitApplicationService", (group) => {
  group.each.setup(async () => {
    await db.delete(schoolApplications).execute();
    await db.delete(schoolProfiles).execute();
    await db.delete(users).execute();
  });

  test("dispatches ApplicationSubmittedEvent after the application is saved", async ({
    assert,
    cleanup,
  }) => {
    const events = emitter.fake();
    cleanup(() => emitter.restore());
    const { user, school } = await makeSchool();

    await service().execute(school.id, user.id, payload);

    const application = await db.query.schoolApplications.findFirst({
      where: { schoolId: school.id },
    });
    assert.exists(application);
    events.assertEmitted(
      ApplicationSubmittedEvent,
      ({ data: event }) =>
        event.data.schoolId === school.id &&
        event.data.userId === user.id &&
        event.data.submittedAt.getTime() === application!.createdAt.getTime()
    );
  });

  test("a repeat submit fails and does not dispatch a second event", async ({
    assert,
    cleanup,
  }) => {
    const events = emitter.fake();
    cleanup(() => emitter.restore());
    const { user, school } = await makeSchool();

    await service().execute(school.id, user.id, payload);
    await assert.rejects(() => service().execute(school.id, user.id, payload));

    events.assertEmittedCount(ApplicationSubmittedEvent, 1);
  });
});

test.group("ApplicationSubmittedHandler", (group) => {
  group.each.setup(async () => {
    await db.delete(schoolApplications).execute();
    await db.delete(schoolProfiles).execute();
    await db.delete(users).execute();
  });

  test("emails the application alert address with the school and applicant", async ({
    assert,
    cleanup,
  }) => {
    const fake = mail.fake();
    cleanup(() => mail.restore());
    const { user, school } = await makeSchool();
    const submittedAt = new Date("2026-10-23T18:55:31Z");

    await new ApplicationSubmittedHandler().handle(
      new ApplicationSubmittedEvent({
        schoolId: school.id,
        userId: user.id,
        submittedAt,
      })
    );

    assert.isUndefined(env.get("APPLICATION_ALERT_EMAIL"));
    fake.mails.assertSentCount(ApplicationSubmittedEmail, 1);
    fake.mails.assertSent(ApplicationSubmittedEmail, ({ message }) => {
      message.assertTo(DEFAULT_APPLICATION_ALERT_EMAIL);
      message.assertReplyTo(user.displayEmail);
      message.assertSubject(`New school application: ${school.name}`);
      message.assertHtmlIncludes(school.name);
      message.assertHtmlIncludes("Casey Coach");
      message.assertHtmlIncludes(user.displayEmail);
      message.assertHtmlIncludes("Oct 23, 2026, 2:55 PM ET");
      message.assertHtmlIncludes(`${env.get("SITE_URL")}/admin/applications`);
      return true;
    });
    assert.equal(DEFAULT_APPLICATION_ALERT_EMAIL, "abbey@studio2stadium.com");
  });
});
