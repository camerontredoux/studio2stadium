import env from "#start/env";
import { db } from "#database/connection";
import { crvSubmissions } from "#database/schema/crv";
import { dancerProfiles } from "#database/schema/dancers";
import { users } from "#database/schema/users";
import { mostRecentAugustFirst } from "#shared/prospect-emails/cutoff";
import { ProspectDigestMail } from "#shared/prospect-emails/digest-email";
import { findProspectEmailRecipients } from "#shared/prospect-emails/recipients";
import { sendThrottledEmails } from "#shared/org/throttled-email-sender";
import mail from "@adonisjs/mail/services/main";
import type { DigestDancer } from "@stos/emails";
import { and, eq, inArray } from "drizzle-orm";

export interface DigestBucketCount {
  schoolId: string;
  early: number;
  fresh: number;
}

export interface ProspectDigestResult {
  recipients: number;
  sent: number;
  failed: number;
  skipped: boolean;
  dryRun: boolean;
  buckets: DigestBucketCount[];
}

interface Options {
  /** Overrides CRON_EMAILS_ENABLED. Tests pass this explicitly. */
  enabled?: boolean;
}

export default class SendProspectDigestService {
  constructor(private options: Options = {}) {}

  async run(
    opts: { dryRun?: boolean; now?: Date } = {}
  ): Promise<ProspectDigestResult> {
    const dryRun = opts.dryRun ?? false;
    const now = opts.now ?? new Date();
    const enabled =
      this.options.enabled ?? env.get("CRON_EMAILS_ENABLED") === true;

    const cutoff = mostRecentAugustFirst(now);
    const recipients = await findProspectEmailRecipients();

    if (recipients.length === 0) {
      return {
        recipients: 0,
        sent: 0,
        failed: 0,
        skipped: !dryRun && !enabled,
        dryRun,
        buckets: [],
      };
    }

    const siteUrl = env.get("SITE_URL").replace(/\/$/, "");

    const rows = await db
      .select({
        schoolId: crvSubmissions.schoolId,
        createdAt: crvSubmissions.createdAt,
        dancerId: dancerProfiles.id,
        username: users.username,
        firstName: users.firstName,
        lastName: users.lastName,
      })
      .from(crvSubmissions)
      .innerJoin(dancerProfiles, eq(crvSubmissions.dancerId, dancerProfiles.id))
      .innerJoin(users, eq(dancerProfiles.userId, users.id))
      .where(
        and(
          inArray(crvSubmissions.status, ["pending", "in_review"]),
          inArray(
            crvSubmissions.schoolId,
            recipients.map((r) => r.schoolId)
          )
        )
      );

    const bySchool = new Map<
      string,
      { early: DigestDancer[]; fresh: DigestDancer[] }
    >();

    for (const row of rows) {
      const bucket = bySchool.get(row.schoolId) ?? { early: [], fresh: [] };

      const dancer: DigestDancer = {
        id: row.dancerId,
        name: `${row.firstName} ${row.lastName}`.trim(),
        profileUrl: `${siteUrl}/${row.username}`,
      };

      if (row.createdAt < cutoff) {
        bucket.early.push(dancer);
      } else {
        bucket.fresh.push(dancer);
      }

      bySchool.set(row.schoolId, bucket);
    }

    const buckets: DigestBucketCount[] = recipients.map((r) => {
      const b = bySchool.get(r.schoolId) ?? { early: [], fresh: [] };
      return {
        schoolId: r.schoolId,
        early: b.early.length,
        fresh: b.fresh.length,
      };
    });

    if (!dryRun && !enabled) {
      console.log(
        `[ProspectDigest]: CRON_EMAILS_ENABLED is off; skipping ${recipients.length} recipient(s)`
      );
      return {
        recipients: recipients.length,
        sent: 0,
        failed: 0,
        skipped: true,
        dryRun,
        buckets,
      };
    }

    if (dryRun) {
      console.log(`[ProspectDigest][dry-run]: cutoff ${cutoff.toISOString()}`);
      for (const r of recipients) {
        const b = bySchool.get(r.schoolId) ?? { early: [], fresh: [] };
        console.log(
          `[ProspectDigest][dry-run]: would email ${r.email} (${r.schoolName}) — ${b.fresh.length} new, ${b.early.length} early`
        );
      }
      return {
        recipients: recipients.length,
        sent: 0,
        failed: 0,
        skipped: false,
        dryRun,
        buckets,
      };
    }

    const { sent, failed } = await sendThrottledEmails(
      recipients.map((recipient) => {
        const bucket = bySchool.get(recipient.schoolId) ?? {
          early: [],
          fresh: [],
        };

        return {
          recipient: recipient.email,
          send: async () => {
            await mail.send(
              new ProspectDigestMail({
                email: recipient.email,
                userId: recipient.userId,
                schoolName: recipient.schoolName,
                newSubmissions: bucket.fresh,
                earlySubmissions: bucket.early,
              })
            );
          },
        };
      }),
      {
        onTerminalFailure: (task, error) => {
          console.error(
            `[ProspectDigest]: failed to email ${task.recipient}:`,
            error
          );
        },
      }
    );

    console.log(
      `[ProspectDigest]: cutoff ${cutoff.toISOString()}, sent ${sent}/${recipients.length}, ${failed} failed`
    );

    return {
      recipients: recipients.length,
      sent,
      failed,
      skipped: false,
      dryRun,
      buckets,
    };
  }
}
