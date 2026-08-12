import env from "#start/env";
import { findProspectEmailRecipients } from "#shared/prospect-emails/recipients";
import { ProspectReminderMail } from "#shared/prospect-emails/reminder-email";
import mail from "@adonisjs/mail/services/main";

export interface ProspectJobResult {
  recipients: number;
  sent: number;
  failed: number;
  skipped: boolean;
  dryRun: boolean;
}

interface Options {
  /** Overrides CRON_EMAILS_ENABLED. Tests pass this explicitly. */
  enabled?: boolean;
}

export default class SendProspectRemindersService {
  constructor(private options: Options = {}) {}

  async run(opts: { dryRun?: boolean } = {}): Promise<ProspectJobResult> {
    const dryRun = opts.dryRun ?? false;
    const enabled =
      this.options.enabled ?? env.get("CRON_EMAILS_ENABLED") === true;

    const recipients = await findProspectEmailRecipients();

    if (!dryRun && !enabled) {
      console.log(
        `[ProspectReminder]: CRON_EMAILS_ENABLED is off; skipping ${recipients.length} recipient(s)`
      );
      return {
        recipients: recipients.length,
        sent: 0,
        failed: 0,
        skipped: true,
        dryRun,
      };
    }

    if (dryRun) {
      for (const r of recipients) {
        console.log(
          `[ProspectReminder][dry-run]: would email ${r.email} (${r.schoolName})`
        );
      }
      return {
        recipients: recipients.length,
        sent: 0,
        failed: 0,
        skipped: false,
        dryRun,
      };
    }

    let sent = 0;
    let failed = 0;

    // Sequential, not Promise.all: SES throttles, and a monthly job has no
    // latency budget worth risking a rate-limit rejection for.
    for (const recipient of recipients) {
      try {
        await mail.send(
          new ProspectReminderMail({
            email: recipient.email,
            userId: recipient.userId,
          })
        );
        sent += 1;
      } catch (error) {
        failed += 1;
        console.error(
          `[ProspectReminder]: failed to email ${recipient.email}:`,
          error
        );
      }
    }

    console.log(
      `[ProspectReminder]: sent ${sent}/${recipients.length}, ${failed} failed`
    );

    return {
      recipients: recipients.length,
      sent,
      failed,
      skipped: false,
      dryRun,
    };
  }
}
