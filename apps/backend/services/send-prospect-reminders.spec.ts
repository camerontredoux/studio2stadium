import { test } from "@japa/runner";
import mail from "@adonisjs/mail/services/main";
import { db } from "#database/connection";
import { crvSubmissions } from "#database/schema/crv";
import { dancerProfiles } from "#database/schema/dancers";
import { schoolProfiles } from "#database/schema/schools";
import { users } from "#database/schema/users";
import { ProspectReminderMail } from "#shared/prospect-emails/reminder-email";
import SendProspectRemindersService from "./send-prospect-reminders.ts";

let seq = 0;
async function makeSchoolWithPendingSubmission() {
  seq += 1;
  const handle = `rem-${Date.now()}-${seq}`;

  const [schoolUser] = await db
    .insert(users)
    .values({
      username: handle,
      email: `${handle}@example.com`,
      role: "user",
      type: "school",
      displayEmail: `${handle}@example.com`,
      firstName: "Test",
      lastName: "School",
      password: "x",
      notifications: true,
    })
    .returning();

  const [school] = await db
    .insert(schoolProfiles)
    .values({ userId: schoolUser!.id, name: `School ${handle}`, location: "CO" })
    .returning();

  const [dancerUser] = await db
    .insert(users)
    .values({
      username: `${handle}-d`,
      email: `${handle}-d@example.com`,
      role: "user",
      type: "dancer",
      displayEmail: `${handle}-d@example.com`,
      firstName: "Test",
      lastName: "Dancer",
      password: "x",
    })
    .returning();

  const [dancer] = await db
    .insert(dancerProfiles)
    .values({ userId: dancerUser!.id, birthday: "2006-01-01", location: "CO" })
    .returning();

  await db
    .insert(crvSubmissions)
    .values({ dancerId: dancer!.id, schoolId: school!.id, status: "pending" });

  return { schoolUser: schoolUser!, school: school! };
}

test.group("SendProspectRemindersService", (group) => {
  group.each.setup(async () => {
    await db.delete(crvSubmissions).execute();
    await db.delete(dancerProfiles).execute();
    await db.delete(schoolProfiles).execute();
    await db.delete(users).execute();
  });

  group.each.teardown(() => {
    mail.restore();
  });

  test("dry run resolves recipients but sends nothing", async ({ assert }) => {
    await makeSchoolWithPendingSubmission();
    const mailer = mail.fake();

    const result = await new SendProspectRemindersService().run({ dryRun: true });

    assert.equal(result.recipients, 1);
    assert.equal(result.sent, 0);
    assert.isTrue(result.dryRun);
    mailer.mails.assertNoneSent();
  });

  test("sends one email per recipient when enabled", async ({ assert }) => {
    const { schoolUser } = await makeSchoolWithPendingSubmission();
    const mailer = mail.fake();

    const result = await new SendProspectRemindersService({
      enabled: true,
    }).run();

    assert.equal(result.recipients, 1);
    assert.equal(result.sent, 1);
    assert.equal(result.failed, 0);
    assert.isFalse(result.skipped);
    mailer.mails.assertSent(ProspectReminderMail, (mail) =>
      mail.message.hasTo(schoolUser.email)
    );
  });

  test("skips entirely when the kill switch is off", async ({ assert }) => {
    await makeSchoolWithPendingSubmission();
    const mailer = mail.fake();

    const result = await new SendProspectRemindersService({
      enabled: false,
    }).run();

    assert.isTrue(result.skipped);
    assert.equal(result.sent, 0);
    mailer.mails.assertNoneSent();
  });

  test("one failure does not abort the rest", async ({ assert }) => {
    await makeSchoolWithPendingSubmission();
    await makeSchoolWithPendingSubmission();
    const mailer = mail.fake();

    let call = 0;
    const original = mailer.send.bind(mailer);
    mailer.send = (async (...args: unknown[]) => {
      call += 1;
      if (call === 1) throw new Error("ses rejected");
      return await (original as (...a: unknown[]) => Promise<unknown>)(...args);
    }) as typeof mailer.send;

    const result = await new SendProspectRemindersService({ enabled: true }).run();

    assert.equal(result.recipients, 2);
    assert.equal(result.sent, 1);
    assert.equal(result.failed, 1);
  });
});
