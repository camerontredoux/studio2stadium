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
    assert.deepEqual(result.buckets, [
      { schoolId: school.id, early: 1, fresh: 1 },
    ]);
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

    assert.deepEqual(result.buckets, [
      { schoolId: school.id, early: 0, fresh: 1 },
    ]);
  });

  test("sends one digest per recipient when enabled", async ({ assert }) => {
    const { school, user } = await makeSchool();
    const early = await makeDancer("early");
    const fresh = await makeDancer("fresh");
    await db.insert(crvSubmissions).values([
      {
        dancerId: early.id,
        schoolId: school.id,
        status: "pending",
        createdAt: denver("2026-06-15T12:00:00"),
      },
      {
        dancerId: fresh.id,
        schoolId: school.id,
        status: "pending",
        createdAt: denver("2026-09-01T12:00:00"),
      },
    ]);

    const mailer = mail.fake();

    const result = await new SendProspectDigestService({ enabled: true }).run({
      now: denver("2027-01-02T09:00:00"),
    });

    assert.equal(result.sent, 1);
    mailer.mails.assertSent(ProspectDigestMail, (m) =>
      m.message.hasTo(user.email)
    );

    // Pin fresh -> newSubmissions and early -> earlySubmissions: the rendered
    // template puts "New Submissions" before "Early Submissions", so the
    // fresh dancer must appear before the early dancer in that order.
    const [sent] = mailer.mails.sent((m) => m.message.hasTo(user.email));
    sent!.message.assertHtmlIncludes(
      /New Submissions[\s\S]*Dan fresh[\s\S]*Early Submissions[\s\S]*Dan early/
    );
  });

  test("uses the provided `now` to compute the cutoff, not the wall clock", async ({
    assert,
  }) => {
    const { school } = await makeSchool();
    const dancer = await makeDancer("mid-cycle");

    await db.insert(crvSubmissions).values({
      dancerId: dancer.id,
      schoolId: school.id,
      status: "pending",
      createdAt: denver("2026-06-15T12:00:00"),
    });

    mail.fake();

    // now=2026-07-15 resolves to the *previous* cycle's cutoff (2025-08-01),
    // not the wall-clock cutoff (2026-08-01). A June 15 2026 submission is
    // `fresh` under 2025-08-01 but would be `early` under 2026-08-01 —
    // proving `now`, not `new Date()`, drives the cutoff.
    const result = await new SendProspectDigestService({ enabled: true }).run({
      dryRun: true,
      now: denver("2026-07-15T09:00:00"),
    });

    assert.deepEqual(result.buckets, [
      { schoolId: school.id, early: 0, fresh: 1 },
    ]);
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

    const mailer = mail.fake();

    const result = await new SendProspectDigestService({ enabled: false }).run({
      now: denver("2027-01-02T09:00:00"),
    });

    assert.isTrue(result.skipped);
    assert.equal(result.sent, 0);
    mailer.mails.assertNoneSent();
  });

  test("dry run still reports recipients when the kill switch is off", async ({
    assert,
  }) => {
    const { school } = await makeSchool();
    const dancer = await makeDancer("z");
    await db.insert(crvSubmissions).values({
      dancerId: dancer.id,
      schoolId: school.id,
      status: "pending",
      createdAt: denver("2026-09-01T12:00:00"),
    });

    const mailer = mail.fake();

    // The production pre-flight runs a dry run with the kill switch off —
    // there is no staging environment, so this is the one path rehearsed
    // against production data. It must report recipients, not act like the
    // kill switch is on.
    const result = await new SendProspectDigestService({ enabled: false }).run({
      dryRun: true,
      now: denver("2027-01-02T09:00:00"),
    });

    assert.equal(result.recipients, 1);
    assert.equal(result.sent, 0);
    assert.isFalse(result.skipped);
    assert.isTrue(result.dryRun);
    mailer.mails.assertNoneSent();
  });
});
