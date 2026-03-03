import { CronJob } from "cron";
import CacheSkillsService from "../services/cache-skills.ts";
import PublishOutboxService from "../services/publish-outbox.ts";

const cacheSkillsService = new CacheSkillsService();
const publishOutboxService = new PublishOutboxService();

// Cache skill rarity every hour
new CronJob("0 * * * *", async () => {
  console.log("[Cron]: Starting cron job for skill rarity cache");
  await cacheSkillsService.run();
}).start();

// Publish outbox events to SQS every 10 seconds
new CronJob("*/10 * * * * *", async () => {
  try {
    await publishOutboxService.run();
  } catch (error) {
    console.error("[Outbox]: Error publishing events:", error);
  }
}).start();
