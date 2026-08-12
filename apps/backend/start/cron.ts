import { CronJob } from "cron";
import {
  cronRunKey,
  PROSPECT_DIGEST_JOB,
  PROSPECT_REMINDER_JOB,
  withCronClaim,
} from "#shared/cron/claim-run";
import CacheSkillsService from "../services/cache-skills.ts";
import ExpireSubscriptionsService from "../services/expire-subscriptions.ts";
import PublishOutboxService from "../services/publish-outbox.ts";
import ReapStuckVideoUploadsService from "../services/reap-stuck-video-uploads.ts";
import SendProspectDigestService from "../services/send-prospect-digest.ts";
import SendProspectRemindersService from "../services/send-prospect-reminders.ts";

const cacheSkillsService = new CacheSkillsService();
const expireSubscriptionsService = new ExpireSubscriptionsService();
const publishOutboxService = new PublishOutboxService();
const reapStuckVideoUploadsService = new ReapStuckVideoUploadsService();

// Cache skill rarity every hour
new CronJob("0 * * * *", async () => {
  console.log("[Cron]: Starting cron job for skill rarity cache");
  await cacheSkillsService.run();
}).start();

// Expire subscriptions past their period end (runs daily at midnight)
new CronJob("0 0 * * *", async () => {
  try {
    await expireSubscriptionsService.run();
  } catch (error) {
    console.error("[Cron]: Error expiring subscriptions:", error);
  }
}).start();

// Reconcile stuck/abandoned direct video uploads every hour so they stop
// consuming users' direct-video limit (recovers ready ones, fails abandoned)
new CronJob("0 * * * *", async () => {
  try {
    await reapStuckVideoUploadsService.run();
  } catch (error) {
    console.error("[Cron]: Error reaping stuck video uploads:", error);
  }
}).start();

// Publish outbox events to SQS every 10 seconds
new CronJob("*/10 * * * * *", async () => {
  try {
    await publishOutboxService.run();
  } catch (error) {
    console.error("[Outbox]: Error publishing events:", error);
  }
}).start();

const PROSPECT_TIMEZONE = "America/Denver";

const sendProspectRemindersService = new SendProspectRemindersService();
const sendProspectDigestService = new SendProspectDigestService();

/**
 * Prospect status reminder — 1st of the month at midnight Denver, every month
 * except January and September. Those two months get the submissions digest
 * below instead. Expression is carried over unchanged from the retired
 * EventBridge schedule `sendProspectReminder`.
 */
CronJob.from({
  cronTime: "0 0 1 10,11,12,2,3,4,5,6,7,8 *",
  timeZone: PROSPECT_TIMEZONE,
  waitForCompletion: true,
  start: true,
  onTick: async () => {
    try {
      const ran = await withCronClaim(
        PROSPECT_REMINDER_JOB,
        cronRunKey(new Date()),
        () => sendProspectRemindersService.run()
      );
      if (ran === null) {
        console.log(
          "[ProspectReminder]: tick already claimed by another machine; skipping"
        );
      }
    } catch (error) {
      console.error("[ProspectReminder]: job failed:", error);
    }
  },
});

/**
 * Submissions digest — September 1 and January 2, both 09:00 Denver. Two
 * registrations rather than one expression so each date reads plainly.
 */
for (const [label, cronTime] of [
  ["september", "0 9 1 9 *"],
  ["january", "0 9 2 1 *"],
] as const) {
  CronJob.from({
    cronTime,
    timeZone: PROSPECT_TIMEZONE,
    waitForCompletion: true,
    start: true,
    onTick: async () => {
      try {
        const ran = await withCronClaim(
          PROSPECT_DIGEST_JOB,
          cronRunKey(new Date()),
          () => sendProspectDigestService.run()
        );
        if (ran === null) {
          console.log(
            `[ProspectDigest][${label}]: tick already claimed by another machine; skipping`
          );
        }
      } catch (error) {
        console.error(`[ProspectDigest][${label}]: job failed:`, error);
      }
    },
  });
}
