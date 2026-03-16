import { CronJob } from "cron";
import CacheSkillsService from "../services/cache-skills.ts";
import ExpireSubscriptionsService from "../services/expire-subscriptions.ts";
import PublishOutboxService from "../services/publish-outbox.ts";

const cacheSkillsService = new CacheSkillsService();
const expireSubscriptionsService = new ExpireSubscriptionsService();
const publishOutboxService = new PublishOutboxService();

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

// Publish outbox events to SQS every 10 seconds
new CronJob("*/10 * * * * *", async () => {
  try {
    await publishOutboxService.run();
  } catch (error) {
    console.error("[Outbox]: Error publishing events:", error);
  }
}).start();
