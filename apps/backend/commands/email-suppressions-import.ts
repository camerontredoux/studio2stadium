import {
  applySuppressionImport,
  previewSuppressionImport,
} from "#shared/email-suppressions/import";
import {
  parseSuppressions,
  SUPPRESSION_FORMATS,
  type SuppressionFormat,
} from "#shared/email-suppressions/parse";
import { privateInputPath } from "#shared/email-suppressions/private-input";
import { args, BaseCommand, flags } from "@adonisjs/core/ace";
import type { CommandOptions } from "@adonisjs/core/types/ace";
import { readFileSync } from "node:fs";

const SOURCE = { sender: "sender", ses: "ses", removals: "manual" } as const;

/**
 * Load a suppression export into `email_suppressions`.
 *
 *   node ace email-suppressions:import sender /tmp/sender-export.json
 *   node ace email-suppressions:import ses /tmp/ses-suppressions.json --apply
 *   node ace email-suppressions:import removals /tmp/removals.txt --apply
 *
 * A dry run unless --apply is given. The whole file is validated first; one
 * bad entry stops the import before anything is written. Applying adds or
 * refreshes rows in a single transaction and never deletes any. Output is
 * counts only, never addresses.
 *
 * It does not set EMAIL_SUPPRESSION_IMPORTED_AT: deciding the history is
 * complete is a separate, deliberate step.
 */
export default class EmailSuppressionsImport extends BaseCommand {
  static commandName = "email-suppressions:import";
  static description =
    "Validate and (with --apply) load a Sender, SES or removal-request suppression export; prints counts only";

  static options: CommandOptions = {
    startApp: true,
  };

  @args.string({ description: "Export format: sender, ses or removals" })
  declare format: string;

  @args.string({ description: "Path to the export, outside the project" })
  declare file: string;

  @flags.boolean({
    description: "Write to the database. Without it, nothing is written.",
    default: false,
  })
  declare apply: boolean;

  async run() {
    if (!SUPPRESSION_FORMATS.includes(this.format as SuppressionFormat)) {
      this.logger.error(
        `Unknown format. Expected one of: ${SUPPRESSION_FORMATS.join(", ")}.`
      );
      this.exitCode = 1;
      return;
    }
    const format = this.format as SuppressionFormat;

    const input = privateInputPath(this.file, this.app.appRoot.pathname);
    if ("refused" in input) {
      this.logger.error(`Refused: ${input.refused}.`);
      this.exitCode = 1;
      return;
    }

    const parsed = parseSuppressions(format, readFileSync(input.path, "utf8"));

    this.logger.info(
      `Read ${parsed.entries} entr${parsed.entries === 1 ? "y" : "ies"}; ${parsed.duplicates} repeat an address earlier in the file.`
    );

    if (parsed.problems.length > 0) {
      for (const p of parsed.problems.slice(0, 20)) {
        this.logger.error(
          `${p.entry === 0 ? "File" : `Entry ${p.entry}`}: ${p.problem}`
        );
      }
      if (parsed.problems.length > 20) {
        this.logger.error(`…and ${parsed.problems.length - 20} more.`);
      }
      this.logger.error(
        `${parsed.problems.length} problem(s). Nothing was written; fix the export and run again.`
      );
      this.exitCode = 1;
      return;
    }

    const byReason = new Map<string, number>();
    for (const r of parsed.records) {
      byReason.set(r.reason, (byReason.get(r.reason) ?? 0) + 1);
    }
    this.logger.info(
      `${parsed.records.length} distinct address(es): ${[...byReason]
        .map(([reason, n]) => `${n} ${reason}`)
        .join(", ")}.`
    );

    const source = SOURCE[format];
    const counts = this.apply
      ? await applySuppressionImport(source, parsed.records)
      : await previewSuppressionImport(source, parsed.records);

    const summary = `${counts.added} new, ${counts.refreshed} refreshed, ${counts.unchanged} unchanged (${counts.alreadySuppressedElsewhere} of the new are already suppressed by another source).`;

    if (this.apply) {
      this.logger.success(`Applied for source "${source}": ${summary}`);
    } else {
      this.logger.info(
        `Dry run for source "${source}": ${summary} Nothing was written; add --apply to write.`
      );
    }
    this.logger.info(
      "EMAIL_SUPPRESSION_IMPORTED_AT was not changed. Set it yourself only once every source's history is loaded."
    );
  }
}
