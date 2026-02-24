import { CronJob } from "cron";
import CacheSkillsService from "../services/cache-skills.ts";

const service = new CacheSkillsService();

new CronJob("0 * * * *", async () => {
  console.log("[Cron]: Staring cron job for skill rarity cache");
  await service.run();
}).start();
