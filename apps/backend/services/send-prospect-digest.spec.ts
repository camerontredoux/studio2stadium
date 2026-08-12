import { test } from "@japa/runner";
import mail from "@adonisjs/mail/services/main";
import { DateTime } from "luxon";
import { db } from "#database/connection";
import { crvSubmissions } from "#database/schema/crv";
import { dancerProfiles } from "#database/schema/dancers";
import { schoolProfiles } from "#database/schema/schools";
import { users } from "#database/schema/users";
import { PROSPECT_TZ } from "#shared/prospect-emails/cutoff";
import { ProspectDigestMail } from "#shared/prospect-emails/digest-email";
import SendProspectDigestService from "./send-prospect-digest.ts";

let seq = 0;

async function makeDancer(label: string) {
  seq += 1;
  const handle = `dig-d-${Date.now()}-${seq}-${label}`;
  const [user] = await db
    .insert(users)
    .values({
      username: handle,
      email: `${handle}@example.com`,
      role: "user",
      type: "dancer",
      displayEmail: `${handle}@example.com`,
      firstName: "Dan",
      lastName: label,
      password: "x",
    })
    .returning();
  const [dancer] = await db
    .insert(dancerProfiles)
    .values({ userId: user!.id, birthday: "2006-01-01", location: "CO" })
    .returning();
  return dancer!;
}

async function makeSchool() {
  seq += 1;
  const handle = `dig-s-${Date.now()}-${seq}`;
  const [user] = await db
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
    .values({ userId: user!.id, name: `School ${handle}`, location: "CO" })
    .returning();
  return { user: user!, school: school! };
}

function denver(iso: string) {
  return DateTime.fromISO(iso, { zone: PROSPECT_TZ }).toJSDate();
}

test.group("SendProspectDigestService", (group) => {
  group.each.setup(async () => {
    await db.delete(crvSubmissions).execute();
    await db.delete(dancerProfiles).execute();
    await db.delete(schoolProfiles).execute();
    await db.delete(users).execute();
  });

  group.each.teardown(() => {
    mail.restore();
  });

  test("splits submissions on the most recent August 1", async ({ assert }) => {
    const { school } = await makeSchool();
    const early = await makeDancer("early");
    const recent = await makeDancer("recent");

    await db.insert(crvSubmissions).values([
      {
        dancerId: early.id,
        schoolId: school.id,
        status: "pending",
        createdAt: denver("2026-06-15T12:00:00"),
      },
      {
        dancerId: recent.id,
        schoolId: school.id,
        status: "pending",
        createdAt: denver("2026-09-20T12:00:00"),
      },
    ]);

    mail.fake();

    const service = new SendProspectDigestService({ enabled: true });
    const result = await service.run({
      dryRun: true,
      now: denver("2027-01-02T09:00:00"),
    });

    assert.equal(result.recipients, 1);
    assert.deepEqual(result.buckets, [{ schoolId: school.id, early: 1, fresh: 1 }]);
  });

  test("a January run does not put everything in early", async ({ assert }) => {
    const { school } = await makeSchool();
    const dancer = await makeDancer("after-aug");

    await db.insert(crvSubmissions).values({
      dancerId: dancer.id,
      schoolId: school.id,
      status: "pending",
      createdAt: denver("2026-10-01T12:00:00"),
    });

    mail.fake();

    const result = await new SendProspectDigestService({ enabled: true }).run({
      dryRun: true,
      now: denver("2027-01-02T09:00:00"),
    });

    assert.deepEqual(result.buckets, [{ schoolId: school.id, early: 0, fresh: 1 }]);
  });

  test("sends one digest per recipient when enabled", async ({ assert }) => {
    const { school, user } = await makeSchool();
    const dancer = await makeDancer("x");
    await db.insert(crvSubmissions).values({
      dancerId: dancer.id,
      schoolId: school.id,
      status: "pending",
      createdAt: denver("2026-09-01T12:00:00"),
    });

    const mailer = mail.fake();

    const result = await new SendProspectDigestService({ enabled: true }).run({
      now: denver("2027-01-02T09:00:00"),
    });

    assert.equal(result.sent, 1);
    mailer.mails.assertSent(ProspectDigestMail, (m) => m.message.hasTo(user.email));
  });

  test("skips entirely when the kill switch is off", async ({ assert }) => {
    const { school } = await makeSchool();
    const dancer = await makeDancer("y");
    await db.insert(crvSubmissions).values({
      dancerId: dancer.id,
      schoolId: school.id,
      status: "pending",
      createdAt: denver("2026-09-01T12:00:00"),
    });

    mail.fake();

    const result = await new SendProspectDigestService({ enabled: false }).run({
      now: denver("2027-01-02T09:00:00"),
    });

    assert.isTrue(result.skipped);
    assert.equal(result.sent, 0);
  });
});
