import env from "#start/env";
import { test } from "@japa/runner";
import { activeKinds, weekPassEmailConfig } from "./config.ts";

const KEYS = [
  "WEEK_PASS_WELCOME_EMAIL_ENABLED",
  "WEEK_PASS_EXPIRED_EMAIL_ENABLED",
  "WEEK_PASS_EMAILS_ACTIVE_FROM",
  "WEEK_PASS_EMAILS_TIMEZONE",
  "MAIL_POSTAL_ADDRESS",
  "EMAIL_SUPPRESSION_IMPORTED_AT",
  "CRON_EMAILS_ENABLED",
] as const;

test.group("Week Pass email settings", (group) => {
  group.each.setup(() => {
    const saved = Object.fromEntries(KEYS.map((k) => [k, env.get(k)]));
    for (const k of KEYS) {
      env.set(k, (k.endsWith("_ENABLED") ? false : "") as never);
    }
    return () => {
      for (const k of KEYS) env.set(k, saved[k] as never);
    };
  });

  const ready = () => {
    env.set("WEEK_PASS_EMAILS_ACTIVE_FROM", "2026-12-01T17:00:00Z");
    env.set("MAIL_POSTAL_ADDRESS", "TEST ADDRESS, NOT REAL");
    env.set("EMAIL_SUPPRESSION_IMPORTED_AT", "2026-11-30T00:00:00Z");
  };

  test("everything is off by default", ({ assert }) => {
    const config = weekPassEmailConfig();
    assert.isFalse(config.welcome.enabled);
    assert.isFalse(config.expired.enabled);
    assert.deepEqual(activeKinds(config), []);
  });

  test("the general scheduled-email switch does not turn these on", ({
    assert,
  }) => {
    ready();
    env.set("CRON_EMAILS_ENABLED", true);
    assert.deepEqual(activeKinds(weekPassEmailConfig()), []);
  });

  test("each switch turns on only its own email", ({ assert }) => {
    ready();
    env.set("WEEK_PASS_WELCOME_EMAIL_ENABLED", true);
    assert.deepEqual(activeKinds(weekPassEmailConfig()), ["welcome"]);
  });

  test("a switch on without a postal address or cutoff stays off and says why", ({
    assert,
  }) => {
    env.set("WEEK_PASS_WELCOME_EMAIL_ENABLED", true);
    env.set("WEEK_PASS_EXPIRED_EMAIL_ENABLED", true);
    const config = weekPassEmailConfig();
    assert.deepEqual(activeKinds(config), []);
    assert.isTrue(
      config.welcome.problems.some((p) => p.startsWith("MAIL_POSTAL_ADDRESS"))
    );
    assert.isTrue(
      config.welcome.problems.some((p) =>
        p.startsWith("WEEK_PASS_EMAILS_ACTIVE_FROM")
      )
    );
    assert.isTrue(
      config.expired.problems.some((p) =>
        p.startsWith("EMAIL_SUPPRESSION_IMPORTED_AT")
      )
    );
  });

  test("the offer stays off until the suppression history is imported", ({
    assert,
  }) => {
    ready();
    env.set("EMAIL_SUPPRESSION_IMPORTED_AT", "");
    env.set("WEEK_PASS_EXPIRED_EMAIL_ENABLED", true);
    env.set("WEEK_PASS_WELCOME_EMAIL_ENABLED", true);
    assert.deepEqual(activeKinds(weekPassEmailConfig()), ["welcome"]);
  });

  test("a cutoff without a zone, or an unknown time zone, is refused", ({
    assert,
  }) => {
    ready();
    env.set("WEEK_PASS_WELCOME_EMAIL_ENABLED", true);
    env.set("WEEK_PASS_EMAILS_ACTIVE_FROM", "2026-12-01");
    assert.deepEqual(activeKinds(weekPassEmailConfig()), []);

    ready();
    env.set("WEEK_PASS_EMAILS_TIMEZONE", "Mars/Olympus");
    assert.deepEqual(activeKinds(weekPassEmailConfig()), []);
  });
});
