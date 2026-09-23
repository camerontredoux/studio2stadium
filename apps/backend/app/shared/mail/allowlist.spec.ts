import app from "@adonisjs/core/services/app";
import { configProvider } from "@adonisjs/core";
import { MailResponse } from "@adonisjs/mail";
import type {
  MailTransportContract,
  NodeMailerMessage,
} from "@adonisjs/mail/types";
import { test } from "@japa/runner";
import {
  AllowlistTransport,
  maskEmail,
  parseMailAllowlist,
  withMailAllowlist,
} from "./allowlist.ts";

class RecordingTransport implements MailTransportContract {
  sent: NodeMailerMessage[] = [];

  async send(message: NodeMailerMessage) {
    this.sent.push(message);
    return new MailResponse("sent-id", { from: false, to: [] }, undefined);
  }
}

class RecordingLogger {
  lines: { obj: object; msg: string }[] = [];

  info(obj: object, msg: string) {
    this.lines.push({ obj, msg });
  }
}

function setup(raw: string) {
  const inner = new RecordingTransport();
  const log = new RecordingLogger();
  const transport = new AllowlistTransport(
    inner,
    parseMailAllowlist(raw)!,
    log
  );
  return { inner, log, transport };
}

test.group("parseMailAllowlist", () => {
  test("unset or empty means no filtering", ({ assert }) => {
    assert.isNull(parseMailAllowlist(undefined));
    assert.isNull(parseMailAllowlist(""));
    assert.isNull(parseMailAllowlist(" , ,"));
  });

  test("splits exact emails and @domain patterns", ({ assert }) => {
    const allowlist = parseMailAllowlist(
      " QA@Example.com , @Studio2Stadium.com "
    )!;
    assert.deepEqual([...allowlist.emails], ["qa@example.com"]);
    assert.deepEqual([...allowlist.domains], ["studio2stadium.com"]);
  });
});

test.group("maskEmail", () => {
  test("keeps the first letter and the domain", ({ assert }) => {
    assert.equal(maskEmail("jane.doe@example.com"), "j***@example.com");
    assert.equal(maskEmail("not-an-email"), "***");
  });
});

test.group("AllowlistTransport", () => {
  test("allowed recipients are sent unchanged", async ({ assert }) => {
    const { inner, log, transport } = setup(
      "qa@example.com,@studio2stadium.com"
    );

    const response = await transport.send({
      subject: "Welcome",
      to: [{ address: "QA@example.com", name: "QA" }],
      cc: ["coach@studio2stadium.com"],
    });

    assert.equal(response.messageId, "sent-id");
    assert.lengthOf(inner.sent, 1);
    assert.deepEqual(inner.sent[0]!.to, [
      { address: "QA@example.com", name: "QA" },
    ]);
    assert.deepEqual(inner.sent[0]!.cc, ["coach@studio2stadium.com"]);
    assert.lengthOf(log.lines, 0);
  });

  test("blocked recipients are dropped and the send skipped", async ({
    assert,
  }) => {
    const { inner, log, transport } = setup("@studio2stadium.com");

    const response = await transport.send({
      subject: "Your invite",
      to: ["jane@gmail.com"],
      bcc: ["John Smith <john@studio2stadium.com.evil.io>"],
    });

    assert.equal(response.messageId, "");
    assert.lengthOf(inner.sent, 0);
    assert.deepEqual(
      log.lines.map((line) => line.obj),
      [
        { subject: "Your invite", recipient: "j***@gmail.com", field: "to" },
        {
          subject: "Your invite",
          recipient: "j***@studio2stadium.com.evil.io",
          field: "bcc",
        },
        { subject: "Your invite" },
      ]
    );
  });

  test("mixed recipients: only allowed ones go out, per field", async ({
    assert,
  }) => {
    const { inner, log, transport } = setup(
      "qa@example.com,@studio2stadium.com"
    );

    await transport.send({
      subject: "Digest",
      to: ["qa@example.com", "parent@gmail.com"],
      cc: ["someone@yahoo.com"],
      bcc: ["Ops <ops@studio2stadium.com>"],
      envelope: { from: "a@b.c", to: ["parent@gmail.com"] },
    });

    assert.lengthOf(inner.sent, 1);
    const sent = inner.sent[0]!;
    assert.deepEqual(sent.to, ["qa@example.com"]);
    assert.notProperty(sent, "cc");
    assert.deepEqual(sent.bcc, ["Ops <ops@studio2stadium.com>"]);
    assert.notProperty(sent, "envelope");
    assert.equal(sent.subject, "Digest");
    assert.deepEqual(
      log.lines.map((line) => line.obj),
      [
        { subject: "Digest", recipient: "p***@gmail.com", field: "to" },
        { subject: "Digest", recipient: "s***@yahoo.com", field: "cc" },
      ]
    );
  });
});

test.group("withMailAllowlist", () => {
  const inner = new RecordingTransport();
  const provider = configProvider.create(async () => () => inner);

  test("unset returns the original transport provider", ({ assert }) => {
    assert.strictEqual(withMailAllowlist(provider, undefined), provider);
    assert.strictEqual(withMailAllowlist(provider, ""), provider);
  });

  test("set wraps the resolved transport", async ({ assert }) => {
    const wrapped = withMailAllowlist(provider, "@studio2stadium.com");
    const factory = await wrapped.resolver(app);
    const transport = factory();

    assert.instanceOf(transport, AllowlistTransport);
    await transport.send({ subject: "x", to: ["a@gmail.com"] });
    await transport.send({ subject: "y", to: ["a@studio2stadium.com"] });
    assert.deepEqual(
      inner.sent.map((message) => message.subject),
      ["y"]
    );
  });
});
