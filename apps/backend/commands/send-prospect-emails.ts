import { args, BaseCommand, flags } from "@adonisjs/core/ace";
import type { CommandOptions } from "@adonisjs/core/types/ace";
import SendProspectDigestService from "../services/send-prospect-digest.ts";
import SendProspectRemindersService from "../services/send-prospect-reminders.ts";

/**
 * Manual entry point for the two prospect email jobs.
 *
 * The app has no staging environment — `studio2stadium-dev` serves
 * api.studio2stadium.com — so always run with --dry-run first and read the
 * recipient list before sending for real.
 */
export default class SendProspectEmails extends BaseCommand {
  static commandName = "send:prospect-emails";
  static description =
    "Send the prospect reminder or submissions digest email (use --dry-run first)";

  static options: CommandOptions = {
    startApp: true,
  };

  @args.string({
    description: "Which job to run: 'reminder' or 'digest'",
  })
  declare job: string;

  @flags.boolean({
    description: "Resolve recipients and log them without sending anything",
    default: false,
  })
  declare dryRun: boolean;

  async run() {
    if (this.job !== "reminder" && this.job !== "digest") {
      this.logger.error(
        `Unknown job '${this.job}'. Expected 'reminder' or 'digest'.`
      );
      this.exitCode = 1;
      return;
    }

    const result =
      this.job === "reminder"
        ? await new SendProspectRemindersService().run({ dryRun: this.dryRun })
        : await new SendProspectDigestService().run({ dryRun: this.dryRun });

    if (result.skipped) {
      this.logger.warning(
        `Skipped: CRON_EMAILS_ENABLED is not true. ${result.recipients} recipient(s) would have been emailed.`
      );
      return;
    }

    if (result.dryRun) {
      this.logger.info(
        `Dry run: ${result.recipients} recipient(s), nothing sent.`
      );
      return;
    }

    this.logger.success(
      `Sent ${result.sent}/${result.recipients}, ${result.failed} failed.`
    );

    if (result.failed > 0) {
      this.exitCode = 1;
    }
  }
}
