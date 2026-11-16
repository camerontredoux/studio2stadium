import { projectRoot } from "#shared/email-suppressions/private-input";
import { weekPassEmailConfig } from "#shared/week-pass-emails/config";
import {
  planSamples,
  prepareSample,
  type SampleVariant,
} from "#shared/week-pass-emails/sample";
import { args, BaseCommand, flags } from "@adonisjs/core/ace";
import type { CommandOptions } from "@adonisjs/core/types/ace";
import mail from "@adonisjs/mail/services/main";
import { mkdirSync, writeFileSync } from "node:fs";
import { isAbsolute, join, relative, resolve } from "node:path";

/**
 * Show, and only with --send deliver, a sample of the Week Pass welcome to
 * one internal mailbox:
 *
 *   node ace week-pass-emails:send-sample reviewer@example.com
 *   node ace week-pass-emails:send-sample reviewer@example.com --out /tmp/sample
 *   node ace week-pass-emails:send-sample reviewer@example.com --variant current --send
 *
 * Fake name and dates only; no customer is looked up and nothing is read
 * from or written to the database. Sending also requires the address to
 * match WEEK_PASS_SAMPLE_RECIPIENT exactly, and MAIL_POSTAL_ADDRESS to be
 * set. It does not need, and does not change, the Week Pass email switches.
 */
export default class WeekPassEmailsSendSample extends BaseCommand {
  static commandName = "week-pass-emails:send-sample";
  static description =
    "Preview (default) or, with --send, deliver a fake-data Week Pass welcome to the one configured internal mailbox";

  static options: CommandOptions = {
    startApp: true,
  };

  @args.string({ description: "The one internal mailbox to send to" })
  declare to: string;

  @flags.string({
    description: "current, queued or both (default both)",
    default: "both",
  })
  declare variant: string;

  @flags.string({
    description: "Write the rendered HTML and text here (outside the project)",
  })
  declare out?: string;

  @flags.boolean({
    description: "Actually send. Without it, nothing is sent.",
    default: false,
  })
  declare send: boolean;

  async run() {
    const variants: SampleVariant[] =
      this.variant === "both"
        ? ["current", "queued"]
        : this.variant === "current" || this.variant === "queued"
          ? [this.variant]
          : [];
    if (variants.length === 0) {
      this.logger.error("--variant must be current, queued or both.");
      this.exitCode = 1;
      return;
    }

    const config = weekPassEmailConfig();
    const now = new Date();
    const plan = planSamples(this.to, variants, config, now);

    this.logger.info("Week Pass welcome: internal sample (fake data)");
    this.logger.info(`  To:        ${plan.to}`);
    this.logger.info(`  From:      ${plan.from}`);
    for (const v of plan.variants) {
      this.logger.info(
        `  ${v.variant.padEnd(8)}  "${v.subject}"  starts ${v.startsAt}, access ends ${v.accessEndsAt}`
      );
    }
    this.logger.info(`  Profile:   ${plan.links.profile} (fake username)`);
    this.logger.info(`  Settings:  ${plan.links.preferences}`);
    this.logger.info(`  Opt-out:   ${plan.links.unsubscribe}`);
    for (const image of plan.images) {
      this.logger.info(`  Image:     ${image.name} -> ${image.url}`);
    }
    this.logger.info(
      "  Sender:    not checked (samples go only to the configured internal mailbox; customer sends check Sender every attempt)"
    );
    this.logger.info(
      `  Address:   ${plan.postalAddressConfigured ? "configured" : "NOT configured"}`
    );
    this.logger.info(`  Time zone: ${plan.timezone}`);
    this.logger.info(
      `  Switches:  welcome ${config.welcome.enabled ? "ON" : "off"}, expired ${config.expired.enabled ? "ON" : "off"} (a sample neither needs nor changes them)`
    );

    if (this.out) {
      const dir = resolve(this.out);
      const root = projectRoot(this.app.appRoot.pathname);
      const rel = relative(root, dir);
      if (rel === "" || (!rel.startsWith("..") && !isAbsolute(rel))) {
        this.logger.error("Refused: --out must be outside the project.");
        this.exitCode = 1;
        return;
      }
      mkdirSync(dir, { recursive: true });
      for (const variant of variants) {
        const message = await prepareSample(variant, plan.to, config, now);
        const json = message.message.toJSON().message as {
          html?: string;
          text?: string;
        };
        writeFileSync(
          join(dir, `week-pass-welcome-${variant}.html`),
          json.html ?? ""
        );
        writeFileSync(
          join(dir, `week-pass-welcome-${variant}.txt`),
          json.text ?? ""
        );
      }
      this.logger.info(`  Rendered:  ${dir}`);
    }

    if (!this.send) {
      if (plan.problems.length > 0) {
        this.logger.warning(
          `A send would be refused: ${plan.problems.join("; ")}.`
        );
      }
      this.logger.info("Dry run: nothing was sent. Add --send to deliver.");
      return;
    }

    if (plan.problems.length > 0) {
      for (const problem of plan.problems) this.logger.error(problem);
      this.logger.error("Refused: nothing was sent.");
      this.exitCode = 1;
      return;
    }

    for (const variant of variants) {
      const message = await prepareSample(variant, plan.to, config, now);
      const response = await mail.send(message);
      this.logger.success(
        `Sent ${variant} sample to ${plan.to}${response?.messageId ? ` (message id ${response.messageId})` : ""}.`
      );
    }
  }
}
