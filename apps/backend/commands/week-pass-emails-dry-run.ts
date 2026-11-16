import { BaseCommand } from "@adonisjs/core/ace";
import type { CommandOptions } from "@adonisjs/core/types/ace";
import SendWeekPassEmailsService from "../services/send-week-pass-emails.ts";

/**
 * Shows what the Week Pass email job would do right now: which settings stop
 * each email from activating, which Dancers would be owed an expired-pass
 * email, and which owed emails would be sent or suppressed and why. Writes
 * nothing and sends nothing, whatever the switches say. There is deliberately
 * no live mode here: only the scheduled job sends.
 */
export default class WeekPassEmailsDryRun extends BaseCommand {
  static commandName = "week-pass-emails:dry-run";
  static description =
    "Report what the Week Pass email job would send, without writing or sending anything";

  static options: CommandOptions = {
    startApp: true,
  };

  async run() {
    const report = await new SendWeekPassEmailsService().run({ dryRun: true });

    for (const kind of ["welcome", "expired"] as const) {
      const problems = report.problems[kind];
      if (problems.length === 0) {
        this.logger.info(`${kind}: all settings present`);
      } else {
        for (const problem of problems) {
          this.logger.warning(`${kind}: ${problem}`);
        }
      }
    }

    for (const step of report.plan) {
      this.logger.info(
        `[dry-run] ${step.kind} ${step.action} user=${step.userId}${step.reason ? ` reason=${step.reason}` : ""}`
      );
    }

    this.logger.info(
      `Dry run: ${report.enqueued} would be owed, ${report.sent} would send, ${Object.values(report.suppressed).reduce<number>((a, b) => a + (b ?? 0), 0)} would be suppressed. Nothing was written or sent.`
    );
  }
}
