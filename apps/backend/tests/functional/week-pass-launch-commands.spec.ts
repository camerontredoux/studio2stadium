import { snapshotEnv } from "#tests/helpers/env";
import { db } from "#database/connection";
import { users } from "#database/schema/users";
import {
  emailSuppressions,
  weekPassEmails,
} from "#database/schema/week-pass-emails";
import { SAMPLE_HEADER } from "#shared/week-pass-emails/sample";
import env from "#start/env";
import ace from "@adonisjs/core/services/ace";
import app from "@adonisjs/core/services/app";
import mail from "@adonisjs/mail/services/main";
import { test } from "@japa/runner";
import { sql } from "drizzle-orm";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import EmailSuppressionsImport from "../../commands/email-suppressions-import.ts";
import WeekPassEmailsSendSample from "../../commands/week-pass-emails-send-sample.ts";

// Reserved example domains only; no real address appears in these tests.
const SAMPLE_TO = "reviewer@example.com";

function scratch() {
  return mkdtempSync(join(tmpdir(), "s2s-cmd-test-"));
}

async function run<
  T extends typeof EmailSuppressionsImport | typeof WeekPassEmailsSendSample,
>(Command: T, argv: string[]) {
  const command = await ace.create(Command, argv);
  command.ui.switchMode("raw");
  await command.exec();
  const logs = command.ui.logger
    .getLogs()
    .map((l) => l.message)
    .join("\n");
  return { command, logs };
}

test.group("email-suppressions:import", (group) => {
  let dir: string;
  group.each.setup(async () => {
    await db.execute(sql`truncate table ${emailSuppressions}`);
    dir = scratch();
    return () => rmSync(dir, { recursive: true, force: true });
  });

  const senderFile = () => {
    const file = join(dir, "sender.json");
    writeFileSync(
      file,
      JSON.stringify([
        {
          email: "One@Example.com",
          status: { email: "unsubscribed", temail: "active" },
          unsubscribed_at: "2026-03-01T00:00:00Z",
          bounced_at: null,
        },
        {
          email: "two@example.com",
          status: { email: "spam_reported", temail: "active" },
          unsubscribed_at: null,
          bounced_at: null,
        },
      ])
    );
    return file;
  };

  test("dry run by default: counts only, nothing written", async ({
    assert,
  }) => {
    const { command, logs } = await run(EmailSuppressionsImport, [
      "sender",
      senderFile(),
    ]);
    command.assertSucceeded();
    assert.include(logs, "Dry run");
    assert.include(logs, "2 new");
    assert.notInclude(logs.toLowerCase(), "one@example.com");
    assert.notInclude(logs, "two@example.com");
    assert.include(logs, "EMAIL_SUPPRESSION_IMPORTED_AT was not changed");
    assert.lengthOf(await db.select().from(emailSuppressions), 0);
  });

  test("--apply writes once; running again changes nothing", async ({
    assert,
  }) => {
    const file = senderFile();
    const first = await run(EmailSuppressionsImport, [
      "sender",
      file,
      "--apply",
    ]);
    first.command.assertSucceeded();
    assert.include(first.logs, "2 new");

    const second = await run(EmailSuppressionsImport, [
      "sender",
      file,
      "--apply",
    ]);
    second.command.assertSucceeded();
    assert.include(second.logs, "0 new, 0 refreshed, 2 unchanged");
    assert.lengthOf(await db.select().from(emailSuppressions), 2);
  });

  test("an invalid entry anywhere stops the import before writing", async ({
    assert,
  }) => {
    const file = join(dir, "bad.txt");
    writeFileSync(file, "fine@example.com\nnot an address\n");
    const { command, logs } = await run(EmailSuppressionsImport, [
      "removals",
      file,
      "--apply",
    ]);
    command.assertFailed();
    assert.include(logs, "Entry 2: not a valid email address");
    assert.include(logs, "Nothing was written");
    assert.notInclude(logs, "fine@example.com");
    assert.lengthOf(await db.select().from(emailSuppressions), 0);
  });

  test("an export inside the project is refused", async ({ assert }) => {
    const file = app.makePath("suppression-test-export.json");
    writeFileSync(file, "[]");
    try {
      const { command, logs } = await run(EmailSuppressionsImport, [
        "ses",
        file,
      ]);
      command.assertFailed();
      assert.include(logs, "inside the project");
    } finally {
      rmSync(file, { force: true });
    }
  });

  test("an unknown format is refused", async () => {
    const { command } = await run(EmailSuppressionsImport, [
      "mailchimp",
      senderFile(),
    ]);
    command.assertFailed();
  });
});

test.group("week-pass-emails:send-sample", (group) => {
  const KEYS = [
    "WEEK_PASS_SAMPLE_RECIPIENT",
    "MAIL_POSTAL_ADDRESS",
    "WEEK_PASS_EMAIL_ASSET_BASE_URL",
    "WEEK_PASS_WELCOME_EMAIL_ENABLED",
    "WEEK_PASS_EXPIRED_EMAIL_ENABLED",
    "WEEK_PASS_EMAIL_ASSETS",
  ] as const;

  group.each.setup(async () => {
    await db.execute(sql`truncate table ${users} cascade`);
    const restore = snapshotEnv(KEYS);
    env.set("WEEK_PASS_SAMPLE_RECIPIENT", SAMPLE_TO);
    env.set("MAIL_POSTAL_ADDRESS", "TEST ADDRESS, NOT REAL");
    env.set(
      "WEEK_PASS_EMAIL_ASSET_BASE_URL",
      "https://assets.example.com/week-pass"
    );
    // Both customer switches stay off throughout.
    env.set("WEEK_PASS_WELCOME_EMAIL_ENABLED", false);
    env.set("WEEK_PASS_EXPIRED_EMAIL_ENABLED", false);
    env.set("WEEK_PASS_EMAIL_ASSETS", "");
    return () => {
      mail.restore();
      restore();
    };
  });

  test("by default it only previews: nothing is sent or stored", async ({
    assert,
  }) => {
    const fake = mail.fake();
    const { command, logs } = await run(WeekPassEmailsSendSample, [SAMPLE_TO]);
    command.assertSucceeded();
    assert.include(logs, "Dry run: nothing was sent");
    assert.include(logs, "Your S2S Week Pass starts now");
    assert.include(logs, "Your next S2S Week Pass is lined up");
    assert.include(logs, "welcome off, expired off");
    assert.lengthOf(fake.mails.sent(), 0);
    assert.lengthOf(await db.select().from(weekPassEmails), 0);
  });

  test("--send delivers both fake-data variants to the one configured mailbox", async ({
    assert,
  }) => {
    const fake = mail.fake();
    const { command } = await run(WeekPassEmailsSendSample, [
      SAMPLE_TO,
      "--send",
    ]);
    command.assertSucceeded();

    const messages = fake.mails.sent();
    assert.lengthOf(messages, 2);
    for (const message of messages) {
      const json = message.message.toJSON().message as any;
      const to = (Array.isArray(json.to) ? json.to : [json.to]).map(
        (t: any) => t.address ?? t
      );
      assert.deepEqual(to, [SAMPLE_TO]);
      assert.isUndefined(json.cc);
      assert.isUndefined(json.bcc);
      const headers = JSON.stringify(json.headers ?? {});
      assert.include(headers, SAMPLE_HEADER);
      assert.include(headers, "List-Unsubscribe");
      assert.include(json.text, "Hi Sample,");
      assert.include(json.html, "TEST ADDRESS, NOT REAL");
      assert.include(json.html, "https://assets.example.com/week-pass/");
      assert.include(json.html, 'href="http://localhost:5173/sample-dancer"');
      assert.notInclude(json.html, "—");
    }
    assert.deepEqual(
      messages.map((m) => m.message.toJSON().message.subject),
      ["Your S2S Week Pass starts now", "Your next S2S Week Pass is lined up"]
    );
    assert.lengthOf(await db.select().from(weekPassEmails), 0);
    assert.lengthOf(await db.select().from(users), 0);
  });

  test("--variant sends just one", async ({ assert }) => {
    const fake = mail.fake();
    const { command } = await run(WeekPassEmailsSendSample, [
      SAMPLE_TO,
      "--variant",
      "queued",
      "--send",
    ]);
    command.assertSucceeded();
    assert.lengthOf(fake.mails.sent(), 1);
  });

  for (const [name, setup, argv, expected] of [
    [
      "a mailbox other than the configured one",
      () => {},
      ["someone@example.com", "--send"],
      "does not exactly match WEEK_PASS_SAMPLE_RECIPIENT",
    ],
    [
      "more than one address",
      () => {},
      [`${SAMPLE_TO},other@example.com`, "--send"],
      "exactly one email address",
    ],
    [
      "no configured sample mailbox",
      () => env.set("WEEK_PASS_SAMPLE_RECIPIENT", "" as never),
      [SAMPLE_TO, "--send"],
      "WEEK_PASS_SAMPLE_RECIPIENT is not set",
    ],
    [
      "no postal address",
      () => env.set("MAIL_POSTAL_ADDRESS", ""),
      [SAMPLE_TO, "--send"],
      "MAIL_POSTAL_ADDRESS is not set",
    ],
  ] as const) {
    test(`refuses to send to ${name}`, async ({ assert }) => {
      setup();
      const fake = mail.fake();
      const { command, logs } = await run(WeekPassEmailsSendSample, [...argv]);
      command.assertFailed();
      assert.include(logs, expected);
      assert.include(logs, "nothing was sent");
      assert.lengthOf(fake.mails.sent(), 0);
    });
  }

  test("--out writes the rendered samples outside the project, never inside it", async ({
    assert,
  }) => {
    const dir = scratch();
    try {
      const { command } = await run(WeekPassEmailsSendSample, [
        SAMPLE_TO,
        "--out",
        dir,
      ]);
      command.assertSucceeded();
      const html = readFileSync(
        join(dir, "week-pass-welcome-queued.html"),
        "utf8"
      );
      assert.include(html, "Your pass starts:");
      assert.notInclude(html, "starts now");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }

    const inside = await run(WeekPassEmailsSendSample, [
      SAMPLE_TO,
      "--out",
      app.makePath("sample-out"),
    ]);
    inside.command.assertFailed();
    assert.include(inside.logs, "outside the project");
  });

  test("a send is refused until every welcome image has a hosted URL", async ({
    assert,
  }) => {
    env.set("WEEK_PASS_EMAIL_ASSET_BASE_URL", "");
    env.set(
      "WEEK_PASS_EMAIL_ASSETS",
      JSON.stringify({
        "logo-wordmark-white.png": "https://cdn.example.com/1_logo.png",
        "hero-welcome.jpg": "https://cdn.example.com/2_hero.jpg",
        "icon-calendar.png": "https://cdn.example.com/3_calendar.png",
      })
    );
    const fake = mail.fake();
    const refused = await run(WeekPassEmailsSendSample, [SAMPLE_TO, "--send"]);
    refused.command.assertFailed();
    assert.include(refused.logs, '"icon-shield.png" has no hosted URL');
    assert.lengthOf(fake.mails.sent(), 0);

    env.set(
      "WEEK_PASS_EMAIL_ASSETS",
      JSON.stringify({
        "logo-wordmark-white.png": "https://cdn.example.com/1_logo.png",
        "hero-welcome.jpg": "https://cdn.example.com/2_hero.jpg",
        "icon-calendar.png": "https://cdn.example.com/3_calendar.png",
        "icon-shield.png": "https://cdn.example.com/4_shield.png",
      })
    );
    const ok = await run(WeekPassEmailsSendSample, [
      SAMPLE_TO,
      "--variant",
      "current",
      "--send",
    ]);
    ok.command.assertSucceeded();
    assert.include(
      ok.logs,
      "hero-welcome.jpg -> https://cdn.example.com/2_hero.jpg"
    );
    assert.include(ok.logs, "Sender:    not checked");
    const html = fake.mails.sent()[0]!.message.toJSON().message.html as string;
    assert.include(html, "https://cdn.example.com/4_shield.png");
  });
});
